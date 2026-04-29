import { client, delReq, getReq, postReq, putReq, unwrapList } from "./client";
import type { AuthUser, ProductSearchRow } from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    postReq<{ accessToken: string; refreshToken: string; user: AuthUser }>("/auth/login", { email, password }),
  logout: () => postReq<{ ok: boolean }>("/auth/logout"),
  me: () => getReq<AuthUser>("/auth/me"),
};

export const posApi = {
  searchProducts: (q: string, page = 1, pageSize = 20) =>
    unwrapList<ProductSearchRow>(client.get("/pos/products/search", { params: { q, page, pageSize } })),
  checkout: (body: Record<string, unknown>, idempotencyKey?: string) =>
    postReq<{ invoice: Record<string, unknown>; replay: boolean }>("/pos/sales", body, {
      headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    }),
};

export const holdsApi = {
  list: () => getReq<unknown[]>("/sales/holds"),
  create: (body: Record<string, unknown>) => postReq<{ holdId: string }>("/sales/holds", body),
  remove: (holdId: string) => delReq<{ ok: boolean }>(`/sales/holds/${encodeURIComponent(holdId)}`),
};

export const dashboardApi = {
  summary: (params?: { from?: string; to?: string }) =>
    getReq<Record<string, unknown>>("/dashboard/summary", { params }),
  charts: (params?: { days?: number }) =>
    getReq<{ series: { date: string; sales: number; bills: number }[]; days: number }>("/dashboard/charts", { params }),
};

export const inventoryApi = {
  stock: (params?: { q?: string; page?: number; pageSize?: number; sort?: string }) =>
    unwrapList<unknown>(client.get("/inventory/stock", { params })),
  products: (params?: { q?: string; page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/inventory/products", { params })),
  summary: () => getReq<{ totalSkus: number; expiringSoon: number; lowStock: number }>("/inventory/summary"),
  addStock: (body: Record<string, unknown>) => postReq<{ id: string }>("/inventory/stock", body),
  createProduct: (body: Record<string, unknown>) => postReq<{ id: string }>("/inventory/products", body),
  updateProduct: (id: string, body: Record<string, unknown>) =>
    putReq<{ id: string }>(`/inventory/products/${encodeURIComponent(id)}`, body),
  importRows: (rows: unknown[]) =>
    postReq<{ accepted: number; message: string }>("/inventory/import", { rows }),
};

export const customersApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/customers", { params })),
  get: (id: string) => getReq<unknown>(`/customers/${id}`),
  create: (body: Record<string, unknown>) => postReq<unknown>("/customers", body),
  update: (id: string, body: Record<string, unknown>) => putReq<unknown>(`/customers/${encodeURIComponent(id)}`, body),
  remove: (id: string) => delReq<{ ok: boolean }>(`/customers/${encodeURIComponent(id)}`),
};

export const suppliersApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/suppliers", { params })),
  create: (body: Record<string, unknown>) => postReq<unknown>("/suppliers", body),
  update: (id: string, body: Record<string, unknown>) =>
    putReq<unknown>(`/suppliers/${encodeURIComponent(id)}`, body),
  remove: (id: string) => delReq<{ ok: boolean }>(`/suppliers/${encodeURIComponent(id)}`),
};

export const invoicesApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/sales/invoices", { params })),
  get: (id: string) => getReq<unknown>(`/sales/invoices/${encodeURIComponent(id)}`),
};

export const purchasesApi = {
  list: (params?: Record<string, string | number>) =>
    unwrapList<unknown>(client.get("/purchases/orders", { params })),
  get: (id: string) => getReq<unknown>(`/purchases/orders/${encodeURIComponent(id)}`),
  create: (body: Record<string, unknown>) => postReq<unknown>("/purchases/orders", body),
  receive: (id: string, body: { lines: unknown[] }) =>
    postReq<unknown>(`/purchases/orders/${encodeURIComponent(id)}/receive`, body),
  addPayment: (id: string, body: { amount: number; method?: string; reference?: string; note?: string }) =>
    postReq<unknown>(`/purchases/orders/${encodeURIComponent(id)}/payments`, body),
};

export const countersApi = {
  list: () => getReq<unknown[]>("/counters"),
  create: (body: { name: string; location?: string }) => postReq<unknown>("/counters", body),
  login: (id: string) => postReq<unknown>(`/counters/${encodeURIComponent(id)}/login`, {}),
  logout: (id: string) => postReq<unknown>(`/counters/${encodeURIComponent(id)}/logout`, {}),
};

export const attendanceApi = {
  clockIn: (employeeId?: string) => postReq<unknown>("/attendance/clock-in", employeeId ? { employeeId } : {}),
  clockOut: (employeeId?: string) => postReq<unknown>("/attendance/clock-out", employeeId ? { employeeId } : {}),
  me: () => getReq<unknown[]>("/attendance/me"),
  getStaffAttendance: (id: string) => getReq<unknown[]>(`/attendance/staff/${encodeURIComponent(id)}`),
};

export const reportsApi = {
  overview: (params?: { from?: string; to?: string }) =>
    getReq<Record<string, unknown>>("/reports/overview", { params }),
  sales: (params?: { from?: string; to?: string }) =>
    getReq<Record<string, unknown>>("/reports/sales", { params }),
  gst: (params?: { from?: string; to?: string }) =>
    getReq<Record<string, unknown>>("/reports/gst", { params }),
  inventoryIntelligence: () => getReq<Record<string, unknown>>("/reports/inventory-intelligence"),
};

export const expensesApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/expenses", { params })),
  create: (body: Record<string, unknown>) => postReq<unknown>("/expenses", body),
  remove: (id: string) => delReq<{ ok: boolean }>(`/expenses/${encodeURIComponent(id)}`),
};

export const activityApi = {
  list: (params?: { page?: number; pageSize?: number; category?: string }) =>
    unwrapList<unknown>(client.get("/activity-logs", { params })),
};

export const returnsApi = {
  list: (params?: { page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/returns", { params })),
  create: (body: Record<string, unknown>) => postReq<unknown>("/returns", body),
  approve: (id: string) => postReq<unknown>(`/returns/${encodeURIComponent(id)}/approve`, {}),
};

export const settingsApi = {
  get: (key: string) => getReq<unknown>(`/settings/${encodeURIComponent(key)}`),
  put: (key: string, value: unknown) => putReq<unknown>("/settings", { key, value }),
  /** Keys used by UI: store, billing, gst, invoice — plus bags / invoice-print if stored. */
  store: () => getReq<unknown>("/settings/store"),
  billing: () => getReq<unknown>("/settings/billing"),
  invoicePrint: () => getReq<unknown>("/settings/invoice-print"),
  bags: () => getReq<unknown>("/settings/bags"),
};

export const staffApi = {
  list: (params?: { q?: string; page?: number; pageSize?: number }) =>
    unwrapList<unknown>(client.get("/staff", { params })),
  create: (body: Record<string, unknown>) => postReq<unknown>("/staff", body),
  update: (id: string, body: Record<string, unknown>) => putReq<unknown>(`/staff/${encodeURIComponent(id)}`, body),
  remove: (id: string) => delReq<{ ok: boolean }>(`/staff/${encodeURIComponent(id)}`),
  addDocument: (id: string, body: Record<string, unknown>) => postReq<unknown>(`/staff/${encodeURIComponent(id)}/documents`, body),
  removeDocument: (id: string, docId: string) => delReq<unknown>(`/staff/${encodeURIComponent(id)}/documents/${encodeURIComponent(docId)}`),
};

export const uploadsApi = {
  prescription: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await client.post("/uploads/prescription", fd);
    if (!data.success) throw new Error(data.error?.message || "Upload failed");
    return data.data as { id: string; url: string };
  },
};
