import mongoose from "mongoose";

const returnItemSchema = new mongoose.Schema(
  {
    drug: { type: String, required: true },
    qty: { type: Number, required: true },
    amount: { type: Number, required: true },
    reason: { type: String },
    productBatchId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBatch" },
  },
  { _id: true }
);

const returnSchema = new mongoose.Schema(
  {
    returnCode: { type: String, unique: true, sparse: true, index: true },
    type: { type: String, enum: ["customer", "supplier"], required: true, index: true },
    date: { type: Date, default: Date.now },
    partyName: { type: String, required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    saleId: { type: mongoose.Schema.Types.ObjectId, ref: "Sale" },
    items: [returnItemSchema],
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "completed"],
      default: "pending",
    },
    creditNote: { type: String },
  },
  { timestamps: true }
);

returnSchema.index({ partyName: "text", returnCode: "text" });

export const ReturnDoc = mongoose.model("ReturnDoc", returnSchema);
