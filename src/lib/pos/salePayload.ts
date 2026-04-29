import type { Customer } from "@/components/billing/CustomerSelector";

export type CartLine = {
  id: string;
  name: string;
  description: string;
  mfr: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  qty: number;
  sgst: number;
  cgst: number;
  discPct: number;
  dosageLabel?: string;
  frequency?: unknown;
  isBag?: boolean;
  requiresRx?: boolean;
  rxVerified?: boolean;
  rxDoctorName?: string;
  rxImageUrl?: string;
  productBatchId?: string;
  productId?: string;
};

export function buildPosSalePayload({
  cart,
  selectedCustomer,
  customerName,
  customerPhone,
  counterId,
  payments,
  paymentMode,
  loyaltyPointsRedeemed,
}: {
  cart: CartLine[];
  selectedCustomer: Customer | null;
  customerName: string;
  customerPhone: string;
  counterId?: string;
  payments: { method: string; amount: number }[];
  paymentMode: string;
  loyaltyPointsRedeemed: number;
}) {
  const normalizedPhone = (customerPhone || "").replace(/\D/g, "").slice(0, 10);
  const lines = cart.map((c) => {
    if (c.isBag) {
      return {
        isBag: true,
        name: c.name,
        mrp: c.mrp,
        qty: c.qty,
        discPct: c.discPct,
        gstPct: c.sgst + c.cgst,
        dosageLabel: c.dosageLabel,
        frequency: c.frequency,
      };
    }
    const line: Record<string, unknown> = {
      qty: c.qty,
      discPct: c.discPct,
      dosageLabel: c.dosageLabel,
      frequency: c.frequency,
      requiresRx: c.requiresRx,
      rxDoctorName: c.rxDoctorName,
      rxImageUrl: c.rxImageUrl,
    };
    if (c.productBatchId) line.productBatchId = c.productBatchId;
    else if (c.productId) line.productId = c.productId;
    return line;
  });

  return {
    counterId: counterId || undefined,
    customerId: selectedCustomer?.id != null ? String(selectedCustomer.id) : undefined,
    customerName: customerName?.trim() || "Walk-in",
    customerPhone: normalizedPhone,
    lines,
    loyaltyPointsRedeemed,
    payments,
    paymentMode,
  };
}
