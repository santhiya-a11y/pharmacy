import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBatch", index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", index: true },
    changeQty: { type: Number, required: true },
    reason: {
      type: String,
      enum: ["sale", "purchase_receive", "adjustment", "return_in", "return_out", "expiry_writeoff", "other"],
      required: true,
    },
    refType: { type: String },
    refId: { type: mongoose.Schema.Types.ObjectId },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String },
  },
  { timestamps: true }
);

inventoryLogSchema.index({ createdAt: -1 });

export const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);
