import { Employee } from "../models/Employee.js";
import { success } from "../utils/apiResponse.js";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  email: z.string().email().optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).optional().default("active"),
  shift: z.string().min(1, "Shift is required"),
  dob: z.string().min(1, "Date of birth is required"),
  gender: z.string().min(1, "Gender is required"),
  address: z.string().min(1, "Address is required"),
  emergencyContact: z.string().length(10, "Emergency contact must be exactly 10 digits"),
  qualification: z.string().optional(),
  university: z.string().optional(),
  graduationYear: z.string().optional(),
  regNumber: z.string().optional(),
  pharmacyCouncil: z.string().optional(),
  licenseIssue: z.string().optional(),
  licenseExpiry: z.string().optional(),
  idType: z.string().min(1, "ID Type is required").optional().or(z.literal("")),
  idNumber: z.string().min(1, "ID Number is required").optional().or(z.literal("")),
});

export async function listStaff(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 100;
    const q = req.query.q?.trim();
    const filter = q
      ? {
          $or: [
            { name: new RegExp(q, "i") },
            { employeeCode: new RegExp(q, "i") },
            { role: new RegExp(q, "i") },
          ],
        }
      : {};

    const [data, total, stats] = await Promise.all([
      Employee.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Employee.countDocuments(filter),
      Employee.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
            inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
            roles: { $addToSet: "$role" },
          },
        },
      ]),
    ]);

    const summary = stats[0] || { total: 0, active: 0, inactive: 0, roles: [] };

    return res.json(success(data, { 
      page, 
      pageSize, 
      total, 
      stats: {
        total: summary.total,
        active: summary.active,
        inactive: summary.inactive,
        rolesCount: summary.roles.length,
      } 
    }));
  } catch (e) {
    next(e);
  }
}

export async function postStaff(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const count = await Employee.countDocuments();
    const emp = await Employee.create({
      ...body,
      employeeCode: `EMP-${String(count + 1).padStart(4, "0")}`,
      joinDate: new Date(),
    });
    return res.status(201).json(success(emp));
  } catch (e) {
    next(e);
  }
}

export async function postStaffDocument(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type, url, size } = req.body;
    const emp = await Employee.findByIdAndUpdate(
      id,
      {
        $push: {
          documents: {
            name,
            type,
            url,
            size: size || "1.0 MB",
            uploadedAt: new Date(),
          },
        },
      },
      { new: true }
    );
    if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee" } });
    return res.json(success(emp));
  } catch (e) {
    next(e);
  }
}

export async function deleteStaff(req, res, next) {
  try {
    const { id } = req.params;
    const emp = await Employee.findByIdAndDelete(id);
    if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body;
    const emp = await Employee.findByIdAndUpdate(id, { $set: body }, { new: true });
    if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
    return res.json(success(emp));
  } catch (e) {
    next(e);
  }
}

export async function deleteStaffDocument(req, res, next) {
  try {
    const { id, docId } = req.params;
    const emp = await Employee.findByIdAndUpdate(
      id,
      { $pull: { documents: { _id: docId } } },
      { new: true }
    );
    if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
    return res.json(success(emp));
  } catch (e) {
    next(e);
  }
}
