import { useState } from "react";
import {
  Plus, Monitor, Clock, Power, PowerOff, Coffee,
  Trash2, LogIn, LogOut as LogOutIcon, X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRole } from "@/contexts/RoleContext";

type CounterStatus = "open" | "closed" | "break";

interface Counter {
  id: number;
  name: string;
  location: string;
  assignedEmployee: string | null;
  employeeId: string | null;
  status: CounterStatus;
  openedAt: string | null;
  todaySales: number;
  todayTransactions: number;
}

const initialCounters: Counter[] = [
  {
    id: 1, name: "Counter 1", location: "Main Hall - Left",
    assignedEmployee: "Priya Sharma", employeeId: "EMP-001",
    status: "open", openedAt: "09:00 AM",
    todaySales: 12450, todayTransactions: 28
  },
  {
    id: 2, name: "Counter 2", location: "Main Hall - Right",
    assignedEmployee: "Rahul Kumar", employeeId: "EMP-002",
    status: "open", openedAt: "09:15 AM",
    todaySales: 8720, todayTransactions: 19
  },
  {
    id: 3, name: "Counter 3", location: "Near Entrance",
    assignedEmployee: "Vikram Singh", employeeId: "EMP-004",
    status: "break", openedAt: "10:00 AM",
    todaySales: 3200, todayTransactions: 8
  },
  {
    id: 4, name: "Counter 4", location: "Express Billing",
    assignedEmployee: null, employeeId: null,
    status: "closed", openedAt: null,
    todaySales: 0, todayTransactions: 0
  },
];

const statusConfig: Record<CounterStatus, { label: string; color: string; icon: typeof Power }> = {
  open: { label: "Open", color: "bg-chart-2/15 text-chart-2 border-chart-2/30", icon: Power },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: PowerOff },
  break: { label: "On Break", color: "bg-chart-4/15 text-chart-4 border-chart-4/30", icon: Coffee },
};

const CountersPage = () => {
  const { currentUser } = useRole();
  const [counters, setCounters] = useState<Counter[]>(initialCounters);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const openCount = counters.filter(c => c.status === "open").length;
  const breakCount = counters.filter(c => c.status === "break").length;
  const totalSales = counters.reduce((s, c) => s + c.todaySales, 0);

  // Check if current user is already logged into a counter
  const myCounter = counters.find(c => c.employeeId === currentUser.employeeId);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const id = Math.max(...counters.map(c => c.id), 0) + 1;
    setCounters(prev => [...prev, {
      id, name: newName.trim(), location: newLocation.trim(),
      assignedEmployee: null, employeeId: null,
      status: "closed", openedAt: null,
      todaySales: 0, todayTransactions: 0
    }]);
    setNewName(""); setNewLocation(""); setCreateOpen(false);
    toast.success(`${newName.trim()} created`);
  };

  // Auto-login: current user logs into a counter
  const handleLogin = (counter: Counter) => {
    if (myCounter) {
      toast.error(`You're already logged into ${myCounter.name}. Log out first.`);
      return;
    }
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setCounters(prev => prev.map(c =>
      c.id === counter.id
        ? {
            ...c,
            assignedEmployee: currentUser.name,
            employeeId: currentUser.employeeId,
            status: "open",
            openedAt: now
          }
        : c
    ));
    toast.success(`You're now logged into ${counter.name}`);
  };

  // Logout from counter
  const handleLogout = (counter: Counter) => {
    setCounters(prev => prev.map(c =>
      c.id === counter.id
        ? { ...c, assignedEmployee: null, employeeId: null, status: "closed", openedAt: null }
        : c
    ));
    toast.info(`Logged out from ${counter.name}`);
  };

  const toggleStatus = (counter: Counter, newStatus: CounterStatus) => {
    const now = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    setCounters(prev => prev.map(c =>
      c.id === counter.id
        ? {
            ...c,
            status: newStatus,
            openedAt: newStatus === "open" ? now : newStatus === "closed" ? null : c.openedAt,
            // If closing, also log out the employee
            ...(newStatus === "closed" ? { assignedEmployee: null, employeeId: null } : {})
          }
        : c
    ));
    toast.success(`${counter.name} → ${statusConfig[newStatus].label}`);
  };

  const handleDelete = (counter: Counter) => {
    if (counter.status === "open") {
      toast.error("Close the counter before deleting");
      return;
    }
    setCounters(prev => prev.filter(c => c.id !== counter.id));
    toast.success(`${counter.name} deleted`);
  };

  const isMe = (counter: Counter) => counter.employeeId === currentUser.employeeId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Counter Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Login to a counter to start billing · Logged in as <span className="font-medium text-foreground">{currentUser.name}</span>
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Counter
        </Button>
      </div>

      {/* My Counter Banner */}
      {myCounter && (
        <div className="flex items-center gap-3 rounded-xl border border-chart-2/30 bg-chart-2/5 px-4 py-3">
          <div className="h-9 w-9 rounded-lg bg-chart-2/15 flex items-center justify-center">
            <Monitor className="h-5 w-5 text-chart-2" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">
              You're active on <span className="text-chart-2">{myCounter.name}</span>
            </p>
            <p className="text-xs text-muted-foreground">{myCounter.location} · Since {myCounter.openedAt}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleLogout(myCounter)}>
            <LogOutIcon className="h-3.5 w-3.5" /> Log Out
          </Button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{counters.length}</p>
              <p className="text-xs text-muted-foreground">Total Counters</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-2/10 flex items-center justify-center">
              <Power className="h-5 w-5 text-chart-2" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{openCount}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-4/10 flex items-center justify-center">
              <Coffee className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{breakCount}</p>
              <p className="text-xs text-muted-foreground">On Break</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-chart-1/10 flex items-center justify-center">
              <span className="text-chart-1 font-bold text-sm">₹</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">₹{totalSales.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">Today's Sales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Counter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {counters.map(counter => {
          const cfg = statusConfig[counter.status];
          const StatusIcon = cfg.icon;
          const isMine = isMe(counter);
          return (
            <Card key={counter.id} className={`relative overflow-hidden ${isMine ? "ring-2 ring-chart-2/40" : ""}`}>
              {/* Status indicator strip */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${
                counter.status === "open" ? "bg-chart-2" :
                counter.status === "break" ? "bg-chart-4" : "bg-muted-foreground/30"
              }`} />

              <CardHeader className="pb-3 pt-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-secondary flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        {counter.name}
                        {isMine && <span className="text-xs font-normal text-chart-2 ml-2">(You)</span>}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{counter.location || "No location set"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${cfg.color}`}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {cfg.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Logged-in Employee */}
                {counter.assignedEmployee ? (
                  <div className="flex items-center gap-2.5 bg-secondary/50 rounded-lg p-3">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {counter.assignedEmployee.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{counter.assignedEmployee}</p>
                      <p className="text-[11px] text-muted-foreground">{counter.employeeId} · Logged in</p>
                    </div>
                    {isMine && (
                      <Badge className="bg-chart-2/15 text-chart-2 border-chart-2/30 text-[9px]">You</Badge>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-3 text-sm text-muted-foreground">
                    <Monitor className="h-4 w-4" /> No one logged in
                  </div>
                )}

                {/* Stats row */}
                {counter.status !== "closed" && (
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      Since {counter.openedAt}
                    </div>
                    <div className="flex gap-3">
                      <span className="font-medium text-foreground">₹{counter.todaySales.toLocaleString("en-IN")}</span>
                      <span className="text-muted-foreground">{counter.todayTransactions} txns</span>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  {/* Available counter - Login */}
                  {counter.status === "closed" && !counter.assignedEmployee && (
                    <Button
                      size="sm" className="flex-1 gap-1.5"
                      onClick={() => handleLogin(counter)}
                      disabled={!!myCounter}
                    >
                      <LogIn className="h-3.5 w-3.5" /> Login to Counter
                    </Button>
                  )}

                  {/* My counter actions */}
                  {isMine && counter.status === "open" && (
                    <>
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => toggleStatus(counter, "break")}>
                        <Coffee className="h-3.5 w-3.5" /> Break
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => handleLogout(counter)}>
                        <LogOutIcon className="h-3.5 w-3.5" /> Log Out
                      </Button>
                    </>
                  )}
                  {isMine && counter.status === "break" && (
                    <Button size="sm" className="flex-1 gap-1.5" onClick={() => toggleStatus(counter, "open")}>
                      <Power className="h-3.5 w-3.5" /> Resume
                    </Button>
                  )}

                  {/* Other person's counter - admin can force close */}
                  {counter.assignedEmployee && !isMine && counter.status !== "closed" && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-destructive" onClick={() => toggleStatus(counter, "closed")}>
                      <PowerOff className="h-3.5 w-3.5" /> Force Close
                    </Button>
                  )}

                  {/* Delete - only when closed */}
                  {counter.status === "closed" && (
                    <Button
                      size="sm" variant="ghost" className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(counter)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create Counter Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Counter</DialogTitle>
            <DialogDescription>Add a new billing counter to your pharmacy</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Counter Name</Label>
              <Input
                placeholder="e.g. Counter 5"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Input
                placeholder="e.g. Near Entrance"
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>Create Counter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CountersPage;
