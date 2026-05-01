import { ReturnDoc } from "../models/ReturnDoc.js";
import { Sale } from "../models/Sale.js";
import mongoose from "mongoose";
import { ProductBatch } from "../models/ProductBatch.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { env } from "../config/env.js";
import { deleteById, findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { withWriteLock } from "../db/nedb/writeMutex.js";
import { toIdString } from "../db/types.js";
import { success } from "../utils/apiResponse.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { z } from "zod";

const createSchema = z.object({
  type: z.enum(["customer", "supplier"]),
  partyName: z.string(),
  items: z.array(
    z.object({
      drug: z.string(),
      qty: z.number(),
      amount: z.number(),
      reason: z.string().optional(),
      productBatchId: z.string().optional(),
    })
  ),
  totalAmount: z.number(),
  saleId: z.string().optional(),
});

export async function listReturns(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    let data;
    let total;
    if (env.dbMode === "offline") {
      const store = getWrapped("returndocs");
      const rows = await store.find({}, { sort: { createdAt: -1 } });
      total = rows.length;
      data = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    } else {
      [data, total] = await Promise.all([
        ReturnDoc.find()
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        ReturnDoc.countDocuments(),
      ]);
    }
    return res.json(success(data, { page, pageSize, total }));
  } catch (e) {
    next(e);
  }
}

export async function postReturn(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const processedItems = [];

    for (const item of body.items) {
      const itemData = {
        drug: item.drug,
        qty: item.qty,
        amount: item.amount,
        reason: item.reason,
        productBatchId:
          item.productBatchId && mongoose.Types.ObjectId.isValid(item.productBatchId)
            ? env.dbMode === "offline"
              ? toIdString(item.productBatchId)
              : new mongoose.Types.ObjectId(item.productBatchId)
            : undefined,
      };
      processedItems.push(itemData);
    }

    const saleId =
      body.saleId && mongoose.Types.ObjectId.isValid(body.saleId)
        ? env.dbMode === "offline"
          ? toIdString(body.saleId)
          : new mongoose.Types.ObjectId(body.saleId)
        : undefined;

    if (env.dbMode === "offline") {
      const doc = await insertWithTimestamps(getWrapped("returndocs"), {
        returnCode: `RET-${Date.now()}`,
        type: body.type,
        partyName: body.partyName,
        items: processedItems,
        totalAmount: body.totalAmount,
        saleId,
        status: "pending",
        date: new Date(),
      });
      return res.status(201).json(success(doc));
    }

    const doc = await ReturnDoc.create({
      returnCode: `RET-${Date.now()}`,
      type: body.type,
      partyName: body.partyName,
      items: processedItems,
      totalAmount: body.totalAmount,
      saleId,
      status: "pending",
    });

    return res.status(201).json(success(doc));
  } catch (e) {
    next(e);
  }
}

export async function approveReturn(req, res, next) {
  if (env.dbMode === "offline") {
    try {
      const ret = await approveReturnOffline(req);
      return res.json(success(ret));
    } catch (e) {
      return next(e);
    }
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const ret = await ReturnDoc.findById(req.params.id).session(session);
    if (!ret) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Return not found" } });
    if (ret.status !== "pending") return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Only pending returns can be approved" } });

    for (const item of ret.items) {
      if (item.productBatchId) {
        const batch = await ProductBatch.findByIdAndUpdate(
          item.productBatchId,
          { $inc: { qtyOnHand: item.qty } },
          { new: true, session }
        );

        if (batch) {
          await InventoryLog.create(
            [
              {
                batchId: item.productBatchId,
                productId: batch.productId,
                changeQty: item.qty,
                reason: "return_in",
                refType: "return",
                refId: ret._id,
                userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
                note: `Approved Return: ${ret.partyName}`,
              },
            ],
            { session }
          );
        }
      }
    }

    ret.status = "completed";
    await ret.save({ session });

    if (ret.saleId) {
      await Sale.findByIdAndUpdate(ret.saleId, { status: "returned" }, { session });
    }

    await session.commitTransaction();
    return res.json(success(ret));
  } catch (e) {
    await session.abortTransaction();
    next(e);
  } finally {
    await session.endSession();
  }
}

async function approveReturnOffline(req) {
  return withWriteLock("return-approve", async () => {
    const retStore = getWrapped("returndocs");
    const bs = getWrapped("productbatches");
    const logs = getWrapped("inventorylogs");
    const ret = await findById(retStore, req.params.id);
    if (!ret) throw new AppError(ErrorCodes.NOT_FOUND, "Return not found", 404);
    if (ret.status !== "pending") {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Only pending returns can be approved", 400);
    }

    /** @type {Array<() => Promise<void>>} */
    const rollbacks = [];

    try {
      for (const item of ret.items) {
        if (!item.productBatchId) continue;
        const bid = toIdString(item.productBatchId);
        const batch = await findById(bs, bid);
        if (!batch) continue;
        const prevQty = batch.qtyOnHand;
        await bs.update(
          { _id: bid },
          { $inc: { qtyOnHand: item.qty }, $set: { updatedAt: new Date() } },
          {}
        );
        rollbacks.push(async () => {
          await bs.update({ _id: bid }, { $set: { qtyOnHand: prevQty, updatedAt: new Date() } }, {});
        });

        const logDoc = await insertWithTimestamps(logs, {
          batchId: bid,
          productId: batch.productId,
          changeQty: item.qty,
          reason: "return_in",
          refType: "return",
          refId: ret._id,
          userId: req.user?.id ? toIdString(req.user.id) : undefined,
          note: `Approved Return: ${ret.partyName}`,
        });
        rollbacks.push(async () => {
          await deleteById(logs, logDoc._id);
        });
      }

      const prevRetStatus = ret.status;
      await retStore.update({ _id: ret._id }, { $set: { status: "completed", updatedAt: new Date() } }, {});
      rollbacks.push(async () => {
        await retStore.update({ _id: ret._id }, { $set: { status: prevRetStatus, updatedAt: new Date() } }, {});
      });

      if (ret.saleId) {
        const sales = getWrapped("sales");
        const sid = toIdString(ret.saleId);
        const sale = await findById(sales, sid);
        const prevSaleStatus = sale?.status;
        await sales.update({ _id: sid }, { $set: { status: "returned", updatedAt: new Date() } }, {});
        rollbacks.push(async () => {
          await sales.update({ _id: sid }, { $set: { status: prevSaleStatus || "completed", updatedAt: new Date() } }, {});
        });
      }

      return findById(retStore, ret._id);
    } catch (e) {
      for (const rb of rollbacks.reverse()) await rb().catch(() => {});
      throw e;
    }
  });
}
