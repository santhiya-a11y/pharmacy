import mongoose from "mongoose";

const saleItemSchema = new mongoose.Schema(
  {
    productBatchId: { type: mongoose.Schema.Types.ObjectId, ref: "ProductBatch" },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: { type: String, required: true },
    mfr: { type: String },
    batch: { type: String },
    expiry: { type: String },
    hsn: { type: String },
    mrp: { type: Number, required: true },
    qty: { type: Number, required: true },
    sgst: { type: Number },
    cgst: { type: Number },
    discPct: { type: Number, default: 0 },
    sgstAmt: { type: Number },
    cgstAmt: { type: Number },
    taxable: { type: Number },
    amount: { type: Number },
    purchaseRate: { type: Number },
    dosageLabel: { type: String },
    frequency: { type: mongoose.Schema.Types.Mixed },
    requiresRx: { type: Boolean, default: false },
    rxVerified: { type: Boolean, default: false },
    rxDoctorName: { type: String },
    rxImageUrl: { type: String },
    isBag: { type: Boolean, default: false },
  },
  { _id: true }
);

const salePaymentSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, index: true },
    time: { type: String },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true },
    customerName: { type: String },
    customerPhone: { type: String, index: true },
    paymentMode: { type: String },
    counterId: { type: mongoose.Schema.Types.ObjectId, ref: "Counter" },
    counterName: { type: String },
    billedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    billedByName: { type: String },
    items: [saleItemSchema],
    payments: [salePaymentSchema],
    subtotal: { type: Number, required: true },
    sgstTotal: { type: Number, default: 0 },
    cgstTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    loyaltyRedeemedPoints: { type: Number, default: 0 },
    loyaltyRedeemedValue: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    status: {
      type: String,
      enum: ["completed", "returned", "partial-return", "void"],
      default: "completed",
    },
    idempotencyKey: { type: String, sparse: true, unique: true },
  },
  { timestamps: true }
);

saleSchema.index({ "customerName": "text", invoiceNo: "text" });

export const Sale = mongoose.model("Sale", saleSchema);
