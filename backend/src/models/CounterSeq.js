import mongoose from "mongoose";

const counterSeqSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 4500 },
  },
  { collection: "counter_sequences" }
);

export const CounterSeq = mongoose.model("CounterSeq", counterSeqSchema);

/** First issued number will be 4500 (matches UI bill counter start default). */
const INITIAL_INVOICE_SEQ = 4499;

export async function nextSeq(name) {
  const { env } = await import("../config/env.js");
  if (env.dbMode === "offline") {
    const { nextInvoiceSeqOffline } = await import("../db/nedb/sequences.js");
    return nextInvoiceSeqOffline(name);
  }
  const doc = await CounterSeq.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return doc?.seq ?? 4500;
}
