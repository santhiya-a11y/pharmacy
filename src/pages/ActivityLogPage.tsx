import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Activity, Shield, Pill, Receipt, Users, Package,
  Clock, Filter, Download, AlertTriangle, Eye
} from "lucide-react";

type LogCategory = "all" | "dispensing" | "billing" | "inventory" | "controlled" | "access";

interface LogEntry {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: string;
  category: LogCategory;
  details: string;
  severity: "info" | "warning" | "critical";
  drugInfo?: { drug: string; qty: number; batchNo?: string };
}

const logs: LogEntry[] = [
  { id: "LOG-001", timestamp: "Mar 6, 10:42 AM", user: "Priya", role: "Admin", action: "Price Override", category: "billing", details: "Overrode MRP for Paracetamol 500mg from ₹12 to ₹10 (Bill #4521)", severity: "warning" },
  { id: "LOG-002", timestamp: "Mar 6, 10:38 AM", user: "Rahul", role: "Pharmacist", action: "Controlled Drug Dispensed", category: "controlled", details: "Dispensed Tramadol 50mg to patient PT-001 against Rx-1001", severity: "critical", drugInfo: { drug: "Tramadol 50mg", qty: 10, batchNo: "BN-7701" } },
  { id: "LOG-003", timestamp: "Mar 6, 10:30 AM", user: "Amit", role: "Technician", action: "Stock Added", category: "inventory", details: "Added 500 units of Paracetamol 500mg (Batch BN-3302)", severity: "info", drugInfo: { drug: "Paracetamol 500mg", qty: 500, batchNo: "BN-3302" } },
  { id: "LOG-004", timestamp: "Mar 6, 10:15 AM", user: "Priya", role: "Admin", action: "Bill Generated", category: "billing", details: "Bill #4520 - ₹1,240 (5 items) for Sunita Devi", severity: "info" },
  { id: "LOG-005", timestamp: "Mar 6, 09:55 AM", user: "Rahul", role: "Pharmacist", action: "Prescription Verified", category: "dispensing", details: "Verified Rx-1003 for Amit Patel (2 medications)", severity: "info" },
  { id: "LOG-006", timestamp: "Mar 6, 09:45 AM", user: "System", role: "System", action: "Expiry Alert Triggered", category: "inventory", details: "Insulin Glargine (BN-4401) expires in 3 days", severity: "warning" },
  { id: "LOG-007", timestamp: "Mar 6, 09:30 AM", user: "Priya", role: "Admin", action: "Staff Login", category: "access", details: "Admin login from IP 192.168.1.105", severity: "info" },
  { id: "LOG-008", timestamp: "Mar 6, 09:28 AM", user: "Rahul", role: "Pharmacist", action: "Controlled Drug Dispensed", category: "controlled", details: "Dispensed Codeine Phosphate to patient PT-005 against Rx-998", severity: "critical", drugInfo: { drug: "Codeine Phosphate 15mg", qty: 20, batchNo: "BN-8801" } },
  { id: "LOG-009", timestamp: "Mar 5, 06:45 PM", user: "Amit", role: "Technician", action: "Stock Return", category: "inventory", details: "Returned 12 units of expired Cough Syrup (BN-1102) to supplier", severity: "warning" },
  { id: "LOG-010", timestamp: "Mar 5, 05:30 PM", user: "Priya", role: "Admin", action: "Failed Login Attempt", category: "access", details: "3 failed login attempts from unknown device", severity: "critical" },
];

const categoryConfig: Record<LogCategory, { label: string; icon: React.ElementType; color: string }> = {
  all: { label: "All", icon: Activity, color: "text-foreground" },
  dispensing: { label: "Dispensing", icon: Pill, color: "text-primary" },
  billing: { label: "Billing", icon: Receipt, color: "text-emerald-600" },
  inventory: { label: "Inventory", icon: Package, color: "text-blue-600" },
  controlled: { label: "Controlled Drugs", icon: Shield, color: "text-destructive" },
  access: { label: "Access", icon: Users, color: "text-amber-600" },
};

const severityConfig = {
  info: { color: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  warning: { color: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  critical: { color: "bg-destructive/10 text-destructive", dot: "bg-destructive" },
};

const ActivityLogPage = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<LogCategory>("all");

  const filtered = logs.filter(log => {
    if (category !== "all" && log.category !== category) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Activity & Compliance Log</h1>
          <p className="text-sm text-muted-foreground">Complete audit trail of all system actions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search logs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" variant="outline"><Download className="h-4 w-4 mr-1" />Export</Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Today's Actions", value: logs.filter(l => l.timestamp.includes("Mar 6")).length, icon: Activity, color: "text-primary" },
          { label: "Controlled Drugs", value: logs.filter(l => l.category === "controlled").length, icon: Shield, color: "text-destructive" },
          { label: "Warnings", value: logs.filter(l => l.severity === "warning").length, icon: AlertTriangle, color: "text-amber-600" },
          { label: "Critical Events", value: logs.filter(l => l.severity === "critical").length, icon: AlertTriangle, color: "text-destructive" },
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

      {/* Category Filters */}
      <div className="flex gap-2">
        {Object.entries(categoryConfig).map(([key, cfg]) => (
          <Button
            key={key}
            size="sm"
            variant={category === key ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setCategory(key as LogCategory)}
          >
            <cfg.icon className="h-3.5 w-3.5 mr-1" />{cfg.label}
          </Button>
        ))}
      </div>

      {/* Log Timeline */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {filtered.map(log => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                <div className="mt-1.5">
                  <div className={`h-2.5 w-2.5 rounded-full ${severityConfig[log.severity].dot}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">{log.action}</span>
                    <Badge className={`text-[9px] h-4 px-1.5 ${severityConfig[log.severity].color}`}>{log.severity}</Badge>
                    {log.category === "controlled" && <Badge variant="destructive" className="text-[9px] h-4 px-1.5"><Shield className="h-2.5 w-2.5 mr-0.5" />DEA Track</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{log.details}</p>
                  {log.drugInfo && (
                    <div className="mt-1.5 inline-flex items-center gap-2 bg-muted rounded px-2 py-1">
                      <Pill className="h-3 w-3 text-primary" />
                      <span className="text-[11px] font-medium">{log.drugInfo.drug}</span>
                      <span className="text-[10px] text-muted-foreground">Qty: {log.drugInfo.qty}</span>
                      {log.drugInfo.batchNo && <span className="text-[10px] text-muted-foreground">Batch: {log.drugInfo.batchNo}</span>}
                    </div>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-medium text-foreground">{log.user}</p>
                  <p className="text-[10px] text-muted-foreground">{log.role}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{log.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityLogPage;
