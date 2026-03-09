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

const monthlyData = [
  { month: "Oct", amount: 28000 },
  { month: "Nov", amount: 32000 },
  { month: "Dec", amount: 35000 },
  { month: "Jan", amount: 30000 },
  { month: "Feb", amount: 27000 },
  { month: "Mar", amount: 18000 },
];

const expenses = [
  { id: "EXP-101", date: "Mar 6, 2026", category: "Rent", description: "Monthly store rent", amount: 15000, paidTo: "Landlord - Sharma Properties" },
  { id: "EXP-102", date: "Mar 5, 2026", category: "Electricity", description: "Electricity bill - Feb", amount: 3200, paidTo: "MSEDCL" },
  { id: "EXP-103", date: "Mar 4, 2026", category: "Salary", description: "Staff salary advance - Amit", amount: 5000, paidTo: "Amit (Technician)" },
  { id: "EXP-104", date: "Mar 3, 2026", category: "Maintenance", description: "AC repair", amount: 2500, paidTo: "Cool Air Services" },
  { id: "EXP-105", date: "Mar 2, 2026", category: "Transport", description: "Medicine delivery charges", amount: 800, paidTo: "Local courier" },
  { id: "EXP-106", date: "Mar 1, 2026", category: "Supplies", description: "Packaging materials", amount: 1200, paidTo: "PackRight Traders" },
];

const categoryIcons: Record<string, React.ElementType> = {
  Rent: Building2, Electricity: Zap, Salary: Users, Maintenance: Receipt, Transport: TrendingUp, Supplies: Receipt,
};

const ExpensesPage = () => {
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const totalMonth = expenses.reduce((s, e) => s + e.amount, 0);
  const filtered = expenses.filter(e =>
    !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase())
  );

  const categoryTotals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

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
          <DateRangeFilter />
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />Add Expense</Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-muted p-2.5"><Wallet className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-lg font-bold text-foreground">₹{totalMonth.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">This Month</p>
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
              <BarChart data={monthlyData}>
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
            {Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{cat}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(amt / totalMonth) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold w-16 text-right">₹{amt.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
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
            {filtered.map(exp => (
              <TableRow key={exp.id}>
                <TableCell className="font-semibold text-sm text-primary">{exp.id}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{exp.date}</TableCell>
                <TableCell><Badge variant="secondary" className="text-[10px]">{exp.category}</Badge></TableCell>
                <TableCell className="text-sm">{exp.description}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{exp.paidTo}</TableCell>
                <TableCell className="text-sm text-right font-semibold">₹{exp.amount.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Expense</DialogTitle><DialogDescription>Record a new expense entry</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Category *</Label><Input className="h-9" placeholder="Rent, Salary..." /></div>
              <div className="space-y-1.5"><Label className="text-xs">Amount (₹) *</Label><Input type="number" className="h-9" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs">Description</Label><Input className="h-9" placeholder="Brief description" /></div>
            <div className="space-y-1.5"><Label className="text-xs">Paid To</Label><Input className="h-9" placeholder="Vendor / person name" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdd(false)}>Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExpensesPage;
