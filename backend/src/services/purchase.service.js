import mongoose from "mongoose";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { GoodsReceipt } from "../models/GoodsReceipt.js";
import { Product } from "../models/Product.js";
import { ProductBatch } from "../models/ProductBatch.js";
import { Supplier } from "../models/Supplier.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { AppError, ErrorCodes } from "../utils/errors.js";

export async function receivePurchaseStock({
  purchaseOrderId,
  lines,
  userId,
}) {
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
        const [created] = await Product.create([
          { name: line.drug, manufacturer: "", defaultGstPct: 12 },
        ], { session });
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

      await InventoryLog.create([{
        batchId: batch._id,
        productId: product._id,
        changeQty: Number(line.receivedQty),
        reason: "purchase_receive",
        refType: "purchase_order",
        refId: po._id,
        userId: new mongoose.Types.ObjectId(userId),
      }], { session });

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

    await GoodsReceipt.create([{
      purchaseOrderId: po._id,
      lines: receiptLines,
      userId: new mongoose.Types.ObjectId(userId),
    }], { session });

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

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function createPurchaseOrder(payload) {
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

export async function getPurchaseOrderById(id) {
  const po = await PurchaseOrder.findById(id).populate("supplierId").lean();
  if (!po) throw new AppError(ErrorCodes.NOT_FOUND, "Purchase order not found", 404);
  return po;
}

export async function recordPurchasePayment(purchaseOrderId, payload) {
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
