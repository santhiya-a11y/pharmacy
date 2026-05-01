import mongoose from "mongoose";
import { env } from "../config/env.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { insertWithTimestamps, findById, deleteById } from "../db/nedb/documentHelpers.js";
import { withWriteLock } from "../db/nedb/writeMutex.js";
import { toIdString } from "../db/types.js";
import * as productRepo from "../db/repositories/productRepository.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { GoodsReceipt } from "../models/GoodsReceipt.js";
import { Product } from "../models/Product.js";
import { ProductBatch } from "../models/ProductBatch.js";
import { Supplier } from "../models/Supplier.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { AppError, ErrorCodes } from "../utils/errors.js";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function receivePurchaseStock({
  purchaseOrderId,
  lines,
  userId,
}) {
  if (env.dbMode === "offline") {
    return receivePurchaseStockOffline({ purchaseOrderId, lines, userId });
  }
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const po = await PurchaseOrder.findById(purchaseOrderId).session(session);
    if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);

    const receiptLines = [];
    for (const line of lines) {
      if (!line.batch?.trim() || !line.receivedQty || line.receivedQty <= 0) continue;

      let product = await Product.findOne({
        name: new RegExp(`^${escapeRegex(line.drug)}$`, "i"),
      }).session(session);

      if (!product) {
        const [created] = await Product.create([{ name: line.drug, manufacturer: "", defaultGstPct: 12 }], { session });
        product = created;
      }

      const batch = await ProductBatch.findOneAndUpdate(
        { productId: product._id, batchNo: line.batch.trim() },
        {
          $setOnInsert: {
            productId: product._id,
            batchNo: line.batch.trim(),
            supplierId: po.supplierId,
            expiryDate: new Date(line.expiry),
            mrp: Number(line.mrp),
            purchaseRate: 0,
            rack: line.rackLocation || "",
          },
          $inc: { qtyOnHand: Number(line.receivedQty) },
        },
        { upsert: true, new: true, session }
      );

      await InventoryLog.create(
        [
          {
            batchId: batch._id,
            productId: product._id,
            changeQty: Number(line.receivedQty),
            reason: "purchase_receive",
            refType: "purchase_order",
            refId: po._id,
            userId: new mongoose.Types.ObjectId(userId),
          },
        ],
        { session }
      );

      receiptLines.push({
        drug: line.drug,
        orderedQty: line.orderedQty,
        receivedQty: line.receivedQty,
        batchNo: line.batch,
        expiryDate: new Date(line.expiry),
        mrp: line.mrp,
        rackLocation: line.rackLocation,
        productBatchId: batch._id,
      });
    }

    await GoodsReceipt.create(
      [
        {
          purchaseOrderId: po._id,
          lines: receiptLines,
          userId: new mongoose.Types.ObjectId(userId),
        },
      ],
      { session }
    );

    po.status = "delivered";
    await po.save({ session });

    await session.commitTransaction();
    return { purchaseOrderId: String(po._id), linesReceived: receiptLines.length };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }
}

async function receivePurchaseStockOffline({ purchaseOrderId, lines, userId }) {
  return withWriteLock("purchase-receive", async () => {
    const poStore = getWrapped("purchaseorders");
    const bs = getWrapped("productbatches");
    const logs = getWrapped("inventorylogs");
    const grStore = getWrapped("goodsreceipts");

    const po = await findById(poStore, purchaseOrderId);
    if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);

    const receiptLines = [];
    /** @type {Array<() => Promise<void>>} */
    const rollbacks = [];

    try {
      for (const line of lines) {
        if (!line.batch?.trim() || !line.receivedQty || line.receivedQty <= 0) continue;

        let product = await productRepo.productFindOne({
          name: new RegExp(`^${escapeRegex(line.drug)}$`, "i"),
        });

        let createdProduct = false;
        if (!product) {
          product = await productRepo.productInsert({ name: line.drug, manufacturer: "", defaultGstPct: 12 });
          createdProduct = true;
          rollbacks.push(async () => {
            if (createdProduct) await deleteById(getWrapped("products"), product._id);
          });
        }

        const pidStr = toIdString(product._id);
        const supplierIdStr = po.supplierId ? toIdString(po.supplierId) : undefined;
        const batchNo = line.batch.trim();
        let batch = await bs.findOne({ productId: pidStr, batchNo });
        const qtyAdd = Number(line.receivedQty);

        if (!batch) {
          batch = await insertWithTimestamps(bs, {
            productId: pidStr,
            batchNo,
            supplierId: supplierIdStr,
            expiryDate: new Date(line.expiry),
            mrp: Number(line.mrp),
            purchaseRate: 0,
            rack: line.rackLocation || "",
            qtyOnHand: qtyAdd,
            sgstPct: 6,
            cgstPct: 6,
            status: "safe",
          });
          rollbacks.push(async () => {
            await deleteById(bs, batch._id);
          });
        } else {
          const prevQty = batch.qtyOnHand;
          await bs.update(
            { _id: batch._id },
            { $inc: { qtyOnHand: qtyAdd }, $set: { updatedAt: new Date() } },
            {}
          );
          batch = await bs.findOne({ _id: batch._id });
          rollbacks.push(async () => {
            await bs.update({ _id: batch._id }, { $set: { qtyOnHand: prevQty, updatedAt: new Date() } }, {});
          });
        }

        const logDoc = await insertWithTimestamps(logs, {
          batchId: batch._id,
          productId: pidStr,
          changeQty: qtyAdd,
          reason: "purchase_receive",
          refType: "purchase_order",
          refId: po._id,
          userId: toIdString(userId),
        });
        rollbacks.push(async () => {
          await deleteById(logs, logDoc._id);
        });

        receiptLines.push({
          drug: line.drug,
          orderedQty: line.orderedQty,
          receivedQty: line.receivedQty,
          batchNo: line.batch,
          expiryDate: new Date(line.expiry),
          mrp: line.mrp,
          rackLocation: line.rackLocation,
          productBatchId: batch._id,
        });
      }

      const gr = await insertWithTimestamps(grStore, {
        purchaseOrderId: po._id,
        lines: receiptLines,
        userId: toIdString(userId),
      });
      rollbacks.push(async () => {
        await deleteById(grStore, gr._id);
      });

      const prevStatus = po.status;
      await poStore.update(
        { _id: po._id },
        { $set: { status: "delivered", updatedAt: new Date() } },
        {}
      );
      rollbacks.push(async () => {
        await poStore.update({ _id: po._id }, { $set: { status: prevStatus, updatedAt: new Date() } }, {});
      });

      return { purchaseOrderId: String(po._id), linesReceived: receiptLines.length };
    } catch (err) {
      for (const rb of rollbacks.reverse()) {
        await rb().catch(() => {});
      }
      throw err;
    }
  });
}

export async function createPurchaseOrder(payload) {
  if (env.dbMode === "offline") return createPurchaseOrderOffline(payload);
  const supplier = await Supplier.findById(payload.supplierId);
  if (!supplier) throw new AppError(ErrorCodes.NOT_FOUND, "Supplier not found", 404);

  const items = payload.items.map((i) => ({
    drug: i.drug,
    qty: i.qty,
    rate: i.rate,
  }));
  const totalAmount = items.reduce((s, i) => s + i.qty * i.rate, 0);

  const count = await PurchaseOrder.countDocuments();
  const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(count + 1).padStart(3, "0")}`;

  const po = await PurchaseOrder.create({
    poNumber,
    supplierId: supplier._id,
    supplierName: supplier.name,
    items,
    totalAmount,
    status: payload.status || "draft",
    paymentStatus: "pending",
    deliveryDate: payload.deliveryDate,
    dueDate: payload.dueDate,
    paymentTerms: payload.paymentTerms,
    remarks: payload.remarks,
  });

  return po;
}

async function createPurchaseOrderOffline(payload) {
  const supplier = await findById(getWrapped("suppliers"), payload.supplierId);
  if (!supplier) throw new AppError(ErrorCodes.NOT_FOUND, "Supplier not found", 404);

  const items = payload.items.map((i) => ({
    drug: i.drug,
    qty: i.qty,
    rate: i.rate,
  }));
  const totalAmount = items.reduce((s, i) => s + i.qty * i.rate, 0);

  const count = await getWrapped("purchaseorders").count({});
  const poNumber = `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(count + 1).padStart(3, "0")}`;

  return insertWithTimestamps(getWrapped("purchaseorders"), {
    poNumber,
    supplierId: toIdString(supplier._id),
    supplierName: supplier.name,
    items,
    totalAmount,
    status: payload.status || "draft",
    paymentStatus: "pending",
    deliveryDate: payload.deliveryDate ? new Date(payload.deliveryDate) : undefined,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
    paymentTerms: payload.paymentTerms,
    remarks: payload.remarks,
    payments: [],
    paidAmount: 0,
    date: new Date(),
  });
}

export async function getPurchaseOrderById(id) {
  if (env.dbMode === "offline") {
    const po = await findById(getWrapped("purchaseorders"), id);
    if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
    const sup = po.supplierId ? await findById(getWrapped("suppliers"), po.supplierId) : null;
    return { ...po, supplierId: sup || po.supplierId };
  }
  const po = await PurchaseOrder.findById(id).populate("supplierId").lean();
  if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
  return po;
}

export async function recordPurchasePayment(purchaseOrderId, payload) {
  if (env.dbMode === "offline") return recordPurchasePaymentOffline(purchaseOrderId, payload);
  const { amount, method, reference, note } = payload;
  const po = await PurchaseOrder.findById(purchaseOrderId);
  if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid payment amount", 400);
  }
  po.payments.push({
    amount: amt,
    method: method || "Bank",
    reference: reference || "",
    note: note || "",
    paidAt: new Date(),
  });
  po.paidAmount = (po.paidAmount || 0) + amt;
  if (po.paidAmount >= (po.totalAmount || 0) - 0.01) po.paymentStatus = "paid";
  else if (po.paidAmount > 0) po.paymentStatus = "partial";
  await po.save();
  return po.toObject();
}

async function recordPurchasePaymentOffline(purchaseOrderId, payload) {
  const { amount, method, reference, note } = payload;
  const poStore = getWrapped("purchaseorders");
  const po = await findById(poStore, purchaseOrderId);
  if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid payment amount", 400);
  }
  const payments = [...(po.payments || [])];
  payments.push({
    amount: amt,
    method: method || "Bank",
    reference: reference || "",
    note: note || "",
    paidAt: new Date(),
  });
  let paidAmount = (po.paidAmount || 0) + amt;
  let paymentStatus = po.paymentStatus;
  if (paidAmount >= (po.totalAmount || 0) - 0.01) paymentStatus = "paid";
  else if (paidAmount > 0) paymentStatus = "partial";

  await poStore.update(
    { _id: po._id },
    {
      $set: {
        payments,
        paidAmount,
        paymentStatus,
        updatedAt: new Date(),
      },
    },
    {}
  );
  return { ...po, payments, paidAmount, paymentStatus };
}
