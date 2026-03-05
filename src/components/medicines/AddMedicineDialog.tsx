import { useState } from "react";
import { X, Pill, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AddMedicineDialogProps {
  open: boolean;
  onClose: () => void;
}

const schedules = ["OTC", "H", "H1", "X", "G"];
const categories = [
  "Analgesic", "Antibiotic", "Antihistamine", "Antacid", "Antidiabetic",
  "Antihypertensive", "Antifungal", "Vitamin", "Antiseptic", "Other"
];
const dosageForms = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler", "Powder", "Ointment"];

const AddMedicineDialog = ({ open, onClose }: AddMedicineDialogProps) => {
  const [formData, setFormData] = useState({
    brandName: "", genericName: "", manufacturer: "", category: "",
    schedule: "", dosageForm: "", packSize: "", mrp: "", barcode: "", description: ""
  });

  const update = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to database
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Pill className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Add New Medicine</h2>
              <p className="text-xs text-muted-foreground">Fill in medicine details for the master database</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Primary Info — most important fields first (progressive disclosure) */}
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-card-foreground">Basic Information</p>
            <p className="text-xs text-muted-foreground">Required fields to identify the medicine</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Brand Name *</Label>
              <Input id="brandName" placeholder="e.g. Dolo 650" value={formData.brandName} onChange={e => update("brandName", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="genericName">Generic Name *</Label>
              <Input id="genericName" placeholder="e.g. Paracetamol" value={formData.genericName} onChange={e => update("genericName", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input id="manufacturer" placeholder="e.g. Micro Labs" value={formData.manufacturer} onChange={e => update("manufacturer", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={v => update("category", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Classification & Packaging */}
          <div className="space-y-1.5 pt-2">
            <p className="text-sm font-semibold text-card-foreground">Classification & Packaging</p>
            <p className="text-xs text-muted-foreground">Drug schedule, form and pricing</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Drug Schedule *</Label>
              <Select value={formData.schedule} onValueChange={v => update("schedule", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Schedule" /></SelectTrigger>
                <SelectContent>
                  {schedules.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dosage Form *</Label>
              <Select value={formData.dosageForm} onValueChange={v => update("dosageForm", v)}>
                <SelectTrigger className="bg-background"><SelectValue placeholder="Form" /></SelectTrigger>
                <SelectContent>
                  {dosageForms.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="packSize">Pack Size *</Label>
              <Input id="packSize" placeholder="e.g. 10 tablets" value={formData.packSize} onChange={e => update("packSize", e.target.value)} required className="bg-background" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mrp">MRP (₹) *</Label>
              <Input id="mrp" type="number" min="0" step="0.01" placeholder="0.00" value={formData.mrp} onChange={e => update("mrp", e.target.value)} required className="bg-background" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" placeholder="Scan or enter barcode" value={formData.barcode} onChange={e => update("barcode", e.target.value)} className="bg-background" />
            </div>
          </div>

          {/* Optional */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" placeholder="Usage notes, storage instructions..." value={formData.description} onChange={e => update("description", e.target.value)} className="bg-background min-h-[72px]" />
          </div>

          {/* Actions — primary action on the right (Fitts's Law) */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" className="gap-2">
              <Save className="h-4 w-4" /> Save Medicine
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMedicineDialog;
