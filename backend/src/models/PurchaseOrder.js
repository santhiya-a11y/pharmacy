import mongoose from "mongoose";

const poItemSchema = new mongoose.Schema(
  {
    drug: { type: String, required: true },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true },
  },
  { _id: true }
);

const purchasePaymentSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    method: { type: String },
    reference: { type: String },
    note: { type: String },
    paidAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true, index: true },
    supplierName: { type: String },
    date: { type: Date, default: Date.now },
    items: [poItemSchema],
    status: {
      type: String,
      enum: ["draft", "ordered", "delivered", "cancelled"],
      default: "draft",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    totalAmount: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    deliveryDate: { type: Date },
    dueDate: { type: Date },
    paymentTerms: { type: String },
    remarks: { type: String },
    invoiceNo: { type: String },
    payments: [purchasePaymentSchema],
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ status: 1, paymentStatus: 1 });

export const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);
