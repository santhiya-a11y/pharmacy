import { env } from "../config/env.js";
import { findById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { StoreSettings } from "../models/StoreSettings.js";
import { success } from "../utils/apiResponse.js";
import { z } from "zod";

const patchSchema = z.object({
  key: z.string(),
  value: z.any(),
});

export async function getSettings(req, res, next) {
  try {
    const key = req.params.key;
    if (env.dbMode === "offline") {
      const doc = await getWrapped("storesettings").findOne({ key });
      return res.json(success(doc?.value ?? {}));
    }
    const doc = await StoreSettings.findOne({ key }).lean();
    return res.json(success(doc?.value ?? {}));
  } catch (e) {
    next(e);
  }
}

export async function putSettings(req, res, next) {
  try {
    const body = patchSchema.parse(req.body);
    if (env.dbMode === "offline") {
      const store = getWrapped("storesettings");
      let doc = await store.findOne({ key: body.key });
      if (!doc) {
        doc = await insertWithTimestamps(store, { key: body.key, value: body.value });
      } else {
        await store.update({ _id: doc._id }, { $set: { value: body.value, updatedAt: new Date() } }, {});
        doc = await findById(store, doc._id);
      }
      return res.json(success(doc.value));
    }
    const doc = await StoreSettings.findOneAndUpdate(
      { key: body.key },
      { $set: { value: body.value } },
      { upsert: true, new: true }
    );
    return res.json(success(doc.value));
  } catch (e) {
    next(e);
  }
}
