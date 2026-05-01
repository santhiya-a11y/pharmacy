import { newObjectIdString, toIdString } from "../types.js";

export async function insertWithTimestamps(store, doc) {
  const now = new Date();
  const d = { ...doc };
  if (!d._id) d._id = newObjectIdString();
  d.createdAt = d.createdAt ?? now;
  d.updatedAt = d.updatedAt ?? now;
  return store.insert(d);
}

export async function findById(store, id) {
  return store.findOne({ _id: toIdString(id) });
}

export async function deleteById(store, id) {
  return store.remove({ _id: toIdString(id) }, { multi: false });
}
