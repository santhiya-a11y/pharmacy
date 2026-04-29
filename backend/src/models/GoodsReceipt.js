import mongoose from "mongoose";

const receiptLineSchema = new mongoose.Schema(
  {
    purchaseItemId: { type: mongoose.Schema.Types.ObjectId },
    drug: String,
    orderedQty: Number,
    receivedQty: { type: Number, required: true },
    batchNo: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    mrp: { type: Number, required: true },
    rackLocation: { type: String },
    productBatchId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBatch" },
  },
  { _id: true }
);

const goodsReceiptSchema = new mongoose.Schema(
  {
    purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: "PurchaseOrder", required: true, index: true },
    lines: [receiptLineSchema],
    receivedAt: { type: Date, default: Date.now },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const GoodsReceipt = mongoose.model("GoodsReceipt", goodsReceiptSchema);
