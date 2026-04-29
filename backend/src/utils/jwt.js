import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export function signAccessToken(userId, roleName) {
  return jwt.sign({ sub: userId, role: roleName, typ: "access" }, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpires,
  });
}

export function signRefreshToken(userId, version) {
  return jwt.sign({ sub: userId, typ: "refresh", v: version }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpires,
  });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret);
}
