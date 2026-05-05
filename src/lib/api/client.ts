import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "./types";

/**
 * Always default to the API origin so XHR/fetch targets port 4000 (visible in Network as :4000).
 * Override with VITE_API_URL in `.env` (e.g. production URL).
 */
const getBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") {
    const { hostname, protocol, port } = window.location;
    // For local dev where Vite is running without proxying, we could fallback to 4000
    // But Vite is configured to proxy /api to 4000 anyway.
    // By using a relative path, it perfectly handles the offline production app (running on 8080)
    // as well as any network IP access.
  }
  return "/api/v1";
};

export const API_BASE_URL = getBaseUrl();

const baseURL = API_BASE_URL;

let accessToken: string | null = null;
let refreshToken: string | null = null;

const ACCESS_KEY = "pill_smart_access";
const REFRESH_KEY = "pill_smart_refresh";

export function loadTokensFromStorage() {
  accessToken = localStorage.getItem(ACCESS_KEY);
  refreshToken = localStorage.getItem(REFRESH_KEY);
}

export function getAccessToken() {
  return accessToken;
}

export function setTokens(access: string | null, refresh: string | null) {
  accessToken = access;
  refreshToken = refresh;
  if (access) localStorage.setItem(ACCESS_KEY, access);
  else localStorage.removeItem(ACCESS_KEY);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  else localStorage.removeItem(REFRESH_KEY);
}

export function clearTokens() {
  setTokens(null, null);
}

loadTokensFromStorage();

export const client = axios.create({
  baseURL,
  timeout: 120000,
  headers: { "Content-Type": "application/json" },
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  if (import.meta.env.DEV) {
    const u = `${config.baseURL ?? ""}${config.url ?? ""}`;
    console.debug(`[api] ${String(config.method || "get").toUpperCase()} ${u}`);
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  async (error: { config: RetryConfig; response?: { status: number } }) => {
    const original = error.config;
    if (!original || original._retry) return Promise.reject(error);
    if (error.response?.status === 401 && refreshToken) {
      original._retry = true;
      try {
        const { data } = await axios.post<ApiEnvelope<{ accessToken: string }>>(`${baseURL}/auth/refresh`, {
          refreshToken,
        });
        if (data.success && data.data?.accessToken) {
          setTokens(data.data.accessToken, refreshToken);
          original.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return client(original);
        }
      } catch {
        clearTokens();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
      }
    } else if (
      error.response?.status === 401 &&
      accessToken &&
      !refreshToken &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      clearTokens();
      window.location.assign("/login");
    }
    return Promise.reject(error);
  }
);

export async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const { data } = await p;
  if (!data.success) {
    const e = (data as { success: false; error: { code: string; message: string; details?: unknown } }).error;
    throw Object.assign(new Error(e.message), { code: e.code, details: e.details });
  }
  return data.data;
}

export async function unwrapList<R>(
  p: Promise<{ data: ApiEnvelope<R[]> }>
): Promise<{ rows: R[]; meta: Record<string, unknown> }> {
  const { data } = await p;
  if (!data.success) {
    const e = (data as { success: false; error: { code: string; message: string; details?: unknown } }).error;
    throw Object.assign(new Error(e.message), { code: e.code, details: e.details });
  }
  return { rows: data.data, meta: (data as { meta?: Record<string, unknown> }).meta || {} };
}

export async function getReq<T>(url: string, config?: AxiosRequestConfig) {
  return unwrap<T>(client.get<ApiEnvelope<T>>(url, config));
}

export async function postReq<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return unwrap<T>(client.post<ApiEnvelope<T>>(url, body, config));
}

export async function putReq<T>(url: string, body?: unknown, config?: AxiosRequestConfig) {
  return unwrap<T>(client.put<ApiEnvelope<T>>(url, body, config));
}

export async function delReq<T>(url: string, config?: AxiosRequestConfig) {
  return unwrap<T>(client.delete<ApiEnvelope<T>>(url, config));
}
