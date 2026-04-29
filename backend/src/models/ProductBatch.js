import mongoose from "mongoose";

const productBatchSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    supplierId: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    batchNo: { type: String, required: true, trim: true },
    expiryDate: { type: Date, required: true },
    mrp: { type: Number, required: true },
    purchaseRate: { type: Number, default: 0 },
    sgstPct: { type: Number, default: 6 },
    cgstPct: { type: Number, default: 6 },
    rack: { type: String, trim: true },
    qtyOnHand: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["safe", "expiring", "low", "expired"],
      default: "safe",
    },
  },
  { timestamps: true }
);

productBatchSchema.index({ productId: 1, batchNo: 1 }, { unique: true });
productBatchSchema.index({ expiryDate: 1 });

export const ProductBatch = mongoose.model("ProductBatch", productBatchSchema);
