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

const categories = [
  { value: "tablet", label: "Tablet / Capsule" },
  { value: "syrup", label: "Syrup / Liquid" },
  { value: "injection", label: "Injection" },
  { value: "ointment", label: "Ointment / Cream / Gel" },
  { value: "drops", label: "Drops (Eye/Ear/Nasal)" },
  { value: "inhaler", label: "Inhaler" },
  { value: "surgical", label: "Surgical / Medical Devices" },
  { value: "hygiene", label: "Hygiene & Personal Care" },
  { value: "otc", label: "OTC / General Products" },
  { value: "baby", label: "Baby Care" },
  { value: "nutrition", label: "Nutrition / Supplements" },
];

const schedules = ["OTC", "H", "H1", "X"];

// Category-specific fields config
const categoryFields: Record<string, { label: string; placeholder: string; field: string; type?: string }[]> = {
  tablet: [
    { label: "Composition / Salt", placeholder: "e.g. Paracetamol 500mg", field: "composition" },
    { label: "Dosage Form", placeholder: "Tablet / Capsule / Strip", field: "dosageForm" },
    { label: "Pack Size (units per strip)", placeholder: "e.g. 10", field: "packSize", type: "number" },
    { label: "Schedule", placeholder: "", field: "schedule" },
    { label: "Storage Condition", placeholder: "e.g. Below 25°C", field: "storage" },
  ],
  syrup: [
    { label: "Composition / Salt", placeholder: "e.g. Ambroxol HCl 30mg/5ml", field: "composition" },
    { label: "Volume (ml)", placeholder: "e.g. 100", field: "volume", type: "number" },
    { label: "Flavour", placeholder: "e.g. Orange", field: "flavour" },
    { label: "Schedule", placeholder: "", field: "schedule" },
    { label: "Storage Condition", placeholder: "e.g. Store in cool place", field: "storage" },
  ],
  injection: [
    { label: "Composition / Salt", placeholder: "e.g. Diclofenac Sodium 75mg", field: "composition" },
    { label: "Volume (ml)", placeholder: "e.g. 2", field: "volume", type: "number" },
    { label: "Route", placeholder: "IM / IV / SC", field: "route" },
    { label: "Schedule", placeholder: "", field: "schedule" },
    { label: "Cold Chain Required", placeholder: "Yes / No", field: "coldChain" },
  ],
  ointment: [
    { label: "Composition", placeholder: "e.g. Betamethasone 0.05%", field: "composition" },
    { label: "Form", placeholder: "Ointment / Cream / Gel", field: "dosageForm" },
    { label: "Weight (gm)", placeholder: "e.g. 15", field: "weight", type: "number" },
    { label: "Schedule", placeholder: "", field: "schedule" },
  ],
  drops: [
    { label: "Composition", placeholder: "e.g. Ofloxacin 0.3%", field: "composition" },
    { label: "Type", placeholder: "Eye / Ear / Nasal", field: "dosageForm" },
    { label: "Volume (ml)", placeholder: "e.g. 10", field: "volume", type: "number" },
    { label: "Schedule", placeholder: "", field: "schedule" },
  ],
  inhaler: [
    { label: "Composition", placeholder: "e.g. Salbutamol 100mcg", field: "composition" },
    { label: "Type", placeholder: "MDI / DPI / Nebulizer", field: "dosageForm" },
    { label: "Doses per unit", placeholder: "e.g. 200", field: "packSize", type: "number" },
    { label: "Schedule", placeholder: "", field: "schedule" },
  ],
  surgical: [
    { label: "Product Type", placeholder: "e.g. Cotton Roll, Bandage, Gloves", field: "productType" },
    { label: "Size", placeholder: "e.g. 500gm, Large, 6x6 inch", field: "size" },
    { label: "Material", placeholder: "e.g. Absorbent Cotton", field: "material" },
    { label: "Sterile", placeholder: "Yes / No", field: "sterile" },
  ],
  hygiene: [
    { label: "Product Type", placeholder: "e.g. Sanitary Pad, Hand Sanitizer", field: "productType" },
    { label: "Size / Variant", placeholder: "e.g. XL, 200ml", field: "size" },
    { label: "Pack Count", placeholder: "e.g. 8 pads", field: "packSize", type: "number" },
  ],
  otc: [
    { label: "Product Type", placeholder: "e.g. Pain Balm, Cough Drop", field: "productType" },
    { label: "Size / Weight", placeholder: "e.g. 50gm, 20 lozenges", field: "size" },
  ],
  baby: [
    { label: "Product Type", placeholder: "e.g. Gripe Water, Diaper, Baby Oil", field: "productType" },
    { label: "Size / Variant", placeholder: "e.g. 150ml, Small (S)", field: "size" },
    { label: "Age Group", placeholder: "e.g. 0-6 months", field: "ageGroup" },
  ],
  nutrition: [
    { label: "Product Type", placeholder: "e.g. Protein Powder, Multivitamin", field: "productType" },
    { label: "Flavour", placeholder: "e.g. Chocolate", field: "flavour" },
    { label: "Weight / Volume", placeholder: "e.g. 400gm, 200ml", field: "size" },
    { label: "Veg / Non-Veg", placeholder: "", field: "vegStatus" },
  ],
};

const suppliers = ["Cipla Ltd", "Sun Pharma", "Micro Labs", "Alkem", "GSK", "Dr. Reddy's", "USV", "Mankind", "Himalaya", "Dabur"];

const AddStockDialog = ({ open, onClose }: AddStockDialogProps) => {
  const [category, setCategory] = useState("");
  const [formData, setFormData] = useState({
    itemName: "", supplier: "", batchNumber: "", expiryDate: "",
    quantity: "", purchasePrice: "", mrp: "", rackLocation: "", gstRate: "12",
    invoiceNumber: "", manufacturer: "",
  });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
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
                <Button type="button" variant="ghost" className="text-muted-foreground">Save & Add Another</Button>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                  <Button type="submit" className="gap-2">
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
