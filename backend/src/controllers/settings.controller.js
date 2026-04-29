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
    const doc = await StoreSettings.findOne({ key }).lean();
    return res.json(success(doc?.value ?? {}));
  } catch (e) {
    next(e);
  }
}

export async function putSettings(req, res, next) {
  try {
    const body = patchSchema.parse(req.body);
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
