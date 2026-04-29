import { useMemo, useState } from "react";
import { Plus, Monitor, Clock, Power, PowerOff, Coffee, LogIn, LogOut as LogOutIcon } from "lucide-react";
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
import { useCounterLogin, useCounterLogout, useCounters, useCreateCounter } from "@/hooks/api/useApi";

type CounterStatus = "open" | "closed" | "break";

interface Counter {
  _id: string;
  name: string;
  location: string;
  assignedEmployeeName: string | null;
  assignedEmployeeId: string | null;
  status: CounterStatus;
  openedAt: string | null | Date;
  todaySales: number;
  todayTransactions: number;
}

const statusConfig: Record<CounterStatus, { label: string; color: string; icon: typeof Power }> = {
  open: { label: "Open", color: "bg-chart-2/15 text-chart-2 border-chart-2/30", icon: Power },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground border-border", icon: PowerOff },
  break: { label: "On Break", color: "bg-chart-4/15 text-chart-4 border-chart-4/30", icon: Coffee },
};

const CountersPage = () => {
  const { currentUser } = useRole();
  const { data } = useCounters();
  const counters = (data || []) as Counter[];
  const { mutate: createCounter, isPending: isCreating } = useCreateCounter();
  const { mutate: loginCounter, isPending: isLoggingIn } = useCounterLogin();
  const { mutate: logoutCounter, isPending: isLoggingOut } = useCounterLogout();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const openCount = counters.filter(c => c.status === "open").length;
  const breakCount = counters.filter(c => c.status === "break").length;
  const totalSales = counters.reduce((s, c) => s + c.todaySales, 0);

  // Check if current user is already logged into a counter
  const myCounter = useMemo(
    () => counters.find((c) => c.assignedEmployeeId === currentUser.employeeId),
    [counters, currentUser.employeeId]
  );

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCounter(
      { name: newName.trim(), location: newLocation.trim() || undefined },
      {
        onSuccess: () => {
          setNewName("");
          setNewLocation("");
          setCreateOpen(false);
          toast.success(`${newName.trim()} created`);
        },
        onError: (err: any) => toast.error(err?.message || "Failed to create counter"),
      }
    );
  };

  const handleLogin = (counter: Counter) => {
    if (myCounter) {
      toast.error(`You're already logged into ${myCounter.name}. Log out first.`);
      return;
    }
    loginCounter(counter._id, {
      onSuccess: () => toast.success(`You're now logged into ${counter.name}`),
      onError: (err: any) => toast.error(err?.message || "Failed to login to counter"),
    });
  };

  const handleLogout = (counter: Counter) => {
    logoutCounter(counter._id, {
      onSuccess: () => toast.info(`Logged out from ${counter.name}`),
      onError: (err: any) => toast.error(err?.message || "Failed to logout from counter"),
    });
  };

  const isMe = (counter: Counter) => counter.assignedEmployeeId === currentUser.employeeId;

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
                    <p className="text-xs text-muted-foreground">
                      {myCounter.location} · Since {myCounter.openedAt ? new Date(myCounter.openedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </p>
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
                {counter.assignedEmployeeName ? (
                  <div className="flex items-center gap-2.5 bg-secondary/50 rounded-lg p-3">
                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {counter.assignedEmployeeName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{counter.assignedEmployeeName}</p>
                      <p className="text-[11px] text-muted-foreground">{counter.assignedEmployeeId} · Logged in</p>
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
                      Since {counter.openedAt ? new Date(counter.openedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "-"}
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
                      disabled={!!myCounter || isLoggingIn || isLoggingOut}
                    >
                      <LogIn className="h-3.5 w-3.5" /> Login to Counter
                    </Button>
                  )}

                  {/* My counter actions */}
                  {isMine && counter.status !== "closed" && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => handleLogout(counter)}>
                      <LogOutIcon className="h-3.5 w-3.5" /> Log Out
                    </Button>
                  )}

                  {/* Other person's counter - admin can force close */}
                  {counter.assignedEmployeeName && !isMine && counter.status !== "closed" && (
                    <Button size="sm" variant="outline" className="flex-1 gap-1.5 text-destructive" onClick={() => handleLogout(counter)}>
                      <PowerOff className="h-3.5 w-3.5" /> Force Close
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
            <Button onClick={handleCreate} disabled={!newName.trim() || isCreating}>Create Counter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CountersPage;
