import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Plus, Package, Truck, IndianRupee, Clock, ClipboardList,
  CheckCircle2, XCircle, Eye, Send, MessageCircle, Mail, Copy, Check, Download, Minus, X,
  AlertTriangle, PackageCheck, Warehouse
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import PrintablePurchaseOrder from "@/components/inventory/PrintablePurchaseOrder";
import { DateRangeFilter } from "@/components/ui/date-range-filter";

type OrderStatus = "draft" | "ordered" | "delivered" | "cancelled";
type PaymentStatus = "pending" | "partial" | "paid";

interface POItem { drug: string; qty: number; rate: number; }

interface ReceiveItem {
  drug: string;
  orderedQty: number;
  receivedQty: number;
  batch: string;
  expiry: string;
  mrp: number;
  rackLocation: string;
}

interface PurchaseOrder {
  id: string;
  supplier: string;
  supplierWhatsapp?: string;
  supplierEmail?: string;
  date: string;
  items: POItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  paidAmount: number;
  deliveryDate?: string;
  invoiceNo?: string;
  dueDate?: string;
  paymentTerms?: string;
  remarks?: string;
}

const initialOrders: PurchaseOrder[] = [
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

const suppliers = ["MedPharma Distributors", "HealthCare Supplies", "Generic Meds Ltd.", "Micro Labs", "Cipla Ltd", "Dr. Reddy's", "GSK Pharma", "Sun Pharma", "USV Ltd", "Mankind Pharma"];
const paymentTermOptions = ["Advance", "COD", "7 Days", "15 Days", "30 Days", "45 Days", "60 Days"];

// Inventory data with supplier mapping for expiry suggestions
interface InventoryRef {
  name: string; batch: string; expiry: string; stock: number; purchasePrice: number; supplier: string; status: string;
}
const inventoryData: InventoryRef[] = [
  { name: "Dolo 650mg", batch: "B102", expiry: "08/2026", stock: 250, purchasePrice: 22, supplier: "Micro Labs", status: "safe" },
  { name: "Azithromycin 500mg", batch: "A45", expiry: "12/2026", stock: 45, purchasePrice: 68, supplier: "Cipla Ltd", status: "safe" },
  { name: "Cetirizine 10mg", batch: "C78", expiry: "04/2026", stock: 180, purchasePrice: 18, supplier: "Dr. Reddy's", status: "expiring" },
  { name: "Amoxicillin 250mg", batch: "AM33", expiry: "05/2026", stock: 8, purchasePrice: 32, supplier: "GSK Pharma", status: "low" },
  { name: "Metformin 500mg", batch: "M90", expiry: "11/2026", stock: 300, purchasePrice: 15, supplier: "USV Ltd", status: "safe" },
  { name: "Pantoprazole 40mg", batch: "P12", expiry: "06/2026", stock: 92, purchasePrice: 38, supplier: "Sun Pharma", status: "expiring" },
  { name: "Paracetamol 500mg", batch: "P201", expiry: "05/2026", stock: 120, purchasePrice: 1.2, supplier: "MedPharma Distributors", status: "expiring" },
  { name: "Omeprazole 20mg", batch: "O55", expiry: "04/2026", stock: 60, purchasePrice: 12, supplier: "MedPharma Distributors", status: "expiring" },
  { name: "Insulin Glargine", batch: "IG10", expiry: "06/2026", stock: 10, purchasePrice: 450, supplier: "HealthCare Supplies", status: "expiring" },
  { name: "Atorvastatin 10mg", batch: "AT22", expiry: "05/2026", stock: 200, purchasePrice: 2.1, supplier: "Generic Meds Ltd.", status: "expiring" },
  { name: "Losartan 50mg", batch: "L44", expiry: "07/2026", stock: 75, purchasePrice: 8, supplier: "Generic Meds Ltd.", status: "expiring" },
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
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [orders] = useState<PurchaseOrder[]>(initialOrders);
  const [selected, setSelected] = useState<PurchaseOrder | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<PurchaseOrder | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  // Receive Stock state
  const [showReceiveStock, setShowReceiveStock] = useState(false);
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [receiveItems, setReceiveItems] = useState<ReceiveItem[]>([]);

  // New PO form state
  const [poSupplier, setPoSupplier] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([{ drug: "", qty: 0, rate: 0 }]);
  const [poDeliveryDate, setPoDeliveryDate] = useState("");
  const [poPaymentTerms, setPoPaymentTerms] = useState("30 Days");
  const [poRemarks, setPoRemarks] = useState("");
  const [poDueDate, setPoDueDate] = useState("");

  // Expiring/low stock items filtered by selected supplier
  const supplierExpiringItems = useMemo(() => {
    if (!poSupplier) return [];
    return inventoryData.filter(item => item.supplier === poSupplier && (item.status === "expiring" || item.status === "low"));
  }, [poSupplier]);

  // PDF
  const printRef = useRef<HTMLDivElement>(null);
  const [printingPO, setPrintingPO] = useState<PurchaseOrder | null>(null);

  // Handle incoming item from inventory
  useEffect(() => {
    const state = location.state as { newPOItem?: { drug: string; qty: number; rate: number; supplier: string; batch: string; expiry: string } } | null;
    if (state?.newPOItem) {
      const { drug, qty, rate, supplier } = state.newPOItem;
      setPoSupplier(supplier);
      setPoItems([{ drug, qty, rate }]);
      setPoRemarks("");
      setPoDeliveryDate("");
      setPoPaymentTerms("30 Days");
      setPoDueDate("");
      setShowAdd(true);
      // Clear navigation state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const openReceiveStock = (order: PurchaseOrder) => {
    setReceiveTarget(order);
    setReceiveItems(order.items.map(item => ({
      drug: item.drug,
      orderedQty: item.qty,
      receivedQty: item.qty,
      batch: "",
      expiry: "",
      mrp: item.rate * 1.3, // default MRP ~30% markup
      rackLocation: "",
    })));
    setShowReceiveStock(true);
    setSelected(null);
  };

  const updateReceiveItem = (index: number, field: keyof ReceiveItem, value: string | number) => {
    setReceiveItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleReceiveStock = () => {
    const validItems = receiveItems.filter(i => i.receivedQty > 0 && i.batch.trim());
    if (validItems.length === 0) {
      toast.error("Please enter batch number for at least one item");
      return;
    }
    const totalReceived = validItems.reduce((s, i) => s + i.receivedQty, 0);
    toast.success(`${totalReceived} units from ${receiveTarget?.id} added to inventory`, {
      description: `${validItems.length} items received from ${receiveTarget?.supplier}`,
    });
    setShowReceiveStock(false);
    setReceiveTarget(null);
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

  // PO form helpers
  const addPOItem = () => setPoItems(prev => [...prev, { drug: "", qty: 0, rate: 0 }]);
  const updatePOItem = (index: number, field: keyof POItem, value: string | number) => {
    setPoItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };
  const removePOItem = (index: number) => {
    if (poItems.length <= 1) return;
    setPoItems(prev => prev.filter((_, i) => i !== index));
  };

  const poTotal = poItems.reduce((s, i) => s + i.qty * i.rate, 0);

  const getNewPONumber = () => {
    const d = new Date();
    return `PO-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(orders.length + 1).padStart(3, '0')}`;
  };

  const handleCreatePO = () => {
    const validItems = poItems.filter(i => i.drug.trim() && i.qty > 0);
    if (!poSupplier || validItems.length === 0) {
      toast.error("Please fill supplier and at least one item");
      return;
    }
    toast.success(`Purchase Order ${getNewPONumber()} created for ${poSupplier}`);
    setShowAdd(false);
    resetPOForm();
  };

  const resetPOForm = () => {
    setPoSupplier("");
    setPoItems([{ drug: "", qty: 0, rate: 0 }]);
    setPoDeliveryDate("");
    setPoPaymentTerms("30 Days");
    setPoRemarks("");
    setPoDueDate("");
  };

  const handleDownloadPO = () => {
    const validItems = poItems.filter(i => i.drug.trim() && i.qty > 0);
    if (!poSupplier || validItems.length === 0) {
      toast.error("Please fill supplier and at least one item");
      return;
    }
    const fakePO: PurchaseOrder = {
      id: getNewPONumber(), supplier: poSupplier, date: new Date().toLocaleDateString(),
      items: validItems, status: "draft", paymentStatus: "pending",
      totalAmount: poTotal, paidAmount: 0, deliveryDate: poDeliveryDate,
      paymentTerms: poPaymentTerms, remarks: poRemarks,
    };
    setPrintingPO(fakePO);
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Purchase Order - ${fakePO.id}</title>
            <style>@media print { body { margin: 0; } @page { size: A4; margin: 0; } }</style>
            </head><body>${printRef.current.innerHTML}</body></html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
        }
      }
      setPrintingPO(null);
    }, 100);
  };

  const handleDownloadExistingPO = (order: PurchaseOrder) => {
    setPrintingPO(order);
    setTimeout(() => {
      if (printRef.current) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Purchase Order - ${order.id}</title>
            <style>@media print { body { margin: 0; } @page { size: A4; margin: 0; } }</style>
            </head><body>${printRef.current.innerHTML}</body></html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
        }
      }
      setPrintingPO(null);
    }, 100);
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
          <Button size="sm" onClick={() => { resetPOForm(); setShowAdd(true); }}><Plus className="h-4 w-4 mr-1" />New PO</Button>
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
      <div className="flex gap-2 flex-wrap">
        <DateRangeFilter />
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
              <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(order)}>
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
                  <div className="flex items-center gap-1 justify-end" onClick={e => e.stopPropagation()}>
                    {(order.status === "ordered" || order.status === "delivered") && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 text-chart-2 border-chart-2/30 hover:bg-chart-2/10" onClick={() => openReceiveStock(order)}>
                        <PackageCheck className="h-3 w-3" /> Receive
                      </Button>
                    )}
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {selected?.id}
            </DialogTitle>
            <DialogDescription>{selected?.supplier} · {selected?.date}</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Status Badges */}
              <div className="flex gap-2 flex-wrap">
                <Badge className={`text-xs ${statusConfig[selected.status].color}`}>{statusConfig[selected.status].label}</Badge>
                <Badge className={`text-xs ${paymentConfig[selected.paymentStatus].color}`}>Payment: {paymentConfig[selected.paymentStatus].label}</Badge>
                {selected.paymentTerms && <Badge variant="outline" className="text-xs">{selected.paymentTerms}</Badge>}
              </div>

              {/* PO Meta Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">PO Date</p>
                  <p className="text-xs font-semibold text-card-foreground">{selected.date}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Delivery Date</p>
                  <p className="text-xs font-semibold text-card-foreground">{selected.deliveryDate || "—"}</p>
                </div>
                <div className="rounded-lg border border-border bg-secondary/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground">Due Date</p>
                  <p className="text-xs font-semibold text-card-foreground">{selected.dueDate || "—"}</p>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Line Items</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-secondary/50 border-b border-border">
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground">#</th>
                        <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground">Item</th>
                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground">Qty</th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground">Rate</th>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={i} className="border-b border-border/50">
                          <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                          <td className="px-3 py-2 font-medium text-card-foreground">{item.drug}</td>
                          <td className="px-3 py-2 text-center font-semibold">{item.qty}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">₹{item.rate}</td>
                          <td className="px-3 py-2 text-right font-semibold">₹{(item.qty * item.rate).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="rounded-lg border border-border p-3 space-y-1.5">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Amount</span><span className="font-bold">₹{selected.totalAmount.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span className="font-semibold text-chart-2">₹{selected.paidAmount.toLocaleString()}</span></div>
                {selected.totalAmount - selected.paidAmount > 0 && (
                  <div className="flex justify-between text-sm border-t border-border pt-1.5"><span className="text-muted-foreground">Balance Due</span><span className="font-bold text-destructive">₹{(selected.totalAmount - selected.paidAmount).toLocaleString()}</span></div>
                )}
              </div>

              {selected.invoiceNo && (
                <p className="text-xs text-muted-foreground">Supplier Invoice: <span className="font-mono font-semibold text-card-foreground">{selected.invoiceNo}</span></p>
              )}

              {selected.remarks && (
                <div className="rounded-lg border border-border bg-secondary/20 p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Remarks</p>
                  <p className="text-xs text-card-foreground">{selected.remarks}</p>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-border">
                {/* Receive Stock - for ordered/delivered POs */}
                {(selected.status === "ordered" || selected.status === "delivered") && (
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-chart-2 hover:bg-chart-2/90 text-white"
                    onClick={() => openReceiveStock(selected)}
                  >
                    <PackageCheck className="h-4 w-4" /> Receive Stock & Add to Inventory
                  </Button>
                )}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => handleDownloadExistingPO(selected)}>
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </Button>
                  {selected.paymentStatus !== "paid" && (
                    <Button size="sm" className="flex-1" onClick={() => { setSelected(null); openPayment(selected); }}>Record Payment</Button>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Send PO to Supplier</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 bg-chart-2/10 hover:bg-chart-2/20 text-chart-2 border-chart-2/30"
                    disabled={!selected.supplierWhatsapp}
                    onClick={() => {
                      const msg = `Purchase Order: ${selected.id}\n\nItems:\n${selected.items.map((i, idx) => `${idx + 1}. ${i.drug} - Qty: ${i.qty} @ ₹${i.rate}`).join("\n")}\n\nTotal: ₹${selected.totalAmount.toLocaleString()}\n\nPlease confirm availability and delivery date.`;
                      window.open(`https://wa.me/${selected.supplierWhatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
                      toast.success("Opening WhatsApp...");
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    disabled={!selected.supplierEmail}
                    onClick={() => {
                      const msg = `Purchase Order: ${selected.id}\n\nItems:\n${selected.items.map((i, idx) => `${idx + 1}. ${i.drug} - Qty: ${i.qty} @ ₹${i.rate}`).join("\n")}\n\nTotal: ₹${selected.totalAmount.toLocaleString()}\n\nPlease confirm availability and delivery date.`;
                      window.open(`mailto:${selected.supplierEmail}?subject=${encodeURIComponent(`Purchase Order: ${selected.id}`)}&body=${encodeURIComponent(msg)}`);
                      toast.success("Opening email...");
                    }}
                  >
                    <Mail className="h-3.5 w-3.5" /> Email
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      const msg = `Purchase Order: ${selected.id}\n\nItems:\n${selected.items.map((i, idx) => `${idx + 1}. ${i.drug} - Qty: ${i.qty} @ ₹${i.rate}`).join("\n")}\n\nTotal: ₹${selected.totalAmount.toLocaleString()}\n\nPlease confirm availability and delivery date.`;
                      navigator.clipboard.writeText(msg);
                      toast.success("PO details copied to clipboard");
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
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

      {/* Receive Stock Dialog */}
      <Dialog open={showReceiveStock} onOpenChange={setShowReceiveStock}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-chart-2" />
              Receive Stock — {receiveTarget?.id}
            </DialogTitle>
            <DialogDescription>
              Verify received quantities, enter batch & expiry details to add items to inventory
            </DialogDescription>
          </DialogHeader>

          {receiveTarget && (
            <div className="space-y-4">
              {/* Supplier info */}
              <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2">
                <Truck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{receiveTarget.supplier}</span>
                <span className="text-xs text-muted-foreground">· {receiveTarget.date}</span>
              </div>

              {/* Items table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="px-3 py-2.5 text-left text-[10px] font-semibold text-muted-foreground">Item</th>
                      <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-muted-foreground w-16">Ordered</th>
                      <th className="px-2 py-2.5 text-center text-[10px] font-semibold text-muted-foreground w-20">Received</th>
                      <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-muted-foreground w-24">Batch *</th>
                      <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-muted-foreground w-28">Expiry</th>
                      <th className="px-2 py-2.5 text-right text-[10px] font-semibold text-muted-foreground w-20">MRP (₹)</th>
                      <th className="px-2 py-2.5 text-left text-[10px] font-semibold text-muted-foreground w-24">Rack</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiveItems.map((item, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-3 py-2 font-medium text-foreground">{item.drug}</td>
                        <td className="px-2 py-2 text-center text-muted-foreground">{item.orderedQty}</td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            value={item.receivedQty}
                            onChange={e => updateReceiveItem(i, "receivedQty", Number(e.target.value))}
                            className="h-7 text-xs text-center w-16 mx-auto"
                            min={0}
                            max={item.orderedQty}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            value={item.batch}
                            onChange={e => updateReceiveItem(i, "batch", e.target.value)}
                            placeholder="Batch #"
                            className="h-7 text-xs w-20"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="month"
                            value={item.expiry}
                            onChange={e => updateReceiveItem(i, "expiry", e.target.value)}
                            className="h-7 text-xs w-28"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            type="number"
                            value={item.mrp}
                            onChange={e => updateReceiveItem(i, "mrp", Number(e.target.value))}
                            className="h-7 text-xs text-right w-20"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <Input
                            value={item.rackLocation}
                            onChange={e => updateReceiveItem(i, "rackLocation", e.target.value)}
                            placeholder="e.g. A1-3"
                            className="h-7 text-xs w-20"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex items-center justify-between rounded-lg bg-chart-2/5 border border-chart-2/20 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Warehouse className="h-4 w-4 text-chart-2" />
                  <span className="text-sm font-medium text-foreground">
                    {receiveItems.filter(i => i.receivedQty > 0 && i.batch.trim()).length} of {receiveItems.length} items ready
                  </span>
                </div>
                <span className="text-sm font-bold text-foreground">
                  Total: {receiveItems.reduce((s, i) => s + i.receivedQty, 0)} units
                </span>
              </div>

              {receiveItems.some(i => i.receivedQty < i.orderedQty) && (
                <div className="flex items-center gap-2 rounded-lg bg-chart-4/10 border border-chart-4/20 px-3 py-2">
                  <AlertTriangle className="h-4 w-4 text-chart-4" />
                  <span className="text-xs text-chart-4 font-medium">
                    Some items have partial or zero quantities — short delivery will be noted
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowReceiveStock(false)}>Cancel</Button>
            <Button className="gap-2 bg-chart-2 hover:bg-chart-2/90" onClick={handleReceiveStock}>
              <PackageCheck className="h-4 w-4" /> Confirm & Add to Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAdd} onOpenChange={v => { if (!v) { setShowAdd(false); resetPOForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              New Purchase Order
            </DialogTitle>
            <DialogDescription>
              {poSupplier ? `Creating PO for ${poSupplier}` : "Fill supplier and item details to create a purchase order"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Supplier & Meta */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Supplier *</Label>
                <Select value={poSupplier} onValueChange={setPoSupplier}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">PO Number</Label>
                <Input value={getNewPONumber()} disabled className="h-9 bg-muted font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Expected Delivery</Label>
                <Input type="date" value={poDeliveryDate} onChange={e => setPoDeliveryDate(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Terms</Label>
                <Select value={poPaymentTerms} onValueChange={setPoPaymentTerms}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {paymentTermOptions.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Due Date</Label>
                <Input type="date" value={poDueDate} onChange={e => setPoDueDate(e.target.value)} className="h-9" />
              </div>
            </div>

            {/* Expiring Items from this Supplier */}
            {poSupplier && supplierExpiringItems.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <p className="text-xs font-semibold text-warning">Expiring / Low Stock Items from {poSupplier}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">These items from this supplier are expiring soon or running low. Select to add them to this PO.</p>
                <div className="space-y-1">
                  {supplierExpiringItems.map((item, idx) => {
                    const alreadyInPO = poItems.some(p => p.drug === item.name);
                    return (
                      <div key={idx} className="flex items-center gap-3 rounded-md border border-border bg-background p-2">
                        <Checkbox
                          checked={alreadyInPO}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              const suggestedQty = item.stock < 10 ? 100 : item.stock < 50 ? 50 : 30;
                              setPoItems(prev => {
                                const cleaned = prev.filter(p => p.drug.trim() !== "");
                                return [...cleaned, { drug: item.name, qty: suggestedQty, rate: item.purchasePrice }];
                              });
                            } else {
                              setPoItems(prev => {
                                const filtered = prev.filter(p => p.drug !== item.name);
                                return filtered.length === 0 ? [{ drug: "", qty: 0, rate: 0 }] : filtered;
                              });
                            }
                          }}
                          className="h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-card-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground">Batch: {item.batch} · Exp: {item.expiry} · Stock: {item.stock}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge className={`text-[9px] ${item.status === "low" ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning"}`}>
                            {item.status === "low" ? "Low Stock" : "Expiring"}
                          </Badge>
                          <p className="text-[10px] text-muted-foreground mt-0.5">₹{item.purchasePrice}/unit</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold">Line Items</Label>
                <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addPOItem}>
                  <Plus className="h-3 w-3" /> Add Item
                </Button>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50 border-b border-border">
                      <th className="px-3 py-2 text-left text-[10px] font-semibold text-muted-foreground uppercase">Item Name</th>
                      <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase w-24">Qty</th>
                      <th className="px-3 py-2 text-center text-[10px] font-semibold text-muted-foreground uppercase w-28">Rate (₹)</th>
                      <th className="px-3 py-2 text-right text-[10px] font-semibold text-muted-foreground uppercase w-24">Amount</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td className="px-3 py-2">
                          <Input
                            placeholder="e.g. Paracetamol 500mg"
                            value={item.drug}
                            onChange={e => updatePOItem(i, "drug", e.target.value)}
                            className="h-8 text-xs border-0 bg-transparent px-0 focus-visible:ring-0"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={() => updatePOItem(i, "qty", Math.max(0, item.qty - 10))} className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-secondary"><Minus className="h-3 w-3" /></button>
                            <Input
                              type="number" min={0} value={item.qty}
                              onChange={e => updatePOItem(i, "qty", parseInt(e.target.value) || 0)}
                              className="h-8 w-14 text-center text-xs px-1"
                            />
                            <button onClick={() => updatePOItem(i, "qty", item.qty + 10)} className="flex h-6 w-6 items-center justify-center rounded border border-border hover:bg-secondary"><Plus className="h-3 w-3" /></button>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Input
                            type="number" min={0} step="0.01" value={item.rate}
                            onChange={e => updatePOItem(i, "rate", parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs text-center"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-semibold text-card-foreground">
                          ₹{(item.qty * item.rate).toFixed(2)}
                        </td>
                        <td className="px-2 py-2">
                          {poItems.length > 1 && (
                            <button onClick={() => removePOItem(i)} className="p-1 rounded hover:bg-destructive/10">
                              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Total row */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-secondary/30 border-t border-border">
                  <p className="text-xs text-muted-foreground">{poItems.filter(i => i.drug.trim()).length} item(s)</p>
                  <p className="text-sm font-bold text-card-foreground">Total: ₹{poTotal.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <Label className="text-xs">Remarks / Notes</Label>
              <Textarea
                placeholder="e.g. Urgent order, check batch freshness, deliver before noon..."
                value={poRemarks}
                onChange={e => setPoRemarks(e.target.value)}
                className="text-xs min-h-[48px] resize-none"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownloadPO}>
              <Download className="h-3.5 w-3.5" /> Download PDF
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setShowAdd(false); resetPOForm(); }}>Cancel</Button>
              <Button size="sm" onClick={handleCreatePO} className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Create PO
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden printable PO */}
      {printingPO && (
        <div className="fixed -left-[9999px] top-0">
          <PrintablePurchaseOrder
            ref={printRef}
            poNumber={printingPO.id}
            poDate={printingPO.date}
            supplier={printingPO.supplier}
            items={printingPO.items.map(i => ({
              item: { name: i.drug, mfr: "", batch: "", expiry: "", hsn: "3004", mrp: i.rate, stock: 0, sgst: 6, cgst: 6, rack: "", status: "safe", purchasePrice: i.rate },
              qty: i.qty
            }))}
            deliveryDate={printingPO.deliveryDate || ""}
            paymentTerms={printingPO.paymentTerms || "30 Days"}
            remarks={printingPO.remarks || ""}
            pharmacyName="MedPlus Pharmacy"
            pharmacyAddress="123 Health Street, Chennai - 600001"
            pharmacyPhone="+91 98765 43210"
            pharmacyGSTIN="33AABCT1234F1ZH"
          />
        </div>
      )}
    </div>
  );
};

export default PurchasesPage;
