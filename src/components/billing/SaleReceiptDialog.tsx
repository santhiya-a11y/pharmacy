import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Printer, Download, X } from "lucide-react";
import { useRef } from "react";

interface ReceiptItem {
  sno: number;
  name: string;
  batch: string;
  qty: number;
  mrp: number;
  discPct: number;
  total: number;
  dosageLabel?: string;
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
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = receiptRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt - ${invoiceNo}</title>
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; padding: 10px; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; }
        .small { font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; font-size: 11px; }
        .total-row td { font-weight: bold; font-size: 13px; border-top: 1px solid #000; padding-top: 4px; }
      </style></head><body>
      ${content.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-chart-2">
            <CheckCircle className="h-5 w-5" />
            Sale Completed!
          </DialogTitle>
          <DialogDescription>Invoice #{invoiceNo}</DialogDescription>
        </DialogHeader>

        {/* Success animation */}
        <div className="text-center py-3">
          <div className="w-16 h-16 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-300">
            <CheckCircle className="h-8 w-8 text-chart-2" />
          </div>
          <p className="text-2xl font-extrabold text-foreground tabular-nums">₹{total.toFixed(2)}</p>
          <Badge className="mt-1 bg-primary/10 text-primary text-[10px]">{paymentMethod}</Badge>
        </div>

        {/* Receipt Preview */}
        <div ref={receiptRef} className="bg-muted rounded-xl p-4 text-xs space-y-2 max-h-48 overflow-y-auto border border-border">
          <div className="center bold" style={{ textAlign: "center", fontWeight: "bold" }}>
            <p className="text-sm font-bold">PharmaCare Medical Store</p>
            <p className="text-[10px] text-muted-foreground">123, MG Road, Andheri West, Mumbai</p>
            <p className="text-[10px] text-muted-foreground">GST: 27AABCM1234L1Z5</p>
          </div>
          <div className="border-t border-dashed border-border my-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>{invoiceNo}</span>
            <span>{new Date().toLocaleDateString("en-IN")}</span>
          </div>
          {customerName && <p className="text-[10px]">Customer: {customerName}</p>}
          <div className="border-t border-dashed border-border my-1" />
          {items.map(item => (
            <div key={item.sno} className="flex justify-between">
              <span className="flex-1 truncate">{item.qty}x {item.name}</span>
              <span className="tabular-nums ml-2">₹{item.total.toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-dashed border-border my-1" />
          <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          {discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-₹{discount.toFixed(2)}</span></div>}
          <div className="flex justify-between"><span>GST</span><span>₹{gst.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-sm border-t border-border pt-1">
            <span>Total</span><span>₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:opacity-90 transition-all active:scale-[0.98]"
          >
            <Printer className="h-4 w-4" />
            Print Receipt
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
