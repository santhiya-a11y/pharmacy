import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, Package, Users, Warehouse,
  RotateCcw, BarChart3, Wallet, AlertTriangle, UserCircle,
  UserCog, Activity, Settings, Truck, FileText, Pill, ChevronDown, LogOut,
  Clock, Home
} from "lucide-react";
import { useRole, AppRole } from "@/contexts/RoleContext";

const adminNavGroups = [
  {
    label: "Dashboard",
    items: [
      { label: "Sales", icon: LayoutDashboard, path: "/" },
      { label: "Billing (POS)", icon: Receipt, path: "/pos" },
    ],
  },
  {
    label: "Inventory",
    items: [
      { label: "Stock", icon: Warehouse, path: "/inventory" },
      { label: "Purchases", icon: Package, path: "/purchases" },
      { label: "Returns", icon: RotateCcw, path: "/returns" },
      { label: "Suppliers", icon: Truck, path: "/suppliers" },
    ],
  },
  {
    label: "Customers",
    items: [
      { label: "Customers", icon: UserCircle, path: "/customers" },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Staff", icon: UserCog, path: "/staff" },
      { label: "Expenses", icon: Wallet, path: "/expenses" },
      { label: "Activity Log", icon: Activity, path: "/activity" },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", icon: BarChart3, path: "/reports" },
      { label: "Stock Alerts", icon: AlertTriangle, path: "/expiry" },
    ],
  },
];

const employeeNavGroups = [
  {
    label: "My Dashboard",
    items: [
      { label: "Home", icon: Home, path: "/employee" },
    ],
  },
  {
    label: "Work",
    items: [
      { label: "Billing (POS)", icon: Receipt, path: "/pos" },
    ],
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const { role, setRole, currentUser } = useRole();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const navGroups = role === "admin" ? adminNavGroups : employeeNavGroups;

  const handleRoleSwitch = (newRole: AppRole) => {
    setRole(newRole);
    setRoleMenuOpen(false);
  };

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          Rx
        </div>
        <div>
          <h1 className="text-sm font-bold text-foreground">PharmaCare</h1>
          <p className="text-[11px] text-muted-foreground">Pharmacy ERP</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="relative mx-4 mb-3">
        <button
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="w-full flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary transition-colors"
        >
          <div className="flex items-center gap-2">
            {role === "admin" ? <UserCog className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-success" />}
            <span className="font-medium text-foreground">
              {role === "admin" ? "Admin View" : "Employee View"}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${roleMenuOpen ? "rotate-180" : ""}`} />
        </button>
        {roleMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-card shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
              <button
                onClick={() => handleRoleSwitch("admin")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${role === "admin" ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-secondary"}`}
              >
                <UserCog className="h-4 w-4" />
                <div className="text-left">
                  <p>Admin View</p>
                  <p className="text-[10px] opacity-60">Full access to all modules</p>
                </div>
              </button>
              <button
                onClick={() => handleRoleSwitch("employee")}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${role === "employee" ? "bg-success/10 text-success font-semibold" : "text-muted-foreground hover:bg-secondary"}`}
              >
                <Users className="h-4 w-4" />
                <div className="text-left">
                  <p>Employee View</p>
                  <p className="text-[10px] opacity-60">Attendance & daily tasks</p>
                </div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 scrollbar-thin space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path + item.label}
                    to={item.path}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
                      isActive
                        ? "bg-accent text-primary font-semibold"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`h-[18px] w-[18px] flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link - admin only */}
      {role === "admin" && (
        <div className="px-3 pb-2">
          <NavLink
            to="/settings"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 ${
              location.pathname === "/settings"
                ? "bg-accent text-primary font-semibold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Settings className="h-[18px] w-[18px] flex-shrink-0" />
            <span>Settings</span>
          </NavLink>
        </div>
      )}

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {currentUser.avatar.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{currentUser.name.split(" ")[0]}</p>
            <p className="text-[11px] text-muted-foreground capitalize">{role}</p>
          </div>
          <button className="rounded-md p-1.5 hover:bg-secondary transition-colors">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
};
