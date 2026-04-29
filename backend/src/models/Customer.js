import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    drug: String,
    dosage: String,
    refillDate: Date,
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    customerCode: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    age: { type: Number },
    gender: { type: String, trim: true },
    address: { type: String },
    allergies: [{ type: String }],
    conditions: [{ type: String }],
    medications: [medicationSchema],
    loyaltyPoints: { type: Number, default: 0 },
    creditBalance: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    type: { type: String, enum: ["regular", "vip", "credit"], default: "regular" },
    lastVisit: { type: Date },
    avatar: { type: String },
  },
  { timestamps: true }
);

customerSchema.index({ name: "text", phone: "text", customerCode: "text" });

export const Customer = mongoose.model("Customer", customerSchema);
