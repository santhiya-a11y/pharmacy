import { useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import AddMedicineDialog from "@/components/medicines/AddMedicineDialog";

const medicines = [
  { name: "Dolo 650mg", generic: "Paracetamol", manufacturer: "Micro Labs", category: "Analgesic", mrp: 30, stock: 250, schedule: "OTC" },
  { name: "Azithromycin 500mg", generic: "Azithromycin", manufacturer: "Cipla", category: "Antibiotic", mrp: 100, stock: 45, schedule: "H" },
  { name: "Cetirizine 10mg", generic: "Cetirizine", manufacturer: "Sun Pharma", category: "Antihistamine", mrp: 30, stock: 180, schedule: "OTC" },
  { name: "Pantoprazole 40mg", generic: "Pantoprazole", manufacturer: "Alkem", category: "Antacid", mrp: 60, stock: 92, schedule: "H" },
  { name: "Amoxicillin 250mg", generic: "Amoxicillin", manufacturer: "GSK", category: "Antibiotic", mrp: 50, stock: 8, schedule: "H1" },
  { name: "Metformin 500mg", generic: "Metformin", manufacturer: "USV", category: "Antidiabetic", mrp: 25, stock: 300, schedule: "H" },
  { name: "Crocin Advance", generic: "Paracetamol", manufacturer: "GSK", category: "Analgesic", mrp: 28, stock: 150, schedule: "OTC" },
  { name: "Omeprazole 20mg", generic: "Omeprazole", manufacturer: "Dr. Reddy's", category: "Antacid", mrp: 45, stock: 67, schedule: "H" },
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
            <tr className="bg-secondary/50 border-b border-border">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Medicine</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Generic</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Manufacturer</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">MRP</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Stock</th>
              <th className="px-4 py-3 text-center font-medium text-muted-foreground">Schedule</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((med, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors cursor-pointer">
                <td className="px-4 py-3 font-medium text-card-foreground">{med.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{med.generic}</td>
                <td className="px-4 py-3 text-muted-foreground">{med.manufacturer}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{med.category}</span>
                </td>
                <td className="px-4 py-3 text-right font-semibold">₹{med.mrp}</td>
                <td className={`px-4 py-3 text-right font-semibold ${med.stock < 10 ? "text-destructive" : ""}`}>{med.stock}</td>
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
