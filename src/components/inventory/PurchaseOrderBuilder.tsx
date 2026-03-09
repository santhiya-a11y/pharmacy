import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardList, X, Download, MessageCircle, Mail, Copy, Minus, Plus, Building2, FileText, Calendar, Check } from "lucide-react";
import type { InventoryItem } from "./ItemDetailSheet";
import PrintablePurchaseOrder from "./PrintablePurchaseOrder";
import { toast } from "sonner";

export interface ReorderEntry {
  item: InventoryItem;
  qty: number;
}

interface PurchaseOrderBuilderProps {
  entries: ReorderEntry[];
  onUpdateQty: (itemName: string, qty: number) => void;
  onRemove: (itemName: string) => void;
  onClear: () => void;
}

const paymentTermOptions = ["Advance", "COD", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days"];

const PurchaseOrderBuilder = ({ entries, onUpdateQty, onRemove, onClear }: PurchaseOrderBuilderProps) => {
  const [open, setOpen] = useState(false);
  const [activeSupplier, setActiveSupplier] = useState<string | null>(null);
  const [poMeta, setPoMeta] = useState<Record<string, { deliveryDate: string; paymentTerms: string; remarks: string }>>({});
  const [sentSuppliers, setSentSuppliers] = useState<Set<string>>(new Set());
  const printRef = useRef<HTMLDivElement>(null);
  const [printingSupplier, setPrintingSupplier] = useState<string | null>(null);

  if (entries.length === 0) return null;

  // Group by supplier
  const grouped: Record<string, ReorderEntry[]> = {};
  entries.forEach(e => {
    const supplier = e.item.supplier || e.item.mfr;
    if (!grouped[supplier]) grouped[supplier] = [];
    grouped[supplier].push(e);
  });

  const totalItems = entries.length;
  const supplierList = Object.keys(grouped);

  const getPoNumber = (supplier: string) => {
    const idx = supplierList.indexOf(supplier) + 1;
    const date = new Date();
    return `PO-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${String(idx).padStart(3, '0')}`;
  };

  const getPoDate = () => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const getMeta = (supplier: string) => poMeta[supplier] || { deliveryDate: "", paymentTerms: "30 Days", remarks: "" };

  const updateMeta = (supplier: string, field: string, value: string) => {
    setPoMeta(prev => ({
      ...prev,
      [supplier]: { ...getMeta(supplier), [field]: value }
    }));
  };

  const getSupplierTotal = (items: ReorderEntry[]) => {
    return items.reduce((sum, e) => {
      const rate = e.item.purchasePrice || e.item.mrp;
      const gst = rate * e.qty * (e.item.sgst + e.item.cgst) / 100;
      return sum + rate * e.qty + gst;
    }, 0);
  };

  const buildMessage = (supplier: string, items: ReorderEntry[]) => {
    const poNum = getPoNumber(supplier);
    const meta = getMeta(supplier);
    const lines = items.map((e, i) => `${i + 1}. ${e.item.name} — Qty: ${e.qty} (Batch: ${e.item.batch})`);
    return `PURCHASE ORDER: ${poNum}\nDate: ${getPoDate()}\n\nDear ${supplier},\n\nPlease supply the following:\n\n${lines.join("\n")}\n\nExpected Delivery: ${meta.deliveryDate || "ASAP"}\nPayment Terms: ${meta.paymentTerms || "30 Days"}\n${meta.remarks ? `Remarks: ${meta.remarks}\n` : ""}\nPlease confirm availability and delivery timeline.\n\nThank you.`;
  };

  const handleWhatsApp = (supplier: string, items: ReorderEntry[]) => {
    const msg = encodeURIComponent(buildMessage(supplier, items));
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    setSentSuppliers(prev => new Set(prev).add(supplier));
    toast.success(`PO sent via WhatsApp to ${supplier}`);
  };

  const handleEmail = (supplier: string, items: ReorderEntry[]) => {
    const poNum = getPoNumber(supplier);
    const subject = encodeURIComponent(`Purchase Order ${poNum} — ${items.length} items`);
    const body = encodeURIComponent(buildMessage(supplier, items));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setSentSuppliers(prev => new Set(prev).add(supplier));
    toast.success(`PO email opened for ${supplier}`);
  };

  const handleCopy = (supplier: string, items: ReorderEntry[]) => {
    navigator.clipboard.writeText(buildMessage(supplier, items));
    setSentSuppliers(prev => new Set(prev).add(supplier));
    toast.success("Purchase order copied to clipboard");
  };

  const handleDownloadPDF = (supplier: string) => {
    setPrintingSupplier(supplier);
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Purchase Order - ${getPoNumber(supplier)}</title>
            <style>@media print { body { margin: 0; } @page { size: A4; margin: 0; } }</style>
            </head><body>${printRef.current.innerHTML}</body></html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
        }
      }
      setPrintingSupplier(null);
    }, 100);
  };

  const handleClearAll = () => {
    onClear();
    setSentSuppliers(new Set());
    setPoMeta({});
    setActiveSupplier(null);
    setOpen(false);
  };

  return (
    <>
      {/* Floating PO Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-lg hover:opacity-90 transition-all animate-in slide-in-from-bottom-4 duration-300"
      >
        <ClipboardList className="h-5 w-5" />
        <span className="text-sm font-semibold">Draft PO</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
          {totalItems}
        </span>
      </button>

      {/* PO Builder Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0 border-border bg-card" side="right">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-card-foreground">Purchase Orders</SheetTitle>
                  <p className="text-xs text-muted-foreground">{totalItems} item(s) · {supplierList.length} supplier(s)</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground text-xs">
                Discard All
              </Button>
            </div>
          </SheetHeader>

          <div className="p-4 space-y-4">
            {supplierList.map(supplier => {
              const items = grouped[supplier];
              const isActive = activeSupplier === supplier;
              const isSent = sentSuppliers.has(supplier);
              const meta = getMeta(supplier);
              const poNumber = getPoNumber(supplier);
              const total = getSupplierTotal(items);

              return (
                <div key={supplier} className="rounded-xl border border-border overflow-hidden">
                  {/* Supplier Header — clickable accordion */}
                  <button
                    onClick={() => setActiveSupplier(isActive ? null : supplier)}
                    className="w-full flex items-center justify-between bg-secondary/40 px-4 py-3 border-b border-border hover:bg-secondary/60 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold text-card-foreground">{supplier}</p>
                        <p className="text-[11px] text-muted-foreground">{poNumber} · {items.length} item(s) · ₹{total.toFixed(0)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isSent && (
                        <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/30 gap-1 text-[10px]">
                          <Check className="h-3 w-3" /> Sent
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {isActive ? "Collapse" : "Review"}
                      </Badge>
                    </div>
                  </button>

                  {isActive && (
                    <div className="divide-y divide-border/50">
                      {/* PO Meta Fields */}
                      <div className="p-4 grid grid-cols-2 gap-3 bg-background/50">
                        <div className="space-y-1">
                          <Label className="text-[11px]">Expected Delivery</Label>
                          <Input
                            type="date"
                            value={meta.deliveryDate}
                            onChange={e => updateMeta(supplier, "deliveryDate", e.target.value)}
                            className="h-8 text-xs bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[11px]">Payment Terms</Label>
                          <Select value={meta.paymentTerms || "30 Days"} onValueChange={v => updateMeta(supplier, "paymentTerms", v)}>
                            <SelectTrigger className="h-8 text-xs bg-background"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {paymentTermOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[11px]">Remarks</Label>
                          <Textarea
                            placeholder="e.g. Urgent, check batch freshness..."
                            value={meta.remarks}
                            onChange={e => updateMeta(supplier, "remarks", e.target.value)}
                            className="text-xs bg-background min-h-[52px] resize-none"
                            rows={2}
                          />
                        </div>
                      </div>

                      {/* Line Items */}
                      {items.map(entry => {
                        const rate = entry.item.purchasePrice || entry.item.mrp;
                        const lineTotal = rate * entry.qty;
                        return (
                          <div key={entry.item.name} className="flex items-center gap-3 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-card-foreground truncate">{entry.item.name}</p>
                              <p className="text-[11px] text-muted-foreground">
                                Batch {entry.item.batch} · Exp {entry.item.expiry} · ₹{rate}/unit · Stock: {entry.item.stock}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => onUpdateQty(entry.item.name, Math.max(1, entry.qty - 10))}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-secondary transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <Input
                                type="number"
                                min={1}
                                value={entry.qty}
                                onChange={e => onUpdateQty(entry.item.name, Math.max(1, parseInt(e.target.value) || 1))}
                                className="h-7 w-14 text-center text-xs bg-background px-1"
                              />
                              <button
                                onClick={() => onUpdateQty(entry.item.name, entry.qty + 10)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-border hover:bg-secondary transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                            <p className="text-xs font-semibold text-card-foreground w-16 text-right">₹{lineTotal.toFixed(0)}</p>
                            <button onClick={() => onRemove(entry.item.name)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          </div>
                        );
                      })}

                      {/* Total */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/30">
                        <p className="text-xs text-muted-foreground">PO Total (incl. GST)</p>
                        <p className="text-sm font-bold text-card-foreground">₹{total.toFixed(2)}</p>
                      </div>

                      {/* Actions */}
                      <div className="p-3 bg-secondary/20 space-y-2">
                        {/* Primary: Download PDF */}
                        <Button
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => handleDownloadPDF(supplier)}
                        >
                          <Download className="h-4 w-4" /> Download Purchase Order (PDF)
                        </Button>

                        {/* Secondary: Share */}
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => handleWhatsApp(supplier, items)}>
                            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-xs" onClick={() => handleEmail(supplier, items)}>
                            <Mail className="h-3.5 w-3.5" /> Email
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleCopy(supplier, items)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Hidden printable PO */}
      {printingSupplier && (
        <div className="fixed -left-[9999px] top-0">
          <PrintablePurchaseOrder
            ref={printRef}
            poNumber={getPoNumber(printingSupplier)}
            poDate={getPoDate()}
            supplier={printingSupplier}
            items={grouped[printingSupplier] || []}
            deliveryDate={getMeta(printingSupplier).deliveryDate}
            paymentTerms={getMeta(printingSupplier).paymentTerms}
            remarks={getMeta(printingSupplier).remarks}
            pharmacyName="MedPlus Pharmacy"
            pharmacyAddress="123 Health Street, Chennai - 600001"
            pharmacyPhone="+91 98765 43210"
            pharmacyGSTIN="33AABCT1234F1ZH"
          />
        </div>
      )}
    </>
  );
};

export default PurchaseOrderBuilder;
