import { env } from "../config/env.js";
import { deleteById, findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
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

    if (env.dbMode === "offline") {
      const store = getWrapped("customers");
      let rows = await store.find(filter, { sort: { createdAt: -1 } });
      const total = rows.length;
      rows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
      let totalLoyalty = 0;
      let totalCredit = 0;
      let totalMeds = 0;
      const all = await store.find({});
      for (const c of all) {
        totalLoyalty += Number(c.loyaltyPoints) || 0;
        totalCredit += Number(c.creditBalance) || 0;
        totalMeds += (c.medications || []).length;
      }
      const summary = { totalLoyalty, totalCredit, totalMeds };
      return res.json(
        success(rows, {
          page,
          pageSize,
          total,
          stats: {
            total,
            loyalty: summary.totalLoyalty,
            credit: summary.totalCredit,
            meds: summary.totalMeds,
          },
        })
      );
    }

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

    return res.json(
      success(data, {
        page,
        pageSize,
        total,
        stats: {
          total,
          loyalty: summary.totalLoyalty,
          credit: summary.totalCredit,
          meds: summary.totalMeds,
        },
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function postCustomer(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const seq = await getNextSequence("customer");
    if (env.dbMode === "offline") {
      const c = await insertWithTimestamps(getWrapped("customers"), {
        ...body,
        customerCode: `CUST-${String(seq).padStart(4, "0")}`,
      });
      return res.status(201).json(success(c));
    }
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
    let c;
    if (env.dbMode === "offline") {
      c = await findById(getWrapped("customers"), req.params.id);
    } else {
      c = await Customer.findById(req.params.id).lean();
    }
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
    if (env.dbMode === "offline") {
      const store = getWrapped("customers");
      const cur = await findById(store, req.params.id);
      if (!cur) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
      await store.update({ _id: cur._id }, { $set: { ...body, updatedAt: new Date() } }, {});
      const c = await findById(store, req.params.id);
      return res.json(success(c));
    }
    const c = await Customer.findByIdAndUpdate(req.params.id, { $set: body }, { new: true }).lean();
    if (!c) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
    return res.json(success(c));
  } catch (e) {
    next(e);
  }
}

export async function deleteCustomer(req, res, next) {
  try {
    if (env.dbMode === "offline") {
      const cur = await findById(getWrapped("customers"), req.params.id);
      if (!cur) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
      await deleteById(getWrapped("customers"), req.params.id);
      return res.json(success({ ok: true }));
    }
    const r = await Customer.findByIdAndDelete(req.params.id);
    if (!r) return res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Customer not found" } });
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
