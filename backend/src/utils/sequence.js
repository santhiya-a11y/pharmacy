import { CounterSeq } from "../models/CounterSeq.js";

/**
 * Increment and return a sequential counter for a given collection.
 *
 * @param {string} name - collection name e.g. "customer", "expense", "invoice"
 * @param {number} startAt - default if not found
 */
export async function getNextSequence(name, startAt = 1) {
  const { env } = await import("../config/env.js");
  if (env.dbMode === "offline") {
    const { bumpSeq } = await import("../db/nedb/sequences.js");
    return bumpSeq(name, startAt);
  }
  const doc = await CounterSeq.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
}
