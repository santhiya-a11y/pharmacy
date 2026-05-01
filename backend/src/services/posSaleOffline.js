import { getWrapped } from "../db/nedb/initStores.js";
import { insertWithTimestamps, findById } from "../db/nedb/documentHelpers.js";
import { loadUserWithRoleLean } from "../db/offline/authSupport.js";
import { toIdString } from "../db/types.js";
import * as productRepo from "../db/repositories/productRepository.js";
import { nextInvoiceNumber } from "../utils/invoiceNumber.js";
import { lineAmounts, sumPayments, splitGstPercent } from "../utils/gst.js";
import { AppError, ErrorCodes } from "../utils/errors.js";
import { writeActivityLog } from "./activityLog.service.js";

const LOYALTY_RUPEE_PER_POINT = 0.25;
const PAYMENT_EPSILON = 0.5;

function toOidString(id) {
  if (!id) return null;
  try {
    return toIdString(id);
  } catch {
    return null;
  }
}

async function allocateFefoOffline(productIdStr, qtyNeeded) {
  const batches = await getWrapped("productbatches").find({
    productId: productIdStr,
    qtyOnHand: { $gt: 0 },
    expiryDate: { $gte: new Date() },
  });
  batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

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

async function deductBatchQtyOffline(batchId, qty) {
  const bs = getWrapped("productbatches");
  const res = await bs.update(
    { _id: toIdString(batchId), qtyOnHand: { $gte: qty } },
    { $inc: { qtyOnHand: -qty }, $set: { updatedAt: new Date() } },
    { multi: false, returnUpdatedDocs: true }
  );
  if (!res.numAffected || !res.affectedDocuments) {
    throw new AppError(ErrorCodes.INSUFFICIENT_STOCK, "Insufficient stock for batch", 409);
  }
  return res.affectedDocuments;
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

export async function createPosSaleOffline(input) {
  const sales = getWrapped("sales");
  const idemKey = input.idempotencyKey?.trim();
  if (idemKey) {
    const existing = await sales.findOne({ idempotencyKey: idemKey });
    if (existing) {
      return { replay: true, invoice: mapSaleResponse(existing) };
    }
  }

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

  const userDoc = await loadUserWithRoleLean(userId);
  let billedByName = "Staff";
  if (userDoc?.employeeId && typeof userDoc.employeeId === "object") {
    billedByName = userDoc.employeeId.name || billedByName;
  } else if (userDoc?.employeeId) {
    const emp = await findById(getWrapped("employees"), userDoc.employeeId);
    billedByName = emp?.name || billedByName;
  }
  billedByName = billedByName || userDoc?.email?.split("@")[0] || "Staff";

  let counterName;
  const counterOid = toOidString(counterId);
  if (counterOid) {
    const c = await findById(getWrapped("counters"), counterOid);
    counterName = c?.name;
  }

  const customerOid = toOidString(customerId);
  let resolvedCustomer = null;
  const custStore = getWrapped("customers");
  if (customerOid) {
    resolvedCustomer = await findById(custStore, customerOid);
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
    const batchOid = toOidString(line.productBatchId);
    const productOid = toOidString(line.productId);

    if (batchOid) {
      const batchDoc = await findById(getWrapped("productbatches"), batchOid);
      if (!batchDoc) throw new AppError(ErrorCodes.NOT_FOUND, "Batch not found", 404);
      if (batchDoc.qtyOnHand < line.qty) {
        throw new AppError(ErrorCodes.INSUFFICIENT_STOCK, "Insufficient stock for selected batch", 409);
      }
      allocations = [{ batch: batchDoc, qty: line.qty }];
    } else if (productOid) {
      allocations = await allocateFefoOffline(productOid, line.qty);
    } else {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Invalid line: missing product reference", 400);
    }

    for (const { batch, qty } of allocations) {
      const product = await productRepo.productFindById(batch.productId);
      if (!product) throw new AppError(ErrorCodes.NOT_FOUND, "Product not found", 404);

      const requiresRx = Boolean(product.requiresRx || line.requiresRx);
      if (requiresRx) {
        const doctor = line.rxDoctorName?.trim();
        if (!doctor) {
          throw new AppError(ErrorCodes.RX_REQUIRED, `Prescription verification required for ${product.name}`, 400);
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

  if (isNaN(grandTotal)) {
    throw new AppError(ErrorCodes.VALIDATION_ERROR, "Calculated grand total is not a valid number (NaN)", 400);
  }

  if (resolvedCustomer && loyaltyPointsRedeemed > 0) {
    if (resolvedCustomer.loyaltyPoints < loyaltyPointsRedeemed) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, "Insufficient loyalty points", 400);
    }
    await custStore.update(
      { _id: resolvedCustomer._id },
      {
        $set: {
          loyaltyPoints: resolvedCustomer.loyaltyPoints - loyaltyPointsRedeemed,
          totalPurchases: (resolvedCustomer.totalPurchases || 0) + grandTotal,
          lastVisit: new Date(),
          updatedAt: new Date(),
        },
      },
      {}
    );
  } else if (resolvedCustomer) {
    await custStore.update(
      { _id: resolvedCustomer._id },
      {
        $set: {
          totalPurchases: (resolvedCustomer.totalPurchases || 0) + grandTotal,
          lastVisit: new Date(),
          updatedAt: new Date(),
        },
      },
      {}
    );
  }

  for (const op of stockOps) {
    await deductBatchQtyOffline(op.batchId, op.qty);
  }

  const invoiceNo = await nextInvoiceNumber();
  const now = new Date();

  const sale = await insertWithTimestamps(sales, {
    invoiceNo,
    date: now,
    time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    customerId: customerOid || undefined,
    customerName: customerName || resolvedCustomer?.name || "Walk-in",
    customerPhone: customerPhone || resolvedCustomer?.phone || "",
    paymentMode,
    counterId: counterOid || undefined,
    counterName,
    billedByUserId: toOidString(userId),
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
  });

  const logs = getWrapped("inventorylogs");
  for (const op of stockOps) {
    await insertWithTimestamps(logs, {
      batchId: op.batchId,
      productId: op.productId,
      changeQty: -op.qty,
      reason: "sale",
      refType: "sale",
      refId: sale._id,
      userId: toOidString(userId),
      note: op.productName,
    });
  }

  if (counterOid) {
    await getWrapped("counters").update(
      { _id: counterOid },
      { $inc: { todaySales: grandTotal, todayTransactions: 1 }, $set: { updatedAt: new Date() } },
      {}
    );
  }

  const roleName =
    (userDoc?.roleId && typeof userDoc.roleId === "object" ? userDoc.roleId.name : null) || "";

  await writeActivityLog({
    userId: toOidString(userId),
    userName: billedByName,
    role: roleName,
    action: "Bill Generated",
    category: "billing",
    details: `Bill ${invoiceNo} - ₹${grandTotal.toFixed(2)}`,
    severity: "info",
    session: null,
  });

  return { replay: false, invoice: mapSaleResponse(sale) };
}
