import fs from "fs";
import path from "path";
import multer from "multer";
import { env } from "../config/env.js";

const uploadRoot = path.resolve(env.uploadDir);
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ok = /^image\//.test(file.mimetype) || file.mimetype === "application/pdf";
  cb(null, ok);
}

export const uploadPrescription = multer({
  storage,
  limits: { fileSize: env.maxFileMb * 1024 * 1024 },
  fileFilter,
});

export const uploadLogo = multer({
  storage,
  limits: { fileSize: env.maxFileMb * 1024 * 1024 },
  fileFilter,
});
