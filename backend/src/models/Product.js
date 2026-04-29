import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    genericName: { type: String },
    manufacturer: { type: String, trim: true },
    hsn: { type: String, trim: true },
    schedule: { type: String },
    category: { type: String },
    dosageForm: { type: String },
    packSize: { type: String },
    requiresRx: { type: Boolean, default: false },
    isBag: { type: Boolean, default: false },
    defaultGstPct: { type: Number, default: 12 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", genericName: "text", manufacturer: "text" });

export const Product = mongoose.model("Product", productSchema);
