import { Search, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";

export const TopHeader = () => {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search medicines, customers, invoices..."
          className="pl-10 bg-secondary border-0 h-10 text-sm"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        <button className="relative rounded-lg p-2 hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            3
          </span>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            AU
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold">Admin User</p>
            <p className="text-xs text-muted-foreground">Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
};
