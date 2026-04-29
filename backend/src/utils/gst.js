/**
 * Discount applied on MRP * qty (taxable base before GST).
 * SGST/CGST are half of total GST rate each (India intra-state).
 */
export function splitGstPercent(totalGstPct) {
  const half = totalGstPct / 2;
  return { sgstPct: half, cgstPct: half };
}

export function lineAmounts({ mrp, qty, discPct, sgstPct, cgstPct }) {
  const gross = mrp * qty;
  const discountAmount = gross * (discPct / 100);
  const taxable = gross - discountAmount;
  const sgstAmt = taxable * (sgstPct / 100);
  const cgstAmt = taxable * (cgstPct / 100);
  const lineTotal = taxable + sgstAmt + cgstAmt;
  return {
    gross,
    discountAmount,
    taxable,
    sgstAmt,
    cgstAmt,
    lineTotal,
  };
}

export function sumPayments(payments) {
  return payments.reduce((s, p) => s + Number(p.amount), 0);
}
