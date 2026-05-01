import { env } from "../config/env.js";
import { deleteById, findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { toIdString } from "../db/types.js";
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
          $or: [{ name: new RegExp(q, "i") }, { employeeCode: new RegExp(q, "i") }, { role: new RegExp(q, "i") }],
        }
      : {};

    if (env.dbMode === "offline") {
      const store = getWrapped("employees");
      let rows = await store.find(filter, { sort: { name: 1 } });
      const total = rows.length;
      rows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
      const all = await store.find({});
      let active = 0;
      let inactive = 0;
      const roles = new Set();
      for (const e of all) {
        if (e.status === "active") active += 1;
        if (e.status === "inactive") inactive += 1;
        if (e.role) roles.add(e.role);
      }
      const summary = { total: all.length, active, inactive, roles: [...roles] };
      return res.json(
        success(rows, {
          page,
          pageSize,
          total,
          stats: {
            total: summary.total,
            active: summary.active,
            inactive: summary.inactive,
            rolesCount: summary.roles.length,
          },
        })
      );
    }

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

    return res.json(
      success(data, {
        page,
        pageSize,
        total,
        stats: {
          total: summary.total,
          active: summary.active,
          inactive: summary.inactive,
          rolesCount: summary.roles.length,
        },
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function postStaff(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    if (env.dbMode === "offline") {
      const store = getWrapped("employees");
      const count = await store.count({});
      const emp = await insertWithTimestamps(store, {
        ...body,
        employeeCode: `EMP-${String(count + 1).padStart(4, "0")}`,
        joinDate: new Date(),
        documents: [],
      });
      return res.status(201).json(success(emp));
    }
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
    if (env.dbMode === "offline") {
      const store = getWrapped("employees");
      const emp = await findById(store, id);
      if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee" } });
      const documents = [...(emp.documents || [])];
      documents.push({
        name,
        type,
        url,
        size: size || "1.0 MB",
        uploadedAt: new Date(),
      });
      await store.update({ _id: emp._id }, { $set: { documents, updatedAt: new Date() } }, {});
      const out = await findById(store, id);
      return res.json(success(out));
    }
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
    if (env.dbMode === "offline") {
      const cur = await findById(getWrapped("employees"), id);
      if (!cur) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
      await deleteById(getWrapped("employees"), id);
      return res.json(success({ ok: true }));
    }
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
    if (env.dbMode === "offline") {
      const store = getWrapped("employees");
      const cur = await findById(store, id);
      if (!cur) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
      await store.update({ _id: cur._id }, { $set: { ...body, updatedAt: new Date() } }, {});
      const emp = await findById(store, id);
      return res.json(success(emp));
    }
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
    if (env.dbMode === "offline") {
      const store = getWrapped("employees");
      const emp = await findById(store, id);
      if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
      const documents = (emp.documents || []).filter((d) => toIdString(d._id) !== toIdString(docId));
      await store.update({ _id: emp._id }, { $set: { documents, updatedAt: new Date() } }, {});
      const out = await findById(store, id);
      return res.json(success(out));
    }
    const emp = await Employee.findByIdAndUpdate(id, { $pull: { documents: { _id: docId } } }, { new: true });
    if (!emp) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "No employee found" } });
    return res.json(success(emp));
  } catch (e) {
    next(e);
  }
}
