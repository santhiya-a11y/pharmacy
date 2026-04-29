import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Search, Eye, Download, FileText, IndianRupee, TrendingUp, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import ImportExportMenu from "@/components/shared/ImportExportMenu";

interface InvoiceItem {
  name: string;
  mfr: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  qty: number;
  sgst: number;
  cgst: number;
  disc: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  time: string;
  customerName: string;
  customerPhone: string;
  paymentMode: "Cash" | "UPI" | "Card" | "Split";
  items: InvoiceItem[];
  subtotal: number;
  sgstTotal: number;
  cgstTotal: number;
  discount: number;
  grandTotal: number;
  counterName: string;
  billedByName: string;
  status: "completed" | "returned" | "partial-return" | "void";
}

const sampleInvoices: Invoice[] = [
  {
    id: "65eaf1", invoiceNo: "INV-MMK4L0QV", date: "Mar 9, 2026", time: "09:44 pm", customerName: "Walk-in", customerPhone: "-",
    paymentMode: "Cash", counterName: "Counter 1", billedByName: "Priya",
    items: [
      { name: "Dolo 650mg", mfr: "Micro Labs", batch: "B102", expiry: "08/2026", hsn: "30049099", mrp: 30, qty: 1, sgst: 1.80, cgst: 1.80, disc: 0, amount: 33.60 },
    ],
    subtotal: 30.00, sgstTotal: 1.80, cgstTotal: 1.80, discount: 0, grandTotal: 33.60, status: "completed",
  },
  {
    id: "65eaf2", invoiceNo: "INV-AB12XY9Z", date: "Mar 9, 2026", time: "04:15 pm", customerName: "Rajesh Kumar", customerPhone: "9876543210",
    paymentMode: "UPI", counterName: "Counter 1", billedByName: "Priya",
    items: [
      { name: "Azithromycin 500mg", mfr: "Cipla Ltd", batch: "A45", expiry: "12/2026", hsn: "30049099", mrp: 100, qty: 3, sgst: 18.00, cgst: 18.00, disc: 0, amount: 336.00 },
      { name: "Cetirizine 10mg", mfr: "Dr. Reddy's", batch: "C78", expiry: "04/2026", hsn: "30049099", mrp: 30, qty: 10, sgst: 18.00, cgst: 18.00, disc: 5, amount: 321.00 },
    ],
    subtotal: 600.00, sgstTotal: 36.00, cgstTotal: 36.00, discount: 15.00, grandTotal: 657.00, status: "completed",
  },
  {
    id: "65eaf3", invoiceNo: "INV-CD34PQ7W", date: "Mar 8, 2026", time: "11:30 am", customerName: "Sunita Devi", customerPhone: "9123456789",
    paymentMode: "Card", counterName: "Counter 2", billedByName: "Amit",
    items: [
      { name: "Metformin 500mg", mfr: "USV Ltd", batch: "M90", expiry: "11/2026", hsn: "30049099", mrp: 25, qty: 60, sgst: 37.50, cgst: 37.50, disc: 0, amount: 1575.00 },
    ],
    subtotal: 1500.00, sgstTotal: 37.50, cgstTotal: 37.50, discount: 0, grandTotal: 1575.00, status: "completed",
  },
  {
    id: "65eaf4", invoiceNo: "INV-EF56RS3T", date: "Mar 8, 2026", time: "02:00 pm", customerName: "Vikram Singh", customerPhone: "9988776655",
    paymentMode: "Split", counterName: "Counter 1", billedByName: "Priya",
    items: [
      { name: "Pantoprazole 40mg", mfr: "Sun Pharma", batch: "P12", expiry: "06/2026", hsn: "30049099", mrp: 60, qty: 5, sgst: 18.00, cgst: 18.00, disc: 0, amount: 336.00 },
      { name: "Amoxicillin 250mg", mfr: "GSK Pharma", batch: "AM33", expiry: "05/2026", hsn: "30049099", mrp: 50, qty: 10, sgst: 30.00, cgst: 30.00, disc: 10, amount: 510.00 },
    ],
    subtotal: 800.00, sgstTotal: 48.00, cgstTotal: 48.00, discount: 50.00, grandTotal: 846.00, status: "partial-return",
  },
  {
    id: "65eaf5", invoiceNo: "INV-GH78UV1X", date: "Mar 7, 2026", time: "10:00 am", customerName: "Anita Sharma", customerPhone: "9876501234",
    paymentMode: "Cash", counterName: "Counter 1", billedByName: "Priya",
    items: [
      { name: "Dolo 650mg", mfr: "Micro Labs", batch: "B102", expiry: "08/2026", hsn: "30049099", mrp: 30, qty: 5, sgst: 9.00, cgst: 9.00, disc: 0, amount: 168.00 },
    ],
    subtotal: 150.00, sgstTotal: 9.00, cgstTotal: 9.00, discount: 0, grandTotal: 168.00, status: "returned",
  },
  {
    id: "65eaf6", invoiceNo: "INV-IJ90WX5Y", date: "Mar 7, 2026", time: "03:30 pm", customerName: "Walk-in", customerPhone: "-",
    paymentMode: "UPI", counterName: "Counter 2", billedByName: "Amit",
    items: [
      { name: "Cetirizine 10mg", mfr: "Dr. Reddy's", batch: "C78", expiry: "04/2026", hsn: "30049099", mrp: 30, qty: 2, sgst: 3.60, cgst: 3.60, disc: 0, amount: 67.20 },
      { name: "Azithromycin 500mg", mfr: "Cipla Ltd", batch: "A45", expiry: "12/2026", hsn: "30049099", mrp: 100, qty: 1, sgst: 6.00, cgst: 6.00, disc: 0, amount: 112.00 },
    ],
    subtotal: 160.00, sgstTotal: 9.60, cgstTotal: 9.60, discount: 0, grandTotal: 179.20, status: "completed",
  },
];

import { useInvoices } from "@/hooks/api/useApi";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const statusStyles: Record<string, string> = {
  completed: "bg-chart-2/10 text-chart-2",
  returned: "bg-destructive text-destructive-foreground font-bold",
  "partial-return": "bg-warning/10 text-warning",
  void: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  returned: "Returned",
  "partial-return": "Partial Return",
};

const paymentStyles: Record<string, string> = {
  Cash: "bg-chart-2/10 text-chart-2",
  UPI: "bg-primary/10 text-primary",
  Card: "bg-accent text-accent-foreground",
  Split: "bg-warning/10 text-warning",
};

const InvoicesPage = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });

  const { data: invoiceData, isLoading } = useInvoices({
    q: debouncedSearch.trim() || undefined,
    page: 1,
    pageSize: 50,
    from: format(dateRange.from, "yyyy-MM-dd"),
    to: format(dateRange.to, "yyyy-MM-dd"),
  });

  const invoices = useMemo(() => {
    const rows = (invoiceData?.rows as any[]) || [];
    return rows.map(r => ({
      ...r,
      id: r._id,
      invoiceNo: r.invoiceNo,
      date: r.date ? new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-",
      time: r.date ? new Date(r.date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : "-",
      customerName: r.customerName || "Walk-in",
      customerPhone: r.customerPhone || "-",
      counterName: r.counterName || "-",
      billedByName: r.billedByName || "-",
    }));
  }, [invoiceData]);

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      const matchPayment = paymentFilter === "all" || inv.paymentMode === paymentFilter;
      return matchStatus && matchPayment;
    });
  }, [invoices, statusFilter, paymentFilter]);

  const totals = useMemo(() => ({
    count: filtered.length,
    revenue: filtered.reduce((s, i) => s + i.grandTotal, 0),
    items: filtered.reduce((s, i) => s + i.items.reduce((a, it) => a + it.qty, 0), 0),
    tax: filtered.reduce((s, i) => s + i.sgstTotal + i.cgstTotal, 0),
  }), [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">View and manage all sales invoices</p>
        </div>
        <ImportExportMenu
          data={filtered.map(inv => ({
            id: inv.id,
            date: inv.date,
            time: inv.time,
            customer: inv.customer,
            phone: inv.phone,
            paymentMode: inv.paymentMode,
            items: inv.items.map(i => `${i.name} x${i.qty}`).join("; "),
            subtotal: inv.subtotal,
            tax: inv.sgstTotal + inv.cgstTotal,
            discount: inv.discount,
            grandTotal: inv.grandTotal,
            status: inv.status,
            counter: inv.counter,
            billedBy: inv.billedBy,
          }))}
          columns={[
            { key: "id", label: "Invoice #" },
            { key: "date", label: "Date" },
            { key: "time", label: "Time" },
            { key: "customer", label: "Customer" },
            { key: "phone", label: "Phone" },
            { key: "paymentMode", label: "Payment" },
            { key: "items", label: "Items" },
            { key: "subtotal", label: "Subtotal" },
            { key: "tax", label: "Tax" },
            { key: "discount", label: "Discount" },
            { key: "grandTotal", label: "Grand Total" },
            { key: "status", label: "Status" },
            { key: "counter", label: "Counter" },
            { key: "billedBy", label: "Billed By" },
          ]}
          filenamePrefix="invoices"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2.5">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-xl font-bold text-card-foreground">{totals.count}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-chart-2/10 p-2.5">
            <IndianRupee className="h-5 w-5 text-chart-2" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-xl font-bold text-card-foreground">₹{totals.revenue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-warning/10 p-2.5">
            <TrendingUp className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tax Collected</p>
            <p className="text-xl font-bold text-card-foreground">₹{totals.tax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="rounded-lg bg-accent p-2.5">
            <Receipt className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Items Sold</p>
            <p className="text-xl font-bold text-card-foreground">{totals.items}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search invoice #, customer, phone, medicine..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-card border-border"
          />
        </div>
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="partial-return">Partial Return</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentFilter} onValueChange={setPaymentFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Payments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Payments</SelectItem>
            <SelectItem value="Cash">Cash</SelectItem>
            <SelectItem value="UPI">UPI</SelectItem>
            <SelectItem value="Card">Card</SelectItem>
            <SelectItem value="Split">Split</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/50">
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Invoice #</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Date & Time</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Customer</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Items</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">Amount</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Payment</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Status</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Counter</TableHead>
              <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                  No invoices found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(inv => (
                <TableRow
                  key={inv.id}
                  className={`cursor-pointer transition-colors ${inv.status === 'returned' ? 'bg-destructive/5' : 'hover:bg-accent/30'}`}
                  onClick={() => setSelected(inv)}
                >
                  <TableCell className="font-mono font-medium text-primary">
                    <div className="flex flex-col gap-1">
                      {inv.invoiceNo}
                      {inv.status === "returned" && (
                        <span className="inline-flex items-center text-[9px] font-bold text-destructive uppercase">
                          Return Processed
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-card-foreground">{inv.date}</div>
                    <div className="text-xs text-muted-foreground">{inv.time}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-card-foreground">{inv.customerName}</div>
                    {inv.customerPhone !== "-" && <div className="text-xs text-muted-foreground">{inv.customerPhone}</div>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {inv.items.length} item{inv.items.length > 1 ? "s" : ""} · {inv.items.reduce((a, i) => a + i.qty, 0)} qty
                  </TableCell>
                  <TableCell className="text-right font-semibold">₹{inv.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStyles[inv.paymentMode]}`}>
                      {inv.paymentMode}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[inv.status]}`}>
                      {statusLabels[inv.status]}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{inv.counterName}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={e => { e.stopPropagation(); setSelected(inv); }}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoice {selected?.invoiceNo}
            </DialogTitle>
            <DialogDescription>
              {selected?.date} at {selected?.time} · {selected?.counterName} · Billed by {selected?.billedByName}
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className={`space-y-4 ${selected.status === 'returned' ? 'opacity-80' : ''}`}>
              {selected.status === 'returned' && (
                <div className="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 mb-2">
                   Returned Bill — Inventory Restocked
                </div>
              )}
              {/* Customer & Payment Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Customer</p>
                  <p className="font-medium text-card-foreground">{selected.customerName}</p>
                  {selected.customerPhone !== "-" && <p className="text-sm text-muted-foreground">{selected.customerPhone}</p>}
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-1">Payment & Status</p>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStyles[selected.paymentMode]}`}>
                      {selected.paymentMode}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[selected.status]}`}>
                      {statusLabels[selected.status]}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/50">
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Item</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Batch</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Expiry</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">MRP</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">Qty</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">SGST</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">CGST</TableHead>
                      <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selected.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="font-medium text-card-foreground">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.mfr}</div>
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground">{item.batch}</TableCell>
                        <TableCell className="text-muted-foreground">{item.expiry}</TableCell>
                        <TableCell className="text-right">₹{item.mrp}</TableCell>
                        <TableCell className="text-right font-semibold">{item.qty}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{item.sgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">₹{item.cgst.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-semibold">₹{item.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Totals */}
              <div className="rounded-lg border border-border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>₹{selected.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">SGST</span>
                  <span>₹{selected.sgstTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CGST</span>
                  <span>₹{selected.cgstTotal.toFixed(2)}</span>
                </div>
                {selected.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="text-destructive">-₹{selected.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                  <span>Grand Total</span>
                  <span className="text-primary">₹{selected.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
