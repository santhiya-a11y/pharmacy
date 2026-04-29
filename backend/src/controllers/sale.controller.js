import { Sale } from "../models/Sale.js";
import { success, fail } from "../utils/apiResponse.js";

export async function listInvoices(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const q = req.query.q?.trim();
    const filter = q
      ? {
          $or: [
            { invoiceNo: new RegExp(q, "i") },
            { customerName: new RegExp(q, "i") },
            { customerPhone: new RegExp(q, "i") },
          ],
        }
      : {};
    const [rows, total] = await Promise.all([
      Sale.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      Sale.countDocuments(filter),
    ]);
    return res.json(success(rows, { page, pageSize, total }));
  } catch (e) {
    next(e);
  }
}

export async function getInvoice(req, res, next) {
  try {
    let inv = await Sale.findOne({ invoiceNo: req.params.id }).lean();
    if (!inv) inv = await Sale.findById(req.params.id).lean();
    if (!inv) return res.status(404).json(fail("NOT_FOUND", "Invoice not found"));
    return res.json(success(inv));
  } catch (e) {
    next(e);
  }
}
