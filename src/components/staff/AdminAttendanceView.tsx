import { useState } from "react";
import { useAttendance, AttendanceRecord } from "@/hooks/useAttendance";
import {
  Users, UserCheck, UserX, Clock, AlertCircle,
  ChevronDown, Search, CalendarDays
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const statusStyles: Record<string, string> = {
  present: "bg-success/15 text-success border-success/30",
  late: "bg-warning/15 text-warning border-warning/30",
  absent: "bg-destructive/15 text-destructive border-destructive/30",
  "half-day": "bg-primary/15 text-primary border-primary/30",
};

const AdminAttendanceView = () => {
  const { records, getAttendanceSummary, getTodayRecords } = useAttendance();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"today" | "weekly">("today");
  const summary = getAttendanceSummary();

  const todayRecords = getTodayRecords();

  // Group by employee for weekly view
  const employeeMap = new Map<string, AttendanceRecord[]>();
  records.forEach((r) => {
    if (!employeeMap.has(r.employeeId)) employeeMap.set(r.employeeId, []);
    employeeMap.get(r.employeeId)!.push(r);
  });

  const filteredToday = todayRecords.filter((r) => {
    const matchSearch = r.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Total Staff</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="h-4 w-4 text-success" />
            <p className="text-xs text-success font-medium">Present</p>
          </div>
          <p className="text-2xl font-bold text-success">{summary.present}</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-warning" />
            <p className="text-xs text-warning font-medium">Late</p>
          </div>
          <p className="text-2xl font-bold text-warning">{summary.late}</p>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <UserX className="h-4 w-4 text-destructive" />
            <p className="text-xs text-destructive font-medium">Absent</p>
          </div>
          <p className="text-2xl font-bold text-destructive">{summary.absent}</p>
        </div>
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Half Day</p>
          </div>
          <p className="text-2xl font-bold text-primary">{summary.halfDay}</p>
        </div>
      </div>

      {/* View Toggle + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex rounded-lg border border-border bg-card overflow-hidden">
          <button
            onClick={() => setViewMode("today")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "today" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            Today
          </button>
          <button
            onClick={() => setViewMode("weekly")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${viewMode === "weekly" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
          >
            Weekly
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
        </div>
        {viewMode === "today" && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40 bg-card border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
              <SelectItem value="half-day">Half Day</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Today View */}
      {viewMode === "today" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-3 bg-secondary/30">
            <div className="grid grid-cols-5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span className="col-span-2">Employee</span>
              <span>Status</span>
              <span>Clock In / Out</span>
              <span className="text-right">Hours</span>
            </div>
          </div>
          <div className="divide-y divide-border">
            {filteredToday.map((record) => (
              <div key={record.id} className="grid grid-cols-5 items-center px-5 py-3.5 hover:bg-secondary/20 transition-colors">
                <div className="col-span-2 flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                    record.status === "present" || record.status === "late" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {record.employeeName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{record.employeeName}</p>
                    <p className="text-[11px] text-muted-foreground">{record.shift} Shift</p>
                  </div>
                </div>
                <div>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${statusStyles[record.status]}`}>
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                  </Badge>
                </div>
                <div className="text-sm text-card-foreground">
                  {record.clockIn || "—"} → {record.clockOut || "—"}
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-card-foreground">
                    {record.hoursWorked ? `${record.hoursWorked}h` : "—"}
                  </span>
                </div>
              </div>
            ))}
            {filteredToday.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">No records found</div>
            )}
          </div>
        </div>
      )}

      {/* Weekly View */}
      {viewMode === "weekly" && (
        <div className="space-y-3">
          {Array.from(employeeMap.entries())
            .filter(([, recs]) => recs[0].employeeName.toLowerCase().includes(search.toLowerCase()))
            .map(([empId, recs]) => {
              const sorted = recs.sort((a, b) => a.date.localeCompare(b.date));
              const totalH = sorted.reduce((s, r) => s + (r.hoursWorked || 0), 0);
              const presentCount = sorted.filter(r => r.status === "present").length;
              return (
                <div key={empId} className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {sorted[0].employeeName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-card-foreground">{sorted[0].employeeName}</p>
                        <p className="text-[11px] text-muted-foreground">{sorted[0].shift} Shift · {totalH.toFixed(1)}h this week</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-card-foreground">{Math.round((presentCount / sorted.length) * 100)}%</p>
                      <p className="text-[10px] text-muted-foreground">Attendance</p>
                    </div>
                  </div>
                  {/* Day pills */}
                  <div className="flex gap-1.5">
                    {sorted.map((r) => {
                      const d = new Date(r.date);
                      const dayLabel = d.toLocaleDateString("en-IN", { weekday: "narrow" });
                      return (
                        <div
                          key={r.id}
                          className={`flex-1 rounded-lg border py-2 text-center text-[11px] font-medium ${statusStyles[r.status]}`}
                          title={`${r.date}: ${r.status}`}
                        >
                          <p className="text-[9px] opacity-70">{dayLabel}</p>
                          <p>{r.status === "present" ? "✓" : r.status === "late" ? "L" : r.status === "absent" ? "✗" : "½"}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default AdminAttendanceView;
