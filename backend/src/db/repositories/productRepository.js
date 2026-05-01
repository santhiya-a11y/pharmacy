import { getWrapped } from "../nedb/initStores.js";
import { insertWithTimestamps, findById } from "../nedb/documentHelpers.js";
import { toIdString } from "../types.js";

function productStore() {
  return getWrapped("products");
}

export async function productFindById(id) {
  return findById(productStore(), id);
}

export async function productFindOne(filter) {
  return productStore().findOne(filter);
}

export async function productFind(filter, opts) {
  return productStore().find(filter, opts);
}

export async function productCount(filter) {
  return productStore().count(filter);
}

export async function productInsert(doc) {
  return insertWithTimestamps(productStore(), doc);
}

export async function productUpdateById(id, $set) {
  return productStore().update(
    { _id: toIdString(id) },
    { $set: { ...$set, updatedAt: new Date() } },
    { multi: false }
  );
}

/** Multi-field case-insensitive search (replaces Mongoose text index intent). */
export async function productFindIdsByQuery(q) {
  const rx = new RegExp(q.trim(), "i");
  const rows = await productStore().find({ $or: [{ name: rx }, { genericName: rx }, { manufacturer: rx }] }, {
    sort: { name: 1 },
  });
  return rows.map((p) => p._id);
}

export async function productInsertFromMaster(body) {
  return insertWithTimestamps(productStore(), {
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
}

export async function productUpdateFromMaster(id, body) {
  const res = await productStore().update(
    { _id: toIdString(id) },
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
        updatedAt: new Date(),
      },
    },
    { multi: false, returnUpdatedDocs: true }
  );
  return res.affectedDocuments ?? null;
}
