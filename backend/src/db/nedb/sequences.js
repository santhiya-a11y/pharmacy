import { withWriteLock } from "./writeMutex.js";
import { getWrapped } from "./initStores.js";

const FIRST_INVOICE_SEQ = 4500;

/**
 * Monotonic counter stored in counter_sequences (_id = counter name).
 * @param {string} name
 * @param {number} firstValue value returned on first bump
 */
export async function bumpSeq(name, firstValue) {
  return withWriteLock(`seq:${name}`, async () => {
    const w = getWrapped("counter_sequences");
    const doc = await w.findOne({ _id: name });
    if (!doc) {
      await w.insert({ _id: name, seq: firstValue, createdAt: new Date(), updatedAt: new Date() });
      return firstValue;
    }
    const next = Number(doc.seq) + 1;
    await w.update({ _id: name }, { $set: { seq: next, updatedAt: new Date() } }, {});
    return next;
  });
}

/** Matches mongoose CounterSeq.nextSeq("invoice") first value ≈4500 for fresh DB. */
export async function nextInvoiceSeqOffline(name) {
  return bumpSeq(name, FIRST_INVOICE_SEQ);
}
