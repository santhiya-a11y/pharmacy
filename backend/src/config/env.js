import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const defaultAccessSecret = "dev-access-secret-change-in-prod-32chars";
const defaultRefreshSecret = "dev-refresh-secret-change-in-prod-32";

const dbMode =
  String(process.env.DB_MODE || "online").toLowerCase() === "offline" ? "offline" : "online";

const required =
  dbMode === "offline"
    ? ["JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"]
    : ["MONGODB_URI", "JWT_ACCESS_SECRET", "JWT_REFRESH_SECRET"];

export function loadEnv() {
  const missing = required.filter((k) => !process.env[k]);
  const nodeEnv = process.env.NODE_ENV || "development";
  const strictMode = nodeEnv === "production" || process.env.STRICT_ENV === "true";
  if (missing.length && strictMode) {
    throw new Error(`Missing required env: ${missing.join(", ")}`);
  }
  if (strictMode) {
    if (process.env.JWT_ACCESS_SECRET === defaultAccessSecret || process.env.JWT_REFRESH_SECRET === defaultRefreshSecret) {
      throw new Error("Refusing to start with insecure default JWT secrets");
    }
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  dbMode,
  nedbDataDir: process.env.NEDB_DATA_DIR || path.join(backendRoot, "data", "nedb"),
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/pill_smart",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || defaultAccessSecret,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || defaultRefreshSecret,
  jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  uploadDir: process.env.UPLOAD_DIR || "./uploads",
  maxFileMb: Number(process.env.MAX_FILE_MB) || 5,
};
