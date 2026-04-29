export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role?: string;
  permissions?: string[];
  employeeId?: string;
};

export type ProductSearchRow = {
  id: string;
  name: string;
  description: string;
  generic: string;
  mfr: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  cost: number;
  stock: number;
  gstPct: number;
  requiresRx: boolean;
  productBatchId: string | null;
};
