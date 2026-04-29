import { fail } from "../utils/apiResponse.js";
import { AppError } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json(fail(err.code, err.message, err.details));
  }

  if (err.name === "ZodError") {
    return res.status(400).json(
      fail("VALIDATION_ERROR", "Validation failed", err.flatten?.() ?? err.errors)
    );
  }

  if (err.name === "ValidationError") {
    return res.status(400).json(fail("VALIDATION_ERROR", err.message));
  }

  if (err.code === 11000) {
    return res.status(409).json(fail("CONFLICT", "Duplicate key"));
  }

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json(fail("UNAUTHORIZED", "Invalid or expired token"));
  }

  const message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message;
  console.error(err);
  return res.status(500).json(fail("INTERNAL_ERROR", message));
}
