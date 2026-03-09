import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin, Package, ClipboardList, Calendar, Building2, Hash, Pill, TrendingDown } from "lucide-react";

export interface InventoryItem {
  name: string;
  mfr: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  stock: number;
  sgst: number;
  cgst: number;
  rack: string;
  status: string;
  purchasePrice?: number;
  supplier?: string;
}

interface ItemDetailSheetProps {
  item: InventoryItem | null;
  open: boolean;
  onClose: () => void;
  onAddToReorder: (item: InventoryItem) => void;
  isInReorder: boolean;
}

const getExpiryInfo = (expiry: string) => {
  const [mm, yyyy] = expiry.split("/").map(Number);
  const exp = new Date(yyyy, mm - 1);
  const now = new Date();
  const months = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
  if (months < 0) return { level: "expired", months: Math.abs(months), text: "Already Expired", color: "bg-destructive/10 text-destructive border-destructive/30" };
  if (months <= 3) return { level: "critical", months, text: `Expires in ${months} month(s)`, color: "bg-destructive/10 text-destructive border-destructive/30" };
  if (months <= 6) return { level: "warning", months, text: `Expires in ${months} months`, color: "bg-warning/10 text-warning border-warning/30" };
  return { level: "safe", months, text: `Expires in ${months} months`, color: "bg-chart-2/10 text-chart-2 border-chart-2/30" };
};

const statusConfig: Record<string, { label: string; class: string }> = {
  safe: { label: "In Stock", class: "bg-chart-2/10 text-chart-2 border-chart-2/30" },
  expiring: { label: "Expiring Soon", class: "bg-warning/10 text-warning border-warning/30" },
  low: { label: "Low Stock", class: "bg-destructive/10 text-destructive border-destructive/30" },
  expired: { label: "Expired", class: "bg-destructive text-destructive-foreground border-destructive" },
};

const ItemDetailSheet = ({ item, open, onClose, onAddToReorder, isInReorder }: ItemDetailSheetProps) => {
  if (!item) return null;

  const expiryInfo = getExpiryInfo(item.expiry);
  const needsReorder = item.status === "low" || item.status === "expiring" || expiryInfo.level !== "safe";
  const estimatedValue = item.mrp * item.stock;
  const margin = item.purchasePrice
    ? (((item.mrp - item.purchasePrice) / item.mrp) * 100).toFixed(1)
    : null;

  return (
    <Sheet open={open} onOpenChange={v => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 border-border bg-card">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold text-card-foreground leading-tight">{item.name}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-0.5">{item.mfr}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge variant="outline" className={statusConfig[item.status]?.class}>
              {statusConfig[item.status]?.label}
            </Badge>
            <Badge variant="outline" className={expiryInfo.color}>
              {expiryInfo.text}
            </Badge>
          </div>
        </SheetHeader>

        <div className="p-6 space-y-5">
          {/* Urgency Banner */}
          {needsReorder && (
            <div className={`rounded-xl border p-4 space-y-3 ${
              expiryInfo.level === "expired" || expiryInfo.level === "critical"
                ? "bg-destructive/5 border-destructive/20"
                : item.status === "low"
                ? "bg-destructive/5 border-destructive/20"
                : "bg-warning/5 border-warning/20"
            }`}>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className={`h-5 w-5 mt-0.5 shrink-0 ${
                  expiryInfo.level === "expired" || expiryInfo.level === "critical" || item.status === "low"
                    ? "text-destructive" : "text-warning"
                }`} />
                <div>
                  <p className="text-sm font-semibold text-card-foreground">
                    {item.status === "low" && expiryInfo.level !== "safe"
                      ? "Low Stock & Expiring Soon"
                      : item.status === "low"
                      ? "Stock Running Low"
                      : expiryInfo.level === "expired"
                      ? "Batch Has Expired — Remove from shelf"
                      : "Expiring Soon — Plan Replacement"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.status === "low"
                      ? `Only ${item.stock} units left. Raise a PO to avoid stockout.`
                      : expiryInfo.level === "expired"
                      ? `₹${estimatedValue.toLocaleString()} worth of expired stock. Remove & reorder.`
                      : `₹${estimatedValue.toLocaleString()} worth of stock may expire. Raise PO for fresh batch.`}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => onAddToReorder(item)}
                disabled={isInReorder}
                className="w-full gap-2"
                variant={isInReorder ? "outline" : "default"}
                size="sm"
              >
                <ClipboardList className="h-4 w-4" />
                {isInReorder ? "Added to Purchase Order" : "Add to Purchase Order"}
              </Button>
            </div>
          )}

          {/* Detail Grid */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock & Batch Info</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DetailCard icon={Package} label="Current Stock" value={`${item.stock} units`} highlight={item.stock < 10} />
            <DetailCard icon={Hash} label="Batch No." value={item.batch} />
            <DetailCard icon={Calendar} label="Expiry" value={item.expiry} highlight={expiryInfo.level !== "safe"} />
            <DetailCard icon={MapPin} label="Rack Location" value={item.rack} />
          </div>

          <div className="space-y-1 pt-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pricing & Tax</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DetailCard icon={TrendingDown} label="MRP" value={`₹${item.mrp}`} />
            {item.purchasePrice && (
              <DetailCard icon={TrendingDown} label="Purchase Price" value={`₹${item.purchasePrice}`} />
            )}
            <DetailCard label="HSN Code" value={item.hsn} />
            <DetailCard label="GST" value={`SGST ${item.sgst}% + CGST ${item.cgst}%`} />
            {margin && <DetailCard label="Margin" value={`${margin}%`} />}
            <DetailCard label="Stock Value" value={`₹${estimatedValue.toLocaleString()}`} />
          </div>

          {item.supplier && (
            <>
              <div className="space-y-1 pt-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Supplier</p>
              </div>
              <div className="grid grid-cols-1 gap-3">
                <DetailCard icon={Building2} label="Supplier" value={item.supplier} />
              </div>
            </>
          )}

          {/* Bottom action for safe items */}
          {!needsReorder && (
            <div className="pt-2">
              <Button
                onClick={() => onAddToReorder(item)}
                disabled={isInReorder}
                variant="outline"
                className="w-full gap-2"
                size="sm"
              >
                <ClipboardList className="h-4 w-4" />
                {isInReorder ? "Already in Draft PO" : "Add to Purchase Order"}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const DetailCard = ({ icon: Icon, label, value, highlight }: {
  icon?: React.ElementType; label: string; value: string; highlight?: boolean;
}) => (
  <div className="rounded-lg border border-border bg-background p-3 space-y-1">
    <div className="flex items-center gap-1.5">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
    <p className={`text-sm font-semibold ${highlight ? "text-destructive" : "text-card-foreground"}`}>{value}</p>
  </div>
);

export default ItemDetailSheet;
