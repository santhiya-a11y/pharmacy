import { forwardRef } from "react";

export interface InvoiceSettings {
  pharmacyName: string;
  subtitle: string;
  address: string;
  phone: string;
  gstin: string;
  dlNo: string;
  email: string;
  website: string;
  logoUrl?: string;
  stateNameCode: string;
  operatingHours: string;
  showLogo: boolean;
  showDoctor: boolean;
  showPatientAge: boolean;
  showHN: boolean;
  showTokenNumber: boolean;
  showHSN: boolean;
  showBatch: boolean;
  showExpiry: boolean;
  showMFR: boolean;
  showDiscount: boolean;
  showTaxableValue: boolean;
  showGSTPercent: boolean;
  showSGSTCGST: boolean;
  showValue: boolean;
  showPharmacist: boolean;
  showBilledBy: boolean;
  showCheckedBy: boolean;
  showPageNumber: boolean;
  showStateCode: boolean;
  showDeliveryNote: boolean;
  pharmacistName: string;
  billedByName: string;
  checkedByName: string;
  deliveryNote: string;
  footerNote: string;
  invoiceTitle: string;
}

export const DEFAULT_INVOICE_SETTINGS: InvoiceSettings = {
  pharmacyName: "PharmaCare Medical Store",
  subtitle: "Pharmacy Division",
  address: "123, MG Road, Andheri West, Mumbai - 400058",
  phone: "022-12345678",
  gstin: "27AABCM1234L1Z5",
  dlNo: "DL-2024-MH-12345",
  email: "info@pharmacare.in",
  website: "www.pharmacare.in",
  stateNameCode: "MH-27",
  operatingHours: "24 Hours - No Holiday",
  showLogo: true,
  showDoctor: true,
  showPatientAge: true,
  showHN: true,
  showTokenNumber: false,
  showHSN: true,
  showBatch: true,
  showExpiry: true,
  showMFR: true,
  showDiscount: true,
  showTaxableValue: true,
  showGSTPercent: true,
  showSGSTCGST: true,
  showValue: true,
  showPharmacist: true,
  showBilledBy: true,
  showCheckedBy: true,
  showPageNumber: true,
  showStateCode: true,
  showDeliveryNote: true,
  pharmacistName: "Dr. Pharmacist Name",
  billedByName: "",
  checkedByName: "",
  deliveryNote: "Delivered at Pharmacy",
  footerNote: "Service to Humanity is Service to God",
  invoiceTitle: "TAX INVOICE - CASH",
};

export interface InvoiceItem {
  sno: number;
  name: string;
  mfr?: string;
  hsnCode?: string;
  batch?: string;
  expiry?: string;
  qty: number;
  mrp: number;
  discPct: number;
  gstPct: number;
  dosageLabel?: string;
}

export interface InvoiceData {
  invoiceNo: string;
  billDate: string;
  billTime: string;
  customerName?: string;
  customerPhone?: string;
  customerAge?: string;
  customerSex?: string;
  customerHN?: string;
  tokenNumber?: string;
  doctorName?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  paymentMethod: string;
  pageNumber?: number;
  totalPages?: number;
}

interface PrintableInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ data, settings }, ref) => {
    const itemRows = data.items.map((item) => {
      const value = item.mrp * item.qty;
      const discAmt = value * (item.discPct / 100);
      const taxableValue = value - discAmt;
      const sgstPct = item.gstPct / 2;
      const cgstPct = item.gstPct / 2;
      const sgstAmt = taxableValue * (sgstPct / 100);
      const cgstAmt = taxableValue * (cgstPct / 100);
      const amount = taxableValue + sgstAmt + cgstAmt;
      return { ...item, value, discAmt, taxableValue, sgstPct, cgstPct, sgstAmt, cgstAmt, amount };
    });

    const totals = itemRows.reduce(
      (acc, r) => ({
        value: acc.value + r.value,
        discount: acc.discount + r.discAmt,
        taxable: acc.taxable + r.taxableValue,
        sgst: acc.sgst + r.sgstAmt,
        cgst: acc.cgst + r.cgstAmt,
        total: acc.total + r.amount,
        qty: acc.qty + r.qty,
      }),
      { value: 0, discount: 0, taxable: 0, sgst: 0, cgst: 0, total: 0, qty: 0 }
    );

    const roundOff = Math.round(totals.total) - totals.total;
    const netAmount = Math.round(totals.total);

    const numberToWords = (num: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
        'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (num === 0) return 'Zero';
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
      if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
      if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
      return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };

    const td = (extra?: React.CSSProperties): React.CSSProperties => ({ padding: "4px 3px", fontSize: "10px", ...extra });
    const th = (extra?: React.CSSProperties): React.CSSProperties => ({ padding: "5px 3px", fontWeight: 700, fontSize: "9.5px", textTransform: "uppercase" as const, letterSpacing: "0.3px", ...extra });

    return (
      <div ref={ref} style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: "11px", color: "#000", background: "#fff", maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
        {/* ───── HEADER ───── */}
        <div style={{ borderBottom: "2px solid #333", paddingBottom: "8px", marginBottom: "6px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a" }}>{settings.pharmacyName}</div>
              {settings.subtitle && <div style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>{settings.subtitle}</div>}
              <div style={{ fontSize: "9.5px", color: "#666", marginTop: "3px", lineHeight: 1.6 }}>
                {settings.address}<br />
                Phone: {settings.phone}
                {settings.email && <> | {settings.email}</>}
                {settings.website && <> | {settings.website}</>}
              </div>
              <div style={{ fontSize: "9.5px", color: "#555", marginTop: "2px" }}>
                GSTIN: {settings.gstin} | D.L.No: {settings.dlNo}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              {settings.showLogo && settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: "55px", maxWidth: "130px", marginBottom: "4px" }} />
              )}
              {settings.operatingHours && (
                <div style={{ fontSize: "9px", fontWeight: 700, color: "#333", marginTop: "2px" }}>{settings.operatingHours}</div>
              )}
            </div>
          </div>
        </div>

        {/* ───── INVOICE TITLE ───── */}
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: "13px", padding: "3px 0", borderBottom: "1px solid #ccc", marginBottom: "6px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
          {settings.invoiceTitle}
        </div>

        {/* ───── CUSTOMER + META ───── */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "8px", fontSize: "10.5px" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.customerName && <tr><td style={metaLabel}>Name</td><td style={metaVal}>: {data.customerName}</td></tr>}
                {settings.showHN && data.customerHN && <tr><td style={metaLabel}>HN</td><td style={metaVal}>: {data.customerHN}</td></tr>}
                {settings.showPatientAge && data.customerAge && (
                  <tr><td style={metaLabel}>Age / Sex</td><td style={metaVal}>: {data.customerAge}{data.customerSex ? ` / ${data.customerSex}` : ''}</td></tr>
                )}
                {settings.showDoctor && data.doctorName && <tr><td style={metaLabel}>Doctor</td><td style={metaVal}>: {data.doctorName}</td></tr>}
                {data.customerAddress && <tr><td style={metaLabel}>Address</td><td style={metaVal}>: {data.customerAddress}</td></tr>}
              </tbody>
            </table>
          </div>
          <div style={{ width: "220px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={metaLabel}>Invoice No</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.invoiceNo}</td></tr>
                <tr><td style={metaLabel}>Bill Date</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.billDate}</td></tr>
                <tr><td style={metaLabel}>Time</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.billTime}</td></tr>
                {data.customerPhone && <tr><td style={metaLabel}>Phone No</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.customerPhone}</td></tr>}
                {settings.showTokenNumber && data.tokenNumber && <tr><td style={metaLabel}>Token No</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.tokenNumber}</td></tr>}
                {settings.showStateCode && <tr><td style={metaLabel}>State & Code</td><td style={{ ...metaVal, textAlign: "right" }}>: {settings.stateNameCode}</td></tr>}
                <tr><td style={metaLabel}>Payment</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.paymentMethod}</td></tr>
                {settings.showPageNumber && <tr><td style={metaLabel}>Page</td><td style={{ ...metaVal, textAlign: "right" }}>: {data.pageNumber || 1} of {data.totalPages || 1}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* ───── ITEMS TABLE ───── */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "4px" }}>
          <thead>
            <tr style={{ background: "#f5f5f5", borderTop: "1.5px solid #333", borderBottom: "1.5px solid #333" }}>
              <th style={th({ textAlign: "center", width: "26px" })}>S.No</th>
              <th style={th({ textAlign: "left" })}>Item Name</th>
              {settings.showMFR && <th style={th({ textAlign: "left", width: "48px" })}>MFR</th>}
              {settings.showHSN && <th style={th({ textAlign: "left", width: "58px" })}>HSN</th>}
              {settings.showBatch && <th style={th({ textAlign: "left", width: "48px" })}>Batch</th>}
              {settings.showExpiry && <th style={th({ textAlign: "center", width: "46px" })}>Expiry</th>}
              <th style={th({ textAlign: "center", width: "28px" })}>Qty</th>
              <th style={th({ textAlign: "right", width: "52px" })}>R.MRP</th>
              {settings.showValue && <th style={th({ textAlign: "right", width: "52px" })}>Value</th>}
              {settings.showDiscount && <th style={th({ textAlign: "right", width: "36px" })}>Disc</th>}
              {settings.showTaxableValue && <th style={th({ textAlign: "right", width: "54px" })}>Taxable</th>}
              {settings.showGSTPercent && <th style={th({ textAlign: "right", width: "32px" })}>GST%</th>}
              {settings.showSGSTCGST && (
                <>
                  <th style={th({ textAlign: "right", width: "34px" })}>SGST</th>
                  <th style={th({ textAlign: "right", width: "34px" })}>CGST</th>
                </>
              )}
              <th style={th({ textAlign: "right", width: "56px" })}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid #ddd" }}>
                <td style={td({ textAlign: "center" })}>{row.sno}</td>
                <td style={td()}>
                  <div style={{ fontWeight: 600, fontSize: "10px" }}>{row.name}</div>
                  {row.dosageLabel && <div style={{ fontSize: "8.5px", color: "#888" }}>💊 {row.dosageLabel}</div>}
                </td>
                {settings.showMFR && <td style={td({ fontSize: "9px" })}>{row.mfr || "—"}</td>}
                {settings.showHSN && <td style={td({ fontSize: "9px" })}>{row.hsnCode || "—"}</td>}
                {settings.showBatch && <td style={td({ fontSize: "9px" })}>{row.batch || "—"}</td>}
                {settings.showExpiry && <td style={td({ textAlign: "center", fontSize: "9px" })}>{row.expiry || "—"}</td>}
                <td style={td({ textAlign: "center", fontWeight: 600 })}>{row.qty}</td>
                <td style={td({ textAlign: "right" })}>{row.mrp.toFixed(2)}</td>
                {settings.showValue && <td style={td({ textAlign: "right" })}>{row.value.toFixed(2)}</td>}
                {settings.showDiscount && <td style={td({ textAlign: "right" })}>{row.discPct > 0 ? `${row.discPct}%` : "—"}</td>}
                {settings.showTaxableValue && <td style={td({ textAlign: "right" })}>{row.taxableValue.toFixed(2)}</td>}
                {settings.showGSTPercent && <td style={td({ textAlign: "right", fontSize: "9px" })}>{row.gstPct}%</td>}
                {settings.showSGSTCGST && (
                  <>
                    <td style={td({ textAlign: "right", fontSize: "9px" })}>{row.sgstAmt.toFixed(2)}</td>
                    <td style={td({ textAlign: "right", fontSize: "9px" })}>{row.cgstAmt.toFixed(2)}</td>
                  </>
                )}
                <td style={td({ textAlign: "right", fontWeight: 600 })}>{row.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ───── TOTALS ───── */}
        <div style={{ borderTop: "1.5px solid #333", paddingTop: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "20px" }}>
            {/* Tax Summary */}
            {settings.showSGSTCGST && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", fontWeight: 700, marginBottom: "3px", color: "#555", textTransform: "uppercase" }}>Tax Summary</div>
                <table style={{ borderCollapse: "collapse", fontSize: "9px", width: "100%" }}>
                  <thead>
                    <tr style={{ background: "#f9f9f9", borderBottom: "0.5px solid #ccc" }}>
                      <th style={{ padding: "2px 4px", textAlign: "left" }}>Tax %</th>
                      <th style={{ padding: "2px 4px", textAlign: "right" }}>Taxable</th>
                      <th style={{ padding: "2px 4px", textAlign: "right" }}>SGST</th>
                      <th style={{ padding: "2px 4px", textAlign: "right" }}>CGST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.values(
                      itemRows.reduce((acc, r) => {
                        const key = r.gstPct;
                        if (!acc[key]) acc[key] = { pct: key, taxable: 0, sgst: 0, cgst: 0 };
                        acc[key].taxable += r.taxableValue;
                        acc[key].sgst += r.sgstAmt;
                        acc[key].cgst += r.cgstAmt;
                        return acc;
                      }, {} as Record<number, { pct: number; taxable: number; sgst: number; cgst: number }>)
                    ).map((g, i) => (
                      <tr key={i} style={{ borderBottom: "0.5px solid #eee" }}>
                        <td style={{ padding: "2px 4px" }}>{g.pct}%</td>
                        <td style={{ padding: "2px 4px", textAlign: "right" }}>{g.taxable.toFixed(2)}</td>
                        <td style={{ padding: "2px 4px", textAlign: "right" }}>{g.sgst.toFixed(2)}</td>
                        <td style={{ padding: "2px 4px", textAlign: "right" }}>{g.cgst.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Grand Totals */}
            <div style={{ width: "220px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10.5px" }}>
                <tbody>
                  <tr><td style={{ padding: "2px 0", color: "#555" }}>Gross Value</td><td style={{ textAlign: "right", padding: "2px 0" }}>₹{totals.value.toFixed(2)}</td></tr>
                  {totals.discount > 0 && (
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Less Disc</td><td style={{ textAlign: "right", padding: "2px 0" }}>-₹{totals.discount.toFixed(2)}</td></tr>
                  )}
                  <tr><td style={{ padding: "2px 0", color: "#555" }}>Taxable Value</td><td style={{ textAlign: "right", padding: "2px 0" }}>₹{totals.taxable.toFixed(2)}</td></tr>
                  {settings.showSGSTCGST && (
                    <>
                      <tr><td style={{ padding: "2px 0", color: "#555" }}>*SGST</td><td style={{ textAlign: "right", padding: "2px 0" }}>₹{totals.sgst.toFixed(2)}</td></tr>
                      <tr><td style={{ padding: "2px 0", color: "#555" }}>*CGST</td><td style={{ textAlign: "right", padding: "2px 0" }}>₹{totals.cgst.toFixed(2)}</td></tr>
                    </>
                  )}
                  <tr><td style={{ padding: "2px 0", color: "#555" }}>Round Off</td><td style={{ textAlign: "right", padding: "2px 0" }}>{roundOff >= 0 ? '+' : ''}{roundOff.toFixed(2)}</td></tr>
                  <tr style={{ borderTop: "1.5px solid #333" }}>
                    <td style={{ padding: "6px 0 2px", fontWeight: 800, fontSize: "13px" }}>Invoice Value</td>
                    <td style={{ textAlign: "right", padding: "6px 0 2px", fontWeight: 800, fontSize: "13px" }}>₹{netAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Amount in words */}
        <div style={{ fontSize: "9.5px", marginTop: "6px", fontStyle: "italic", color: "#444" }}>
          Amount in words: <strong>{numberToWords(netAmount)} Rupees Only</strong>
        </div>

        {/* Delivery note */}
        {settings.showDeliveryNote && settings.deliveryNote && (
          <div style={{ fontSize: "9px", marginTop: "4px", color: "#555" }}>{settings.deliveryNote}</div>
        )}

        {/* ───── FOOTER ───── */}
        <div style={{ borderTop: "1px solid #ddd", marginTop: "10px", paddingTop: "8px", fontSize: "9.5px", color: "#555" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              {settings.showPharmacist && settings.pharmacistName && (
                <div><span style={{ fontWeight: 600 }}>Pharmacist:</span> {settings.pharmacistName}</div>
              )}
              {settings.showBilledBy && settings.billedByName && (
                <div style={{ marginTop: "2px" }}><span style={{ fontWeight: 600 }}>Billed By:</span> {settings.billedByName}</div>
              )}
              {settings.showCheckedBy && settings.checkedByName && (
                <div style={{ marginTop: "2px" }}><span style={{ fontWeight: 600 }}>Checked By:</span> {settings.checkedByName}</div>
              )}
              {settings.footerNote && (
                <div style={{ marginTop: "6px", fontStyle: "italic", fontWeight: 700, color: "#333", fontSize: "10px" }}>{settings.footerNote}</div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div>Printed: {data.billDate} {data.billTime}</div>
              <div style={{ marginTop: "20px", borderTop: "1px solid #999", paddingTop: "2px", fontWeight: 600 }}>Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const metaLabel: React.CSSProperties = { fontWeight: 600, padding: "1.5px 4px 1.5px 0", width: "75px", color: "#555", fontSize: "10px", verticalAlign: "top" };
const metaVal: React.CSSProperties = { padding: "1.5px 0", fontSize: "10px" };

PrintableInvoice.displayName = "PrintableInvoice";
export default PrintableInvoice;
