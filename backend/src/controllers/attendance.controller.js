import mongoose from "mongoose";
import { env } from "../config/env.js";
import { findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { toIdString } from "../db/types.js";
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

    const date = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    if (env.dbMode === "offline") {
      const store = getWrapped("attendancerecords");
      const empOid = toIdString(eid);
      let rec = await store.findOne({ employeeId: empOid, date });
      if (!rec) {
        rec = await insertWithTimestamps(store, {
          employeeId: empOid,
          date,
          clockIn: now,
          status: "present",
          shift: "General",
        });
      } else {
        await store.update(
          { _id: rec._id },
          {
            $set: { clockIn: now, status: "present", shift: "General", updatedAt: new Date() },
            $unset: { clockOut: true, hoursWorked: true },
          },
          {}
        );
        rec = await findById(store, rec._id);
      }
      return res.json(success(rec));
    }

    const empOid = new mongoose.Types.ObjectId(eid);

    const rec = await AttendanceRecord.findOneAndUpdate(
      { employeeId: empOid, date },
      {
        $set: { clockIn: now, status: "present", shift: "General" },
        $unset: { clockOut: "", hoursWorked: "" },
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

    const date = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

    if (env.dbMode === "offline") {
      const store = getWrapped("attendancerecords");
      const empOid = toIdString(eid);
      const record = await store.findOne({ employeeId: empOid, date });
      if (!record || !record.clockIn) {
        return res.status(400).json({ success: false, error: { code: "NOT_CLOCKED_IN", message: "No clock-in record found for today" } });
      }

      const start = parseTime(record.clockIn);
      const end = parseTime(now);
      let hoursWorked = 0;
      if (start && end) {
        const startMin = start.hours * 60 + start.minutes;
        const endMin = end.hours * 60 + end.minutes;
        hoursWorked = Math.max(0, (endMin - startMin) / 60);
      }

      await store.update(
        { _id: record._id },
        { $set: { clockOut: now, hoursWorked: Number(hoursWorked.toFixed(2)), updatedAt: new Date() } },
        {}
      );
      const rec = await findById(store, record._id);
      return res.json(success(rec));
    }

    const empOid = new mongoose.Types.ObjectId(eid);

    const record = await AttendanceRecord.findOne({ employeeId: empOid, date });
    if (!record || !record.clockIn) {
      return res.status(400).json({ success: false, error: { code: "NOT_CLOCKED_IN", message: "No clock-in record found for today" } });
    }

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
    if (env.dbMode === "offline") {
      const rows = await getWrapped("attendancerecords").find({ employeeId: toIdString(eid) }, { sort: { date: -1 }, limit: 30 });
      return res.json(success(rows));
    }
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
    if (env.dbMode === "offline") {
      const rows = await getWrapped("attendancerecords").find({ employeeId: toIdString(id) }, { sort: { date: -1 }, limit: 60 });
      return res.json(success(rows));
    }
    const rows = await AttendanceRecord.find({ employeeId: new mongoose.Types.ObjectId(id) })
      .sort({ date: -1 })
      .limit(60)
      .lean();
    return res.json(success(rows));
  } catch (e) {
    next(e);
  }
}
