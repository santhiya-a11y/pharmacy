import { StoreSettings } from "../models/StoreSettings.js";
import { nextSeq } from "../models/CounterSeq.js";

export async function nextInvoiceNumber() {
  const settings = await StoreSettings.findOne({ key: "billing" }).lean();
  const prefix = settings?.value?.invoicePrefix ?? "INV-";
  const n = await nextSeq("invoice");
  return `${prefix}${String(n).padStart(6, "0")}`;
}
