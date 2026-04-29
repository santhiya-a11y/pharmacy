import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { RolePermissions } from "./permissions.js";

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Missing bearer token", 401);
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub).populate("roleId").lean();
    if (!user || !user.isActive) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid user", 401);
    }
    req.user = {
      id: String(user._id),
      email: user.email,
      roleId: user.roleId?._id ? String(user.roleId._id) : String(user.roleId),
      roleName: user.roleId?.name,
      permissions: user.roleId?.permissions?.length ? user.roleId.permissions : (RolePermissions[user.roleId?.name] || []),
      employeeId: user.employeeId ? String(user.employeeId) : undefined,
    };
    next();
  } catch (e) {
    if (e instanceof AppError) return next(e);
    return next(new AppError(ErrorCodes.UNAUTHORIZED, "Invalid or expired token", 401));
  }
}
