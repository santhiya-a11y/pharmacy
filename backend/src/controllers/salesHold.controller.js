import { env } from "../config/env.js";
import { deleteById, insertWithTimestamps } from "../db/nedb/documentHelpers.js";
import { getWrapped } from "../db/nedb/initStores.js";
import { toIdString } from "../db/types.js";
import { SaleHold } from "../models/SaleHold.js";
import { success } from "../utils/apiResponse.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import mongoose from "mongoose";

export async function listHolds(req, res, next) {
  try {
    const uid = toIdString(req.user.id);
    if (env.dbMode === "offline") {
      const holds = await getWrapped("saleholds").find({ userId: uid }, { sort: { createdAt: -1 } });
      return res.json(success(holds));
    }
    const holds = await SaleHold.find({ userId: new mongoose.Types.ObjectId(req.user.id) })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(success(holds));
  } catch (e) {
    next(e);
  }
}

export async function createHold(req, res, next) {
  try {
    const { cart, customerName, customerId, grandTotal, counterId } = req.body;
    const holdId = `HLD-${Date.now().toString(36).toUpperCase()}`;
    const uid = toIdString(req.user.id);
    if (env.dbMode === "offline") {
      const doc = await insertWithTimestamps(getWrapped("saleholds"), {
        holdId,
        userId: uid,
        counterId: counterId ? toIdString(counterId) : undefined,
        customerId: customerId ? toIdString(customerId) : undefined,
        customerName,
        cart: cart || [],
        grandTotal,
      });
      return res.status(201).json(success({ holdId: doc.holdId, _id: String(doc._id) }));
    }
    const doc = await SaleHold.create({
      holdId,
      userId: new mongoose.Types.ObjectId(req.user.id),
      counterId: counterId ? new mongoose.Types.ObjectId(counterId) : undefined,
      customerId: customerId ? new mongoose.Types.ObjectId(customerId) : undefined,
      customerName,
      cart: cart || [],
      grandTotal,
    });
    return res.status(201).json(success({ holdId: doc.holdId, _id: String(doc._id) }));
  } catch (e) {
    next(e);
  }
}

export async function deleteHold(req, res, next) {
  try {
    const uid = toIdString(req.user.id);
    if (env.dbMode === "offline") {
      const store = getWrapped("saleholds");
      const doc = await store.findOne({ holdId: req.params.id, userId: uid });
      if (!doc) throw new AppError(ErrorCodes.NOT_FOUND, "Hold not found", 404);
      await deleteById(store, doc._id);
      return res.json(success({ ok: true }));
    }
    const r = await SaleHold.deleteOne({ holdId: req.params.id, userId: new mongoose.Types.ObjectId(req.user.id) });
    if (r.deletedCount === 0) throw new AppError(ErrorCodes.NOT_FOUND, "Hold not found", 404);
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
