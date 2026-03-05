import { useState } from "react";
import { X, Package, Save, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddStockDialogProps {
  open: boolean;
  onClose: () => void;
}

const medicines = [
  "Dolo 650mg", "Azithromycin 500mg", "Cetirizine 10mg", "Pantoprazole 40mg",
  "Amoxicillin 250mg", "Metformin 500mg", "Crocin Advance", "Omeprazole 20mg"
];

const suppliers = ["Cipla Ltd", "Sun Pharma", "Micro Labs", "Alkem", "GSK", "Dr. Reddy's", "USV"];

const AddStockDialog = ({ open, onClose }: AddStockDialogProps) => {
  const [formData, setFormData] = useState({
    medicine: "", supplier: "", batchNumber: "", expiryDate: "",
    quantity: "", purchasePrice: "", mrp: "", rackLocation: "", gstRate: "12",
    invoiceNumber: ""
  });

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  // Calculate margin for visual feedback
  const margin = formData.purchasePrice && formData.mrp
    ? (((parseFloat(formData.mrp) - parseFloat(formData.purchasePrice)) / parseFloat(formData.mrp)) * 100).toFixed(1)
    : null;

  // Expiry warning
  const expiryWarning = (() => {
    if (!formData.expiryDate) return null;
    const exp = new Date(formData.expiryDate);
    const now = new Date();
    const months = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
    if (months < 0) return { level: "expired", text: "This batch is already expired!" };
    if (months <= 3) return { level: "danger", text: `Expires in ${months} month(s) — consider not stocking` };
    if (months <= 6) return { level: "warning", text: `Expires in ${months} months — sell with FEFO priority` };
    return null;
  })();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <Package className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Add Stock Entry</h2>
              <p className="text-xs text-muted-foreground">Record new batch with purchase and expiry details</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Medicine & Supplier */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-card-foreground">Medicine & Source</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Medicine *</Label>
              <Select value={formData.medicine} onValueChange={v => update("medicine", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select medicine" /></SelectTrigger>
                <SelectContent>
                  {medicines.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Supplier *</Label>
              <Select value={formData.supplier} onValueChange={v => update("supplier", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Batch Details */}
          <div className="space-y-1.5 pt-2">
            <p className="text-sm font-semibold text-card-foreground">Batch Details</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="batchNumber">Batch No. *</Label>
              <Input id="batchNumber" placeholder="e.g. B102" value={formData.batchNumber} onChange={e => update("batchNumber", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiryDate">Expiry Date *</Label>
              <Input id="expiryDate" type="month" value={formData.expiryDate} onChange={e => update("expiryDate", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input id="quantity" type="number" min="1" placeholder="0" value={formData.quantity} onChange={e => update("quantity", e.target.value)} required className="bg-background" />
            </div>
          </div>

          {/* Expiry Warning — real-time safety feedback */}
          {expiryWarning && (
            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
              expiryWarning.level === "expired" ? "bg-destructive/10 text-destructive" :
              expiryWarning.level === "danger" ? "bg-destructive/10 text-destructive" :
              "bg-warning/10 text-warning"
            }`}>
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {expiryWarning.text}
            </div>
          )}

          {/* Pricing */}
          <div className="space-y-1.5 pt-2">
            <p className="text-sm font-semibold text-card-foreground">Pricing & Location</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchasePrice">Purchase Price (₹) *</Label>
              <Input id="purchasePrice" type="number" min="0" step="0.01" placeholder="0.00" value={formData.purchasePrice} onChange={e => update("purchasePrice", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mrp">MRP (₹) *</Label>
              <Input id="mrp" type="number" min="0" step="0.01" placeholder="0.00" value={formData.mrp} onChange={e => update("mrp", e.target.value)} required className="bg-background" />
            </div>
          </div>

          {/* Margin indicator — instant feedback for business decisions */}
          {margin !== null && (
            <div className={`rounded-lg px-4 py-2.5 text-sm font-medium ${
              parseFloat(margin) >= 20 ? "bg-success/10 text-success" :
              parseFloat(margin) >= 10 ? "bg-warning/10 text-warning" :
              "bg-destructive/10 text-destructive"
            }`}>
              Profit Margin: {margin}% {parseFloat(margin) < 10 ? "— Low margin, verify pricing" : ""}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>GST Rate</Label>
              <Select value={formData.gstRate} onValueChange={v => update("gstRate", v)}>
                <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["0", "5", "12", "18", "28"].map(g => <SelectItem key={g} value={g}>{g}%</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rackLocation">Rack Location</Label>
              <Input id="rackLocation" placeholder="e.g. A1-03" value={formData.rackLocation} onChange={e => update("rackLocation", e.target.value)} className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="invoiceNumber">Invoice No.</Label>
              <Input id="invoiceNumber" placeholder="e.g. INV-2026-001" value={formData.invoiceNumber} onChange={e => update("invoiceNumber", e.target.value)} className="bg-background" />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t border-border">
            <Button type="button" variant="ghost" className="text-muted-foreground">Save & Add Another</Button>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit" className="gap-2">
                <Save className="h-4 w-4" /> Add Stock
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddStockDialog;
