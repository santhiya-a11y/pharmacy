import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Receipt, Package, Users, Warehouse,
  RotateCcw, BarChart3, Wallet, AlertTriangle, UserCircle,
  UserCog, Activity, Printer, Settings, Truck, Tags, FileText, Pill
} from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "POS Billing", icon: Receipt, path: "/pos" },
  { label: "Medicines", icon: Pill, path: "/medicines" },
  { label: "Inventory", icon: Warehouse, path: "/inventory" },
  { label: "Purchases", icon: Package, path: "/purchases" },
  { label: "Suppliers", icon: Truck, path: "/suppliers" },
  { label: "Customers", icon: UserCircle, path: "/customers" },
  { label: "Prescriptions", icon: FileText, path: "/prescriptions" },
  { label: "Expiry Management", icon: AlertTriangle, path: "/expiry" },
  { label: "Offers & Discounts", icon: Tags, path: "/offers" },
  { label: "Returns", icon: RotateCcw, path: "/returns" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Expenses", icon: Wallet, path: "/expenses" },
  { label: "Staff", icon: UserCog, path: "/staff" },
  { label: "Activity Log", icon: Activity, path: "/activity" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();

  return (
    <aside className="sidebar-gradient flex w-60 flex-col text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
          Rx
        </div>
        <div>
          <h1 className="text-sm font-bold text-sidebar-active-foreground">PharmaCare</h1>
          <p className="text-[10px] text-sidebar-foreground/60">Pharmacy ERP</p>
        </div>
      </div>

      {/* Role Selector */}
      <div className="mx-3 mt-4 mb-2 flex items-center gap-2 rounded-lg bg-sidebar-hover px-3 py-2 text-xs">
        <UserCog className="h-3.5 w-3.5" />
        <span className="font-medium text-sidebar-active-foreground">Admin View</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 scrollbar-thin space-y-0.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-sidebar-active-foreground"
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-active-foreground truncate">Admin User</p>
            <p className="text-[10px] text-sidebar-foreground/60">Owner</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
