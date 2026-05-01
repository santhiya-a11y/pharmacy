import mongoose from "mongoose";
import { env } from "../config/env.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { insertWithTimestamps, findById } from "../db/nedb/documentHelpers.js";
import { withWriteLock } from "../db/nedb/writeMutex.js";
import { toIdString } from "../db/types.js";
import * as productRepo from "../db/repositories/productRepository.js";
import { ProductBatch } from "../models/ProductBatch.js";
import { Product } from "../models/Product.js";
import { Supplier } from "../models/Supplier.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { addDays, endOfDay, startOfDay } from "date-fns";

const LOW_STOCK_THRESHOLD = 15;
const EXPIRY_WINDOW_DAYS = 60;

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function batchStore() {
  return getWrapped("productbatches");
}
function supplierStore() {
  return getWrapped("suppliers");
}
function logStore() {
  return getWrapped("inventorylogs");
}

export async function listStock({ q, page = 1, pageSize = 20, sort = "createdAt:desc", type }) {
  if (env.dbMode === "offline") return listStockOffline({ q, page, pageSize, sort, type });
  let filter = { qtyOnHand: { $gt: 0 } };
  const now = startOfDay(new Date());
  const soon = endOfDay(addDays(now, EXPIRY_WINDOW_DAYS));

  if (type === "expired") {
    filter.expiryDate = { $lt: now };
  } else if (type === "expiring") {
    filter.expiryDate = { $gte: now, $lte: soon };
  } else if (type === "low_stock") {
    const productTotals = await ProductBatch.aggregate([
      { $match: { qtyOnHand: { $gt: 0 } } },
      { $group: { _id: "$productId", totalStock: { $sum: "$qtyOnHand" } } },
      { $match: { totalStock: { $lte: LOW_STOCK_THRESHOLD } } }
    ]);
    const lowStockProductIds = productTotals.map(pt => pt._id);
    filter.productId = { $in: lowStockProductIds };
  } else if (type === "dead_stock") {
    const age = new Date();
    age.setDate(age.getDate() - 90);
    filter.createdAt = { $lt: age };
    filter.qtyOnHand = { $gt: 50 };
  }

  if (q?.trim()) {
    const rx = new RegExp(q.trim(), "i");
    const products = await Product.find({
      $or: [{ name: rx }, { genericName: rx }, { manufacturer: rx }],
    })
      .select("_id")
      .lean();
    filter.productId = { $in: products.map((p) => p._id) };
  }

  const [field, dir] = sort.split(":");
  const sortObj = { [field || (type === "expiring" ? "expiryDate" : "createdAt")]: dir === "desc" ? -1 : 1 };

  const skip = (page - 1) * pageSize;
  const [rows, total] = await Promise.all([
    ProductBatch.find(filter)
      .populate("productId", "name manufacturer hsn genericName requiresRx")
      .populate("supplierId", "name")
      .sort(sortObj)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    ProductBatch.countDocuments(filter),
  ]);

  const productIds = [...new Set(rows.map(r => String(r.productId?._id)))].filter(Boolean);
  
  const productTotals = await ProductBatch.aggregate([
    { $match: { productId: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } } },
    { $group: { _id: "$productId", totalStock: { $sum: "$qtyOnHand" } } }
  ]);
  const stockMap = {};
  productTotals.forEach(pt => {
    stockMap[String(pt._id)] = pt.totalStock;
  });

  const data = rows.map((b) => {
    const p = b.productId;
    const pidStr = String(p?._id);
    const totalProdStock = stockMap[pidStr] || b.qtyOnHand;

    let computedStatus = "safe";
    if (b.expiryDate < now) {
      computedStatus = "expired";
    } else if (b.expiryDate <= soon) {
      computedStatus = "expiring";
    } else if (totalProdStock <= LOW_STOCK_THRESHOLD) {
      computedStatus = "low";
    }
    
    return {
      id: String(b._id),
      name: p?.name,
      mfr: p?.manufacturer,
      batch: b.batchNo,
      expiry: b.expiryDate,
      hsn: p?.hsn,
      mrp: b.mrp,
      stock: b.qtyOnHand,
      sgst: b.sgstPct,
      cgst: b.cgstPct,
      rack: b.rack,
      status: computedStatus,
      purchasePrice: b.purchaseRate,
      supplier: b.supplierId?.name || "",
    };
  });

  return {
    data,
    meta: { page, pageSize, total, sort, type },
  };
}

async function listStockOffline({ q, page = 1, pageSize = 20, sort = "createdAt:desc", type }) {
  let filter = { qtyOnHand: { $gt: 0 } };
  const now = startOfDay(new Date());
  const soon = endOfDay(addDays(now, EXPIRY_WINDOW_DAYS));

  if (type === "expired") {
    filter.expiryDate = { $lt: now };
  } else if (type === "expiring") {
    filter.expiryDate = { $gte: now, $lte: soon };
  } else if (type === "low_stock") {
    filter.qtyOnHand = { $gt: 0, $lte: LOW_STOCK_THRESHOLD };
  } else if (type === "dead_stock") {
    const age = new Date();
    age.setDate(age.getDate() - 90);
    filter.createdAt = { $lt: age };
    filter.qtyOnHand = { $gt: 50 };
  }

  if (q?.trim()) {
    const ids = await productRepo.productFindIdsByQuery(q);
    filter.productId = { $in: ids };
  }

  const [field, dir] = sort.split(":");
  const sortField = field || (type === "expiring" ? "expiryDate" : "createdAt");
  const sortOrder = dir === "desc" ? -1 : 1;
  const sortObj = { [sortField]: sortOrder };

  const bs = batchStore();
  let rows = await bs.find(filter, { sort: sortObj });
  const total = rows.length;
  const skip = (page - 1) * pageSize;
  rows = rows.slice(skip, skip + pageSize);

  const data = [];
  for (const b of rows) {
    const p = await productRepo.productFindById(b.productId);
    let supName = "";
    if (b.supplierId) {
      const s = await findById(supplierStore(), b.supplierId);
      supName = s?.name || "";
    }
    data.push({
      id: String(b._id),
      name: p?.name,
      mfr: p?.manufacturer,
      batch: b.batchNo,
      expiry: b.expiryDate,
      hsn: p?.hsn,
      mrp: b.mrp,
      stock: b.qtyOnHand,
      sgst: b.sgstPct,
      cgst: b.cgstPct,
      rack: b.rack,
      status: b.status,
      purchasePrice: b.purchaseRate,
      supplier: supName,
    });
  }

  return {
    data,
    meta: { page, pageSize, total, sort, type },
  };
}

export async function addStock(payload, userId) {
  if (env.dbMode === "offline") return addStockOffline(payload, userId);
  let pid;

  if (payload.productId?.trim()) {
    pid = new mongoose.Types.ObjectId(payload.productId.trim());
  } else {
    const itemName = payload.itemName?.trim();
    const manufacturer = payload.manufacturer?.trim();
    if (!itemName || !manufacturer) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Either productId or itemName and manufacturer are required", 400);
    }
    let product = await Product.findOne({
      name: new RegExp(`^${escapeRegex(itemName)}$`, "i"),
      manufacturer: new RegExp(`^${escapeRegex(manufacturer)}$`, "i"),
    });
    if (!product) {
      product = await Product.create({
        name: itemName,
        manufacturer,
        category: payload.category?.trim() || undefined,
        defaultGstPct: Number(payload.gstRate) || 12,
      });
    }
    pid = product._id;
  }

  let sid;
  if (payload.supplierId?.trim()) {
    sid = new mongoose.Types.ObjectId(payload.supplierId.trim());
  } else if (payload.supplierName?.trim()) {
    const name = payload.supplierName.trim();
    let supplier = await Supplier.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });
    if (!supplier) {
      supplier = await Supplier.create({ name });
    }
    sid = supplier._id;
  }

  const { batchNo, expiryDate, mrp, purchaseRate, rack, qty } = payload;
  const gst = Number(payload.gstRate);
  const half = Number.isFinite(gst) ? gst / 2 : 6;
  const sgstPct = payload.sgstPct ?? half;
  const cgstPct = payload.cgstPct ?? half;

  const batch = await ProductBatch.findOneAndUpdate(
    { productId: pid, batchNo },
    {
      $setOnInsert: { productId: pid, batchNo },
      $set: {
        supplierId: sid,
        expiryDate: new Date(expiryDate),
        mrp,
        purchaseRate: purchaseRate ?? 0,
        sgstPct,
        cgstPct,
        rack: rack ?? "",
      },
      $inc: { qtyOnHand: qty },
    },
    { upsert: true, new: true }
  );

  const noteParts = ["Add stock"];
  if (payload.invoiceNumber?.trim()) noteParts.push(`Invoice: ${payload.invoiceNumber.trim()}`);

  await InventoryLog.create({
    batchId: batch._id,
    productId: pid,
    changeQty: qty,
    reason: "adjustment",
    refType: "manual_stock",
    userId,
    note: noteParts.join(" — "),
  });

  return batch;
}

async function addStockOffline(payload, userId) {
  return withWriteLock("inventory-mutations", async () => {
    let pidStr;

    if (payload.productId?.trim()) {
      pidStr = toIdString(payload.productId.trim());
      const exists = await productRepo.productFindById(pidStr);
      if (!exists) throw new AppError(ErrorCodes.NOT_FOUND, "Product not found", 404);
    } else {
      const itemName = payload.itemName?.trim();
      const manufacturer = payload.manufacturer?.trim();
      if (!itemName || !manufacturer) {
        throw new AppError(ErrorCodes.VALIDATION_ERROR, "Either productId or itemName and manufacturer are required", 400);
      }
      let product = await productRepo.productFindOne({
        name: new RegExp(`^${escapeRegex(itemName)}$`, "i"),
        manufacturer: new RegExp(`^${escapeRegex(manufacturer)}$`, "i"),
      });
      if (!product) {
        product = await productRepo.productInsert({
          name: itemName,
          manufacturer,
          category: payload.category?.trim() || undefined,
          defaultGstPct: Number(payload.gstRate) || 12,
        });
      }
      pidStr = toIdString(product._id);
    }

    let sidStr;
    if (payload.supplierId?.trim()) {
      sidStr = toIdString(payload.supplierId.trim());
    } else if (payload.supplierName?.trim()) {
      const name = payload.supplierName.trim();
      let supplier = await supplierStore().findOne({
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      });
      if (!supplier) {
        supplier = await insertWithTimestamps(supplierStore(), { name });
      }
      sidStr = toIdString(supplier._id);
    }

    const { batchNo, expiryDate, mrp, purchaseRate, rack, qty } = payload;
    const gst = Number(payload.gstRate);
    const half = Number.isFinite(gst) ? gst / 2 : 6;
    const sgstPct = payload.sgstPct ?? half;
    const cgstPct = payload.cgstPct ?? half;

    const bs = batchStore();
    let batch = await bs.findOne({ productId: pidStr, batchNo });
    if (!batch) {
      batch = await insertWithTimestamps(bs, {
        productId: pidStr,
        batchNo,
        supplierId: sidStr,
        expiryDate: new Date(expiryDate),
        mrp,
        purchaseRate: purchaseRate ?? 0,
        sgstPct,
        cgstPct,
        rack: rack ?? "",
        qtyOnHand: qty,
        status: "safe",
      });
    } else {
      await bs.update(
        { _id: batch._id },
        {
          $set: {
            supplierId: sidStr,
            expiryDate: new Date(expiryDate),
            mrp,
            purchaseRate: purchaseRate ?? 0,
            sgstPct,
            cgstPct,
            rack: rack ?? "",
            updatedAt: new Date(),
          },
          $inc: { qtyOnHand: qty },
        },
        {}
      );
      batch = await bs.findOne({ _id: batch._id });
    }

    const noteParts = ["Add stock"];
    if (payload.invoiceNumber?.trim()) noteParts.push(`Invoice: ${payload.invoiceNumber.trim()}`);

    await insertWithTimestamps(logStore(), {
      batchId: batch._id,
      productId: pidStr,
      changeQty: qty,
      reason: "adjustment",
      refType: "manual_stock",
      userId: toIdString(userId),
      note: noteParts.join(" — "),
    });

    return batch;
  });
}

export async function summarizeInventory() {
  if (env.dbMode === "offline") return summarizeInventoryOffline();
  const now = startOfDay(new Date());
  const soon = endOfDay(addDays(now, EXPIRY_WINDOW_DAYS));

  // Determine which products have low total stock
  const productTotals = await ProductBatch.aggregate([
    { $match: { qtyOnHand: { $gt: 0 } } },
    { $group: { _id: "$productId", totalStock: { $sum: "$qtyOnHand" } } },
    { $match: { totalStock: { $lte: LOW_STOCK_THRESHOLD } } }
  ]);
  const lowStockProductIds = productTotals.map(pt => pt._id);

  const age = new Date();
  age.setDate(age.getDate() - 90);

  const [totalItems, expiredBatches, expiringBatches, lowStockBatches, deadStockBatches, expiredValue] = await Promise.all([
    ProductBatch.countDocuments({ qtyOnHand: { $gt: 0 } }),
    ProductBatch.countDocuments({ qtyOnHand: { $gt: 0 }, expiryDate: { $lt: now } }),
    ProductBatch.countDocuments({ qtyOnHand: { $gt: 0 }, expiryDate: { $gte: now, $lte: soon } }),
    ProductBatch.countDocuments({ 
      qtyOnHand: { $gt: 0 }, 
      expiryDate: { $gt: soon }, // priority: if <= soon, it's expiring/expired, not low stock
      productId: { $in: lowStockProductIds }
    }),
    ProductBatch.countDocuments({ qtyOnHand: { $gt: 50 }, createdAt: { $lt: age } }),
    ProductBatch.aggregate([
      { $match: { expiryDate: { $lt: now }, qtyOnHand: { $gt: 0 } } },
      { $group: { _id: null, value: { $sum: { $multiply: ["$qtyOnHand", "$mrp"] } } } },
    ]),
  ]);

  return {
    totalSkus: totalItems,
    expiringSoon: expiringBatches,
    lowStock: lowStockBatches,
    expired: expiredBatches,
    deadStock: deadStockBatches,
    potentialLoss: expiredValue[0]?.value || 0,
  };
}

async function summarizeInventoryOffline() {
  const now = startOfDay(new Date());
  const soon = endOfDay(addDays(now, EXPIRY_WINDOW_DAYS));
  const age = new Date();
  age.setDate(age.getDate() - 90);

  const [totalSkus, batches] = await Promise.all([
    productRepo.productCount({}),
    batchStore().find({}),
  ]);

  let expiringSoon = 0;
  let lowStock = 0;
  let expired = 0;
  let deadStock = 0;
  let potentialLoss = 0;

  for (const b of batches) {
    const exp = b.expiryDate ? new Date(b.expiryDate) : null;
    const qty = Number(b.qtyOnHand) || 0;
    const cr = b.createdAt ? new Date(b.createdAt) : null;
    if (qty <= 0) continue;
    if (exp && exp < now) {
      expired += 1;
      potentialLoss += qty * (Number(b.mrp) || 0);
    } else if (exp && exp >= now && exp <= soon) {
      expiringSoon += 1;
    }
    if (qty > 0 && qty <= LOW_STOCK_THRESHOLD) lowStock += 1;
    if (cr && cr < age && qty > 50) deadStock += 1;
  }

  return {
    totalSkus,
    expiringSoon,
    lowStock,
    expired,
    deadStock,
    potentialLoss,
  };
}

export async function listProducts({ q, page = 1, pageSize = 20 }) {
  if (env.dbMode === "offline") return listProductsOffline({ q, page, pageSize });
  let filter = {};
  if (q?.trim()) {
    const rx = new RegExp(q.trim(), "i");
    filter.$or = [{ name: rx }, { genericName: rx }, { manufacturer: rx }];
  }

  const skip = (page - 1) * pageSize;

  const [rows, total] = await Promise.all([
    Product.aggregate([
      { $match: filter },
      { $sort: { name: 1 } },
      { $skip: skip },
      { $limit: pageSize },
      {
        $lookup: {
          from: "productbatches",
          localField: "_id",
          foreignField: "productId",
          as: "batches",
        },
      },
      {
        $addFields: {
          activeBatches: {
            $filter: {
              input: "$batches",
              as: "b",
              cond: { $gt: ["$$b.qtyOnHand", 0] },
            },
          },
        },
      },
    ]),
    Product.countDocuments(filter),
  ]);

  const data = rows.map((p) => {
    const latest = p.activeBatches.length > 0 ? p.activeBatches[0] : null;
    const totalStock = p.activeBatches.reduce((sum, b) => sum + b.qtyOnHand, 0);

    return {
      id: String(p._id),
      name: p.name,
      generic: p.genericName || p.manufacturer,
      mfr: p.manufacturer,
      category: p.category,
      dosageForm: p.dosageForm || "---",
      packSize: p.packSize || "---",
      hsn: p.hsn || "---",
      mrp: latest?.mrp || 0,
      stock: totalStock,
      sgst: latest?.sgstPct || 6,
      cgst: latest?.cgstPct || 6,
      schedule: p.requiresRx ? "Rx" : "OTC",
    };
  });

  return { data, meta: { total, page, pageSize } };
}

async function listProductsOffline({ q, page = 1, pageSize = 20 }) {
  let filter = {};
  if (q?.trim()) {
    const rx = new RegExp(q.trim(), "i");
    filter.$or = [{ name: rx }, { genericName: rx }, { manufacturer: rx }];
  }

  const skip = (page - 1) * pageSize;
  const allProducts = await productRepo.productFind(filter, { sort: { name: 1 } });
  const total = allProducts.length;
  const rows = allProducts.slice(skip, skip + pageSize);
  const pids = new Set(rows.map((p) => toIdString(p._id)));
  const allBatches = await batchStore().find({ productId: { $in: [...pids] } });

  const byProduct = new Map();
  for (const b of allBatches) {
    const k = toIdString(b.productId);
    if (!byProduct.has(k)) byProduct.set(k, []);
    byProduct.get(k).push(b);
  }

  const data = rows.map((p) => {
    const pid = toIdString(p._id);
    const activeBatches = (byProduct.get(pid) || []).filter((b) => Number(b.qtyOnHand) > 0);
    const latest = activeBatches.length > 0 ? activeBatches[0] : null;
    const totalStock = activeBatches.reduce((sum, b) => sum + Number(b.qtyOnHand), 0);

    return {
      id: String(p._id),
      name: p.name,
      generic: p.genericName || p.manufacturer,
      mfr: p.manufacturer,
      category: p.category,
      dosageForm: p.dosageForm || "---",
      packSize: p.packSize || "---",
      hsn: p.hsn || "---",
      mrp: latest?.mrp || 0,
      stock: totalStock,
      sgst: latest?.sgstPct || 6,
      cgst: latest?.cgstPct || 6,
      schedule: p.requiresRx ? "Rx" : "OTC",
    };
  });

  return { data, meta: { total, page, pageSize } };
}

export async function createProduct(body) {
  if (env.dbMode === "offline") return productRepo.productInsertFromMaster(body);
  const p = await Product.create({
    name: body.brandName,
    genericName: body.genericName,
    manufacturer: body.manufacturer,
    category: body.category,
    dosageForm: body.dosageForm,
    packSize: body.packSize,
    hsn: body.hsn || body.barcode || "",
    requiresRx: body.schedule !== "OTC",
    defaultGstPct: Number(body.mrp) > 0 ? 12 : 5,
  });
  return p;
}

export async function updateProduct(id, body) {
  if (env.dbMode === "offline") {
    const p = await productRepo.productUpdateFromMaster(id, body);
    if (!p) throw new AppError(ErrorCodes.NOT_FOUND, "Product not found", 404);
    return p;
  }
  const p = await Product.findByIdAndUpdate(
    id,
    {
      $set: {
        name: body.brandName,
        genericName: body.genericName,
        manufacturer: body.manufacturer,
        category: body.category,
        dosageForm: body.dosageForm,
        packSize: body.packSize,
        hsn: body.hsn,
        requiresRx: body.schedule !== "OTC",
      },
    },
    { new: true }
  );
  if (!p) throw new AppError(ErrorCodes.NOT_FOUND, "Product not found", 404);
  return p;
}
