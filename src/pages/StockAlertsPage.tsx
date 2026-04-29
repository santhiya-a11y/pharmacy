import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle, Clock, Package, TrendingDown, Search,
  ShieldAlert, Calendar, RotateCcw, Trash2
} from "lucide-react";
import { DateRangeFilter } from "@/components/ui/date-range-filter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

type AlertTab = "expiring" | "low_stock" | "dead_stock" | "expired";

import { useInventoryStock } from "@/hooks/api/useApi";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

const StockAlertsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AlertTab>("expiring");
  const [search, setSearch] = useState("");

  const { data: stockResponse, isLoading } = useInventoryStock({
    page: 1,
    pageSize: 100,
    type: tab,
  });

  const filteredItems = useMemo(() => {
    const list = (stockResponse?.rows as any[]) || [];
    const q = search.toLowerCase();
    return list.filter(item => !q || item.name?.toLowerCase().includes(q) || item.batch?.toLowerCase().includes(q));
  }, [stockResponse, search]);

  const summary = (stockResponse?.meta as any)?.summary || { expiring: 0, lowStock: 0, expired: 0, deadStock: 0, potentialLoss: 0 };

  const tabs: { key: AlertTab; label: string; icon: any; count: number; color: string }[] = [
    { key: "expiring" as AlertTab, label: "Expiring Soon", icon: Clock, count: isLoading ? 0 : summary.expiring, color: "text-amber-600" },
    { key: "low_stock" as AlertTab, label: "Low Stock", icon: TrendingDown, count: isLoading ? 0 : summary.lowStock, color: "text-destructive" },
    { key: "dead_stock" as AlertTab, label: "Dead Stock", icon: Package, count: isLoading ? 0 : summary.deadStock, color: "text-muted-foreground" },
    { key: "expired" as AlertTab, label: "Expired", icon: ShieldAlert, count: isLoading ? 0 : summary.expired, color: "text-destructive" },
  ];

  const getDaysColor = (days: number) => {
    if (days <= 7) return "text-destructive bg-destructive/10";
    if (days <= 30) return "text-amber-700 bg-amber-100";
    return "text-emerald-700 bg-emerald-100";
  };

  const calculateDaysLeft = (expiry: string) => {
    if (!expiry) return 0;
    const diffTime = new Date(expiry).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Stock Alerts & Expiry</h1>
          <p className="text-sm text-muted-foreground">Monitor stock levels, expiry dates, and dead stock</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search medicines..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <DateRangeFilter />
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
                <p className="text-lg font-bold text-foreground">{isLoading ? "…" : t.count}</p>
                <p className="text-[11px] text-muted-foreground">{t.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
          <p className="text-xs font-medium">Analyzing stock data...</p>
        </div>
      ) : (
        <>
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
                    {filteredItems.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-12 text-sm text-muted-foreground">No expiring items found.</TableCell></TableRow>
                    ) : filteredItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-sm">{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.batch || "—"}</TableCell>
                        <TableCell className="text-sm">{item.expiry ? new Date(item.expiry).toLocaleDateString() : "—"}</TableCell>
                         <TableCell>
                           <Badge className={`text-[10px] ${getDaysColor(calculateDaysLeft(item.expiry))}`}>
                             {calculateDaysLeft(item.expiry)} days
                           </Badge>
                         </TableCell>
                        <TableCell className="text-sm">{item.stock}</TableCell>
                        <TableCell className="text-sm text-right font-semibold text-destructive">₹{(item.stock * (item.mrp || 0)).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs" 
                            onClick={() => navigate("/returns")}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />Return
                          </Button>
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
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">No low stock items found.</div>
                  ) : filteredItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{item.name}</p>
                        <p className="text-[11px] text-muted-foreground">MFR: {item.mfr || "N/A"}</p>
                      </div>
                      <div className="w-48">
                        <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                          <span>{item.stock} left</span>
                          <span>Reorder: {item.reorderLevel || 10}</span>
                        </div>
                        <Progress value={Math.min(100, (item.stock / (item.reorderLevel || 10)) * 100)} className="h-2" />
                      </div>
                      <Button 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => navigate("/purchases")}
                      >
                        Reorder
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dead Stock */}
          {tab === "dead_stock" && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4 text-muted-foreground" />Dead Stock (Blocked Capital)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Medicine</TableHead>
                      <TableHead className="text-xs">Qty</TableHead>
                      <TableHead className="text-xs">Purchase Price</TableHead>
                      <TableHead className="text-xs text-right">Blocked Value</TableHead>
                      <TableHead className="text-xs text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">No dead stock detected.</TableCell></TableRow>
                    ) : filteredItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-sm">{item.name}</TableCell>
                        <TableCell className="text-sm">{item.stock}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">₹{item.purchasePrice}</TableCell>
                        <TableCell className="text-sm text-right font-semibold text-destructive">₹{(item.stock * (item.purchasePrice || 0)).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-xs"
                            onClick={() => navigate("/returns")}
                          >
                            Discount / Return
                          </Button>
                        </TableCell>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-12 text-sm text-muted-foreground">No expired items found.</TableCell></TableRow>
                    ) : filteredItems.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-semibold text-sm">{item.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{item.batch || "—"}</TableCell>
                        <TableCell className="text-sm">{item.expiry ? new Date(item.expiry).toLocaleDateString() : "—"}</TableCell>
                        <TableCell className="text-sm">{item.stock}</TableCell>
                        <TableCell className="text-sm text-right font-semibold text-destructive">₹{(item.stock * (item.mrp || 0)).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default StockAlertsPage;
