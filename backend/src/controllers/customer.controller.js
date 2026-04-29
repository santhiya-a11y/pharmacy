import { Customer } from "../models/Customer.js";
import { success } from "../utils/apiResponse.js";
import { z } from "zod";
import { getNextSequence } from "../utils/sequence.js";

const medicationSchema = z.object({
  drug: z.string(),
  dosage: z.string(),
  refillDate: z.string(),
});

const createSchema = z.object({
  name: z.string(),
  phone: z.string(),
  email: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  allergies: z.array(z.string()).optional(),
  conditions: z.array(z.string()).optional(),
  medications: z.array(medicationSchema).optional(),
});

export async function listCustomers(req, res, next) {
  try {
    const q = req.query.q?.trim();
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 100;
    
    const filter = q
      ? {
          $or: [{ name: new RegExp(q, "i") }, { phone: new RegExp(q, "i") }, { customerCode: new RegExp(q, "i") }],
        }
      : {};

    const [data, total, stats] = await Promise.all([
      Customer.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Customer.countDocuments(filter),
      Customer.aggregate([
        {
          $group: {
            _id: null,
            totalLoyalty: { $sum: "$loyaltyPoints" },
            totalCredit: { $sum: "$creditBalance" },
            totalMeds: { $sum: { $size: { $ifNull: ["$medications", []] } } },
          },
        },
      ]),
    ]);

    const summary = stats[0] || { totalLoyalty: 0, totalCredit: 0, totalMeds: 0 };

    return res.json(success(data, { 
      page, 
      pageSize, 
      total, 
      stats: {
        total: total,
        loyalty: summary.totalLoyalty,
        credit: summary.totalCredit,
        meds: summary.totalMeds
      } 
    }));
  } catch (e) {
    next(e);
  }
}

export async function postCustomer(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const seq = await getNextSequence("customer");
    const c = await Customer.create({
      ...body,
      customerCode: `CUST-${String(seq).padStart(4, "0")}`,
    });
    return res.status(201).json(success(c));
  } catch (e) {
    next(e);
  }
}

export async function getCustomer(req, res, next) {
  try {
    const c = await Customer.findById(req.params.id).lean();
    if (!c) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
    return res.json(success(c));
  } catch (e) {
    next(e);
  }
}

const updateSchema = createSchema.partial();

export async function putCustomer(req, res, next) {
  try {
    const body = updateSchema.parse(req.body);
    const c = await Customer.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
    if (!c) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
    return res.json(success(c));
  } catch (e) {
    next(e);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    const r = await Customer.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
