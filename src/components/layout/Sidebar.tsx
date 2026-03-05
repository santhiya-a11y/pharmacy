import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, Package, Users, Warehouse,
  RotateCcw, BarChart3, Wallet, AlertTriangle, UserCircle,
  UserCog, Activity, Settings, Truck, Tags, FileText, Pill, ChevronDown, LogOut
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Billing (POS)", icon: Receipt, path: "/pos" },
  { label: "Medicines", icon: Pill, path: "/medicines" },
  { label: "Inventory Manage...", icon: Warehouse, path: "/inventory" },
  { label: "Purchases", icon: Package, path: "/purchases" },
  { label: "Suppliers", icon: Truck, path: "/suppliers" },
  { label: "Returns", icon: RotateCcw, path: "/returns" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Expenses", icon: Wallet, path: "/expenses" },
  { label: "Stock Alerts", icon: AlertTriangle, path: "/expiry" },
  { label: "Customers", icon: UserCircle, path: "/customers" },
  { label: "Staff", icon: UserCog, path: "/staff" },
  { label: "Activity Log", icon: Activity, path: "/activity" },
  { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

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
      <div className="mx-4 mb-3 flex items-center justify-between rounded-lg border border-border bg-secondary/50 px-3 py-2.5 text-sm cursor-pointer hover:bg-secondary transition-colors">
        <div className="flex items-center gap-2">
          <UserCog className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Admin View</span>
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 scrollbar-thin space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
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
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            P
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">Priya</p>
            <p className="text-[11px] text-muted-foreground">Admin</p>
          </div>
          <button className="rounded-md p-1.5 hover:bg-secondary transition-colors">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </aside>
  );
};
