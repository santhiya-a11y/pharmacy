import mongoose from "mongoose";

const holdItemSchema = new mongoose.Schema({}, { strict: false, _id: true });

const saleHoldSchema = new mongoose.Schema(
  {
    holdId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    counterId: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String },
    cart: [holdItemSchema],
    grandTotal: { type: Number },
  },
  { timestamps: true }
);

export const SaleHold = mongoose.model("SaleHold", saleHoldSchema);
