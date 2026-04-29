import { AxiosError } from "axios";
import type { ApiFailure } from "./types";

export class ApiRequestError extends Error {
  code: string;
  status?: number;
  details?: unknown;

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function parseApiError(err: unknown): ApiRequestError {
  if (err instanceof ApiRequestError) return err;
  if (err && typeof err === "object" && "code" in err && typeof (err as { code: unknown }).code === "string") {
    const e = err as { message?: string; code: string; details?: unknown };
    if (typeof e.message === "string") {
      return new ApiRequestError(e.message, e.code, undefined, e.details);
    }
  }
  const ax = err as AxiosError<ApiFailure>;
  const body = ax.response?.data;
  if (body && typeof body === "object" && "success" in body && body.success === false && body.error) {
    return new ApiRequestError(
      body.error.message,
      body.error.code,
      ax.response?.status,
      body.error.details
    );
  }
  if (ax.code === "ECONNABORTED" || ax.message === "Network Error") {
    return new ApiRequestError(
      "Cannot reach the API. Start the backend on port 4000 (npm run dev:api) or run both with npm run dev:all.",
      "NETWORK_ERROR",
      ax.response?.status
    );
  }
  return new ApiRequestError(ax.message || "Request failed", "UNKNOWN", ax.response?.status);
}

export function isErrorCode(err: unknown, code: string): boolean {
  return err instanceof ApiRequestError && err.code === code;
}
