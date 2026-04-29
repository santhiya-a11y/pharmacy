import mongoose from "mongoose";

const attendanceRecordSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true, index: true },
    employeeName: { type: String },
    date: { type: String, required: true, index: true },
    clockIn: { type: String },
    clockOut: { type: String },
    status: {
      type: String,
      enum: ["present", "absent", "late", "half-day"],
      default: "present",
    },
    hoursWorked: { type: Number },
    shift: { type: String },
  },
  { timestamps: true }
);

attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });

export const AttendanceRecord = mongoose.model("AttendanceRecord", attendanceRecordSchema);
