import mongoose from "mongoose";
import { Counter } from "../models/Counter.js";
import { CounterSession } from "../models/CounterSession.js";
import { Employee } from "../models/Employee.js";
import { success } from "../utils/apiResponse.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { z } from "zod";

export async function listCounters(req, res, next) {
  try {
    const data = await Counter.find().sort({ name: 1 }).lean();
    return res.json(success(data));
  } catch (e) {
    next(e);
  }
}

const createSchema = z.object({
  name: z.string(),
  location: z.string().optional(),
});

export async function postCounter(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const c = await Counter.create(body);
    return res.status(201).json(success(c));
  } catch (e) {
    next(e);
  }
}

export async function postLogin(req, res, next) {
  try {
    const counter = await Counter.findById(req.params.id);
    if (!counter) throw new AppError(ErrorCodes.NOT_FOUND, "Counter not found", 404);
    if (!req.user.employeeId) {
      throw new AppError(ErrorCodes.NOT_FOUND, "User is not linked to an employee profile", 400);
    }
    const emp = await Employee.findById(new mongoose.Types.ObjectId(req.user.employeeId));
    if (!emp) throw new AppError(ErrorCodes.NOT_FOUND, "Employee profile required for counter login", 400);

    counter.assignedEmployeeId = emp._id;
    counter.assignedEmployeeName = emp.name;
    counter.status = "open";
    counter.openedAt = new Date();
    await counter.save();

    await CounterSession.create({
      counterId: counter._id,
      employeeId: emp._id,
      userId: req.user.id,
    });

    return res.json(success(counter));
  } catch (e) {
    next(e);
  }
}

export async function postLogout(req, res, next) {
  try {
    const counter = await Counter.findById(req.params.id);
    if (!counter) throw new AppError(ErrorCodes.NOT_FOUND, "Counter not found", 404);
    counter.assignedEmployeeId = null;
    counter.assignedEmployeeName = null;
    counter.status = "closed";
    counter.openedAt = null;
    await counter.save();
    await CounterSession.updateMany(
      { counterId: counter._id, logoutAt: null },
      { $set: { logoutAt: new Date() } }
    );
    return res.json(success(counter));
  } catch (e) {
    next(e);
  }
}
