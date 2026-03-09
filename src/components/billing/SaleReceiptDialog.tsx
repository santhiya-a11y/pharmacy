import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Printer } from "lucide-react";
import { useRef } from "react";
import PrintableInvoice, { DEFAULT_INVOICE_SETTINGS, InvoiceData, InvoiceSettings } from "./PrintableInvoice";

interface ReceiptItem {
  sno: number;
  name: string;
  batch: string;
  qty: number;
  mrp: number;
  discPct: number;
  total: number;
  dosageLabel?: string;
  manufacturer?: string;
  expiry?: string;
  gst?: number;
  hsnCode?: string;
}

interface SaleReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceNo: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  gst: number;
  total: number;
  paymentMethod: string;
  onNewSale: () => void;
}

const SaleReceiptDialog = ({
  open, onOpenChange, invoiceNo, customerName, items,
  subtotal, discount, gst, total, paymentMethod, onNewSale
}: SaleReceiptDialogProps) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Load saved settings or use defaults
  const settings: InvoiceSettings = (() => {
    try {
      const saved = localStorage.getItem("invoiceSettings");
      return saved ? { ...DEFAULT_INVOICE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_INVOICE_SETTINGS;
    } catch {
      return DEFAULT_INVOICE_SETTINGS;
    }
  })();

  const now = new Date();
  const invoiceData: InvoiceData = {
    invoiceNo,
    billDate: now.toLocaleDateString("en-IN"),
    billTime: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    customerName: customerName || undefined,
    paymentMethod,
    items: items.map((item) => ({
      sno: item.sno,
      name: item.name,
      mfr: item.manufacturer,
      hsnCode: item.hsnCode || "30049099",
      batch: item.batch,
      expiry: item.expiry,
      qty: item.qty,
      mrp: item.mrp,
      discPct: item.discPct,
      gstPct: item.gst ?? 12,
      dosageLabel: item.dosageLabel,
    })),
  };

  const handlePrint = () => {
    if (!invoiceRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice - ${invoiceNo}</title>
      <style>
        body { margin: 0; padding: 20px; }
        @media print { 
          body { padding: 10px; }
          @page { margin: 10mm; }
        }
      </style></head><body>
      ${invoiceRef.current.innerHTML}
      <script>setTimeout(() => { window.print(); }, 300);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-chart-2">
            <CheckCircle className="h-5 w-5" />
            Sale Completed!
          </DialogTitle>
          <DialogDescription>Invoice #{invoiceNo}</DialogDescription>
        </DialogHeader>

        {/* Success */}
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
            <CheckCircle className="h-7 w-7 text-chart-2" />
          </div>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">₹{total.toFixed(2)}</p>
          <Badge className="mt-1 bg-primary/10 text-primary text-[10px]">{paymentMethod}</Badge>
        </div>

        {/* Invoice Preview */}
        <div className="border border-border rounded-lg p-2 bg-white max-h-[400px] overflow-y-auto">
          <PrintableInvoice ref={invoiceRef} data={invoiceData} settings={settings} />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
          <button
            onClick={() => { onNewSale(); onOpenChange(false); }}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-border py-3 text-sm font-bold text-foreground hover:bg-accent transition-all active:scale-[0.98]"
          >
            New Sale
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleReceiptDialog;
