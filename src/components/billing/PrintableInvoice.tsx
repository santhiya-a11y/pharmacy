import { forwardRef } from "react";

export interface InvoiceSettings {
  pharmacyName: string;
  subtitle: string;
  address: string;
  phone: string;
  gstin: string;
  dlNo: string;
  email: string;
  logoUrl?: string;
  showLogo: boolean;
  showDoctor: boolean;
  showPatientAge: boolean;
  showHSN: boolean;
  showBatch: boolean;
  showExpiry: boolean;
  showMFR: boolean;
  showDiscount: boolean;
  showSGSTCGST: boolean;
  showPharmacist: boolean;
  pharmacistName: string;
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
  showLogo: true,
  showDoctor: true,
  showPatientAge: true,
  showHSN: true,
  showBatch: true,
  showExpiry: true,
  showMFR: true,
  showDiscount: true,
  showSGSTCGST: true,
  showPharmacist: true,
  pharmacistName: "Dr. Pharmacist Name",
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
  doctorName?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  paymentMethod: string;
}

interface PrintableInvoiceProps {
  data: InvoiceData;
  settings: InvoiceSettings;
}

const PrintableInvoice = forwardRef<HTMLDivElement, PrintableInvoiceProps>(
  ({ data, settings }, ref) => {
    // Calculations
    const itemRows = data.items.map((item) => {
      const grossValue = item.mrp * item.qty;
      const discAmt = grossValue * (item.discPct / 100);
      const taxableValue = grossValue - discAmt;
      const sgstPct = item.gstPct / 2;
      const cgstPct = item.gstPct / 2;
      const sgstAmt = taxableValue * (sgstPct / 100);
      const cgstAmt = taxableValue * (cgstPct / 100);
      const amount = taxableValue + sgstAmt + cgstAmt;
      return { ...item, grossValue, discAmt, taxableValue, sgstPct, cgstPct, sgstAmt, cgstAmt, amount };
    });

    const totals = itemRows.reduce(
      (acc, r) => ({
        grossValue: acc.grossValue + r.grossValue,
        discount: acc.discount + r.discAmt,
        taxable: acc.taxable + r.taxableValue,
        sgst: acc.sgst + r.sgstAmt,
        cgst: acc.cgst + r.cgstAmt,
        total: acc.total + r.amount,
        qty: acc.qty + r.qty,
      }),
      { grossValue: 0, discount: 0, taxable: 0, sgst: 0, cgst: 0, total: 0, qty: 0 }
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

    return (
      <div ref={ref} className="invoice-print-area" style={{ fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: "11px", color: "#000", background: "#fff", maxWidth: "800px", margin: "0 auto", padding: "16px" }}>
        {/* Header */}
        <div style={{ borderBottom: "2px solid #333", paddingBottom: "8px", marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.3px" }}>
                {settings.pharmacyName}
              </div>
              {settings.subtitle && (
                <div style={{ fontSize: "11px", color: "#555", marginTop: "1px" }}>{settings.subtitle}</div>
              )}
              <div style={{ fontSize: "10px", color: "#666", marginTop: "4px", lineHeight: "1.5" }}>
                {settings.address}<br />
                Phone: {settings.phone} {settings.email && `| ${settings.email}`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              {settings.showLogo && settings.logoUrl && (
                <img src={settings.logoUrl} alt="Logo" style={{ maxHeight: "50px", maxWidth: "120px", marginBottom: "4px" }} />
              )}
              <div style={{ fontSize: "10px", color: "#555" }}>
                GSTIN: {settings.gstin}<br />
                D.L.No: {settings.dlNo}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Title */}
        <div style={{ textAlign: "center", fontWeight: 700, fontSize: "13px", padding: "4px 0", borderBottom: "1px solid #ddd", marginBottom: "8px", letterSpacing: "1px", textTransform: "uppercase" }}>
          {settings.invoiceTitle}
        </div>

        {/* Customer & Invoice Meta - two columns */}
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", marginBottom: "10px", fontSize: "10.5px" }}>
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {data.customerName && (
                  <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", width: "70px", color: "#555" }}>Name</td><td style={{ padding: "1px 0" }}>: {data.customerName}</td></tr>
                )}
                {settings.showPatientAge && data.customerAge && (
                  <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Age / Sex</td><td style={{ padding: "1px 0" }}>: {data.customerAge}{data.customerSex ? ` / ${data.customerSex}` : ''}</td></tr>
                )}
                {settings.showDoctor && data.doctorName && (
                  <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Doctor</td><td style={{ padding: "1px 0" }}>: {data.doctorName}</td></tr>
                )}
                {data.customerAddress && (
                  <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Address</td><td style={{ padding: "1px 0" }}>: {data.customerAddress}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ width: "200px", textAlign: "right" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Invoice No</td><td style={{ padding: "1px 0", textAlign: "right" }}>: {data.invoiceNo}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Bill Date</td><td style={{ padding: "1px 0", textAlign: "right" }}>: {data.billDate}</td></tr>
                <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Time</td><td style={{ padding: "1px 0", textAlign: "right" }}>: {data.billTime}</td></tr>
                {data.customerPhone && (
                  <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Phone No</td><td style={{ padding: "1px 0", textAlign: "right" }}>: {data.customerPhone}</td></tr>
                )}
                <tr><td style={{ fontWeight: 600, padding: "1px 4px 1px 0", color: "#555" }}>Payment</td><td style={{ padding: "1px 0", textAlign: "right" }}>: {data.paymentMethod}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "10px", marginBottom: "6px" }}>
          <thead>
            <tr style={{ background: "#f5f5f5", borderTop: "1.5px solid #333", borderBottom: "1.5px solid #333" }}>
              <th style={{ padding: "5px 3px", textAlign: "center", fontWeight: 700, width: "28px" }}>S.No</th>
              <th style={{ padding: "5px 3px", textAlign: "left", fontWeight: 700 }}>Item Name</th>
              {settings.showMFR && <th style={{ padding: "5px 3px", textAlign: "left", fontWeight: 700, width: "55px" }}>MFR</th>}
              {settings.showHSN && <th style={{ padding: "5px 3px", textAlign: "left", fontWeight: 700, width: "60px" }}>HSN</th>}
              {settings.showBatch && <th style={{ padding: "5px 3px", textAlign: "left", fontWeight: 700, width: "50px" }}>Batch</th>}
              {settings.showExpiry && <th style={{ padding: "5px 3px", textAlign: "center", fontWeight: 700, width: "50px" }}>Expiry</th>}
              <th style={{ padding: "5px 3px", textAlign: "center", fontWeight: 700, width: "30px" }}>Qty</th>
              <th style={{ padding: "5px 3px", textAlign: "right", fontWeight: 700, width: "55px" }}>MRP</th>
              {settings.showDiscount && <th style={{ padding: "5px 3px", textAlign: "right", fontWeight: 700, width: "40px" }}>Disc</th>}
              {settings.showSGSTCGST && (
                <>
                  <th style={{ padding: "5px 3px", textAlign: "right", fontWeight: 700, width: "40px" }}>SGST</th>
                  <th style={{ padding: "5px 3px", textAlign: "right", fontWeight: 700, width: "40px" }}>CGST</th>
                </>
              )}
              <th style={{ padding: "5px 3px", textAlign: "right", fontWeight: 700, width: "60px" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {itemRows.map((row, i) => (
              <tr key={i} style={{ borderBottom: "0.5px solid #ddd" }}>
                <td style={{ padding: "4px 3px", textAlign: "center" }}>{row.sno}</td>
                <td style={{ padding: "4px 3px" }}>
                  <div style={{ fontWeight: 600 }}>{row.name}</div>
                  {row.dosageLabel && <div style={{ fontSize: "9px", color: "#888" }}>💊 {row.dosageLabel}</div>}
                </td>
                {settings.showMFR && <td style={{ padding: "4px 3px", fontSize: "9px" }}>{row.mfr || "—"}</td>}
                {settings.showHSN && <td style={{ padding: "4px 3px", fontSize: "9px" }}>{row.hsnCode || "—"}</td>}
                {settings.showBatch && <td style={{ padding: "4px 3px", fontSize: "9px" }}>{row.batch || "—"}</td>}
                {settings.showExpiry && <td style={{ padding: "4px 3px", textAlign: "center", fontSize: "9px" }}>{row.expiry || "—"}</td>}
                <td style={{ padding: "4px 3px", textAlign: "center", fontWeight: 600 }}>{row.qty}</td>
                <td style={{ padding: "4px 3px", textAlign: "right" }}>{row.mrp.toFixed(2)}</td>
                {settings.showDiscount && <td style={{ padding: "4px 3px", textAlign: "right" }}>{row.discPct > 0 ? `${row.discPct}%` : "—"}</td>}
                {settings.showSGSTCGST && (
                  <>
                    <td style={{ padding: "4px 3px", textAlign: "right", fontSize: "9px" }}>{row.sgstAmt.toFixed(2)}</td>
                    <td style={{ padding: "4px 3px", textAlign: "right", fontSize: "9px" }}>{row.cgstAmt.toFixed(2)}</td>
                  </>
                )}
                <td style={{ padding: "4px 3px", textAlign: "right", fontWeight: 600 }}>{row.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ borderTop: "1.5px solid #333", paddingTop: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "24px" }}>
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
                    {/* Group by GST rate */}
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
                  <tr><td style={{ padding: "2px 0", color: "#555" }}>Gross Value</td><td style={{ textAlign: "right", padding: "2px 0" }}>₹{totals.grossValue.toFixed(2)}</td></tr>
                  {totals.discount > 0 && (
                    <tr><td style={{ padding: "2px 0", color: "#555" }}>Less Discount</td><td style={{ textAlign: "right", padding: "2px 0" }}>-₹{totals.discount.toFixed(2)}</td></tr>
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

        {/* Footer */}
        <div style={{ borderTop: "1px solid #ddd", marginTop: "12px", paddingTop: "8px", display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "#555" }}>
          <div>
            {settings.showPharmacist && settings.pharmacistName && (
              <div><span style={{ fontWeight: 600 }}>Pharmacist:</span> {settings.pharmacistName}</div>
            )}
            {settings.footerNote && (
              <div style={{ marginTop: "4px", fontStyle: "italic", fontWeight: 600, color: "#333" }}>{settings.footerNote}</div>
            )}
          </div>
          <div style={{ textAlign: "right" }}>
            <div>Printed: {data.billDate} {data.billTime}</div>
            <div style={{ marginTop: "16px", borderTop: "1px solid #999", paddingTop: "2px", fontWeight: 600 }}>Authorized Signatory</div>
          </div>
        </div>
      </div>
    );
  }
);

PrintableInvoice.displayName = "PrintableInvoice";
export default PrintableInvoice;
