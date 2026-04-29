import mongoose from "mongoose";
import { Sale } from "../models/Sale.js";
import { Product } from "../models/Product.js";
import { ProductBatch } from "../models/ProductBatch.js";
import { Customer } from "../models/Customer.js";
import { Counter } from "../models/Counter.js";
import { User } from "../models/User.js";
import { Employee } from "../models/Employee.js";
import { InventoryLog } from "../models/InventoryLog.js";
import { nextInvoiceNumber } from "../utils/invoiceNumber.js";
import { lineAmounts, sumPayments, splitGstPercent } from "../utils/gst.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { writeActivityLog } from "./activityLog.service.js";

const LOYALTY_RUPEE_PER_POINT = 0.25;
const PAYMENT_EPSILON = 0.5;

function toOid(id) {
  if (!id) return null;
  try {
    return new mongoose.Types.ObjectId(id);
  } catch {
    return null;
  }
}

async function allocateFefo(productId, qtyNeeded, session) {
  const batches = await ProductBatch.find({
    productId,
    qtyOnHand: { $gt: 0 },
    expiryDate: { $gte: new Date() },
  })
    .sort({ expiryDate: 1 })
    .session(session)
    .lean();

  let remaining = qtyNeeded;
  const allocations = [];
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, b.qtyOnHand);
    if (take <= 0) continue;
    allocations.push({ batch: b, qty: take });
    remaining -= take;
  }
  if (remaining > 0) {
    throw new AppError(
      ErrorCodes.INSUFFICIENT_STOCK,
      `Insufficient stock for product (FEFO). Short by ${remaining} units.`,
      409
    );
  }
  return allocations;
}

async function deductBatchQty(batchId, qty, session) {
  const updated = await ProductBatch.findOneAndUpdate(
    { _id: batchId, qtyOnHand: { $gte: qty } },
    { $inc: { qtyOnHand: -qty } },
    { new: true, session }
  );
  if (!updated) {
    throw new AppError(ErrorCodes.INSUFFICIENT_STOCK, "Insufficient stock for batch", 409);
  }
  return updated;
}

function formatExpiry(d) {
  if (!d) return "";
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

function gstRatesFromBatchAndProduct(batch, product) {
  if (batch.sgstPct != null && batch.cgstPct != null) {
    return { sgstPct: batch.sgstPct, cgstPct: batch.cgstPct };
  }
  const total = product.defaultGstPct ?? 12;
  return splitGstPercent(total);
}

export async function createPosSale(input) {
  const idemKey = input.idempotencyKey?.trim();
  if (idemKey) {
    const existing = await Sale.findOne({ idempotencyKey: idemKey }).lean();
    if (existing) {
      return { replay: true, invoice: mapSaleResponse(existing) };
    }
  }

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (e) {
    // Falls back to no transaction if standalone MongoDB is used
    console.warn("[POS] Standalone MongoDB detected. Transactions (ACID) are disabled for this sale.");
    session = null;
  }

  try {
    const result = await executeSaleTx(input, session);
    if (session) await session.commitTransaction();
    return result;
  } catch (e) {
    if (session) await session.abortTransaction();

    // If it failed because transactions are not supported on standalone mongod
    if (e.message.includes("Transaction numbers are only allowed")) {
      console.warn("[POS] Retrying sale in standalone mode (no transaction).");
      return executeSaleTx(input, null);
    }

    console.error("[POS Sale Service Error]:", e);
    throw e;
  } finally {
    if (session) session.endSession();
  }
}

async function executeSaleTx(input, session) {
  const {
    counterId,
    customerId,
    customerName,
    customerPhone,
    lines,
    loyaltyPointsRedeemed = 0,
    payments,
    paymentMode,
    userId,
    idempotencyKey,
  } = input;

  const userDoc = await User.findById(userId).populate("roleId").session(session).lean();
  let billedByName =
    (await Employee.findById(userDoc?.employeeId).session(session).lean())?.name ||
    userDoc?.email?.split("@")[0] ||
    "Staff";

  let counterName;
  const counterOid = toOid(counterId);
  if (counterOid) {
    const c = await Counter.findById(counterOid).session(session).lean();
    counterName = c?.name;
  }

  const customerOid = toOid(customerId);
  let resolvedCustomer = null;
  if (customerOid) {
    resolvedCustomer = await Customer.findById(customerOid).session(session);
    if (!resolvedCustomer) {
      throw new AppError(ErrorCodes.NOT_FOUND, "Customer not found", 404);
    }
  }

  const builtItems = [];
  let subtotal = 0;
  let totalDiscount = 0;
  let totalSgst = 0;
  let totalCgst = 0;
  const stockOps = [];

  for (const line of lines) {
    const discPct = line.discPct ?? 0;

    if (line.isBag) {
      const gstPct = line.gstPct ?? 18;
      const { sgstPct, cgstPct } = splitGstPercent(gstPct);
      const mrp = line.mrp;
      const qty = line.qty;
      const amounts = lineAmounts({ mrp, qty, discPct, sgstPct, cgstPct });
      subtotal += mrp * qty;
      totalDiscount += amounts.discountAmount;
      totalSgst += amounts.sgstAmt;
      totalCgst += amounts.cgstAmt;

      builtItems.push({
        name: line.name,
        mfr: "—",
        batch: "—",
        expiry: "—",
        hsn: "3923",
        mrp,
        qty,
        sgst: sgstPct,
        cgst: cgstPct,
        discPct,
        sgstAmt: amounts.sgstAmt,
        cgstAmt: amounts.cgstAmt,
        taxable: amounts.taxable,
        amount: amounts.lineTotal,
        dosageLabel: line.dosageLabel,
        frequency: line.frequency,
        requiresRx: false,
        rxVerified: true,
        isBag: true,
      });
      continue;
    }

    let allocations = [];
    const batchOid = toOid(line.productBatchId);
    const productOid = toOid(line.productId);

    if (batchOid) {
      const batchDoc = await ProductBatch.findById(batchOid).session(session).lean();
      if (!batchDoc) throw new AppError(ErrorCodes.NOT_FOUND, "Batch not found", 404);
      if (batchDoc.qtyOnHand < line.qty) {
        throw new AppError(ErrorCodes.INSUFFICIENT_STOCK, "Insufficient stock for selected batch", 409);
      }
      allocations = [{ batch: batchDoc, qty: line.qty }];
    } else if (productOid) {
      allocations = await allocateFefo(productOid, line.qty, session);
    } else {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid line: missing product reference", 400);
    }

    for (const { batch, qty } of allocations) {
      const product = await Product.findById(batch.productId).session(session).lean();
      if (!product) throw new AppError(ErrorCodes.NOT_FOUND, "Product not found", 404);

      const requiresRx = Boolean(product.requiresRx || line.requiresRx);
      if (requiresRx) {
        const doctor = line.rxDoctorName?.trim();
        if (!doctor) {
          throw new AppError(
            ErrorCodes.RX_REQUIRED,
            `Prescription verification required for ${product.name}`,
            400
          );
        }
      }

      const { sgstPct, cgstPct } = gstRatesFromBatchAndProduct(batch, product);
      const amounts = lineAmounts({
        mrp: batch.mrp,
        qty,
        discPct,
        sgstPct,
        cgstPct,
      });

      subtotal += batch.mrp * qty;
      totalDiscount += amounts.discountAmount;
      totalSgst += amounts.sgstAmt;
      totalCgst += amounts.cgstAmt;

      builtItems.push({
        productBatchId: batch._id,
        productId: product._id,
        name: product.name,
        mfr: product.manufacturer || "",
        batch: batch.batchNo,
        expiry: formatExpiry(batch.expiryDate),
        hsn: product.hsn || "",
        mrp: batch.mrp,
        qty,
        sgst: sgstPct,
        cgst: cgstPct,
        discPct,
        sgstAmt: amounts.sgstAmt,
        cgstAmt: amounts.cgstAmt,
        taxable: amounts.taxable,
        amount: amounts.lineTotal,
        purchaseRate: batch.purchaseRate,
        dosageLabel: line.dosageLabel,
        frequency: line.frequency,
        requiresRx,
        rxVerified: requiresRx ? Boolean(line.rxDoctorName?.trim()) : true,
        rxDoctorName: line.rxDoctorName,
        rxImageUrl: line.rxImageUrl || line.rxImageId,
        isBag: false,
      });

      stockOps.push({ batchId: batch._id, productId: product._id, qty, productName: product.name });
    }
  }

  const loyaltyValue = loyaltyPointsRedeemed * LOYALTY_RUPEE_PER_POINT;
  const taxableNet = subtotal - totalDiscount;
  const grandTotal = taxableNet + totalSgst + totalCgst - loyaltyValue;

  if (grandTotal < 0) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Loyalty redemption exceeds payable amount", 400);
  }

  const paySum = sumPayments(payments);
  if (Math.abs(paySum - grandTotal) > PAYMENT_EPSILON) {
    throw new AppError(
      ErrorCodes.PAYMENT_MISMATCH,
      `Payments (${paySum.toFixed(2)}) must match grand total (${grandTotal.toFixed(2)})`,
      400
    );
  }

  // Ensure grandTotal is a valid number and at least 0
  if (isNaN(grandTotal)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Calculated grand total is not a valid number (NaN)", 400);
  }

  if (resolvedCustomer && loyaltyPointsRedeemed > 0) {
    if (resolvedCustomer.loyaltyPoints < loyaltyPointsRedeemed) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Insufficient loyalty points", 400);
    }
    resolvedCustomer.loyaltyPoints -= loyaltyPointsRedeemed;
    resolvedCustomer.totalPurchases = (resolvedCustomer.totalPurchases || 0) + grandTotal;
    resolvedCustomer.lastVisit = new Date();
    await resolvedCustomer.save({ session });
  } else if (resolvedCustomer) {
    resolvedCustomer.totalPurchases = (resolvedCustomer.totalPurchases || 0) + grandTotal;
    resolvedCustomer.lastVisit = new Date();
    await resolvedCustomer.save({ session });
  }

  for (const op of stockOps) {
    await deductBatchQty(op.batchId, op.qty, session);
  }

  const invoiceNo = await nextInvoiceNumber();
  const now = new Date();

  const saleArr = await Sale.create(
    [
      {
        invoiceNo,
        date: now,
        time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        customerId: customerOid || undefined,
        customerName: customerName || resolvedCustomer?.name || "Walk-in",
        customerPhone: customerPhone || resolvedCustomer?.phone || "",
        paymentMode,
        counterId: counterOid || undefined,
        counterName,
        billedByUserId: toOid(userId),
        billedByName,
        items: builtItems,
        payments,
        subtotal,
        sgstTotal: totalSgst,
        cgstTotal: totalCgst,
        discount: totalDiscount,
        loyaltyRedeemedPoints: loyaltyPointsRedeemed,
        loyaltyRedeemedValue: loyaltyValue,
        grandTotal,
        status: "completed",
        idempotencyKey: idempotencyKey || undefined,
      },
    ],
    { session }
  );

  const sale = saleArr[0];
  if (!sale) {
    throw new AppError("INTERNAL_ERROR", "Transaction failed - sale document was not created correctly", 500);
  }

  for (const op of stockOps) {
    await InventoryLog.create(
      [
        {
          batchId: op.batchId,
          productId: op.productId,
          changeQty: -op.qty,
          reason: "sale",
          refType: "sale",
          refId: sale._id,
          userId: toOid(userId),
          note: op.productName,
        },
      ],
      { session }
    );
  }

  if (counterOid) {
    await Counter.findByIdAndUpdate(
      counterOid,
      { $inc: { todaySales: grandTotal, todayTransactions: 1 } },
      { session }
    );
  }

  const roleName = userDoc?.roleId?.name || "";

  await writeActivityLog({
    userId: toOid(userId),
    userName: billedByName,
    role: roleName,
    action: "Bill Generated",
    category: "billing",
    details: `Bill ${invoiceNo} - ₹${grandTotal.toFixed(2)}`,
    severity: "info",
    session,
  });

  return { replay: false, invoice: mapSaleResponse(sale.toObject()) };
}

function mapSaleResponse(s) {
  return {
    id: s.invoiceNo,
    invoiceNo: s.invoiceNo,
    date: s.date,
    time: s.time,
    customer: s.customerName,
    phone: s.customerPhone,
    paymentMode: s.paymentMode,
    counter: s.counterName,
    billedBy: s.billedByName,
    items: s.items,
    subtotal: s.subtotal,
    sgstTotal: s.sgstTotal,
    cgstTotal: s.cgstTotal,
    discount: s.discount,
    grandTotal: s.grandTotal,
    status: s.status,
    loyaltyRedeemedPoints: s.loyaltyRedeemedPoints,
    loyaltyRedeemedValue: s.loyaltyRedeemedValue,
  };
}
