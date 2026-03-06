import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Package, Truck, IndianRupee, Clock,
  CheckCircle2, XCircle, Eye, ArrowUpDown
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface PurchaseOrder {
  id: string;
  supplier: string;
  date: string;
  items: { drug: string; qty: number; rate: number }[];
  status: "draft" | "ordered" | "delivered" | "cancelled";
  totalAmount: number;
  deliveryDate?: string;
  invoiceNo?: string;
}

const orders: PurchaseOrder[] = [
  {
    id: "PO-2401", supplier: "MedPharma Distributors", date: "Mar 4, 2026",
    items: [{ drug: "Paracetamol 500mg", qty: 500, rate: 1.2 }, { drug: "Amoxicillin 250mg", qty: 200, rate: 4.5 }],
    status: "delivered", totalAmount: 1500, deliveryDate: "Mar 5, 2026", invoiceNo: "INV-8891"
  },
  {
    id: "PO-2402", supplier: "HealthCare Supplies", date: "Mar 5, 2026",
    items: [{ drug: "Insulin Glargine", qty: 20, rate: 450 }, { drug: "Syringes (100pk)", qty: 5, rate: 120 }],
    status: "ordered", totalAmount: 9600
  },
  {
    id: "PO-2403", supplier: "Generic Meds Ltd.", date: "Mar 6, 2026",
    items: [{ drug: "Metformin 500mg", qty: 1000, rate: 0.8 }, { drug: "Atorvastatin 10mg", qty: 500, rate: 2.1 }],
    status: "draft", totalAmount: 1850
  },
  {
    id: "PO-2404", supplier: "MedPharma Distributors", date: "Mar 1, 2026",
    items: [{ drug: "Expired batch return", qty: 50, rate: 3.0 }],
    status: "cancelled", totalAmount: 150
  },
];

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  ordered: { label: "Ordered", color: "bg-blue-100 text-blue-700" },
  delivered: { label: "Delivered", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
};

const PurchasesPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const filtered = orders.filter(o =>
    !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.supplier.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage orders and supplier deliveries</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search PO or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />New PO</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-primary" },
          { label: "Pending Delivery", value: orders.filter(o => o.status === "ordered").length, icon: Truck, color: "text-amber-600" },
          { label: "This Month Spend", value: `₹${orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`, icon: IndianRupee, color: "text-emerald-600" },
          { label: "Avg. Delivery Time", value: "1.5 days", icon: Clock, color: "text-blue-600" },
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

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">PO Number</TableHead>
              <TableHead className="text-xs">Supplier</TableHead>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Items</TableHead>
              <TableHead className="text-xs text-right">Amount</TableHead>
              <TableHead className="text-xs">Status</TableHead>
              <TableHead className="text-xs text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(order => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(order)}>
                <TableCell className="font-semibold text-primary text-sm">{order.id}</TableCell>
                <TableCell className="text-sm">{order.supplier}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                <TableCell className="text-sm">{order.items.length} items</TableCell>
                <TableCell className="text-sm text-right font-semibold">₹{order.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${statusConfig[order.status].color}`}>{statusConfig[order.status].label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="h-7"><Eye className="h-3.5 w-3.5" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.id}</DialogTitle>
            <DialogDescription>{selected?.supplier} · {selected?.date}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="space-y-1.5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.drug}</p>
                      <p className="text-[11px] text-muted-foreground">Rate: ₹{item.rate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">₹{(item.qty * item.rate).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-sm font-bold text-foreground">₹{selected.totalAmount.toLocaleString()}</span>
              </div>
              {selected.invoiceNo && <p className="text-xs text-muted-foreground">Invoice: {selected.invoiceNo}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Purchase Order</DialogTitle>
            <DialogDescription>Create a purchase order for supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Supplier *</Label><Input className="h-9" placeholder="Select supplier" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Drug Name</Label><Input className="h-9" placeholder="Search medicine..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Quantity</Label><Input type="number" className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Rate (₹)</Label><Input type="number" className="h-9" /></div>
            </div>
            <Button variant="outline" size="sm" className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />Add Another Item</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdd(false)}>Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
