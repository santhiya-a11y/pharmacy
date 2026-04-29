import mongoose from "mongoose";
import { AttendanceRecord } from "../models/AttendanceRecord.js";
import { success } from "../utils/apiResponse.js";
import { z } from "zod";

const clockSchema = z.object({
  employeeId: z.string().optional(),
});

function parseTime(timeStr) {
  if (!timeStr) return null;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);
  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;
  return { hours, minutes };
}

export async function postClockIn(req, res, next) {
  try {
    const body = clockSchema.parse(req.body || {});
    const eid = body.employeeId || req.user.employeeId;
    if (!eid) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No employee assigned to user" } });
    
    const empOid = new mongoose.Types.ObjectId(eid);
    const date = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    const rec = await AttendanceRecord.findOneAndUpdate(
      { employeeId: empOid, date },
      { 
        $set: { clockIn: now, status: "present", shift: "General" },
        $unset: { clockOut: "", hoursWorked: "" } 
      },
      { upsert: true, new: true }
    );
    return res.json(success(rec));
  } catch (e) {
    next(e);
  }
}

export async function postClockOut(req, res, next) {
  try {
    const body = clockSchema.parse(req.body || {});
    const eid = body.employeeId || req.user.employeeId;
    if (!eid) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No employee assigned to user" } });
    
    const empOid = new mongoose.Types.ObjectId(eid);
    const date = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    
    const record = await AttendanceRecord.findOne({ employeeId: empOid, date });
    if (!record || !record.clockIn) {
      return res.status(400).json({ success: false, error: { code: "NOT_CLOCKED_IN", message: "No clock-in record found for today" } });
    }

    // Calculate hours
    const start = parseTime(record.clockIn);
    const end = parseTime(now);
    let hoursWorked = 0;
    if (start && end) {
      const startMin = start.hours * 60 + start.minutes;
      const endMin = end.hours * 60 + end.minutes;
      hoursWorked = Math.max(0, (endMin - startMin) / 60);
    }

    const rec = await AttendanceRecord.findOneAndUpdate(
      { employeeId: empOid, date },
      { $set: { clockOut: now, hoursWorked: Number(hoursWorked.toFixed(2)) } },
      { new: true }
    );
    return res.json(success(rec));
  } catch (e) {
    next(e);
  }
}

export async function getMyAttendance(req, res, next) {
  try {
    const eid = req.user.employeeId;
    if (!eid) return res.json(success([]));
    const rows = await AttendanceRecord.find({ employeeId: new mongoose.Types.ObjectId(eid) })
      .sort({ date: -1 })
      .limit(30)
      .lean();
    return res.json(success(rows));
  } catch (e) {
    next(e);
  }
}

export async function getStaffAttendance(req, res, next) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "No employee ID" } });
    const rows = await AttendanceRecord.find({ employeeId: new mongoose.Types.ObjectId(id) })
      .sort({ date: -1 })
      .limit(60)
      .lean();
    return res.json(success(rows));
  } catch (e) {
    next(e);
  }
}
