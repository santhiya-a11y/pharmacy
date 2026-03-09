import { useState } from "react";
import { Search, Plus, MoreVertical, Shield, Phone, Mail, Clock, UserCheck, UserX, X, Save, CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AdminAttendanceView from "@/components/staff/AdminAttendanceView";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  shift: string;
  joinDate: string;
  avatar: string;
  sales?: number;
}

const staffData: StaffMember[] = [
  { id: "EMP-0001", name: "Priya Sharma", role: "Admin", phone: "+91 98765 43210", email: "priya@pharmacare.in", status: "active", shift: "Full Day", joinDate: "Jan 2023", avatar: "PS", sales: 45200 },
  { id: "EMP-0002", name: "Rahul Kumar", role: "Pharmacist", phone: "+91 87654 32109", email: "rahul@pharmacare.in", status: "active", shift: "Morning", joinDate: "Mar 2023", avatar: "RK", sales: 38900 },
  { id: "EMP-0003", name: "Anita Devi", role: "Cashier", phone: "+91 76543 21098", email: "anita@pharmacare.in", status: "active", shift: "Evening", joinDate: "Jun 2023", avatar: "AD", sales: 29400 },
  { id: "EMP-0004", name: "Suresh Babu", role: "Inventory Manager", phone: "+91 65432 10987", email: "suresh@pharmacare.in", status: "active", shift: "Morning", joinDate: "Aug 2023", avatar: "SB" },
  { id: "EMP-0005", name: "Meera Nair", role: "Pharmacist", phone: "+91 54321 09876", email: "meera@pharmacare.in", status: "inactive", shift: "Night", joinDate: "Nov 2023", avatar: "MN", sales: 12300 },
  { id: "EMP-0006", name: "Vikram Singh", role: "Delivery", phone: "+91 43210 98765", email: "vikram@pharmacare.in", status: "active", shift: "Full Day", joinDate: "Feb 2024", avatar: "VS" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary",
  Pharmacist: "bg-success/10 text-success",
  Cashier: "bg-warning/10 text-warning",
  "Inventory Manager": "bg-accent text-accent-foreground",
  Delivery: "bg-secondary text-secondary-foreground",
};

const roles = ["Admin", "Pharmacist", "Cashier", "Inventory Manager", "Delivery"];
const shifts = ["Morning", "Evening", "Night", "Full Day"];

const StaffPage = () => {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"staff" | "attendance">("staff");
  const [newStaff, setNewStaff] = useState({ name: "", role: "", phone: "", email: "", shift: "" });

  const filtered = staffData.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const activeCount = staffData.filter(s => s.status === "active").length;
  const updateNew = (field: string, value: string) => setNewStaff(prev => ({ ...prev, [field]: value }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage team roles, shifts, and attendance</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-lg border border-border bg-card overflow-hidden w-fit">
        <button
          onClick={() => setActiveTab("staff")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeTab === "staff" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
        >
          <UserCheck className="h-4 w-4" />
          Staff Directory
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeTab === "attendance" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}
        >
          <CalendarDays className="h-4 w-4" />
          Attendance
        </button>
      </div>

      {activeTab === "attendance" ? (
        <AdminAttendanceView />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Staff</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">{staffData.length}</p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-success" />
                <p className="text-xs text-success font-medium">Active</p>
              </div>
              <p className="text-2xl font-bold text-success mt-1">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-1.5">
                <UserX className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs text-destructive font-medium">Inactive</p>
              </div>
              <p className="text-2xl font-bold text-destructive mt-1">{staffData.length - activeCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Roles</p>
              </div>
              <p className="text-2xl font-bold text-card-foreground mt-1">{new Set(staffData.map(s => s.role)).size}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(member => (
              <div key={member.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${
                      member.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{member.id}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 ${roleColors[member.role] || "bg-secondary text-secondary-foreground"}`}>
                        {member.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.status === "active" ? "default" : "secondary"} className={`text-[10px] ${member.status === "active" ? "bg-success/15 text-success hover:bg-success/20 border-0" : "bg-muted text-muted-foreground border-0"}`}>
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <button className="rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{member.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{member.shift} Shift · Since {member.joinDate}</span>
                  </div>
                </div>

                {member.sales !== undefined && (
                  <div className="mt-4 rounded-lg bg-secondary/50 px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">This Month Sales</p>
                    <p className="text-sm font-bold text-card-foreground">₹{member.sales.toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Staff Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowAddDialog(false)}>
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-lg font-bold text-card-foreground">Add New Staff Member</h2>
              <button onClick={() => setShowAddDialog(false)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <form className="p-6 space-y-4" onSubmit={e => { e.preventDefault(); setShowAddDialog(false); }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input placeholder="e.g. Arun Patel" value={newStaff.name} onChange={e => updateNew("name", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role *</Label>
                  <Select value={newStaff.role} onValueChange={v => updateNew("role", v)}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Phone *</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={newStaff.phone} onChange={e => updateNew("phone", e.target.value)} required className="bg-background" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="name@pharmacare.in" value={newStaff.email} onChange={e => updateNew("email", e.target.value)} className="bg-background" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Shift *</Label>
                  <Select value={newStaff.shift} onValueChange={v => updateNew("shift", v)}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Select shift" /></SelectTrigger>
                    <SelectContent>
                      {shifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button type="submit" className="gap-2"><Save className="h-4 w-4" /> Add Staff</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
