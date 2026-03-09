import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddMedicineDialog from "@/components/medicines/AddMedicineDialog";

const medicines = [
  { name: "Dolo 650mg", generic: "Paracetamol", mfr: "Micro Labs", batch: "B102", expiry: "08/2026", hsn: "3004", mrp: 30, stock: 250, sgst: 6, cgst: 6, schedule: "OTC", category: "Analgesic" },
  { name: "Azithromycin 500mg", generic: "Azithromycin", mfr: "Cipla", batch: "A45", expiry: "12/2026", hsn: "3004", mrp: 100, stock: 45, sgst: 6, cgst: 6, schedule: "H", category: "Antibiotic" },
  { name: "Cetirizine 10mg", generic: "Cetirizine", mfr: "Sun Pharma", batch: "C78", expiry: "03/2027", hsn: "3004", mrp: 30, stock: 180, sgst: 6, cgst: 6, schedule: "OTC", category: "Antihistamine" },
  { name: "Pantoprazole 40mg", generic: "Pantoprazole", mfr: "Alkem", batch: "P12", expiry: "06/2026", hsn: "3004", mrp: 60, stock: 92, sgst: 6, cgst: 6, schedule: "H", category: "Antacid" },
  { name: "Amoxicillin 250mg", generic: "Amoxicillin", mfr: "GSK", batch: "AM33", expiry: "05/2026", hsn: "3004", mrp: 50, stock: 8, sgst: 6, cgst: 6, schedule: "H1", category: "Antibiotic" },
  { name: "Metformin 500mg", generic: "Metformin", mfr: "USV", batch: "M90", expiry: "11/2026", hsn: "3004", mrp: 25, stock: 300, sgst: 2.5, cgst: 2.5, schedule: "H", category: "Antidiabetic" },
  { name: "Crocin Advance", generic: "Paracetamol", mfr: "GSK", batch: "CR55", expiry: "09/2026", hsn: "3004", mrp: 28, stock: 150, sgst: 6, cgst: 6, schedule: "OTC", category: "Analgesic" },
  { name: "Omeprazole 20mg", generic: "Omeprazole", mfr: "Dr. Reddy's", batch: "OM21", expiry: "07/2026", hsn: "3004", mrp: 45, stock: 67, sgst: 6, cgst: 6, schedule: "H", category: "Antacid" },
];

const MedicinesPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Medicine Master</h1>
          <p className="text-sm text-muted-foreground">Manage your medicine database</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Add Medicine
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search medicines..." className="pl-10 bg-card border-border" />
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm hover:bg-secondary transition-colors">
          <Filter className="h-4 w-4" /> Filter
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3 text-left">S.No</th>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Generic</th>
              <th className="px-4 py-3 text-left">MFR</th>
              <th className="px-4 py-3 text-left">Batch</th>
              <th className="px-4 py-3 text-left">Expiry</th>
              <th className="px-4 py-3 text-left">HSN</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3 text-right">SGST%</th>
              <th className="px-4 py-3 text-right">CGST%</th>
              <th className="px-4 py-3 text-center">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-card-foreground">{med.name}</p>
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">{med.category}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{med.generic}</td>
                <td className="px-4 py-3 text-muted-foreground">{med.mfr}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{med.batch}</td>
                <td className="px-4 py-3 text-muted-foreground">{med.expiry}</td>
                <td className="px-4 py-3 font-mono text-muted-foreground">{med.hsn}</td>
                <td className="px-4 py-3 text-right font-semibold">₹{med.mrp}</td>
                <td className={`px-4 py-3 text-right font-semibold ${med.stock < 10 ? "text-destructive" : ""}`}>{med.stock}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{med.sgst}%</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{med.cgst}%</td>
                <td className="px-4 py-3 text-center">
                  <span className="rounded bg-secondary px-2 py-0.5 text-xs font-medium">{med.schedule}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddMedicineDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
};

export default MedicinesPage;
