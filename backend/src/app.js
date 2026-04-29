import "./models/registerModels.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import fs from "fs";
import pathMod from "path";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { generalLimiter } from "./middleware/rateLimit.js";
import { env } from "./config/env.js";

export function createApp() {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin.split(",").map((s) => s.trim()),
      credentials: true,
    })
  );
  app.use(generalLimiter);
  app.use(express.json({ limit: "2mb" }));
  app.use(requestLogger);

  app.get("/health", (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });

  app.use("/api/v1", routes);

  const uploadRoot = pathMod.resolve(env.uploadDir);
  if (!fs.existsSync(uploadRoot)) {
    fs.mkdirSync(uploadRoot, { recursive: true });
  }
  app.use("/uploads", express.static(uploadRoot));

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Route not found" } });
  });

  app.use(errorHandler);

  return app;
}
