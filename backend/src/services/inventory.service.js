import mongoose from "mongoose";
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

export async function listStock({ q, page = 1, pageSize = 20, sort = "createdAt:desc", type }) {
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

  const data = rows.map((b) => {
    const p = b.productId;
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
      status: b.status,
      purchasePrice: b.purchaseRate,
      supplier: b.supplierId?.name || "",
    };
  });

  return {
    data,
    meta: { page, pageSize, total, sort, type },
  };
}

export async function addStock(payload, userId) {
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
export async function summarizeInventory() {
  const now = startOfDay(new Date());
  const soon = endOfDay(addDays(now, EXPIRY_WINDOW_DAYS));

  const age = new Date();
  age.setDate(age.getDate() - 90);

  const [totalSkus, expiringSoon, lowStock, expired, deadStock, expiredValue] = await Promise.all([
    Product.countDocuments(),
    ProductBatch.countDocuments({ expiryDate: { $gte: now, $lte: soon }, qtyOnHand: { $gt: 0 } }),
    ProductBatch.countDocuments({ qtyOnHand: { $gt: 0, $lte: LOW_STOCK_THRESHOLD } }),
    ProductBatch.countDocuments({ expiryDate: { $lt: now }, qtyOnHand: { $gt: 0 } }),
    ProductBatch.countDocuments({ createdAt: { $lt: age }, qtyOnHand: { $gt: 50 } }),
    ProductBatch.aggregate([
      { $match: { expiryDate: { $lt: now }, qtyOnHand: { $gt: 0 } } },
      { $group: { _id: null, value: { $sum: { $multiply: ["$qtyOnHand", "$mrp"] } } } },
    ]),
  ]);

  return {
    totalSkus,
    expiringSoon,
    lowStock,
    expired,
    deadStock,
    potentialLoss: expiredValue[0]?.value || 0,
  };
}

export async function listProducts({ q, page = 1, pageSize = 20 }) {
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
    // For "Master" view, we might pick the latest batch or sum of all batches
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

export async function createProduct(body) {
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
