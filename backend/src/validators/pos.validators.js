import { z } from "zod";

const paymentSchema = z.object({
  method: z.string().min(1),
  amount: z.number().nonnegative(),
});

const lineSchema = z
  .object({
    productBatchId: z.string().optional(),
    productId: z.string().optional(),
    qty: z.number().positive(),
    discPct: z.number().min(0).max(100).default(0),
    dosageLabel: z.string().optional(),
    frequency: z.record(z.any()).optional().or(z.any().optional()),
    requiresRx: z.boolean().optional(),
    rxDoctorName: z.string().optional(),
    rxImageUrl: z.string().optional(),
    rxImageId: z.string().optional(),
    isBag: z.boolean().optional(),
    name: z.string().optional(),
    mrp: z.number().optional(),
    gstPct: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.isBag && !data.productBatchId && !data.productId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Each line needs productBatchId or productId (or isBag with mrp)",
        path: ["productBatchId"],
      });
    }
    if (data.isBag && (!data.name || data.mrp == null)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Bag lines require name and mrp",
        path: ["name"],
      });
    }
  });

export const posSaleBodySchema = z.object({
  counterId: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  lines: z.array(lineSchema).min(1),
  loyaltyPointsRedeemed: z.number().nonnegative().default(0),
  payments: z.array(paymentSchema).min(1),
  paymentMode: z.string().min(1),
});

export const posSearchQuerySchema = z.object({
  q: z.string().min(1),
  counterId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});
