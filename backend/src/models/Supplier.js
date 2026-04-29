import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true },
    phone: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    location: { type: String },
    gst: { type: String, trim: true },
    rating: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    creditDays: { type: Number, default: 0 },
    categories: [{ type: String }],
    lastOrder: { type: Date },
    outstandingAmount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

supplierSchema.index({ name: "text", phone: "text", supplierCode: "text" });

export const Supplier = mongoose.model("Supplier", supplierSchema);
