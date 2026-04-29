/**
 * Unified API surface for the app.
 * Low-level HTTP + auth lives in `src/lib/api/client.ts`; resource modules in `endpoints.ts`.
 */
export {
  client,
  loadTokensFromStorage,
  getAccessToken,
  setTokens,
  clearTokens,
  unwrap,
  unwrapList,
  getReq,
  postReq,
  putReq,
  delReq,
} from "@/lib/api/client";

export * from "@/lib/api/endpoints";
export { parseApiError, ApiRequestError, isErrorCode } from "@/lib/api/errors";
export type { AuthUser, ProductSearchRow, ApiEnvelope } from "@/lib/api/types";
