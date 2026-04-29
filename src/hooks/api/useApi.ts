import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  dashboardApi,
  inventoryApi,
  customersApi,
  suppliersApi,
  invoicesApi,
  purchasesApi,
  reportsApi,
  expensesApi,
  staffApi,
  countersApi,
  attendanceApi,
  activityApi,
  returnsApi,
  settingsApi,
  posApi,
  holdsApi,
} from "@/lib/api/endpoints";

export const qk = {
  dashboardSummary: ["dashboard", "summary"] as const,
  dashboardCharts: (days: number) => ["dashboard", "charts", days] as const,
  inventoryStock: (params: Record<string, unknown>) => ["inventory", "stock", params] as const,
  inventoryMedicines: (params: Record<string, unknown>) => ["inventory", "medicines", params] as const,
  inventorySummary: ["inventory", "summary"] as const,
  customers: (params: Record<string, unknown>) => ["customers", params] as const,
  customer: (id: string) => ["customers", id] as const,
  suppliers: (params: Record<string, unknown>) => ["suppliers", params] as const,
  invoices: (params: Record<string, unknown>) => ["invoices", params] as const,
  purchases: (params: Record<string, unknown>) => ["purchases", params] as const,
  purchase: (id: string) => ["purchases", id] as const,
  reportsOverview: (params: Record<string, unknown>) => ["reports", "overview", params] as const,
  reportsSales: (params: Record<string, unknown>) => ["reports", "sales", params] as const,
  reportsGst: (params: Record<string, unknown>) => ["reports", "gst", params] as const,
  expenses: (params: Record<string, unknown>) => ["expenses", params] as const,
  staff: (params: Record<string, unknown>) => ["staff", params] as const,
  counters: ["counters"] as const,
  attendanceMe: ["attendance", "me"] as const,
  activity: (params: Record<string, unknown>) => ["activity", params] as const,
  returns: (params: Record<string, unknown>) => ["returns", params] as const,
  settings: (key: string) => ["settings", key] as const,
  salesHolds: ["sales-holds"] as const,
};

export function useDashboardSummary(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: [...qk.dashboardSummary, params ?? {}],
    queryFn: () => dashboardApi.summary(params),
    staleTime: 60_000,
  });
}

export function useDashboardCharts(days = 7) {
  return useQuery({
    queryKey: qk.dashboardCharts(days),
    queryFn: () => dashboardApi.charts({ days }),
    staleTime: 60_000,
  });
}

export function useInventoryStock(params: {
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
  type?: "expiring" | "low_stock" | "dead_stock" | "expired";
}) {
  return useQuery({
    queryKey: qk.inventoryStock(params as Record<string, unknown>),
    queryFn: async () => {
      if (import.meta.env.DEV) {
        console.debug("[useInventoryStock] queryFn → inventoryApi.stock", params);
      }
      return inventoryApi.stock(params);
    },
    enabled: true,
    staleTime: 30_000,
  });
}

export function useInventorySummary() {
  return useQuery({
    queryKey: qk.inventorySummary,
    queryFn: () => inventoryApi.summary(),
    staleTime: 60_000,
  });
}

export function useMedicines(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.inventoryMedicines(params as Record<string, unknown>),
    queryFn: () => inventoryApi.products(params),
    staleTime: 30_000,
  });
}

export function useCreateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => inventoryApi.createProduct(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inventory", "medicines"] });
    },
  });
}

export function useUpdateMedicine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => inventoryApi.updateProduct(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inventory", "medicines"] });
    },
  });
}

export function useCustomers(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.customers(params as Record<string, unknown>),
    queryFn: () => customersApi.list(params),
    staleTime: 30_000,
  });
}

export function useSuppliers(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.suppliers(params as Record<string, unknown>),
    queryFn: () => suppliersApi.list(params),
    staleTime: 30_000,
  });
}

export function useInvoices(params: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.invoices(params as Record<string, unknown>),
    queryFn: () => invoicesApi.list(params),
    staleTime: 30_000,
  });
}

export function usePurchaseOrders(params?: Record<string, string | number>) {
  return useQuery({
    queryKey: qk.purchases(params ?? {}),
    queryFn: () => purchasesApi.list(params),
    staleTime: 30_000,
  });
}

export function usePurchaseOrder(id: string | undefined) {
  return useQuery({
    queryKey: qk.purchase(id ?? ""),
    queryFn: () => purchasesApi.get(id!),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => purchasesApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useReceivePurchaseStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { lines: unknown[] } }) => purchasesApi.receive(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useRecordPurchasePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { amount: number; method?: string; reference?: string; note?: string };
    }) => purchasesApi.addPayment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
    },
  });
}

export function useReportsOverview(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.reportsOverview(params ?? {}),
    queryFn: () => reportsApi.overview(params),
    staleTime: 60_000,
  });
}

export function useReportsSales(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.reportsSales(params ?? {}),
    queryFn: () => reportsApi.sales(params),
    staleTime: 60_000,
  });
}

export function useReportsGst(params?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.reportsGst(params ?? {}),
    queryFn: () => reportsApi.gst(params),
    staleTime: 60_000,
  });
}

export function useInventoryIntelligence() {
  return useQuery({
    queryKey: ["reports", "inventory-intelligence"],
    queryFn: () => reportsApi.inventoryIntelligence(),
    staleTime: 60_000,
  });
}

export function useExpenses(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.expenses(params ?? {}),
    queryFn: () => expensesApi.list(params),
    staleTime: 30_000,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => expensesApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
      void qc.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["expenses"] });
      void qc.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useStaff(params?: { q?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.staff(params ?? {}),
    queryFn: () => staffApi.list(params),
    staleTime: 60_000,
  });
}

export function useCreateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => staffApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useUpdateStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => staffApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeleteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => staffApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useAddStaffDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => staffApi.addDocument(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useDeleteStaffDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, docId }: { id: string; docId: string }) => staffApi.removeDocument(id, docId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["staff"] });
    },
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => customersApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => customersApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => customersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => suppliersApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useUpdateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => suppliersApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useCounters() {
  return useQuery({
    queryKey: qk.counters,
    queryFn: () => countersApi.list(),
    staleTime: 30_000,
  });
}

export function useCreateCounter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; location?: string }) => countersApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.counters });
    },
  });
}

export function useCounterLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => countersApi.login(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.counters });
    },
  });
}

export function useCounterLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => countersApi.logout(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.counters });
    },
  });
}

export function useAttendanceMe() {
  return useQuery({
    queryKey: qk.attendanceMe,
    queryFn: () => attendanceApi.me(),
    staleTime: 60_000,
  });
}

export function useStaffAttendance(id: string | undefined) {
  return useQuery({
    queryKey: ["staff-attendance", id],
    queryFn: () => attendanceApi.getStaffAttendance(id!),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args?: { employeeId?: string }) => attendanceApi.clockIn(args?.employeeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.attendanceMe });
    },
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args?: { employeeId?: string }) => attendanceApi.clockOut(args?.employeeId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.attendanceMe });
    },
  });
}

export function useActivityLogs(params?: { page?: number; pageSize?: number; category?: string }) {
  return useQuery({
    queryKey: qk.activity(params ?? {}),
    queryFn: () => activityApi.list(params),
    staleTime: 30_000,
  });
}

export function useReturns(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: qk.returns(params ?? {}),
    queryFn: () => returnsApi.list(params),
    staleTime: 30_000,
  });
}

export function useCreateReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => returnsApi.create(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["returns"] });
    },
  });
}

export function useApproveReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => returnsApi.approve(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["returns"] });
      void qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useSettings(key: string) {
  return useQuery({
    queryKey: qk.settings(key),
    queryFn: () => settingsApi.get(key),
    staleTime: 120_000,
    enabled: Boolean(key),
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: unknown }) => settingsApi.put(key, value),
    onSuccess: (_d, v) => {
      void qc.invalidateQueries({ queryKey: qk.settings(v.key) });
    },
  });
}

export { posApi, holdsApi };
