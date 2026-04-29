import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Wallet, TrendingUp, Receipt, Building2, Zap, Users } from "lucide-react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { useExpenses, useCreateExpense } from "@/hooks/api/useApi";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

const categoryIcons: Record<string, React.ElementType> = {
  Rent: Building2, Electricity: Zap, Salary: Users, Maintenance: Receipt, Transport: TrendingUp, Supplies: Receipt,
};

const ExpensesPage = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date(),
  });
  const [form, setForm] = useState({ category: "", amount: "", description: "", paidTo: "" });

  const queryParams = useMemo(() => ({
    page: 1,
    pageSize: 100,
    from: format(dateRange.from, "yyyy-MM-dd"),
    to: format(dateRange.to, "yyyy-MM-dd"),
  }), [dateRange]);

  const { data: expenseData, isLoading } = useExpenses(queryParams);

  const { mutate: createExpense, isPending: isSaving } = useCreateExpense();

  const expenses = useMemo(() => (expenseData?.rows as any[]) || [], [expenseData]);
  const summary = (expenseData?.meta as any)?.summary;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return expenses.filter(e =>
      !q || e.description?.toLowerCase().includes(q) || e.category?.toLowerCase().includes(q)
    );
  }, [expenses, search]);

  const totalMonth = summary?.total || 0;
  const categoryTotals = summary?.byCategory || {};
  const monthlySummary = summary?.trend || [];

  const handleSave = () => {
    if (!form.category || !form.amount) {
      toast.error("Category and Amount are required");
      return;
    }
    createExpense({
      ...form,
      amount: parseFloat(form.amount),
    }, {
      onSuccess: () => {
        toast.success("Expense recorded successfully");
        setShowAdd(false);
        setForm({ category: "", amount: "", description: "", paidTo: "" });
      },
      onError: () => toast.error("Failed to save expense"),
    });
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Expense Tracking</h1>
          <p className="text-sm text-muted-foreground">Track operational costs and overhead</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search expenses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <DateRangeFilter value={dateRange} onChange={(d: any) => setDateRange(d)} />
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-2.5"><Wallet className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-lg font-bold text-foreground">{isLoading ? "…" : `₹${totalMonth.toLocaleString()}`}</p>
              <p className="text-[11px] text-muted-foreground">This Period Total</p>
            </div>
          </CardContent>
        </Card>
        {Object.entries(categoryTotals).slice(0, 3).map(([cat, amt]) => {
          const Icon = categoryIcons[cat] || Receipt;
          return (
            <Card key={cat}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="rounded-lg bg-muted p-2.5"><Icon className="h-5 w-5 text-muted-foreground" /></div>
                <div>
                  <p className="text-lg font-bold text-foreground">₹{amt.toLocaleString()}</p>
                  <p className="text-[11px] text-muted-foreground">{cat}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Expense Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlySummary}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v / 1000}K`} />
                <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
          <CardContent className="space-y-2.5">
            {Object.entries(categoryTotals).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{cat}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${((amt as number) / ((totalMonth as number) || 1)) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-16 text-right">₹{(amt as number).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
              <p className="text-sm font-medium">Loading expenses...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-xs">Description</TableHead>
                  <TableHead className="text-xs">Paid To</TableHead>
                  <TableHead className="text-xs text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-sm text-muted-foreground italic">
                      No expenses found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((exp: any) => (
                    <TableRow key={exp._id}>
                      <TableCell className="font-semibold text-xs text-primary">{exp.expenseCode}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(exp.date), "dd MMM yyyy")}</TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{exp.category}</Badge></TableCell>
                      <TableCell className="text-sm">{exp.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{exp.paidTo}</TableCell>
                      <TableCell className="text-sm text-right font-semibold">₹{(exp.amount || 0).toLocaleString()}</TableCell>
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
          <DialogHeader><DialogTitle>Add Expense</DialogTitle><DialogDescription>Record a new expense entry</DialogDescription></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category *</Label>
                <Input className="h-10 focus-visible:ring-primary" placeholder="Rent, Salary..." value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount (₹) *</Label>
                <Input type="number" className="h-10 focus-visible:ring-primary" placeholder="0.00" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</Label>
              <Input className="h-10 focus-visible:ring-primary" placeholder="e.g. Monthly maintenance fee" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid To</Label>
              <Input className="h-10 focus-visible:ring-primary" placeholder="Vendor / person name" value={form.paidTo} onChange={e => setForm({ ...form, paidTo: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)} disabled={isSaving}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
