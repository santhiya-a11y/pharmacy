import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, RotateCcw, ArrowDownLeft, ArrowUpRight, IndianRupee, CheckCircle2, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type ReturnType = "customer" | "supplier";

interface ReturnEntry {
  id: string;
  type: ReturnType;
  date: string;
  partyName: string;
  items: { drug: string; qty: number; amount: number; reason: string }[];
  totalAmount: number;
  status: "pending" | "approved" | "completed";
  creditNote?: string;
}

const returns: ReturnEntry[] = [
  { id: "RET-301", type: "customer", date: "Mar 6, 2026", partyName: "Rahul Sharma", items: [{ drug: "Paracetamol 500mg", qty: 5, amount: 60, reason: "Wrong medicine dispensed" }], totalAmount: 60, status: "completed", creditNote: "CN-201" },
  { id: "RET-302", type: "supplier", date: "Mar 5, 2026", partyName: "MedPharma Distributors", items: [{ drug: "Cough Syrup (Dextro)", qty: 12, amount: 960, reason: "Expired batch" }, { drug: "Antacid Gel", qty: 8, amount: 640, reason: "Expired batch" }], totalAmount: 1600, status: "pending" },
  { id: "RET-303", type: "customer", date: "Mar 4, 2026", partyName: "Priya Nair", items: [{ drug: "Cetirizine 10mg", qty: 10, amount: 45, reason: "Allergic reaction" }], totalAmount: 45, status: "approved" },
  { id: "RET-304", type: "supplier", date: "Mar 3, 2026", partyName: "Generic Meds Ltd.", items: [{ drug: "Damaged packaging lot", qty: 50, amount: 750, reason: "Damaged in transit" }], totalAmount: 750, status: "completed", creditNote: "CN-198" },
];

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const ReturnsPage = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | ReturnType>("all");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = returns.filter(r => {
    if (filter !== "all" && r.type !== filter) return false;
    if (search && !r.partyName.toLowerCase().includes(search.toLowerCase()) && !r.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Returns Management</h1>
          <p className="text-sm text-muted-foreground">Process customer returns & supplier credit notes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search returns..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />New Return</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Customer Returns", value: returns.filter(r => r.type === "customer").length, icon: ArrowDownLeft, color: "text-amber-600" },
          { label: "Supplier Returns", value: returns.filter(r => r.type === "supplier").length, icon: ArrowUpRight, color: "text-blue-600" },
          { label: "Pending", value: returns.filter(r => r.status === "pending").length, icon: Clock, color: "text-destructive" },
          { label: "Total Value", value: `₹${returns.reduce((s, r) => s + r.totalAmount, 0).toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
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

      <div className="flex gap-2">
        {(["all", "customer", "supplier"] as const).map(f => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="h-8 text-xs capitalize" onClick={() => setFilter(f)}>
            {f === "all" ? "All Returns" : f === "customer" ? "Customer Returns" : "Supplier Returns"}
          </Button>
        ))}
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Return ID</TableHead>
              <TableHead className="text-xs">Type</TableHead>
              <TableHead className="text-xs">Party</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Items</TableHead>
              <TableHead className="text-xs text-right">Amount</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs">Credit Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(ret => (
              <TableRow key={ret.id}>
                <TableCell className="font-semibold text-sm text-primary">{ret.id}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px]">
                    {ret.type === "customer" ? <><ArrowDownLeft className="h-2.5 w-2.5 mr-0.5" />Customer</> : <><ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />Supplier</>}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{ret.partyName}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{ret.date}</TableCell>
                <TableCell className="text-sm">
                  {ret.items.map(i => i.drug).join(", ")}
                  <p className="text-[10px] text-muted-foreground">{ret.items[0]?.reason}</p>
                </TableCell>
                <TableCell className="text-sm text-right font-semibold">₹{ret.totalAmount.toLocaleString()}</TableCell>
                <TableCell><Badge className={`text-[10px] ${statusStyles[ret.status]}`}>{ret.status}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{ret.creditNote || "—"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>New Return</DialogTitle><DialogDescription>Process a customer or supplier return</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1"><ArrowDownLeft className="h-3.5 w-3.5 mr-1" />Customer Return</Button>
              <Button size="sm" variant="outline" className="flex-1"><ArrowUpRight className="h-3.5 w-3.5 mr-1" />Supplier Return</Button>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Party Name *</Label><Input className="h-9" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Medicine *</Label><Input className="h-9" placeholder="Search medicine..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Quantity</Label><Input type="number" className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Amount (₹)</Label><Input type="number" className="h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Reason</Label><Textarea className="min-h-[60px]" placeholder="Reason for return..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdd(false)}>Process Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnsPage;
