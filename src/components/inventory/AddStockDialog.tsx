import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { X, Package, Save, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inventoryApi } from "@/lib/api/endpoints";
import { parseApiError } from "@/lib/api/errors";
import { qk } from "@/hooks/api/useApi";

interface AddStockDialogProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { value: "medicine", label: "Medicine" },
  { value: "surgical", label: "Surgical / Medical Devices" },
  { value: "nutrition", label: "Nutrition / Supplements" },
  { value: "baby", label: "Baby Care" },
  { value: "hygiene", label: "Personal Care / Hygiene" },
  { value: "fmcg", label: "General FMCG" },
];

const schedules = ["OTC", "H", "H1", "X"];

const categoryFields: Record<string, { label: string; placeholder: string; field: string; type?: string }[]> = {
  medicine: [
    { label: "Composition / Salt", placeholder: "e.g. Paracetamol 500mg", field: "composition" },
    { label: "Dosage Form", placeholder: "e.g. Tablet, Syrup, Injection, Drops", field: "dosageForm" },
    { label: "Pack Size", placeholder: "e.g. 10 tabs, 100ml", field: "packSize" },
    { label: "Schedule", placeholder: "", field: "schedule" },
    { label: "Storage Condition", placeholder: "e.g. Below 25°C, Refrigerate", field: "storage" },
    { label: "Route", placeholder: "e.g. Oral, Topical, IM/IV", field: "route" },
  ],
  surgical: [
    { label: "Product Type", placeholder: "e.g. Cotton Roll, Bandage, Gloves, Syringe", field: "productType" },
    { label: "Size / Dimension", placeholder: "e.g. Large, 6x6 inch, 5ml", field: "size" },
    { label: "Material", placeholder: "e.g. Absorbent Cotton, Latex", field: "material" },
    { label: "Sterile", placeholder: "Yes / No", field: "sterile" },
    { label: "Pack Count", placeholder: "e.g. 100 pcs", field: "packSize" },
  ],
  nutrition: [
    { label: "Product Type", placeholder: "e.g. Protein Powder, Multivitamin, Health Drink", field: "productType" },
    { label: "Flavour", placeholder: "e.g. Chocolate, Vanilla", field: "flavour" },
    { label: "Weight / Volume", placeholder: "e.g. 400gm, 200ml", field: "size" },
    { label: "Pack Size", placeholder: "e.g. 60 capsules, 1kg", field: "packSize" },
  ],
  baby: [
    { label: "Product Type", placeholder: "e.g. Gripe Water, Diaper, Baby Oil, Cerelac", field: "productType" },
    { label: "Size / Variant", placeholder: "e.g. 150ml, Small (S), Stage 1", field: "size" },
    { label: "Age Group", placeholder: "e.g. 0-6 months, 1-2 years", field: "ageGroup" },
    { label: "Pack Count", placeholder: "e.g. 30 diapers", field: "packSize" },
  ],
  hygiene: [
    { label: "Product Type", placeholder: "e.g. Sanitary Pad, Hand Wash, Shampoo", field: "productType" },
    { label: "Size / Variant", placeholder: "e.g. XL, 200ml, 100gm", field: "size" },
    { label: "Pack Count", placeholder: "e.g. 8 pads, 3 pack", field: "packSize" },
  ],
  fmcg: [
    { label: "Product Type", placeholder: "e.g. Biscuit, Juice, Snack, Detergent", field: "productType" },
    { label: "Brand", placeholder: "e.g. Parle, Surf Excel", field: "brand" },
    { label: "Size / Weight", placeholder: "e.g. 200gm, 1L, 500ml", field: "size" },
    { label: "Pack Count", placeholder: "e.g. 12 units", field: "packSize" },
  ],
};

const suppliers = ["Cipla Ltd", "Sun Pharma", "Micro Labs", "Alkem", "GSK", "Dr. Reddy's", "USV", "Mankind", "Himalaya", "Dabur"];

const initialForm = () => ({
  itemName: "",
  supplier: "",
  batchNumber: "",
  expiryDate: "",
  quantity: "",
  purchasePrice: "",
  mrp: "",
  rackLocation: "",
  gstRate: "12",
  invoiceNumber: "",
  manufacturer: "",
});

const AddStockDialog = ({ open, onClose }: AddStockDialogProps) => {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState(initialForm);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));
  const updateExtra = (field: string, value: string) => setExtraFields(prev => ({ ...prev, [field]: value }));

  const margin = formData.purchasePrice && formData.mrp
    ? (((parseFloat(formData.mrp) - parseFloat(formData.purchasePrice)) / parseFloat(formData.mrp)) * 100).toFixed(1)
    : null;

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

  const fields = category ? (categoryFields[category] || []) : [];

  const addMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) => inventoryApi.addStock(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: qk.inventorySummary });
    },
  });

  const buildPayload = (): Record<string, unknown> => ({
    itemName: formData.itemName.trim(),
    manufacturer: formData.manufacturer.trim(),
    category: category || undefined,
    supplierName: formData.supplier.trim(),
    batchNo: formData.batchNumber.trim(),
    expiryDate: formData.expiryDate,
    mrp: parseFloat(formData.mrp),
    purchaseRate: parseFloat(formData.purchasePrice),
    gstRate: parseFloat(formData.gstRate) || 12,
    rack: formData.rackLocation.trim() || undefined,
    qty: parseInt(formData.quantity, 10),
    invoiceNumber: formData.invoiceNumber.trim() || undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier.trim()) {
      toast.error("Please select a supplier");
      return;
    }
    const payload = buildPayload();
    if (!Number.isFinite(payload.mrp as number) || (payload.mrp as number) <= 0) {
      toast.error("Enter a valid MRP");
      return;
    }
    if (!Number.isFinite(payload.qty as number) || (payload.qty as number) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    addMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Stock added");
        onClose();
        setFormData(initialForm());
        setExtraFields({});
        setCategory("");
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
      },
    });
  };

  const handleSaveAndAddAnother = () => {
    if (!formData.supplier.trim()) {
      toast.error("Please select a supplier");
      return;
    }
    const payload = buildPayload();
    if (!Number.isFinite(payload.mrp as number) || (payload.mrp as number) <= 0) {
      toast.error("Enter a valid MRP");
      return;
    }
    if (!Number.isFinite(payload.qty as number) || (payload.qty as number) <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    addMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Stock added");
        queryClient.invalidateQueries({ queryKey: ["inventory"] });
        queryClient.invalidateQueries({ queryKey: qk.inventorySummary });
        setFormData((prev) => ({
          ...initialForm(),
          itemName: prev.itemName,
          supplier: prev.supplier,
          manufacturer: prev.manufacturer,
          gstRate: prev.gstRate,
        }));
        setExtraFields({});
      },
      onError: (err) => {
        toast.error(parseApiError(err).message);
      },
    });
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    setExtraFields({});
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
              <p className="text-xs text-muted-foreground">Select category, then fill batch and pricing details</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Category Selector — first priority */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-card-foreground">Product Category</p>
            <Select value={category} onValueChange={handleCategoryChange}>
              <SelectTrigger className="bg-background"><SelectValue placeholder="Select category first…" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {category && (
            <>
              {/* Item & Supplier */}
              <div className="space-y-1.5 pt-1">
                <p className="text-sm font-semibold text-card-foreground">Item Details</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Item Name *</Label>
                  <Input placeholder="e.g. Dolo 650mg" value={formData.itemName} onChange={e => update("itemName", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label>Manufacturer *</Label>
                  <Input placeholder="e.g. Micro Labs" value={formData.manufacturer} onChange={e => update("manufacturer", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Supplier *</Label>
                  <Select value={formData.supplier} onValueChange={v => update("supplier", v)}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Category-specific fields */}
              {fields.length > 0 && (
                <>
                  <div className="space-y-1.5 pt-2">
                    <p className="text-sm font-semibold text-card-foreground">
                      {categories.find(c => c.value === category)?.label} Details
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {fields.map(f => (
                      f.field === "schedule" ? (
                        <div key={f.field} className="space-y-1.5">
                          <Label>Schedule</Label>
                          <Select value={extraFields.schedule || ""} onValueChange={v => updateExtra("schedule", v)}>
                            <SelectTrigger className="bg-background"><SelectValue placeholder="Select schedule" /></SelectTrigger>
                            <SelectContent>{schedules.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div key={f.field} className="space-y-1.5">
                          <Label>{f.label}</Label>
                          <Input
                            type={f.type || "text"}
                            placeholder={f.placeholder}
                            value={extraFields[f.field] || ""}
                            onChange={e => updateExtra(f.field, e.target.value)}
                            className="bg-background"
                          />
                        </div>
                      )
                    ))}
                  </div>
                </>
              )}

              {/* Batch Details */}
              <div className="space-y-1.5 pt-2">
                <p className="text-sm font-semibold text-card-foreground">Batch & Stock</p>
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

              {expiryWarning && (
                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium ${
                  expiryWarning.level === "expired" || expiryWarning.level === "danger" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"
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
                <Button
                  type="button"
                  variant="ghost"
                  className="text-muted-foreground"
                  disabled={addMutation.isPending}
                  onClick={handleSaveAndAddAnother}
                >
                  Save & Add Another
                </Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onClose} disabled={addMutation.isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gap-2" disabled={addMutation.isPending}>
                    <Save className="h-4 w-4" /> Add Stock
                  </Button>
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStockDialog;
