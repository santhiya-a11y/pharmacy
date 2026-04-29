import { Product } from "../models/Product.js";
import { ProductBatch } from "../models/ProductBatch.js";

function formatExp(d) {
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

export async function searchProducts({ q, page = 1, pageSize = 20 }) {
  const rx = new RegExp(q.trim(), "i");
  const filter = {
    $or: [{ name: rx }, { genericName: rx }, { manufacturer: rx }],
  };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter),
  ]);

  const data = [];
  for (const p of products) {
    const batch = await ProductBatch.findOne({
      productId: p._id,
      qtyOnHand: { $gt: 0 },
      expiryDate: { $gte: new Date() },
    })
      .sort({ expiryDate: 1 })
      .lean();

    const gstPct = batch
      ? (batch.sgstPct || 0) + (batch.cgstPct || 0) || p.defaultGstPct || 12
      : p.defaultGstPct || 12;

    data.push({
      id: String(p._id),
      name: p.name,
      description: p.description || "",
      generic: p.genericName || "",
      mfr: p.manufacturer || "",
      batch: batch?.batchNo || "",
      expiry: batch ? formatExp(batch.expiryDate) : "",
      hsn: p.hsn || "",
      mrp: batch?.mrp ?? 0,
      cost: batch?.purchaseRate ?? 0,
      stock: batch?.qtyOnHand ?? 0,
      gstPct,
      requiresRx: p.requiresRx || false,
      productBatchId: batch ? String(batch._id) : null,
    });
  }

  return { data, meta: { page, pageSize, total } };
}
