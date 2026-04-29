import { ReturnDoc } from "../models/ReturnDoc.js";
import { Sale } from "../models/Sale.js";
import mongoose from "mongoose";
import { ProductBatch } from "../models/ProductBatch.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { success } from "../utils/apiResponse.js";
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
    const [data, total] = await Promise.all([
      ReturnDoc.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ReturnDoc.countDocuments(),
    ]);
    return res.json(success(data, { page, pageSize, total }));
  } catch (e) {
    next(e);
  }
}

export async function postReturn(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const processedItems = [];

    // Process each item for stock update and logging
    for (const item of body.items) {
      const itemData = {
        drug: item.drug,
        qty: item.qty,
        amount: item.amount,
        reason: item.reason,
        productBatchId: (item.productBatchId && mongoose.Types.ObjectId.isValid(item.productBatchId)) 
          ? new mongoose.Types.ObjectId(item.productBatchId) 
          : undefined
      };
      processedItems.push(itemData);
    }

    // Create the return document with 'pending' status
    const doc = await ReturnDoc.create({
      returnCode: `RET-${Date.now()}`,
      type: body.type,
      partyName: body.partyName,
      items: processedItems,
      totalAmount: body.totalAmount,
      saleId: body.saleId && mongoose.Types.ObjectId.isValid(body.saleId) ? new mongoose.Types.ObjectId(body.saleId) : undefined,
      status: "pending",
    });

    return res.status(201).json(success(doc));
  } catch (e) {
    next(e);
  }
}

export async function approveReturn(req, res, next) {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const ret = await ReturnDoc.findById(req.params.id).session(session);
    if (!ret) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Return not found" } });
    if (ret.status !== "pending") return res.status(400).json({ success: false, error: { code: "BAD_REQUEST", message: "Only pending returns can be approved" } });

    // NOW update stock and log inventory
    for (const item of ret.items) {
      if (item.productBatchId) {
        const batch = await ProductBatch.findByIdAndUpdate(
          item.productBatchId,
          { $inc: { qtyOnHand: item.qty } },
          { new: true, session }
        );

        if (batch) {
          await InventoryLog.create([{
            batchId: item.productBatchId,
            productId: batch.productId,
            changeQty: item.qty,
            reason: "return_in",
            refType: "return",
            refId: ret._id,
            userId: req.user?.id ? new mongoose.Types.ObjectId(req.user.id) : undefined,
            note: `Approved Return: ${ret.partyName}`,
          }], { session });
        }
      }
    }

    ret.status = "completed";
    await ret.save({ session });

    // Link back to Sale if exists
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
