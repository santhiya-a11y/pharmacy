import { env } from "../config/env.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { Sale } from "../models/Sale.js";
import { success, fail } from "../utils/apiResponse.js";

export async function listInvoices(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const q = req.query.q?.trim();
    const { from, to } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { invoiceNo: new RegExp(q, "i") },
        { customerName: new RegExp(q, "i") },
        { customerPhone: new RegExp(q, "i") },
      ];
    }
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    let rows;
    let total;
    if (env.dbMode === "offline") {
      const sales = getWrapped("sales");
      let all = await sales.find(filter, { sort: { createdAt: -1 } });
      total = all.length;
      rows = all.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
    } else {
      [rows, total] = await Promise.all([
        Sale.find(filter)
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        Sale.countDocuments(filter),
      ]);
    }
    return res.json(success(rows, { page, pageSize, total }));
  } catch (e) {
    next(e);
  }
}

export async function getInvoice(req, res, next) {
  try {
    let inv;
    if (env.dbMode === "offline") {
      const sales = getWrapped("sales");
      inv = await sales.findOne({ invoiceNo: req.params.id });
      if (!inv) inv = await sales.findOne({ _id: req.params.id });
    } else {
      inv = await Sale.findOne({ invoiceNo: req.params.id }).lean();
      if (!inv) inv = await Sale.findById(req.params.id).lean();
    }
    if (!inv) return res.status(404).json(fail("NOT_FOUND", "Invoice not found"));
    return res.json(success(inv));
  } catch (e) {
    next(e);
  }
}
