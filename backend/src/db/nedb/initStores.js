import path from "path";
import { env } from "../../config/env.js";
import { createDatastore, wrapDatastore } from "./nedbStore.js";

/** Mongoose default collection names (lowercase plural) + explicit counter_sequences. */
export const COLLECTION_KEYS = [
  "products",
  "productbatches",
  "suppliers",
  "inventorylogs",
  "sales",
  "users",
  "roles",
  "employees",
  "customers",
  "counters",
  "countersessions",
  "purchaseorders",
  "goodsreceipts",
  "expenses",
  "returndocs",
  "saleholds",
  "storesettings",
  "activitylogs",
  "attendancerecords",
  "counter_sequences",
];

/** @type {Map<string, ReturnType<wrapDatastore>>} */
const stores = new Map();

export async function initNedbStores() {
  const root = path.resolve(env.nedbDataDir);
  for (const key of COLLECTION_KEYS) {
    const filepath = path.join(root, `${key}.db`);
    const ds = createDatastore(filepath);
    stores.set(key, wrapDatastore(ds));
  }
  await ensureIndexes();
}

async function ensureIndexes() {
  const sales = stores.get("sales");
  if (sales) {
    await sales.ensureIndex({ fieldName: "invoiceNo", unique: true });
    await sales.ensureIndex({ fieldName: "date" });
    await sales.ensureIndex({ fieldName: "customerPhone" });
    try {
      await sales.ensureIndex({ fieldName: "idempotencyKey", unique: true, sparse: true });
    } catch {
      /* duplicate sparse unique setup on re-run */
    }
  }
  const users = stores.get("users");
  if (users) {
    await users.ensureIndex({ fieldName: "email", unique: true });
  }
  const products = stores.get("products");
  if (products) {
    await products.ensureIndex({ fieldName: "name" });
  }
  const batches = stores.get("productbatches");
  if (batches) {
    await batches.ensureIndex({ fieldName: "productId" });
    await batches.ensureIndex({ fieldName: "batchNo" });
    await batches.ensureIndex({ fieldName: "expiryDate" });
  }
  const po = stores.get("purchaseorders");
  if (po) {
    await po.ensureIndex({ fieldName: "poNumber" });
    await po.ensureIndex({ fieldName: "supplierId" });
  }
  const expenses = stores.get("expenses");
  if (expenses) {
    await expenses.ensureIndex({ fieldName: "date" });
  }
  const holds = stores.get("saleholds");
  if (holds) {
    await holds.ensureIndex({ fieldName: "holdId", unique: true });
    await holds.ensureIndex({ fieldName: "userId" });
  }
}

/**
 * @param {string} key
 * @returns {ReturnType<wrapDatastore>}
 */
export function getWrapped(key) {
  const w = stores.get(key);
  if (!w) throw new Error(`NeDB store not initialized: ${key}`);
  return w;
}

export async function closeNedbStores() {
  stores.clear();
}
