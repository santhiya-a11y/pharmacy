import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { success, fail } from "../utils/apiResponse.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function login(req, res, next) {
  try {
    const parsed = loginSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json(fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten()));
    }
    const body = parsed.data;

    const user = await User.findOne({ email: body.email.toLowerCase() }).populate("roleId");
    if (!user || !user.isActive) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid credentials", 401);
    }

    const hash = user.passwordHash;
    if (!hash || typeof hash !== "string") {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid credentials", 401);
    }

    let passwordOk = false;
    try {
      passwordOk = await bcrypt.compare(body.password, hash);
    } catch {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid credentials", 401);
    }
    if (!passwordOk) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid credentials", 401);
    }

    const roleName = String(user.roleId?.name || "Cashier");
    const refreshVersion = Number(user.refreshTokenVersion ?? 0);

    let accessToken;
    let refreshToken;
    try {
      accessToken = signAccessToken(String(user._id), roleName);
      refreshToken = signRefreshToken(String(user._id), refreshVersion);
    } catch (err) {
      console.error("JWT sign failed:", err);
      return next(err);
    }

    return res.json(
      success({
        accessToken,
        refreshToken,
        user: {
          id: String(user._id),
          name: user.email.split("@")[0],
          email: user.email,
          role: roleName,
          permissions: user.roleId?.permissions || [],
          employeeId: user.employeeId ? String(user.employeeId) : undefined,
        },
      })
    );
  } catch (e) {
    next(e);
  }
}

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function refresh(req, res, next) {
  try {
    const parsed = refreshSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return res.status(400).json(fail("VALIDATION_ERROR", "Validation failed", parsed.error.flatten()));
    }
    const body = parsed.data;
    const payload = verifyRefreshToken(body.refreshToken);
    const user = await User.findById(payload.sub).populate("roleId");
    const tokenVersion = payload.v != null ? Number(payload.v) : 0;
    const currentVersion = Number(user?.refreshTokenVersion ?? 0);
    if (!user || tokenVersion !== currentVersion) {
      throw new AppError(ErrorCodes.UNAUTHORIZED, "Invalid refresh token", 401);
    }
    const roleName = user.roleId?.name || "Cashier";
    const accessToken = signAccessToken(String(user._id), roleName);
    return res.json(success({ accessToken }));
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).populate("roleId").populate("employeeId").lean();
    if (!user) throw new AppError(ErrorCodes.NOT_FOUND, "User not found", 404);
    return res.json(
      success({
        id: String(user._id),
        email: user.email,
        role: user.roleId?.name,
        permissions: user.roleId?.permissions || [],
        employeeId: user.employeeId?._id ? String(user.employeeId._id) : undefined,
        name: user.employeeId?.name || user.email.split("@")[0],
      })
    );
  } catch (e) {
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { refreshTokenVersion: 1 } });
    }
    return res.json(success({ ok: true }));
  } catch (e) {
    next(e);
  }
}
