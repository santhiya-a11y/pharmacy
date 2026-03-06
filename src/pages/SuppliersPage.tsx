import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Truck, Phone, MapPin, Star, IndianRupee } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  location: string;
  gst: string;
  rating: number;
  totalOrders: number;
  totalValue: number;
  creditDays: number;
  categories: string[];
  lastOrder: string;
}

const suppliers: Supplier[] = [
  { id: "SUP-01", name: "MedPharma Distributors", contactPerson: "Rajesh Kumar", phone: "9876543210", location: "Mumbai", gst: "27AABCM1234L1Z5", rating: 4.5, totalOrders: 45, totalValue: 285000, creditDays: 30, categories: ["Tablets", "Capsules", "Syrups"], lastOrder: "Mar 4, 2026" },
  { id: "SUP-02", name: "HealthCare Supplies", contactPerson: "Anita Desai", phone: "9988776655", location: "Pune", gst: "27AABCH5678M1Z3", rating: 4.2, totalOrders: 28, totalValue: 156000, creditDays: 15, categories: ["Insulin", "Surgical", "Devices"], lastOrder: "Mar 5, 2026" },
  { id: "SUP-03", name: "Generic Meds Ltd.", contactPerson: "Suresh Patel", phone: "8877665544", location: "Ahmedabad", gst: "24AABCG9012N1Z1", rating: 3.8, totalOrders: 62, totalValue: 420000, creditDays: 45, categories: ["Generic Tablets", "OTC"], lastOrder: "Mar 6, 2026" },
  { id: "SUP-04", name: "BioLife Pharma", contactPerson: "Meera Shah", phone: "7766554433", location: "Delhi", gst: "07AABCB3456P1Z7", rating: 4.8, totalOrders: 15, totalValue: 98000, creditDays: 21, categories: ["Vaccines", "Biologics"], lastOrder: "Feb 28, 2026" },
];

const SuppliersPage = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Supplier Directory</h1>
          <p className="text-sm text-muted-foreground">{suppliers.length} registered suppliers</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Supplier</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Active Suppliers", value: suppliers.length, icon: Truck, color: "text-primary" },
          { label: "Total Orders", value: suppliers.reduce((s, su) => s + su.totalOrders, 0), icon: IndianRupee, color: "text-emerald-600" },
          { label: "Avg. Rating", value: (suppliers.reduce((s, su) => s + su.rating, 0) / suppliers.length).toFixed(1), icon: Star, color: "text-amber-500" },
          { label: "Total Value", value: `₹${(suppliers.reduce((s, su) => s + su.totalValue, 0) / 1000).toFixed(0)}K`, icon: IndianRupee, color: "text-blue-600" },
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
              <TableHead className="text-xs">Supplier</TableHead>
              <TableHead className="text-xs">Contact</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Rating</TableHead>
              <TableHead className="text-xs">Credit Days</TableHead>
              <TableHead className="text-xs text-right">Total Value</TableHead>
              <TableHead className="text-xs">Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(sup => (
              <TableRow key={sup.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(sup)}>
                <TableCell>
                  <p className="text-sm font-semibold">{sup.name}</p>
                  <p className="text-[10px] text-muted-foreground">GST: {sup.gst}</p>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{sup.contactPerson}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{sup.phone}</p>
                </TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{sup.location}</span></TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />{sup.rating}</span>
                </TableCell>
                <TableCell className="text-sm">{sup.creditDays} days</TableCell>
                <TableCell className="text-sm text-right font-semibold">₹{sup.totalValue.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{sup.lastOrder}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.id} · {selected?.location}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Contact</p><p className="text-sm font-semibold">{selected.contactPerson}</p><p className="text-xs text-muted-foreground">{selected.phone}</p></div>
                <div className="bg-muted rounded-lg p-3"><p className="text-[10px] text-muted-foreground">Credit Terms</p><p className="text-sm font-semibold">{selected.creditDays} days</p><p className="text-xs text-muted-foreground">GST: {selected.gst}</p></div>
              </div>
              <div><p className="text-xs font-semibold mb-1.5">Categories</p><div className="flex gap-1.5 flex-wrap">{selected.categories.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted rounded-lg p-3 text-center"><p className="text-lg font-bold">{selected.totalOrders}</p><p className="text-[10px] text-muted-foreground">Orders</p></div>
                <div className="bg-muted rounded-lg p-3 text-center"><p className="text-lg font-bold">₹{(selected.totalValue / 1000).toFixed(0)}K</p><p className="text-[10px] text-muted-foreground">Value</p></div>
                <div className="bg-muted rounded-lg p-3 text-center"><p className="text-lg font-bold flex items-center justify-center gap-0.5"><Star className="h-4 w-4 text-amber-500 fill-amber-500" />{selected.rating}</p><p className="text-[10px] text-muted-foreground">Rating</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle><DialogDescription>Register a new supplier</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label className="text-xs">Company Name *</Label><Input className="h-9" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Contact Person *</Label><Input className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Phone *</Label><Input className="h-9" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">GST Number</Label><Input className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Credit Days</Label><Input type="number" className="h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Location</Label><Input className="h-9" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdd(false)}>Save Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;
