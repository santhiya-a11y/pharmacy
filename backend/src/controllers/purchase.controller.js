import { z } from "zod";
import { env } from "../config/env.js";
import { findById } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import {
  createPurchaseOrder,
  receivePurchaseStock,
  getPurchaseOrderById,
  recordPurchasePayment,
} from "../services/purchase.service.js";
import { PurchaseOrder } from "../models/PurchaseOrder.js";
import { success } from "../utils/apiResponse.js";

const receiveSchema = z.object({
  lines: z.array(
    z.object({
      drug: z.string(),
      orderedQty: z.number(),
      receivedQty: z.number(),
      batch: z.string(),
      expiry: z.string(),
      mrp: z.number(),
      rackLocation: z.string().optional(),
    })
  ),
});

const createSchema = z.object({
  supplierId: z.string(),
  items: z.array(
    z.object({
      drug: z.string(),
      qty: z.number(),
      rate: z.number(),
    })
  ),
  status: z.enum(["draft", "ordered", "delivered", "cancelled"]).optional(),
  deliveryDate: z.string().optional(),
  dueDate: z.string().optional(),
  paymentTerms: z.string().optional(),
  remarks: z.string().optional(),
});

export async function listPurchases(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 20;
    const q = String(req.query.q || "").trim();
    const status = String(req.query.status || "").trim();
    const paymentStatus = String(req.query.paymentStatus || "").trim();
    const { from, to } = req.query;

    const filter = {};
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [
        { poNumber: rx },
        { supplierName: rx },
        { "items.drug": rx },
      ];
    }
    if (status) {
      filter.status = status;
    }
    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
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

    let data;
    let total;
    if (env.dbMode === "offline") {
      const poStore = getWrapped("purchaseorders");
      let rows = await poStore.find(filter, { sort: { createdAt: -1 } });
      total = rows.length;
      rows = rows.slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize);
      data = await Promise.all(
        rows.map(async (po) => {
          const sup = po.supplierId ? await findById(getWrapped("suppliers"), po.supplierId) : null;
          return { ...po, supplierId: sup ? { _id: sup._id, name: sup.name } : po.supplierId };
        })
      );
    } else {
      [data, total] = await Promise.all([
        PurchaseOrder.find(filter)
          .populate("supplierId", "name")
          .sort({ createdAt: -1 })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean(),
        PurchaseOrder.countDocuments(filter),
      ]);
    }
    return res.json(success(data, { page, pageSize, total }));
  } catch (e) {
    next(e);
  }
}

export async function postPurchase(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const po = await createPurchaseOrder(body);
    return res.status(201).json(success(po));
  } catch (e) {
    next(e);
  }
}

export async function postReceive(req, res, next) {
  try {
    const body = receiveSchema.parse(req.body);
    const out = await receivePurchaseStock({
      purchaseOrderId: req.params.id,
      lines: body.lines,
      userId: req.user.id,
    });
    return res.json(success(out));
  } catch (e) {
    next(e);
  }
}

export async function getPurchase(req, res, next) {
  try {
    const po = await getPurchaseOrderById(req.params.id);
    return res.json(success(po));
  } catch (e) {
    next(e);
  }
}

const paymentSchema = z.object({
  amount: z.number().positive(),
  method: z.string().optional(),
  reference: z.string().optional(),
  note: z.string().optional(),
});

export async function postPayment(req, res, next) {
  try {
    const body = paymentSchema.parse(req.body);
    const po = await recordPurchasePayment(req.params.id, body);
    return res.json(success(po));
  } catch (e) {
    next(e);
  }
}
