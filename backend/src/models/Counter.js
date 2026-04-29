import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, trim: true },
    status: {
      type: String,
      enum: ["open", "closed", "break"],
      default: "closed",
    },
    assignedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    assignedEmployeeName: { type: String },
    openedAt: { type: Date },
    todaySales: { type: Number, default: 0 },
    todayTransactions: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Counter = mongoose.model("Counter", counterSchema);
