import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Phone, Mail, AlertTriangle, Pill, CreditCard,
  MessageSquare, Heart, Gift, Copy, X, Save, Calendar,
  UserCircle, FileDown, Eye, ChevronRight, ShoppingBag, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { useCustomers, useCreateCustomer } from "@/hooks/api/useApi";

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
  avatar: string;
  medications: { drug: string; dosage: string; refillDate: string }[];
}

interface PurchaseRecord {
  invoiceNo: string;
  date: string;
  items: number;
  total: number;
  paymentMode: string;
}

const CustomersPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "purchases" | "medications">("overview");
  const [newCust, setNewCust] = useState({ name: "", phone: "", age: "", gender: "M", email: "", allergies: "", conditions: "" });

  const { data: customerResponse, isLoading } = useCustomers({
    page: 1,
    pageSize: 100,
  });

  const patientList = useMemo(() => {
    return (customerResponse?.rows as any[]) || [];
  }, [customerResponse]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return patientList.filter(p =>
      !q || p.name?.toLowerCase().includes(q) || p.phone?.includes(q) || p.id?.toLowerCase().includes(q)
    );
  }, [patientList, search]);

  const stats = (customerResponse?.meta as any)?.stats || { loyalty: 0, credit: 0, meds: 0, total: 0 };
  const { mutate: createCustomer, isPending: isSaving } = useCreateCustomer();

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">Manage patients, loyalty & purchase history</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Add Customer
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground font-medium">Total Customers</p>
          <p className="text-2xl font-bold text-card-foreground mt-1">{isLoading ? "…" : stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-primary" />
            <p className="text-xs text-primary font-medium">Total Loyalty Points</p>
          </div>
          <p className="text-2xl font-bold text-primary mt-1">{isLoading ? "…" : stats.loyalty.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-destructive" />
            <p className="text-xs text-destructive font-medium">Credit Outstanding</p>
          </div>
          <p className="text-2xl font-bold text-destructive mt-1">₹{isLoading ? "…" : stats.credit.toLocaleString()}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5">
            <Pill className="h-3.5 w-3.5 text-chart-2" />
            <p className="text-xs text-muted-foreground font-medium">Active Medications</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground mt-1">{isLoading ? "…" : stats.meds}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search by name, phone, or ID..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      {/* Customer Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          <p className="text-sm font-medium">Loading customers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground italic">
              No customers found.
            </div>
          ) : (
            filtered.map((patient: any) => (
              <div
                key={patient.id || patient._id}
                onClick={() => { setSelected(patient); setDetailTab("overview"); }}
                className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {(patient.avatar || patient.name?.substring(0, 2) || "C").toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{patient.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{patient.id || "CUST-XXXX"}</p>
                      <Badge variant="outline" className="text-[10px] mt-0.5">{patient.gender || "N/A"}, {patient.age || 0}y</Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(patient.allergies || []).length > 0 && (
                      <Badge variant="destructive" className="text-[9px] h-5 px-1.5">
                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Allergy
                      </Badge>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{patient.phone || "—"}</span>
                  </div>
                  {patient.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      <span className="truncate">{patient.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Last visit: {patient.lastVisit || "N/A"}</span>
                  </div>
                </div>

                {/* Footer Stats */}
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 rounded-lg bg-secondary/50 px-3 py-2 text-center">
                    <p className="text-xs font-bold text-card-foreground">₹{(patient.totalPurchases || 0).toLocaleString()}</p>
                    <p className="text-[9px] text-muted-foreground">Purchases</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-primary/5 px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Heart className="h-3 w-3 text-primary" />
                      <p className="text-xs font-bold text-primary">{patient.loyaltyPoints || 0}</p>
                    </div>
                    <p className="text-[9px] text-muted-foreground">Points</p>
                  </div>
                  {(patient.creditBalance || 0) > 0 && (
                    <div className="flex-1 rounded-lg bg-destructive/5 px-3 py-2 text-center">
                      <p className="text-xs font-bold text-destructive">₹{patient.creditBalance}</p>
                      <p className="text-[9px] text-muted-foreground">Credit</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Customer Detail Panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="relative w-full max-w-2xl max-h-[85vh] rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-border px-6 py-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg">
                {(selected.avatar || selected.name?.substring(0, 2) || "C").toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-card-foreground">{selected.name}</h2>
                  <Badge variant="outline" className="text-[10px]">{selected.gender || "N/A"}, {selected.age || 0}y</Badge>
                  {(selected.allergies || []).length > 0 && (
                    <Badge variant="destructive" className="text-[9px]"><AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Allergy</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm text-muted-foreground font-mono">{selected.id || "CUST-XXXX"}</p>
                  <button onClick={() => { navigator.clipboard.writeText(selected.id || ""); toast.success("ID copied"); }} className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5">
                    <Copy className="h-2.5 w-2.5" /> Copy
                  </button>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-border px-6">
              {[
                { key: "overview" as const, label: "Overview" },
                { key: "purchases" as const, label: "Purchase History" },
                { key: "medications" as const, label: `Medications (${(selected.medications || []).length})` },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setDetailTab(tab.key)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    detailTab === tab.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {detailTab === "overview" && (
                <>
                  {/* Contact & Loyalty */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="text-card-foreground">{selected.phone || "—"}</span>
                        </div>
                        {selected.email && (
                          <div className="flex items-center gap-2.5 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-card-foreground truncate">{selected.email}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-card-foreground">Last visit: {selected.lastVisit || "N/A"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Gift className="h-4 w-4 text-primary" />
                        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Loyalty Program</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-primary">{selected.loyaltyPoints || 0}</p>
                          <p className="text-[10px] text-muted-foreground">Available Points</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-card-foreground">₹{Math.floor((selected.loyaltyPoints || 0) * 0.25)}</p>
                          <p className="text-[10px] text-muted-foreground">Redeemable Value</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="text-xl font-bold text-card-foreground">₹{(selected.totalPurchases || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Total Purchases</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="text-xl font-bold text-destructive">₹{(selected.creditBalance || 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Credit Balance</p>
                    </div>
                    <div className="rounded-xl border border-border p-3 text-center">
                      <p className="text-xl font-bold text-card-foreground">{(selected.purchaseCount || 0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total Invoices</p>
                    </div>
                  </div>

                  {/* Allergies & Conditions */}
                  {(selected.allergies || []).length > 0 && (
                    <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4">
                      <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-2"><AlertTriangle className="h-3.5 w-3.5" />Known Allergies</p>
                      <div className="flex gap-1.5 flex-wrap">{(selected.allergies || []).map((a: string) => <Badge key={a} variant="destructive" className="text-[10px]">{a}</Badge>)}</div>
                    </div>
                  )}

                  {(selected.conditions || []).length > 0 && (
                    <div className="rounded-xl border border-border p-4">
                      <p className="text-xs font-semibold text-card-foreground mb-2">Medical Conditions</p>
                      <div className="flex gap-1.5 flex-wrap">{(selected.conditions || []).map((c: string) => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1"><MessageSquare className="h-3.5 w-3.5 mr-1" />Send SMS</Button>
                    <Button size="sm" variant="outline" className="flex-1"><Calendar className="h-3.5 w-3.5 mr-1" />Refill Reminder</Button>
                  </div>
                </>
              )}

              {detailTab === "purchases" && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-card-foreground">Purchase History</p>
                    <p className="text-xs text-muted-foreground">{(selected.purchaseCount || 0)} invoices</p>
                  </div>
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Invoice No</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                          <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground">Items</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Payment</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selected.purchases || []).map((p: any, i: number) => (
                          <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono font-semibold text-primary">{p.invoiceNo}</span>
                            </td>
                            <td className="px-4 py-3 text-sm text-card-foreground">{p.date}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge variant="secondary" className="text-[10px]">{p.items} items</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-[10px]">{p.paymentMode}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-card-foreground">₹{p.total.toLocaleString()}</td>
                          </tr>
                        ))}
                        {(selected.purchases || []).length === 0 && (
                          <tr>
                            <td colSpan={5} className="text-center py-8 text-sm text-muted-foreground italic">No purchase history found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {detailTab === "medications" && (
                <>
                  <p className="text-sm font-semibold text-card-foreground">Active Medications & Refills</p>
                  <div className="space-y-2">
                    {(selected.medications || []).map((m: any, i: number) => (
                      <div key={i} className="flex items-center justify-between rounded-xl border border-border p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-center gap-3">
                          <div className="rounded-lg bg-chart-2/10 p-2.5">
                            <Pill className="h-4 w-4 text-chart-2" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-card-foreground">{m.drug}</p>
                            <p className="text-[11px] text-muted-foreground">Dosage: {m.dosage}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-muted-foreground">Next refill</p>
                          <p className="text-xs font-semibold text-primary">{m.refillDate}</p>
                        </div>
                      </div>
                    ))}
                    {(selected.medications || []).length === 0 && (
                      <div className="text-center py-8">
                        <Pill className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">No active medications</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Customer Dialog */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">Add New Customer</h2>
                <p className="text-xs text-muted-foreground">ID will be auto-generated</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={e => { 
                e.preventDefault(); 
                if (!newCust.name.trim()) return toast.error("Full name is required");
                if (newCust.phone.length < 10) return toast.error("Please enter a valid 10-digit phone number");
                
                createCustomer({
                  ...newCust,
                  age: Number(newCust.age) || 0,
                  allergies: newCust.allergies.split(",").map(a => a.trim()).filter(Boolean),
                  conditions: newCust.conditions.split(",").map(c => c.trim()).filter(Boolean),
                }, {
                  onSuccess: () => {
                    setShowAdd(false);
                    setNewCust({ name: "", phone: "", age: "", gender: "M", email: "", allergies: "", conditions: "" });
                    toast.success("Customer added successfully");
                  },
                  onError: (err: any) => toast.error(err.message || "Failed to add customer")
                });
              }}>
              <div className="bg-accent rounded-lg px-3 py-2 flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono">NEW</Badge>
                <span className="text-[11px] text-muted-foreground">ID will be auto-generated</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Full Name *</Label>
                  <Input required placeholder="e.g. Arun Patel" className="bg-background" value={newCust.name} onChange={e => setNewCust(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Phone *</Label>
                  <Input 
                    required 
                    type="tel"
                    maxLength={10}
                    placeholder="10-digit mobile" 
                    className="bg-background" 
                    value={newCust.phone} 
                    onChange={e => setNewCust(p => ({ ...p, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} 
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5"><Label className="text-xs">Age</Label><Input type="number" className="bg-background" value={newCust.age} onChange={e => setNewCust(p => ({ ...p, age: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Gender</Label><Input className="bg-background" placeholder="M/F" value={newCust.gender} onChange={e => setNewCust(p => ({ ...p, gender: e.target.value }))} /></div>
                <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input className="bg-background" value={newCust.email} onChange={e => setNewCust(p => ({ ...p, email: e.target.value }))} /></div>
              </div>
              <div className="space-y-1.5"><Label className="text-xs">Known Allergies</Label><Textarea placeholder="Penicillin, Sulfa..." className="min-h-[50px]" value={newCust.allergies} onChange={e => setNewCust(p => ({ ...p, allergies: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs">Medical Conditions</Label><Textarea placeholder="Diabetes, Hypertension..." className="min-h-[50px]" value={newCust.conditions} onChange={e => setNewCust(p => ({ ...p, conditions: e.target.value }))} /></div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving} className="gap-2">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Customer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;





