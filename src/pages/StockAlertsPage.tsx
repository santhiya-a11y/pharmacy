import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Clock, Package, TrendingDown, Search,
  ShieldAlert, Calendar, RotateCcw, Trash2
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

type AlertTab = "expiring" | "low_stock" | "dead_stock" | "expired";

const expiringItems = [
  { drug: "Insulin Glargine", batch: "BN-4401", expiry: "Mar 9, 2026", daysLeft: 3, qty: 8, mrp: 480, supplier: "HealthCare Supplies" },
  { drug: "Amoxicillin 500mg", batch: "BN-3302", expiry: "Mar 15, 2026", daysLeft: 9, qty: 45, mrp: 12, supplier: "MedPharma" },
  { drug: "Cefixime 200mg", batch: "BN-2205", expiry: "Mar 20, 2026", daysLeft: 14, qty: 30, mrp: 18, supplier: "Generic Meds" },
  { drug: "Pantoprazole 40mg", batch: "BN-5501", expiry: "Apr 5, 2026", daysLeft: 30, qty: 120, mrp: 8, supplier: "MedPharma" },
  { drug: "Azithromycin 500mg", batch: "BN-6601", expiry: "Apr 15, 2026", daysLeft: 40, qty: 60, mrp: 22, supplier: "Generic Meds" },
];

const lowStockItems = [
  { drug: "Paracetamol 500mg", currentQty: 5, reorderLevel: 50, dailyUsage: 12, daysOfStock: 0.4 },
  { drug: "Metformin 500mg", currentQty: 18, reorderLevel: 100, dailyUsage: 8, daysOfStock: 2.3 },
  { drug: "Amoxicillin 250mg", currentQty: 22, reorderLevel: 80, dailyUsage: 6, daysOfStock: 3.7 },
  { drug: "Omeprazole 20mg", currentQty: 35, reorderLevel: 60, dailyUsage: 5, daysOfStock: 7 },
  { drug: "Cetirizine 10mg", currentQty: 40, reorderLevel: 100, dailyUsage: 10, daysOfStock: 4 },
];

const deadStockItems = [
  { drug: "Vitamin B Complex", qty: 200, lastSold: "Dec 15, 2025", daysUnsold: 81, value: 1600 },
  { drug: "Multivitamin Syrup", qty: 45, lastSold: "Nov 20, 2025", daysUnsold: 106, value: 4500 },
  { drug: "Iron Tablets", qty: 150, lastSold: "Jan 5, 2026", daysUnsold: 60, value: 900 },
];

const expiredItems = [
  { drug: "Cough Syrup (Dextro)", batch: "BN-1102", expiry: "Feb 28, 2026", qty: 12, value: 960, returnStatus: "pending" },
  { drug: "Antacid Gel", batch: "BN-0901", expiry: "Feb 15, 2026", qty: 8, value: 640, returnStatus: "returned" },
];

const StockAlertsPage = () => {
  const [tab, setTab] = useState<AlertTab>("expiring");
  const [search, setSearch] = useState("");

  const tabs: { key: AlertTab; label: string; icon: React.ElementType; count: number; color: string }[] = [
    { key: "expiring", label: "Expiring Soon", icon: Clock, count: expiringItems.length, color: "text-amber-600" },
    { key: "low_stock", label: "Low Stock", icon: TrendingDown, count: lowStockItems.length, color: "text-destructive" },
    { key: "dead_stock", label: "Dead Stock", icon: Package, count: deadStockItems.length, color: "text-muted-foreground" },
    { key: "expired", label: "Expired", icon: ShieldAlert, count: expiredItems.length, color: "text-destructive" },
  ];

  const getDaysColor = (days: number) => {
    if (days <= 7) return "text-destructive bg-destructive/10";
    if (days <= 30) return "text-amber-700 bg-amber-100";
    return "text-emerald-700 bg-emerald-100";
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock Alerts & Expiry</h1>
          <p className="text-sm text-muted-foreground">Monitor stock levels, expiry dates, and dead stock</p>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </div>

      {/* Alert Summary */}
      <div className="grid grid-cols-4 gap-3">
        {tabs.map(t => (
          <Card
            key={t.key}
            className={`cursor-pointer transition-all ${tab === t.key ? "ring-2 ring-primary shadow-md" : "hover:shadow-sm"}`}
            onClick={() => setTab(t.key)}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <div className="rounded-lg bg-muted p-2.5"><t.icon className={`h-5 w-5 ${t.color}`} /></div>
              <div>
                <p className="text-lg font-bold text-foreground">{t.count}</p>
                <p className="text-[11px] text-muted-foreground">{t.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring Soon */}
      {tab === "expiring" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" />Medicines Expiring Soon</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Medicine</TableHead>
                  <TableHead className="text-xs">Batch</TableHead>
                  <TableHead className="text-xs">Expiry</TableHead>
                  <TableHead className="text-xs">Days Left</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs text-right">Value at Risk</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-sm">{item.drug}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.batch}</TableCell>
                    <TableCell className="text-sm">{item.expiry}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${getDaysColor(item.daysLeft)}`}>
                        {item.daysLeft} days
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{item.qty}</TableCell>
                    <TableCell className="text-sm text-right font-semibold text-destructive">₹{(item.qty * item.mrp).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" className="h-7 text-xs"><RotateCcw className="h-3 w-3 mr-1" />Return</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Low Stock */}
      {tab === "low_stock" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><TrendingDown className="h-4 w-4 text-destructive" />Low Stock Items</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {lowStockItems.map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{item.drug}</p>
                    <p className="text-[11px] text-muted-foreground">Daily usage: ~{item.dailyUsage} units</p>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>{item.currentQty} left</span>
                      <span>Reorder: {item.reorderLevel}</span>
                    </div>
                    <Progress value={(item.currentQty / item.reorderLevel) * 100} className="h-2" />
                  </div>
                  <Badge className={`text-[10px] ${item.daysOfStock < 1 ? "bg-destructive/10 text-destructive" : item.daysOfStock < 3 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                    {item.daysOfStock < 1 ? "Critical" : `${item.daysOfStock.toFixed(1)}d left`}
                  </Badge>
                  <Button size="sm" className="h-7 text-xs">Reorder</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dead Stock */}
      {tab === "dead_stock" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" />Dead Stock (Unsold &gt; 60 days)</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Medicine</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs">Last Sold</TableHead>
                  <TableHead className="text-xs">Days Unsold</TableHead>
                  <TableHead className="text-xs text-right">Blocked Value</TableHead>
                  <TableHead className="text-xs text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deadStockItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-sm">{item.drug}</TableCell>
                    <TableCell className="text-sm">{item.qty}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.lastSold}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{item.daysUnsold} days</Badge></TableCell>
                    <TableCell className="text-sm text-right font-semibold text-destructive">₹{item.value.toLocaleString()}</TableCell>
                    <TableCell className="text-right"><Button size="sm" variant="outline" className="h-7 text-xs">Discount / Return</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Expired */}
      {tab === "expired" && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-destructive" />Expired Medicines</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Medicine</TableHead>
                  <TableHead className="text-xs">Batch</TableHead>
                  <TableHead className="text-xs">Expired On</TableHead>
                  <TableHead className="text-xs">Qty</TableHead>
                  <TableHead className="text-xs text-right">Loss Value</TableHead>
                  <TableHead className="text-xs">Return Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredItems.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-semibold text-sm">{item.drug}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.batch}</TableCell>
                    <TableCell className="text-sm">{item.expiry}</TableCell>
                    <TableCell className="text-sm">{item.qty}</TableCell>
                    <TableCell className="text-sm text-right font-semibold text-destructive">₹{item.value.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${item.returnStatus === "returned" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {item.returnStatus === "returned" ? "Returned" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StockAlertsPage;
