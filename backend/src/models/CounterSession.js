import mongoose from "mongoose";

const counterSessionSchema = new mongoose.Schema(
  {
    counterId: { type: mongoose.Schema.Types.ObjectId, ref: "Counter", required: true, index: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    loginAt: { type: Date, default: Date.now },
    logoutAt: { type: Date },
  },
  { timestamps: true }
);

counterSessionSchema.index({ counterId: 1, logoutAt: 1 });

export const CounterSession = mongoose.model("CounterSession", counterSessionSchema);
