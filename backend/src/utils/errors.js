export class AppError extends Error {
  constructor(code, message, statusCode = 400, details) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  RX_REQUIRED: "RX_REQUIRED",
  PAYMENT_MISMATCH: "PAYMENT_MISMATCH",
  IDEMPOTENCY_REPLAY: "IDEMPOTENCY_REPLAY",
};
