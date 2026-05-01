import { env } from "../config/env.js";
import { findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { toIdString } from "../db/types.js";
import { Supplier } from "../models/Supplier.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { success } from "../utils/apiResponse.js";
import { z } from "zod";
import { getNextSequence } from "../utils/sequence.js";

const createSchema = z.object({
  name: z.string(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().optional(),
  gst: z.string().optional(),
  creditDays: z.coerce.number().optional(),
  categories: z.array(z.string()).optional(),
});

export async function listSuppliers(req, res, next) {
  try {
    const q = req.query.q?.trim();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 100;

    const filter = q
      ? {
          $or: [{ name: new RegExp(q, "i") }, { contactPerson: new RegExp(q, "i") }, { supplierCode: new RegExp(q, "i") }],
        }
      : {};

    if (env.dbMode === "offline") {
      const store = getWrapped("suppliers");
      let rows = await store.find(filter, { sort: { createdAt: -1 } });
      const total = rows.length;
      rows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
      let totalOrders = 0;
      let ratingSum = 0;
      let ratingN = 0;
      let totalValue = 0;
      let totalOutstanding = 0;
      const allSup = await store.find({});
      for (const s of allSup) {
        totalOrders += Number(s.totalOrders) || 0;
        if (s.rating != null) {
          ratingSum += Number(s.rating);
          ratingN += 1;
        }
        totalValue += Number(s.totalValue) || 0;
        totalOutstanding += Number(s.outstandingAmount) || 0;
      }
      const summary = {
        totalOrders,
        avgRating: ratingN ? ratingSum / ratingN : 0,
        totalValue,
        totalOutstanding,
      };
      return res.json(
        success(rows, {
          page,
          pageSize,
          total,
          stats: {
            total,
            orders: summary.totalOrders,
            rating: Number(summary.avgRating || 0).toFixed(1),
            value: summary.totalValue,
            outstanding: summary.totalOutstanding,
          },
        })
      );
    }

    const [data, total, stats] = await Promise.all([
      Supplier.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Supplier.countDocuments(filter),
      Supplier.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: "$totalOrders" },
            avgRating: { $avg: "$rating" },
            totalValue: { $sum: "$totalValue" },
            totalOutstanding: { $sum: "$outstandingAmount" },
          },
        },
      ]),
    ]);

    const summary = stats[0] || { totalOrders: 0, avgRating: 0, totalValue: 0, totalOutstanding: 0 };

    return res.json(
      success(data, {
        page,
        pageSize,
        total,
        stats: {
          total,
          orders: summary.totalOrders,
          rating: Number(summary.avgRating || 0).toFixed(1),
          value: summary.totalValue,
          outstanding: summary.totalOutstanding,
        },
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function postSupplier(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const seq = await getNextSequence("supplier");
    if (env.dbMode === "offline") {
      const s = await insertWithTimestamps(getWrapped("suppliers"), {
        ...body,
        supplierCode: `SUP-${String(seq).padStart(4, "0")}`,
        rating: 0,
        totalOrders: 0,
        totalValue: 0,
        outstandingAmount: 0,
        creditDays: body.creditDays ?? 0,
      });
      return res.status(201).json(success(s));
    }
    const s = await Supplier.create({
      ...body,
      supplierCode: `SUP-${String(seq).padStart(4, "0")}`,
    });
    return res.status(201).json(success(s));
  } catch (e) {
    next(e);
  }
}

const updateSchema = createSchema.partial();

export async function putSupplier(req, res, next) {
  try {
    const body = updateSchema.parse(req.body);
    if (env.dbMode === "offline") {
      const store = getWrapped("suppliers");
      const cur = await findById(store, req.params.id);
      if (!cur) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } });
      await store.update({ _id: cur._id }, { $set: { ...body, updatedAt: new Date() } }, {});
      const s = await findById(store, req.params.id);
      return res.json(success(s));
    }
    const s = await Supplier.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
    if (!s) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } });
    return res.json(success(s));
  } catch (e) {
    next(e);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const sid = req.params.id;
    if (env.dbMode === "offline") {
      const poStore = getWrapped("purchaseorders");
      const pos = await poStore.find({ supplierId: sid });
      const open = pos.filter((p) => p.status !== "cancelled").length;
      if (open > 0) {
        return res.status(409).json({
          success: false,
          error: { code: "CONFLICT", message: "Supplier has purchase orders; cancel or complete them first." },
        });
      }
      const store = getWrapped("suppliers");
      const cur = await findById(store, sid);
      if (!cur) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } });
      await store.remove({ _id: toIdString(sid) }, { multi: false });
      return res.json(success({ ok: true }));
    }
    const open = await PurchaseOrder.countDocuments({
      supplierId: sid,
      status: { $nin: ["cancelled"] },
    });
    if (open > 0) {
      return res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "Supplier has purchase orders; cancel or complete them first." },
      });
    }
    const r = await Supplier.findByIdAndDelete(sid);
    if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } });
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
