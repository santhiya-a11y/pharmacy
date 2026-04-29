import { SaleHold } from "../models/SaleHold.js";
import { success } from "../utils/apiResponse.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import mongoose from "mongoose";

export async function listHolds(req, res, next) {
  try {
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const holds = await SaleHold.find({ userId: uid }).sort({ createdAt: -1 }).lean();
    return res.json(success(holds));
  } catch (e) {
    next(e);
  }
}

export async function createHold(req, res, next) {
  try {
    const { cart, customerName, customerId, grandTotal, counterId } = req.body;
    const holdId = `HLD-${Date.now().toString(36).toUpperCase()}`;
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const doc = await SaleHold.create({
      holdId,
      userId: uid,
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
    const uid = new mongoose.Types.ObjectId(req.user.id);
    const r = await SaleHold.deleteOne({ holdId: req.params.id, userId: uid });
    if (r.deletedCount === 0) throw new AppError(ErrorCodes.NOT_FOUND, "Hold not found", 404);
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
