import { Search, Bell, LogOut, Settings, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/endpoints";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export const TopHeader = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [globalSearch, setGlobalSearch] = useState("");
  const { data: user } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    staleTime: 5 * 60 * 1000,
  });

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "??";

  const runGlobalSearch = () => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return;
    if (q.startsWith("customer") || q.includes("cust") || /^\d{3,}$/.test(q)) {
      navigate("/customers");
      return;
    }
    if (q.startsWith("supplier") || q.includes("vendor")) {
      navigate("/suppliers");
      return;
    }
    if (q.startsWith("invoice") || q.startsWith("inv") || q.includes("bill")) {
      navigate("/invoices");
      return;
    }
    if (q.startsWith("purchase") || q.startsWith("po")) {
      navigate("/purchases");
      return;
    }
    if (q.includes("stock") || q.includes("inventory")) {
      navigate("/inventory");
      return;
    }
    navigate("/medicines");
  };

  const handleNotificationsClick = () => {
    navigate("/activity");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <button
          type="button"
          onClick={runGlobalSearch}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
          aria-label="Run global search"
        >
          <Search className="h-4 w-4" />
        </button>
        <Input
          placeholder="Search medicines, customers, invoices..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runGlobalSearch();
            }
          }}
          className="pl-10 bg-secondary border-0 h-10 text-sm focus-visible:ring-1 focus-visible:ring-primary shadow-none"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleNotificationsClick}
          className="relative rounded-lg p-2.5 hover:bg-secondary transition-all group"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground ring-2 ring-card shadow-sm">
            3
          </span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl p-1.5 hover:bg-secondary transition-all group outline-none">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm overflow-hidden text-sm font-bold">
                {initials}
              </div>
              <div className="hidden sm:block text-left mr-2">
                <p className="text-sm font-bold text-foreground leading-tight">{user?.name || "Loading..."}</p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{user?.role || "Pharmacist"}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl border-border bg-card p-1.5">
            <DropdownMenuLabel className="px-2.5 py-2">
              <div className="flex flex-col space-y-1 text-left">
                <p className="text-sm font-bold text-foreground">{user?.name}</p>
                <p className="text-xs font-medium text-muted-foreground truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50 mx-1.5" />
            <DropdownMenuItem 
              onClick={() => navigate("/settings")}
              className="gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors hover:bg-secondary text-sm font-medium"
            >
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50 mx-1.5" />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="gap-2.5 rounded-lg px-2.5 py-2 cursor-pointer transition-colors bg-destructive/5 text-destructive hover:bg-destructive hover:text-destructive-foreground text-sm font-bold group"
            >
              <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
