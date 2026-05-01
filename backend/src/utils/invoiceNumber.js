import { env } from "../config/env.js";
import { StoreSettings } from "../models/StoreSettings.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { nextSeq } from "../models/CounterSeq.js";

export async function nextInvoiceNumber() {
  let prefix = "INV-";
  if (env.dbMode === "offline") {
    const settings = await getWrapped("storesettings").findOne({ key: "billing" });
    prefix = settings?.value?.invoicePrefix ?? prefix;
  } else {
    const settings = await StoreSettings.findOne({ key: "billing" }).lean();
    prefix = settings?.value?.invoicePrefix ?? prefix;
  }
  const n = await nextSeq("invoice");
  return `${prefix}${String(n).padStart(6, "0")}`;
}
