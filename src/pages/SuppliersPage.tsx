import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Truck, Phone, MapPin, Star, IndianRupee, MessageCircle, Mail, Send, Copy, Check, Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  location: string;
  gst: string;
  rating: number;
  totalOrders: number;
  totalValue: number;
  creditDays: number;
  categories: string[];
  lastOrder: string;
  outstandingAmount: number;
}

const suppliers: Supplier[] = [
  { id: "SUP-001", name: "MedPharma Distributors", contactPerson: "Rajesh Kumar", phone: "9876543210", whatsapp: "919876543210", email: "orders@medpharma.in", location: "Mumbai", gst: "27AABCM1234L1Z5", rating: 4.5, totalOrders: 45, totalValue: 285000, creditDays: 30, categories: ["Tablets", "Capsules", "Syrups"], lastOrder: "Mar 4, 2026", outstandingAmount: 12500 },
  { id: "SUP-002", name: "HealthCare Supplies", contactPerson: "Anita Desai", phone: "9988776655", whatsapp: "919988776655", email: "supply@healthcare.in", location: "Pune", gst: "27AABCH5678M1Z3", rating: 4.2, totalOrders: 28, totalValue: 156000, creditDays: 15, categories: ["Insulin", "Surgical", "Devices"], lastOrder: "Mar 5, 2026", outstandingAmount: 0 },
  { id: "SUP-003", name: "Generic Meds Ltd.", contactPerson: "Suresh Patel", phone: "8877665544", whatsapp: "918877665544", email: "purchase@genericmeds.in", location: "Ahmedabad", gst: "24AABCG9012N1Z1", rating: 3.8, totalOrders: 62, totalValue: 420000, creditDays: 45, categories: ["Generic Tablets", "OTC"], lastOrder: "Mar 6, 2026", outstandingAmount: 34200 },
  { id: "SUP-004", name: "BioLife Pharma", contactPerson: "Meera Shah", phone: "7766554433", email: "orders@biolife.in", location: "Delhi", gst: "07AABCB3456P1Z7", rating: 4.8, totalOrders: 15, totalValue: 98000, creditDays: 21, categories: ["Vaccines", "Biologics"], lastOrder: "Feb 28, 2026", outstandingAmount: 8000 },
];

const SuppliersPage = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Supplier | null>(null);
  const [showSendOrder, setShowSendOrder] = useState(false);
  const [sendTarget, setSendTarget] = useState<Supplier | null>(null);
  const [orderMessage, setOrderMessage] = useState("");
  const [copiedMsg, setCopiedMsg] = useState(false);

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.contactPerson.toLowerCase().includes(search.toLowerCase()) || s.id.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = suppliers.reduce((s, su) => s + su.outstandingAmount, 0);

  const openSendOrder = (supplier: Supplier, items?: string) => {
    setSendTarget(supplier);
    const defaultItems = items || "1. Paracetamol 500mg - 200 strips\n2. Amoxicillin 250mg - 100 strips\n3. Cetirizine 10mg - 150 strips";
    setOrderMessage(
      `Dear ${supplier.contactPerson},\n\nPlease arrange the following medicines at the earliest:\n\n${defaultItems}\n\nKindly confirm availability and delivery date.\n\nThanks,\nPharmaCare Medical Store`
    );
    setShowSendOrder(true);
  };

  const sendViaWhatsApp = () => {
    if (!sendTarget?.whatsapp) { toast.error("No WhatsApp number for this supplier"); return; }
    const url = `https://wa.me/${sendTarget.whatsapp}?text=${encodeURIComponent(orderMessage)}`;
    window.open(url, "_blank");
    toast.success("Opening WhatsApp...");
  };

  const sendViaEmail = () => {
    if (!sendTarget?.email) { toast.error("No email for this supplier"); return; }
    const subject = encodeURIComponent("Purchase Order - PharmaCare Medical Store");
    const body = encodeURIComponent(orderMessage);
    window.open(`mailto:${sendTarget.email}?subject=${subject}&body=${body}`);
    toast.success("Opening email client...");
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(orderMessage);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 2000);
    toast.success("Message copied to clipboard");
  };

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

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Active Suppliers", value: suppliers.length, icon: Truck, color: "text-primary" },
          { label: "Total Orders", value: suppliers.reduce((s, su) => s + su.totalOrders, 0), icon: IndianRupee, color: "text-chart-2" },
          { label: "Avg. Rating", value: (suppliers.reduce((s, su) => s + su.rating, 0) / suppliers.length).toFixed(1), icon: Star, color: "text-warning" },
          { label: "Total Value", value: `₹${(suppliers.reduce((s, su) => s + su.totalValue, 0) / 1000).toFixed(0)}K`, icon: IndianRupee, color: "text-primary" },
          { label: "Outstanding", value: `₹${(totalOutstanding / 1000).toFixed(1)}K`, icon: IndianRupee, color: "text-destructive" },
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
              <TableHead className="text-xs">ID</TableHead>
              <TableHead className="text-xs">Supplier</TableHead>
              <TableHead className="text-xs">Contact</TableHead>
              <TableHead className="text-xs">Location</TableHead>
              <TableHead className="text-xs">Rating</TableHead>
              <TableHead className="text-xs">Credit</TableHead>
              <TableHead className="text-xs text-right">Outstanding</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(sup => (
              <TableRow key={sup.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="text-xs font-mono text-muted-foreground">{sup.id}</TableCell>
                <TableCell onClick={() => setSelected(sup)}>
                  <p className="text-sm font-semibold">{sup.name}</p>
                  <p className="text-[10px] text-muted-foreground">GST: {sup.gst}</p>
                </TableCell>
                <TableCell onClick={() => setSelected(sup)}>
                  <p className="text-sm">{sup.contactPerson}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{sup.phone}</span>
                    {sup.whatsapp && <MessageCircle className="h-3 w-3 text-chart-2" />}
                    {sup.email && <Mail className="h-3 w-3 text-primary" />}
                  </div>
                </TableCell>
                <TableCell className="text-sm"><span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-muted-foreground" />{sup.location}</span></TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 text-sm"><Star className="h-3.5 w-3.5 text-warning fill-warning" />{sup.rating}</span>
                </TableCell>
                <TableCell className="text-sm">{sup.creditDays}d</TableCell>
                <TableCell className="text-sm text-right">
                  {sup.outstandingAmount > 0 ? (
                    <span className="font-semibold text-destructive">₹{sup.outstandingAmount.toLocaleString()}</span>
                  ) : (
                    <span className="text-chart-2 font-medium">Cleared</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(sup)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Supplier Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
            <DialogDescription>{selected?.id} · {selected?.location}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Contact</p>
                  <p className="text-sm font-semibold">{selected.contactPerson}</p>
                  <p className="text-xs text-muted-foreground">{selected.phone}</p>
                  {selected.whatsapp && <p className="text-xs text-chart-2 flex items-center gap-1 mt-0.5"><MessageCircle className="h-3 w-3" />WhatsApp: +{selected.whatsapp}</p>}
                  {selected.email && <p className="text-xs text-primary flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{selected.email}</p>}
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground">Credit Terms</p>
                  <p className="text-sm font-semibold">{selected.creditDays} days</p>
                  <p className="text-xs text-muted-foreground">GST: {selected.gst}</p>
                  {selected.outstandingAmount > 0 && (
                    <p className="text-xs text-destructive font-semibold mt-0.5">Outstanding: ₹{selected.outstandingAmount.toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div><p className="text-xs font-semibold mb-1.5">Categories</p><div className="flex gap-1.5 flex-wrap">{selected.categories.map(c => <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>)}</div></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted rounded-lg p-3 text-center"><p className="text-lg font-bold">{selected.totalOrders}</p><p className="text-[10px] text-muted-foreground">Orders</p></div>
                <div className="bg-muted rounded-lg p-3 text-center"><p className="text-lg font-bold">₹{(selected.totalValue / 1000).toFixed(0)}K</p><p className="text-[10px] text-muted-foreground">Value</p></div>
                <div className="bg-muted rounded-lg p-3 text-center"><p className="text-lg font-bold flex items-center justify-center gap-0.5"><Star className="h-4 w-4 text-warning fill-warning" />{selected.rating}</p><p className="text-[10px] text-muted-foreground">Rating</p></div>
              </div>
              <Button className="w-full gap-2" onClick={() => { setSelected(null); openSendOrder(selected); }}>
                <Send className="h-4 w-4" />Send Reorder Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Order Dialog */}
      <Dialog open={showSendOrder} onOpenChange={setShowSendOrder}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Order to {sendTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Send reorder request via WhatsApp, Email, or copy the message
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Supplier Info Bar */}
            <div className="flex items-center gap-3 bg-muted rounded-lg p-3">
              <div className="flex-1">
                <p className="text-sm font-semibold">{sendTarget?.contactPerson}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  {sendTarget?.whatsapp && <span className="text-[11px] text-chart-2 flex items-center gap-1"><MessageCircle className="h-3 w-3" />+{sendTarget.whatsapp}</span>}
                  {sendTarget?.email && <span className="text-[11px] text-primary flex items-center gap-1"><Mail className="h-3 w-3" />{sendTarget.email}</span>}
                </div>
              </div>
            </div>

            {/* Editable Message */}
            <div className="space-y-1.5">
              <Label className="text-xs">Order Message</Label>
              <Textarea
                value={orderMessage}
                onChange={(e) => setOrderMessage(e.target.value)}
                className="min-h-[180px] text-sm font-mono"
              />
            </div>
          </div>

          {/* Send Actions */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              onClick={sendViaWhatsApp}
              disabled={!sendTarget?.whatsapp}
              className="gap-2 bg-chart-2 hover:bg-chart-2/90 text-white"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </Button>
            <Button
              onClick={sendViaEmail}
              disabled={!sendTarget?.email}
              variant="outline"
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>
            <Button onClick={copyMessage} variant="outline" className="gap-2">
              {copiedMsg ? <Check className="h-4 w-4 text-chart-2" /> : <Copy className="h-4 w-4" />}
              {copiedMsg ? "Copied!" : "Copy"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
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
              <div className="space-y-1.5"><Label className="text-xs">WhatsApp Number</Label><Input className="h-9" placeholder="e.g. 919876543210" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" className="h-9" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">GST Number</Label><Input className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Credit Days</Label><Input type="number" className="h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Location</Label><Input className="h-9" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setShowAdd(false); toast.success("Supplier added"); }}>Save Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;
