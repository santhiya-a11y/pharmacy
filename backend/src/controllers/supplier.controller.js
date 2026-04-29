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

    return res.json(success(data, { 
      page, 
      pageSize, 
      total,
      stats: {
        total: total,
        orders: summary.totalOrders,
        rating: Number(summary.avgRating || 0).toFixed(1),
        value: summary.totalValue,
        outstanding: summary.totalOutstanding
      }
    }));
  } catch (e) {
    next(e);
  }
}

export async function postSupplier(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const seq = await getNextSequence("supplier");
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
    const s = await Supplier.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
    if (!s) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } });
    return res.json(success(s));
  } catch (e) {
    next(e);
  }
}

export async function deleteSupplier(req, res, next) {
  try {
    const open = await PurchaseOrder.countDocuments({
      supplierId: req.params.id,
      status: { $nin: ["cancelled"] },
    });
    if (open > 0) {
      return res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "Supplier has purchase orders; cancel or complete them first." },
      });
    }
    const r = await Supplier.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Supplier not found" } });
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
