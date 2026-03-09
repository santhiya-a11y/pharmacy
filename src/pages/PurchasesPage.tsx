import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Package, Truck, IndianRupee, Clock,
  CheckCircle2, XCircle, Eye, Send, MessageCircle, Mail, Copy, Check
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

type OrderStatus = "draft" | "ordered" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "partial" | "paid";

interface PurchaseOrder {
  id: string;
  supplier: string;
  supplierWhatsapp?: string;
  supplierEmail?: string;
  date: string;
  items: { drug: string; qty: number; rate: number }[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  deliveryDate?: string;
  invoiceNo?: string;
  dueDate?: string;
}

const orders: PurchaseOrder[] = [
  {
    id: "PO-2401", supplier: "MedPharma Distributors", supplierWhatsapp: "919876543210", supplierEmail: "orders@medpharma.in", date: "Mar 4, 2026",
    items: [{ drug: "Paracetamol 500mg", qty: 500, rate: 1.2 }, { drug: "Amoxicillin 250mg", qty: 200, rate: 4.5 }],
    status: "delivered", paymentStatus: "paid", totalAmount: 1500, paidAmount: 1500, deliveryDate: "Mar 5, 2026", invoiceNo: "INV-8891", dueDate: "Apr 4, 2026"
  },
  {
    id: "PO-2402", supplier: "HealthCare Supplies", supplierWhatsapp: "919988776655", supplierEmail: "supply@healthcare.in", date: "Mar 5, 2026",
    items: [{ drug: "Insulin Glargine", qty: 20, rate: 450 }, { drug: "Syringes (100pk)", qty: 5, rate: 120 }],
    status: "ordered", paymentStatus: "pending", totalAmount: 9600, paidAmount: 0, dueDate: "Mar 20, 2026"
  },
  {
    id: "PO-2403", supplier: "Generic Meds Ltd.", supplierWhatsapp: "918877665544", supplierEmail: "purchase@genericmeds.in", date: "Mar 6, 2026",
    items: [{ drug: "Metformin 500mg", qty: 1000, rate: 0.8 }, { drug: "Atorvastatin 10mg", qty: 500, rate: 2.1 }],
    status: "delivered", paymentStatus: "partial", totalAmount: 1850, paidAmount: 1000, invoiceNo: "INV-9002", dueDate: "Apr 20, 2026"
  },
  {
    id: "PO-2404", supplier: "MedPharma Distributors", date: "Mar 1, 2026",
    items: [{ drug: "Expired batch return", qty: 50, rate: 3.0 }],
    status: "cancelled", paymentStatus: "paid", totalAmount: 150, paidAmount: 150
  },
];

const statusConfig = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  ordered: { label: "Ordered", color: "bg-primary/10 text-primary" },
  delivered: { label: "Delivered", color: "bg-chart-2/10 text-chart-2" },
  cancelled: { label: "Cancelled", color: "bg-destructive/10 text-destructive" },
};

const paymentConfig = {
  pending: { label: "Pending", color: "bg-warning/10 text-warning" },
  partial: { label: "Partial", color: "bg-primary/10 text-primary" },
  paid: { label: "Paid", color: "bg-chart-2/10 text-chart-2" },
};

const PurchasesPage = () => {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  const filtered = orders.filter(o => {
    const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.supplier.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const matchPayment = paymentFilter === "all" || o.paymentStatus === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const totalPending = orders.filter(o => o.paymentStatus === "pending").reduce((s, o) => s + o.totalAmount, 0);
  const totalPartial = orders.filter(o => o.paymentStatus === "partial").reduce((s, o) => s + (o.totalAmount - o.paidAmount), 0);

  const openPayment = (order: PurchaseOrder) => {
    setPaymentTarget(order);
    setPaymentAmount((order.totalAmount - order.paidAmount).toString());
    setShowPaymentDialog(true);
  };

  const handleRecordPayment = () => {
    toast.success(`Payment of ₹${paymentAmount} recorded for ${paymentTarget?.id}`);
    setShowPaymentDialog(false);
  };

  const sendOrderToSupplier = (order: PurchaseOrder) => {
    const msg = `Purchase Order: ${order.id}\n\nItems:\n${order.items.map((i, idx) => `${idx + 1}. ${i.drug} - Qty: ${i.qty} @ ₹${i.rate}`).join("\n")}\n\nTotal: ₹${order.totalAmount}\n\nPlease confirm.`;
    if (order.supplierWhatsapp) {
      window.open(`https://wa.me/${order.supplierWhatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
      toast.success("Opening WhatsApp...");
    } else if (order.supplierEmail) {
      window.open(`mailto:${order.supplierEmail}?subject=${encodeURIComponent(`PO: ${order.id}`)}&body=${encodeURIComponent(msg)}`);
      toast.success("Opening email...");
    } else {
      navigator.clipboard.writeText(msg);
      toast.success("Order copied to clipboard");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">Manage orders, deliveries & payments</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search PO or supplier..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />New PO</Button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total Orders", value: orders.length, icon: Package, color: "text-primary" },
          { label: "Pending Delivery", value: orders.filter(o => o.status === "ordered").length, icon: Truck, color: "text-warning" },
          { label: "Month Spend", value: `₹${orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.totalAmount, 0).toLocaleString()}`, icon: IndianRupee, color: "text-chart-2" },
          { label: "Payment Pending", value: `₹${totalPending.toLocaleString()}`, icon: Clock, color: "text-destructive" },
          { label: "Partially Paid", value: `₹${totalPartial.toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
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

      {/* Filters */}
      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Order Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Payment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
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
              <TableHead className="text-xs">Order Status</TableHead>
              <TableHead className="text-xs">Payment</TableHead>
              <TableHead className="text-xs text-right">Due Date</TableHead>
              <TableHead className="text-xs text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(order => (
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-semibold text-primary text-sm">{order.id}</TableCell>
                <TableCell className="text-sm">{order.supplier}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{order.date}</TableCell>
                <TableCell className="text-sm">{order.items.length} items</TableCell>
                <TableCell className="text-sm text-right font-semibold">₹{order.totalAmount.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge className={`text-[10px] ${statusConfig[order.status].color}`}>{statusConfig[order.status].label}</Badge>
                </TableCell>
                <TableCell>
                  <div>
                    <Badge className={`text-[10px] ${paymentConfig[order.paymentStatus].color}`}>{paymentConfig[order.paymentStatus].label}</Badge>
                    {order.paymentStatus === "partial" && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">₹{order.paidAmount} / ₹{order.totalAmount}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-right text-muted-foreground">{order.dueDate || "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setSelected(order)}><Eye className="h-3.5 w-3.5" /></Button>
                    {order.status !== "cancelled" && order.paymentStatus !== "paid" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openPayment(order)}>Pay</Button>
                    )}
                    {order.status === "draft" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => sendOrderToSupplier(order)}>
                        <Send className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selected?.id}</DialogTitle>
            <DialogDescription>{selected?.supplier} · {selected?.date}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Badge className={`text-xs ${statusConfig[selected.status].color}`}>{statusConfig[selected.status].label}</Badge>
                <Badge className={`text-xs ${paymentConfig[selected.paymentStatus].color}`}>Payment: {paymentConfig[selected.paymentStatus].label}</Badge>
              </div>
              <div className="space-y-1.5">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.drug}</p>
                      <p className="text-[11px] text-muted-foreground">Rate: ₹{item.rate} × {item.qty}</p>
                    </div>
                    <p className="text-sm font-semibold">₹{(item.qty * item.rate).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border pt-2 space-y-1">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total</span><span className="font-bold">₹{selected.totalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span className="font-semibold text-chart-2">₹{selected.paidAmount.toLocaleString()}</span></div>
                {selected.totalAmount - selected.paidAmount > 0 && (
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Balance</span><span className="font-semibold text-destructive">₹{(selected.totalAmount - selected.paidAmount).toLocaleString()}</span></div>
                )}
                {selected.dueDate && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Due Date</span><span>{selected.dueDate}</span></div>}
              </div>
              {selected.invoiceNo && <p className="text-xs text-muted-foreground">Invoice: {selected.invoiceNo}</p>}
              <div className="flex gap-2">
                {selected.paymentStatus !== "paid" && (
                  <Button size="sm" className="flex-1" onClick={() => { setSelected(null); openPayment(selected); }}>Record Payment</Button>
                )}
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => sendOrderToSupplier(selected)}>
                  <Send className="h-3.5 w-3.5" />Send to Supplier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>{paymentTarget?.id} · {paymentTarget?.supplier}</DialogDescription>
          </DialogHeader>
          {paymentTarget && (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                <div><p className="text-[10px] text-muted-foreground">Total</p><p className="text-sm font-bold">₹{paymentTarget.totalAmount}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Paid</p><p className="text-sm font-bold text-chart-2">₹{paymentTarget.paidAmount}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Balance</p><p className="text-sm font-bold text-destructive">₹{paymentTarget.totalAmount - paymentTarget.paidAmount}</p></div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Amount (₹)</Label>
                <Input type="number" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Method</Label>
                <Select defaultValue="bank">
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowPaymentDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRecordPayment}>Record Payment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
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
            <div className="space-y-1.5"><Label className="text-xs">Due Date</Label><Input type="date" className="h-9" /></div>
            <Button variant="outline" size="sm" className="w-full"><Plus className="h-3.5 w-3.5 mr-1" />Add Another Item</Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => { setShowAdd(false); toast.success("PO created"); }}>Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
