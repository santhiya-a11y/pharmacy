import { z } from "zod";
import { 
  listStock, addStock, summarizeInventory, 
  listProducts, createProduct, updateProduct 
} from "../services/inventory.service.js";
import { success } from "../utils/apiResponse.js";

const listQuery = z.object({
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sort: z.string().optional(),
  type: z.enum(["expiring", "low_stock", "dead_stock", "expired"]).optional(),
});

const addBody = z
  .object({
    productId: z.string().optional(),
    itemName: z.string().optional(),
    manufacturer: z.string().optional(),
    category: z.string().optional(),
    supplierName: z.string().optional(),
    supplierId: z.string().optional(),
    batchNo: z.string().min(1),
    expiryDate: z.string().or(z.date()),
    mrp: z.number().positive(),
    purchaseRate: z.number().optional(),
    gstRate: z.number().optional(),
    sgstPct: z.number().optional(),
    cgstPct: z.number().optional(),
    rack: z.string().optional(),
    qty: z.number().positive(),
    invoiceNumber: z.string().optional(),
  })
  .refine((d) => Boolean(d.productId?.trim()) || (Boolean(d.itemName?.trim()) && Boolean(d.manufacturer?.trim())), {
    message: "Either productId or both itemName and manufacturer are required",
  });

export async function getStock(req, res, next) {
  try {
    const q = listQuery.parse(req.query);
    const [out, summary] = await Promise.all([listStock(q), summarizeInventory()]);
    return res.json(success(out.data, { ...out.meta, summary }));
  } catch (e) {
    next(e);
  }
}

export async function getProducts(req, res, next) {
  try {
    const q = listQuery.parse(req.query);
    const out = await listProducts(q);
    return res.json(success(out.data, out.meta));
  } catch (e) {
    next(e);
  }
}

export async function postProduct(req, res, next) {
  try {
    const p = await createProduct(req.body);
    return res.status(201).json(success({ id: String(p._id) }));
  } catch (e) {
    next(e);
  }
}

export async function putProduct(req, res, next) {
  try {
    const p = await updateProduct(req.params.id, req.body);
    return res.json(success({ id: String(p._id) }));
  } catch (e) {
    next(e);
  }
}

export async function postStock(req, res, next) {
  try {
    const body = addBody.parse(req.body);
    const batch = await addStock(body, req.user.id);
    return res.status(201).json(success({ id: String(batch._id) }));
  } catch (e) {
    next(e);
  }
}

export async function getSummary(req, res, next) {
  try {
    const s = await summarizeInventory();
    return res.json(success(s));
  } catch (e) {
    next(e);
  }
}

export async function postImport(req, res, next) {
  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    const acceptedRows = [];
    const errors = [];

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i] || {};
      try {
        const payload = addBody.parse({
          productId: row.productId,
          itemName: row.itemName ?? row.name ?? row.drug,
          manufacturer: row.manufacturer,
          category: row.category,
          supplierName: row.supplierName ?? row.supplier,
          supplierId: row.supplierId,
          batchNo: row.batchNo ?? row.batch,
          expiryDate: row.expiryDate ?? row.expiry,
          mrp: Number(row.mrp),
          purchaseRate: row.purchaseRate != null ? Number(row.purchaseRate) : undefined,
          gstRate: row.gstRate != null ? Number(row.gstRate) : undefined,
          sgstPct: row.sgstPct != null ? Number(row.sgstPct) : undefined,
          cgstPct: row.cgstPct != null ? Number(row.cgstPct) : undefined,
          rack: row.rack,
          qty: Number(row.qty ?? row.quantity),
          invoiceNumber: row.invoiceNumber,
        });
        await addStock(payload, req.user.id);
        acceptedRows.push(i);
      } catch (err) {
        errors.push({
          row: i,
          message: err?.message || "Invalid row",
        });
      }
    }

    return res.status(errors.length ? 207 : 201).json(
      success({
        accepted: acceptedRows.length,
        rejected: errors.length,
        errors,
      })
    );
  } catch (e) {
    next(e);
  }
}
