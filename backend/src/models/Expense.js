import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    expenseCode: { type: String, unique: true, sparse: true, index: true },
    date: { type: Date, default: Date.now, index: true },
    category: { type: String, required: true, index: true },
    description: { type: String },
    amount: { type: Number, required: true },
    paidTo: { type: String },
  },
  { timestamps: true }
);

expenseSchema.index({ description: "text", category: "text" });

export const Expense = mongoose.model("Expense", expenseSchema);
