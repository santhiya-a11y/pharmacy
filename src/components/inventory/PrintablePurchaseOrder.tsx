import { forwardRef } from "react";
import type { InventoryItem } from "./ItemDetailSheet";

export interface ReorderEntry {
  item: InventoryItem;
  qty: number;
}

interface PrintablePOProps {
  poNumber: string;
  poDate: string;
  supplier: string;
  items: ReorderEntry[];
  deliveryDate: string;
  paymentTerms: string;
  remarks: string;
  pharmacyName: string;
  pharmacyAddress: string;
  pharmacyPhone: string;
  pharmacyGSTIN: string;
}

const PrintablePurchaseOrder = forwardRef<HTMLDivElement, PrintablePOProps>(({
  poNumber, poDate, supplier, items, deliveryDate, paymentTerms, remarks,
  pharmacyName, pharmacyAddress, pharmacyPhone, pharmacyGSTIN
}, ref) => {
  const totalAmount = items.reduce((sum, e) => sum + (e.item.purchasePrice || e.item.mrp) * e.qty, 0);
  const totalGST = items.reduce((sum, e) => {
    const base = (e.item.purchasePrice || e.item.mrp) * e.qty;
    return sum + base * (e.item.sgst + e.item.cgst) / 100;
  }, 0);
  const grandTotal = totalAmount + totalGST;

  const numberToWords = (num: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num === 0) return 'Zero';
    const n = Math.round(num);
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' and ' + numberToWords(n % 100) : '');
    if (n < 100000) return numberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
    if (n < 10000000) return numberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 ? ' ' + numberToWords(n % 100000) : '');
    return numberToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 ? ' ' + numberToWords(n % 10000000) : '');
  };

  return (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', padding: '12mm 15mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#111', background: '#fff' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', borderBottom: '2px solid #111', paddingBottom: '8px', marginBottom: '12px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px 0', letterSpacing: '1px' }}>PURCHASE ORDER</h1>
        <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>Original for Supplier</p>
      </div>

      {/* From / To */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', gap: '20px' }}>
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>From (Buyer)</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: '0 0 3px 0' }}>{pharmacyName}</p>
          <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>{pharmacyAddress}</p>
          <p style={{ margin: '0 0 2px 0', fontSize: '10px' }}>Phone: {pharmacyPhone}</p>
          {pharmacyGSTIN && <p style={{ margin: 0, fontSize: '10px' }}>GSTIN: {pharmacyGSTIN}</p>}
        </div>
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>To (Supplier)</p>
          <p style={{ fontWeight: 'bold', fontSize: '13px', margin: 0 }}>{supplier}</p>
        </div>
      </div>

      {/* PO Meta */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '16px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', flex: 1 }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 2px 0' }}>PO Number</p>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{poNumber}</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', flex: 1 }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 2px 0' }}>PO Date</p>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{poDate}</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', flex: 1 }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 2px 0' }}>Expected Delivery</p>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{deliveryDate || '—'}</p>
        </div>
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '8px 12px', flex: 1 }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 2px 0' }}>Payment Terms</p>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{paymentTerms || '—'}</p>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            {['S.No', 'Item Name', 'Batch', 'HSN', 'Expiry', 'Qty', 'Rate (₹)', 'GST %', 'Amount (₹)'].map(h => (
              <th key={h} style={{ border: '1px solid #ddd', padding: '6px 8px', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.3px', textAlign: h === 'Item Name' ? 'left' : 'center', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((entry, i) => {
            const rate = entry.item.purchasePrice || entry.item.mrp;
            const gstPct = entry.item.sgst + entry.item.cgst;
            const amount = rate * entry.qty;
            return (
              <tr key={i}>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center' }}>{i + 1}</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', fontWeight: '500' }}>
                  {entry.item.name}
                  <br /><span style={{ fontSize: '9px', color: '#888' }}>{entry.item.mfr}</span>
                </td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{entry.item.batch}</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center', fontFamily: 'monospace' }}>{entry.item.hsn}</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center' }}>{entry.item.expiry}</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center', fontWeight: 'bold' }}>{entry.qty}</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right' }}>{rate.toFixed(2)}</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'center' }}>{gstPct}%</td>
                <td style={{ border: '1px solid #ddd', padding: '5px 8px', textAlign: 'right', fontWeight: 'bold' }}>{amount.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <div style={{ width: '250px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
            <span>Sub Total</span><span style={{ fontWeight: '500' }}>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
            <span>Total GST</span><span style={{ fontWeight: '500' }}>₹{totalGST.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '2px solid #111', marginTop: '4px', fontSize: '14px', fontWeight: 'bold' }}>
            <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <p style={{ fontSize: '9px', color: '#666', margin: '4px 0 0 0' }}>
            Amount in words: <strong>{numberToWords(grandTotal)} Rupees Only</strong>
          </p>
        </div>
      </div>

      {/* Remarks */}
      {remarks && (
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', marginBottom: '16px' }}>
          <p style={{ fontSize: '9px', color: '#888', margin: '0 0 4px 0', textTransform: 'uppercase' }}>Remarks / Notes</p>
          <p style={{ margin: 0, fontSize: '10px' }}>{remarks}</p>
        </div>
      )}

      {/* Terms */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '12px', marginBottom: '40px' }}>
        <p style={{ fontSize: '9px', color: '#888', margin: '0 0 6px 0', textTransform: 'uppercase' }}>Terms & Conditions</p>
        <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '9px', color: '#555', lineHeight: '1.6' }}>
          <li>Please deliver the goods on or before the expected delivery date.</li>
          <li>Batch number and expiry must match as specified. Short-expiry items will be returned.</li>
          <li>Invoice must reference this PO number for payment processing.</li>
          <li>Damaged or defective goods will be returned at supplier's cost.</li>
        </ol>
      </div>

      {/* Signatures */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111', width: '150px', marginBottom: '4px' }} />
          <p style={{ fontSize: '9px', color: '#888', margin: 0 }}>Prepared By</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111', width: '150px', marginBottom: '4px' }} />
          <p style={{ fontSize: '9px', color: '#888', margin: 0 }}>Approved By</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ borderTop: '1px solid #111', width: '150px', marginBottom: '4px' }} />
          <p style={{ fontSize: '9px', color: '#888', margin: 0 }}>Supplier Acknowledgement</p>
        </div>
      </div>
    </div>
  );
});

PrintablePurchaseOrder.displayName = "PrintablePurchaseOrder";
export default PrintablePurchaseOrder;
