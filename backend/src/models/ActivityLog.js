import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String },
    role: { type: String },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["dispensing", "billing", "inventory", "controlled", "access", "other"],
      default: "other",
      index: true,
    },
    details: { type: String },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
      index: true,
    },
    drugInfo: {
      drug: String,
      qty: Number,
      batchNo: String,
    },
    ip: { type: String },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ action: "text", details: "text" });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
