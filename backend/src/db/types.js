import mongoose from "mongoose";

/** Normalize id for NeDB queries (string hex). */
export function toIdString(id) {
  if (id == null) return id;
  if (typeof id === "string") return id;
  if (id && typeof id.toString === "function") return String(id);
  return String(id);
}

export function newObjectIdString() {
  return String(new mongoose.Types.ObjectId());
}

export function isValidObjectIdString(id) {
  return mongoose.Types.ObjectId.isValid(id);
}
