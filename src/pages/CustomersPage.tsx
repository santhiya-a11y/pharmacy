import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, UserCircle, Phone, Mail, Calendar,
  AlertTriangle, Pill, CreditCard, MessageSquare, Heart, Star, Gift, Copy
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type CustomerType = "regular" | "vip" | "credit";

interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age: number;
  gender: string;
  allergies: string[];
  conditions: string[];
  totalPurchases: number;
  creditBalance: number;
  loyaltyPoints: number;
  lastVisit: string;
  type: CustomerType;
  medications: { drug: string; dosage: string; refillDate: string }[];
}

const typeConfig: Record<CustomerType, { label: string; color: string; icon: React.ElementType }> = {
  regular: { label: "Regular", color: "bg-muted text-muted-foreground", icon: UserCircle },
  vip: { label: "VIP", color: "bg-warning/10 text-warning", icon: Star },
  credit: { label: "Credit", color: "bg-destructive/10 text-destructive", icon: CreditCard },
};

const patients: Patient[] = [
  {
    id: "CUST-0001", name: "Rahul Sharma", phone: "9876543210", email: "rahul@email.com",
    age: 45, gender: "Male", allergies: ["Penicillin", "Sulfa drugs"],
    conditions: ["Hypertension", "Type 2 Diabetes"], totalPurchases: 24500, creditBalance: 800,
    loyaltyPoints: 245, lastVisit: "Mar 5, 2026", type: "vip",
    medications: [
      { drug: "Metformin 500mg", dosage: "1-0-1", refillDate: "Mar 20, 2026" },
      { drug: "Amlodipine 5mg", dosage: "1-0-0", refillDate: "Mar 25, 2026" },
    ]
  },
  {
    id: "CUST-0002", name: "Priya Nair", phone: "9988776655", email: "priya.n@email.com",
    age: 32, gender: "Female", allergies: [], conditions: ["Hypothyroidism"],
    totalPurchases: 8900, creditBalance: 0, loyaltyPoints: 89, lastVisit: "Mar 3, 2026", type: "regular",
    medications: [{ drug: "Thyronorm 50mcg", dosage: "1-0-0", refillDate: "Apr 1, 2026" }]
  },
  {
    id: "CUST-0003", name: "Sunita Devi", phone: "7766554433",
    age: 62, gender: "Female", allergies: ["Aspirin"], conditions: ["Arthritis", "Osteoporosis"],
    totalPurchases: 45200, creditBalance: 1200, loyaltyPoints: 452, lastVisit: "Mar 4, 2026", type: "credit",
    medications: [
      { drug: "Calcium + D3", dosage: "0-0-1", refillDate: "Mar 15, 2026" },
      { drug: "Aceclofenac 100mg", dosage: "SOS", refillDate: "Mar 18, 2026" },
    ]
  },
  {
    id: "CUST-0004", name: "Vikram Singh", phone: "6655443322",
    age: 28, gender: "Male", allergies: [], conditions: [],
    totalPurchases: 2100, creditBalance: 0, loyaltyPoints: 21, lastVisit: "Feb 28, 2026", type: "regular",
    medications: []
  },
  {
    id: "CUST-0005", name: "Meera Joshi", phone: "8899001122", email: "meera.j@email.com",
    age: 55, gender: "Female", allergies: ["Ibuprofen"], conditions: ["Asthma"],
    totalPurchases: 18700, creditBalance: 500, loyaltyPoints: 187, lastVisit: "Mar 6, 2026", type: "vip",
    medications: [
      { drug: "Salbutamol Inhaler", dosage: "SOS", refillDate: "Apr 5, 2026" },
      { drug: "Montelukast 10mg", dosage: "0-0-1", refillDate: "Mar 28, 2026" },
    ]
  },
];

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Patient | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filtered = patients.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || p.type === typeFilter;
    return matchSearch && matchType;
  });

  const totalLoyalty = patients.reduce((s, p) => s + p.loyaltyPoints, 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Patient CRM</h1>
          <p className="text-sm text-muted-foreground">{patients.length} registered patients</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Name, phone, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Patient</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Patients", value: patients.length, icon: UserCircle, color: "text-primary" },
          { label: "VIP Customers", value: patients.filter(p => p.type === "vip").length, icon: Star, color: "text-warning" },
          { label: "Active Meds", value: patients.reduce((s, p) => s + p.medications.length, 0), icon: Pill, color: "text-chart-2" },
          { label: "Credit Outstanding", value: `₹${patients.reduce((s, p) => s + p.creditBalance, 0).toLocaleString()}`, icon: CreditCard, color: "text-destructive" },
          { label: "Total Loyalty Pts", value: totalLoyalty.toLocaleString(), icon: Heart, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2.5"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex gap-2">
        {[{ key: "all", label: "All" }, { key: "regular", label: "Regular" }, { key: "vip", label: "VIP" }, { key: "credit", label: "Credit" }].map(f => (
          <button
            key={f.key}
            onClick={() => setTypeFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${typeFilter === f.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Patient List */}
      <div className="space-y-2">
        {filtered.map(patient => {
          const tc = typeConfig[patient.type];
          return (
            <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelected(patient)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {patient.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{patient.name}</p>
                    <span className="text-[10px] text-muted-foreground font-mono">{patient.id}</span>
                    <Badge className={`text-[9px] h-4 px-1.5 ${tc.color}`}>{tc.label}</Badge>
                    <Badge variant="outline" className="text-[10px] h-4">{patient.gender}, {patient.age}y</Badge>
                    {patient.allergies.length > 0 && (
                      <Badge variant="destructive" className="text-[9px] h-4 px-1.5">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Allergies
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{patient.phone}</span>
                    {patient.email && <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{patient.email}</span>}
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">₹{patient.totalPurchases.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total purchases</p>
                </div>
                <div className="text-right space-y-0.5">
                  <div className="flex items-center gap-1 justify-end">
                    <Heart className="h-3 w-3 text-primary" />
                    <span className="text-sm font-semibold text-foreground">{patient.loyaltyPoints}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Loyalty pts</p>
                </div>
                {patient.creditBalance > 0 && (
                  <div className="text-right space-y-0.5">
                    <p className="text-sm font-semibold text-destructive">₹{patient.creditBalance}</p>
                    <p className="text-[10px] text-muted-foreground">Credit due</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[11px] text-muted-foreground">Last visit</p>
                  <p className="text-xs font-medium">{patient.lastVisit}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Patient Detail */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selected?.name}
              {selected && <Badge className={`text-[10px] ${typeConfig[selected.type].color}`}>{typeConfig[selected.type].label}</Badge>}
            </DialogTitle>
            <DialogDescription>{selected?.id} · {selected?.gender}, {selected?.age} years</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {/* ID Card */}
              <div className="bg-accent rounded-lg p-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  {selected.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{selected.name}</p>
                  <p className="text-xs text-muted-foreground">{selected.phone} {selected.email && `· ${selected.email}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-bold text-primary">{selected.id}</p>
                  <button onClick={() => { navigator.clipboard.writeText(selected.id); toast.success("ID copied"); }} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5 ml-auto">
                    <Copy className="h-2.5 w-2.5" /> Copy ID
                  </button>
                </div>
              </div>

              {selected.allergies.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1"><AlertTriangle className="h-3.5 w-3.5" />Allergies</p>
                  <div className="flex gap-1.5 flex-wrap">{selected.allergies.map(a => <Badge key={a} variant="destructive" className="text-[10px]">{a}</Badge>)}</div>
                </div>
              )}

              {selected.conditions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-foreground mb-1.5">Conditions</p>
                  <div className="flex gap-1.5 flex-wrap">{selected.conditions.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div>
                </div>
              )}

              {/* Loyalty Section */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <p className="text-xs font-semibold text-primary">Loyalty Program</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{selected.loyaltyPoints}</p>
                    <p className="text-[10px] text-muted-foreground">Points</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">₹{Math.floor(selected.loyaltyPoints / 10)}</p>
                    <p className="text-[10px] text-muted-foreground">Redeemable</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-chart-2">{Math.floor(selected.totalPurchases / 100)}</p>
                    <p className="text-[10px] text-muted-foreground">Lifetime earned</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-foreground mb-2">Active Medications & Refills</p>
                <div className="space-y-1.5">
                  {selected.medications.map((m, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{m.drug}</p>
                        <p className="text-[11px] text-muted-foreground">Dosage: {m.dosage}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Next refill</p>
                        <p className="text-xs font-semibold text-primary">{m.refillDate}</p>
                      </div>
                    </div>
                  ))}
                  {selected.medications.length === 0 && <p className="text-xs text-muted-foreground">No active medications</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-foreground">₹{selected.totalPurchases.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Total Purchases</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-destructive">₹{selected.creditBalance.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Credit Balance</p>
                </div>
                <div className="bg-muted rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-primary">{selected.loyaltyPoints}</p>
                  <p className="text-[10px] text-muted-foreground">Loyalty Points</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1"><MessageSquare className="h-3.5 w-3.5 mr-1" />Send SMS</Button>
                <Button size="sm" variant="outline" className="flex-1"><Calendar className="h-3.5 w-3.5 mr-1" />Refill Reminder</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Patient */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Patient</DialogTitle>
            <DialogDescription>
              A unique Customer ID (CUST-XXXX) will be auto-generated
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-accent rounded-lg px-3 py-2 flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-mono">CUST-{String(patients.length + 1).padStart(4, "0")}</Badge>
              <span className="text-[11px] text-muted-foreground">Auto-generated Customer ID</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Full Name *</Label><Input className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Phone *</Label><Input className="h-9" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Age</Label><Input type="number" className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Gender</Label><Input className="h-9" placeholder="M/F" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input className="h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Known Allergies</Label><Textarea placeholder="Penicillin, Sulfa..." className="min-h-[50px]" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Medical Conditions</Label><Textarea placeholder="Diabetes, Hypertension..." className="min-h-[50px]" /></div>
            <div className="space-y-1.5">
              <Label className="text-xs">Customer Type</Label>
              <div className="flex gap-2">
                {(["regular", "vip", "credit"] as CustomerType[]).map(t => {
                  const tc = typeConfig[t];
                  return (
                    <button key={t} className={`flex-1 rounded-lg border border-border p-2 text-center text-xs font-medium transition-colors hover:bg-accent`}>
                      {tc.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setShowAdd(false); toast.success("Patient added"); }}>Save Patient</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;
