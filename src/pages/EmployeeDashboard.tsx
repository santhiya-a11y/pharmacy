import { useState } from "react";
import { useRole } from "@/contexts/RoleContext";
import { useAttendance } from "@/hooks/useAttendance";
import {
  Clock, LogIn, LogOut, CalendarDays, TrendingUp,
  CheckCircle2, AlertCircle, Coffee, Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const EmployeeDashboard = () => {
  const { currentUser } = useRole();
  const { clockedIn, clockInTime, clockOutTime, clockIn, clockOut, getEmployeeRecords } = useAttendance();
  const myRecords = getEmployeeRecords(currentUser.employeeId);
  const [showConfirm, setShowConfirm] = useState(false);

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Good Morning" : today.getHours() < 17 ? "Good Afternoon" : "Good Evening";

  const presentDays = myRecords.filter(r => r.status === "present").length;
  const totalDays = myRecords.length;
  const attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const totalHours = myRecords.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

  const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    present: { color: "bg-success/15 text-success border-success/30", icon: CheckCircle2 },
    late: { color: "bg-warning/15 text-warning border-warning/30", icon: AlertCircle },
    absent: { color: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertCircle },
    "half-day": { color: "bg-primary/15 text-primary border-primary/30", icon: Coffee },
  };

  const handleClockAction = () => {
    if (clockedIn) {
      setShowConfirm(true);
    } else {
      clockIn();
    }
  };

  return (
    <div className="space-y-6">
      {/* Greeting + Clock */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{greeting}, {currentUser.name.split(" ")[0]} 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="flex items-center gap-4">
            {clockInTime && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground font-medium">Clocked In</p>
                <p className="text-sm font-bold text-success">{clockInTime}</p>
              </div>
            )}
            {clockOutTime && (
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground font-medium">Clocked Out</p>
                <p className="text-sm font-bold text-destructive">{clockOutTime}</p>
              </div>
            )}
            <Button
              size="lg"
              onClick={handleClockAction}
              className={`gap-2 rounded-xl px-6 text-base font-bold shadow-lg transition-all duration-300 ${
                clockedIn
                  ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  : "bg-success hover:bg-success/90 text-success-foreground"
              }`}
            >
              {clockedIn ? <LogOut className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
              {clockedIn ? "Clock Out" : "Clock In"}
            </Button>
          </div>
        </div>

        {/* Live Timer when clocked in */}
        {clockedIn && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-4 py-2.5">
            <Timer className="h-4 w-4 text-success animate-pulse" />
            <span className="text-sm font-medium text-success">You're currently on shift</span>
            <span className="text-xs text-muted-foreground ml-auto">Since {clockInTime}</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Days Present</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{presentDays}<span className="text-sm text-muted-foreground font-normal">/{totalDays}</span></p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <p className="text-xs text-muted-foreground font-medium">Attendance Rate</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{attendanceRate}%</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-warning" />
            <p className="text-xs text-muted-foreground font-medium">Hours This Week</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{totalHours.toFixed(1)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-xs text-muted-foreground font-medium">Late Arrivals</p>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{myRecords.filter(r => r.status === "late").length}</p>
        </div>
      </div>

      {/* Attendance History */}
      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-card-foreground">My Attendance History</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Last 7 days</p>
        </div>
        <div className="divide-y divide-border">
          {myRecords.slice().reverse().map((record) => {
            const cfg = statusConfig[record.status];
            const Icon = cfg.icon;
            const dateObj = new Date(record.date);
            return (
              <div key={record.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="text-center w-12">
                    <p className="text-lg font-bold text-card-foreground leading-none">{dateObj.getDate()}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">{dateObj.toLocaleDateString("en-IN", { weekday: "short" })}</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] font-semibold ${cfg.color}`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{record.shift} Shift</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-card-foreground">
                    {record.clockIn || "—"} → {record.clockOut || "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.hoursWorked ? `${record.hoursWorked}h worked` : "No data"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clock Out Confirmation */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
                <LogOut className="h-7 w-7 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-card-foreground">End Your Shift?</h3>
              <p className="text-sm text-muted-foreground mt-1">You've been clocked in since {clockInTime}.</p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground" onClick={() => { clockOut(); setShowConfirm(false); }}>
                Confirm Clock Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
