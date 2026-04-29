import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, RotateCcw, ArrowDownLeft, ArrowUpRight, IndianRupee, Clock } from "lucide-react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
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

import { useReturns, useInvoices, useCreateReturn, useApproveReturn } from "@/hooks/api/useApi";
import { useMemo } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const statusStyles = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
};

const ReturnsPage = () => {
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "pending" | "completed">("all");
  const [showAdd, setShowAdd] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<{ drug: string; qty: number; amount: number; productBatchId?: string }[]>([]);
  const [returnReason, setReturnReason] = useState("");

  const { data: returnData, isLoading } = useReturns({
    page: 1,
    pageSize: 100,
  });

  const { data: invoiceResponse } = useInvoices({ q: invoiceSearch || undefined, pageSize: 5 });
  const invoices = (invoiceResponse?.rows as any[]) || [];

  const { mutate: createReturn, isPending: isSaving } = useCreateReturn();
  const { mutate: approveReturn, isPending: isApproving } = useApproveReturn();

  const handleSelectInvoice = (inv: any) => {
    setSelectedInvoice({
      ...inv,
      id: inv._id || inv.id,
      totalAmount: inv.grandTotal || inv.totalAmount || 0, // Fallback for key naming
      customerName: inv.customerName || inv.customer || "Walk-in"
    });
    setInvoiceSearch(inv.invoiceNo);
    setReturnItems([]);
  };

  const addItemToReturn = (item: any) => {
    const batchId = item.productBatchId || item.batchId || item._id;
    if (returnItems.find(ri => ri.productBatchId === batchId)) return;
    
    // Calculate unit price from line total to include tax/discount if needed
    const unitPrice = (Number(item.amount) || Number(item.price) || Number(item.mrp) || 0) / (Number(item.qty) || 1);
    
    setReturnItems([...returnItems, { 
      drug: item.name || item.drugName || "Unknown Medicine", 
      qty: 1, 
      amount: unitPrice, 
      productBatchId: batchId
    }]);
  };

  const totalReturnAmount = useMemo(() => returnItems.reduce((s, i) => s + (i.qty * i.amount), 0), [returnItems]);

  const returnsList = useMemo(() => {
    return (returnData?.rows as any[]) || [];
  }, [returnData]);

  const filtered = useMemo(() => {
    return returnsList.filter(r => {
      if (viewFilter !== "all" && r.status !== viewFilter) return false;
      const q = search.toLowerCase();
      if (q && !r.partyName?.toLowerCase().includes(q) && !r.returnCode?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [returnsList, viewFilter, search]);

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
          <DateRangeFilter />
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />New Return</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Total Returns", value: returnsList.length, icon: ArrowDownLeft, color: "text-amber-600" },
          { label: "Customer Credit Issued", value: returnsList.filter(r => r.type === "customer").length, icon: RotateCcw, color: "text-primary" },
          { label: "Pending Processing", value: returnsList.filter(r => r.status === "pending").length, icon: Clock, color: "text-destructive" },
          { label: "Total Value", value: `₹${returnsList.reduce((s, r) => s + (r.totalAmount || 0), 0).toLocaleString()}`, icon: IndianRupee, color: "text-primary" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2.5"><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{isLoading ? "…" : s.value}</p>
                <p className="text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        {(["all", "pending", "completed"] as const).map(f => (
          <Button key={f} size="sm" variant={viewFilter === f ? "default" : "outline"} className="h-8 text-xs capitalize" 
            onClick={() => setViewFilter(f)}>
            {f === "all" ? "All Returns" : f === "pending" ? "Pending Approval" : "Completed Returns"}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
              <p className="text-sm font-medium">Loading returns...</p>
            </div>
          ) : (
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
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-sm text-muted-foreground italic">
                      No customer returns found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((ret: any) => (
                    <TableRow key={ret.id || ret._id}>
                      <TableCell className="font-semibold text-sm text-primary">{ret.returnCode || ret.id || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-700">
                          <ArrowDownLeft className="h-2.5 w-2.5 mr-0.5" />Customer Return
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{ret.partyName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(ret.createdAt || Date.now()).toLocaleDateString()}</TableCell>
                      <TableCell className="text-sm">
                        {(ret.items || []).map((i: any) => `${i.drug} (qty: ${i.qty})`).join(", ")}
                      </TableCell>
                      <TableCell className="text-sm text-right font-semibold">₹{(ret.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${(statusStyles as any)[ret.status] || ""}`}>{ret.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        {ret.status === "pending" && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            disabled={isApproving}
                            onClick={() => {
                              approveReturn(ret._id || ret.id, {
                                onSuccess: () => toast.success("Return approved and stock updated"),
                                onError: (err: any) => toast.error(err.message || "Approval failed")
                              });
                            }}
                          >
                            {isApproving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle2 className="h-3 w-3 mr-1" />}
                            Approve
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Customer Return</DialogTitle>
            <DialogDescription>Select an invoice to process a return</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Search Invoice Number *</Label>
              <div className="relative">
                <Input 
                  className="h-9" 
                  placeholder="Type invoice #..." 
                  value={invoiceSearch}
                  onChange={e => {
                    setInvoiceSearch(e.target.value);
                    if (selectedInvoice) setSelectedInvoice(null);
                  }}
                />
                {invoiceSearch && !selectedInvoice && invoices.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-md border border-border bg-card shadow-lg p-1">
                    {invoices.map(inv => (
                      <button
                        key={inv._id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-sm"
                        onClick={() => handleSelectInvoice(inv)}
                      >
                        <div className="font-medium text-primary">{inv.invoiceNo}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {inv.customerName || "Walk-in"} · ₹{(inv.grandTotal || 0).toLocaleString()} · {new Date(inv.createdAt).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedInvoice && (
              <>
                <div className="rounded-lg bg-accent/50 p-3 space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Invoice Details</p>
                  <p className="text-sm font-medium">{selectedInvoice.customerName || "Walk-in"}</p>
                  <p className="text-xs text-muted-foreground font-semibold text-primary">Original Total: ₹{(selectedInvoice.totalAmount || 0).toLocaleString()}</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Select Items to Return</Label>
                  <div className="max-h-32 overflow-y-auto border border-border rounded-md p-1 space-y-1">
                    {(selectedInvoice.items || []).map((i: any, idx: number) => (
                      <button
                        key={idx}
                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-accent rounded-sm flex items-center justify-between"
                        onClick={() => addItemToReturn(i)}
                      >
                        <span>{i.drugName || i.name} (qty: {i.qty || i.quantity})</span>
                        <Plus className="h-3 w-3 text-primary" />
                      </button>
                    ))}
                  </div>
                </div>

                {returnItems.length > 0 && (
                  <div className="space-y-2 border-t pt-3">
                    <p className="text-xs font-semibold">Returning Items</p>
                    {returnItems.map((ri, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 truncate">{ri.drug}</span>
                        <Input 
                          type="number" 
                          className="h-7 w-16 text-[10px]" 
                          value={ri.qty} 
                          onChange={e => {
                            const newItems = [...returnItems];
                            newItems[idx].qty = Number(e.target.value);
                            setReturnItems(newItems);
                          }}
                        />
                        <span className="font-medium w-16 text-right">₹{(ri.qty * ri.amount).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center bg-primary/5 p-2 rounded-md mt-2 border border-primary/10">
                      <span className="text-xs font-semibold">Total Refund Amount</span>
                      <span className="text-sm font-bold text-primary">₹{Number(totalReturnAmount || 0).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs">Reason for Return</Label>
                  <Textarea 
                    className="min-h-[60px] text-sm" 
                    placeholder="E.g. Expired, Wrong item, etc."
                    value={returnReason}
                    onChange={e => setReturnReason(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button 
              size="sm" 
              disabled={!selectedInvoice || returnItems.length === 0 || isSaving}
              onClick={() => {
                createReturn({
                  type: "customer",
                  partyName: selectedInvoice.customerName,
                  saleId: selectedInvoice.id || selectedInvoice._id,
                  items: returnItems.map(ri => ({ ...ri, reason: returnReason })),
                  totalAmount: totalReturnAmount
                }, {
                  onSuccess: () => {
                    setShowAdd(false);
                    setInvoiceSearch("");
                    setSelectedInvoice(null);
                    setReturnItems([]);
                    setReturnReason("");
                    toast.success("Return processed successfully");
                  },
                  onError: (err: any) => toast.error(err.message || "Failed to process return")
                });
              }}
            >
              {isSaving && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
              Process Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default ReturnsPage;
