import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, X, Send, MessageCircle, Mail, Copy, Check, Minus, Plus, Building2 } from "lucide-react";
import type { InventoryItem } from "./ItemDetailSheet";
import { toast } from "sonner";

export interface ReorderEntry {
  item: InventoryItem;
  qty: number;
}

interface ReorderCartProps {
  entries: ReorderEntry[];
  onUpdateQty: (itemName: string, qty: number) => void;
  onRemove: (itemName: string) => void;
  onClear: () => void;
}

const ReorderCart = ({ entries, onUpdateQty, onRemove, onClear }: ReorderCartProps) => {
  const [open, setOpen] = useState(false);
  const [sentSuppliers, setSentSuppliers] = useState<Set<string>>(new Set());

  if (entries.length === 0) return null;

  // Group by supplier
  const grouped: Record<string, ReorderEntry[]> = {};
  entries.forEach(e => {
    const supplier = e.item.supplier || e.item.mfr;
    if (!grouped[supplier]) grouped[supplier] = [];
    grouped[supplier].push(e);
  });

  const totalItems = entries.length;

  const buildMessage = (supplier: string, items: ReorderEntry[]) => {
    const lines = items.map(e => `• ${e.item.name} (Batch: ${e.item.batch}) — Qty: ${e.qty}`);
    return `Dear ${supplier},\n\nPlease arrange the following items:\n\n${lines.join("\n")}\n\nThank you.`;
  };

  const handleWhatsApp = (supplier: string, items: ReorderEntry[]) => {
    const msg = encodeURIComponent(buildMessage(supplier, items));
    window.open(`https://wa.me/?text=${msg}`, "_blank");
    setSentSuppliers(prev => new Set(prev).add(supplier));
    toast.success(`WhatsApp opened for ${supplier}`);
  };

  const handleEmail = (supplier: string, items: ReorderEntry[]) => {
    const subject = encodeURIComponent(`Reorder Request — ${items.length} items`);
    const body = encodeURIComponent(buildMessage(supplier, items));
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setSentSuppliers(prev => new Set(prev).add(supplier));
    toast.success(`Email opened for ${supplier}`);
  };

  const handleCopy = (supplier: string, items: ReorderEntry[]) => {
    navigator.clipboard.writeText(buildMessage(supplier, items));
    setSentSuppliers(prev => new Set(prev).add(supplier));
    toast.success("Order copied to clipboard");
  };

  const handleClearAll = () => {
    onClear();
    setSentSuppliers(new Set());
    setOpen(false);
  };

  return (
    <>
      {/* Floating Cart Button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full bg-primary px-5 py-3.5 text-primary-foreground shadow-lg hover:opacity-90 transition-all animate-in slide-in-from-bottom-4 duration-300"
      >
        <ShoppingCart className="h-5 w-5" />
        <span className="text-sm font-semibold">Reorder</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs font-bold">
          {totalItems}
        </span>
      </button>

      {/* Cart Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0 border-border bg-card">
          <SheetHeader className="p-6 pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-card-foreground">Reorder List</SheetTitle>
                  <p className="text-xs text-muted-foreground">{totalItems} item(s) from {Object.keys(grouped).length} supplier(s)</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-muted-foreground text-xs">
                Clear All
              </Button>
            </div>
          </SheetHeader>

          <div className="p-6 space-y-6">
            {Object.entries(grouped).map(([supplier, items]) => {
              const isSent = sentSuppliers.has(supplier);
              return (
                <div key={supplier} className="rounded-xl border border-border overflow-hidden">
                  {/* Supplier Header */}
                  <div className="flex items-center justify-between bg-secondary/50 px-4 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-semibold text-card-foreground">{supplier}</p>
                      <Badge variant="outline" className="text-[10px]">{items.length} items</Badge>
                    </div>
                    {isSent && (
                      <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/30 gap-1">
                        <Check className="h-3 w-3" /> Sent
                      </Badge>
                    )}
                  </div>

                  {/* Items */}
                  <div className="divide-y divide-border/50">
                    {items.map(entry => (
                      <div key={entry.item.name} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{entry.item.name}</p>
                          <p className="text-[11px] text-muted-foreground">Batch {entry.item.batch} · Exp {entry.item.expiry} · Stock: {entry.item.stock}</p>
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
                        <button onClick={() => onRemove(entry.item.name)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors">
                          <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Send Actions */}
                  <div className="flex gap-2 p-3 bg-secondary/30 border-t border-border">
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
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default ReorderCart;
