import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User, Phone, MapPin, Plus } from "lucide-react";

export interface Customer {
  id: number | string;
  name: string;
  phone: string;
  address: string;
  type: "regular" | "vip" | "credit";
  balance?: number;
  lastVisit: string;
  loyaltyPoints?: number;
}

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 1, name: "Rajesh Kumar", phone: "9876543210", address: "MG Road, Andheri", type: "regular", lastVisit: "2 days ago" },
  { id: 2, name: "Priya Sharma", phone: "9876543211", address: "Hill Road, Bandra", type: "vip", lastVisit: "Today" },
  { id: 3, name: "Dr. Anil Mehta", phone: "9876543212", address: "Link Road, Goregaon", type: "credit", balance: 1250, lastVisit: "1 week ago" },
  { id: 4, name: "Sunita Patil", phone: "9876543213", address: "Station Road, Dadar", type: "regular", lastVisit: "3 days ago" },
  { id: 5, name: "Mohammed Ali", phone: "9876543214", address: "JM Road, Pune", type: "vip", lastVisit: "Yesterday" },
  { id: 6, name: "Kavita Deshmukh", phone: "9876543215", address: "FC Road, Pune", type: "credit", balance: 800, lastVisit: "5 days ago" },
];

interface CustomerSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
  /** When provided, replaces built-in sample list (e.g. API-backed). */
  customers?: Customer[];
}

const typeColors: Record<string, string> = {
  regular: "bg-secondary text-secondary-foreground",
  vip: "bg-primary/10 text-primary",
  credit: "bg-chart-3/10 text-chart-3",
};

const CustomerSelector = ({ open, onOpenChange, onSelect, customers }: CustomerSelectorProps) => {
  const [search, setSearch] = useState("");
  const source = customers ?? SAMPLE_CUSTOMERS;

  const filtered = search.length > 0
    ? source.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
      )
    : source;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Select Customer
          </DialogTitle>
          <DialogDescription>Search by name or phone number</DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-10"
            autoFocus
          />
        </div>

        <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
          {filtered.map(c => (
            <button
              key={c.id}
              onClick={() => { onSelect(c); onOpenChange(false); }}
              className="w-full flex items-start gap-3 rounded-xl p-3 text-left hover:bg-accent transition-colors border border-transparent hover:border-border"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{c.name}</p>
                  <Badge className={`text-[9px] h-4 px-1.5 ${typeColors[c.type]}`}>{c.type.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" />{c.phone}
                  </span>
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{c.address}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Last visit: {c.lastVisit}</p>
                {c.balance && c.balance > 0 && (
                  <p className="text-[10px] text-destructive font-medium mt-0.5">Outstanding: ₹{c.balance}</p>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No customers found</p>
              <p className="text-xs mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        <button className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
          <Plus className="h-4 w-4" />
          Add New Customer
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerSelector;
