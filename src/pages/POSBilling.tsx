import { useState } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CartItem {
  id: number;
  name: string;
  batch: string;
  expiry: string;
  mrp: number;
  qty: number;
  gst: number;
}

const sampleMedicines = [
  { id: 1, name: "Dolo 650mg", generic: "Paracetamol", batch: "B102", expiry: "08/2026", mrp: 30, stock: 250, gst: 12 },
  { id: 2, name: "Azithromycin 500mg", generic: "Azithromycin", batch: "A45", expiry: "12/2026", mrp: 100, stock: 45, gst: 12 },
  { id: 3, name: "Cetirizine 10mg", generic: "Cetirizine", batch: "C78", expiry: "03/2027", mrp: 30, stock: 180, gst: 12 },
  { id: 4, name: "Pantoprazole 40mg", generic: "Pantoprazole", batch: "P12", expiry: "06/2026", mrp: 60, stock: 92, gst: 12 },
  { id: 5, name: "Amoxicillin 250mg", generic: "Amoxicillin", batch: "AM33", expiry: "05/2026", mrp: 50, stock: 8, gst: 12 },
  { id: 6, name: "Metformin 500mg", generic: "Metformin", batch: "M90", expiry: "11/2026", mrp: 25, stock: 300, gst: 5 },
  { id: 7, name: "Crocin Advance", generic: "Paracetamol", batch: "CR55", expiry: "09/2026", mrp: 28, stock: 150, gst: 12 },
];

const POSBilling = () => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = search.length > 0
    ? sampleMedicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const addToCart = (med: typeof sampleMedicines[0]) => {
    const existing = cart.find(c => c.id === med.id);
    if (existing) {
      setCart(cart.map(c => c.id === med.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: med.id, name: med.name, batch: med.batch, expiry: med.expiry, mrp: med.mrp, qty: 1, gst: med.gst }]);
    }
    setSearch("");
    setShowSuggestions(false);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const subtotal = cart.reduce((s, c) => s + c.mrp * c.qty, 0);
  const totalGst = cart.reduce((s, c) => s + (c.mrp * c.qty * c.gst) / 100, 0);
  const total = subtotal + totalGst;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-6">
      {/* Left - Search & Cart */}
      <div className="flex flex-1 flex-col">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicine (name / generic / barcode)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            className="h-12 pl-11 text-base bg-card border-border"
            autoFocus
          />
          {/* Suggestions */}
          {showSuggestions && filtered.length > 0 && (
            <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-lg overflow-hidden">
              {filtered.map(med => (
                <button
                  key={med.id}
                  onClick={() => addToCart(med)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border/50 last:border-0"
                >
                  <div>
                    <p className="text-sm font-semibold text-card-foreground">{med.name}</p>
                    <p className="text-xs text-muted-foreground">{med.generic} • Batch: {med.batch} • Exp: {med.expiry}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-card-foreground">₹{med.mrp}</p>
                    <p className={`text-xs ${med.stock < 10 ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                      Stock: {med.stock}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Table */}
        <div className="flex-1 rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-secondary/50 px-4 py-3 grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            <span>Item</span>
            <span className="text-center">Qty</span>
            <span className="text-right">Price</span>
            <span className="text-right">Total</span>
            <span className="w-8"></span>
          </div>
          <div className="max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-thin">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Search className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Search and add medicines to start billing</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-2 items-center px-4 py-3 border-b border-border/50 animate-fade-in">
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Batch: {item.batch} • Exp: {item.expiry}</p>
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => updateQty(item.id, -1)} className="rounded p-1 hover:bg-secondary transition-colors">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => updateQty(item.id, 1)} className="rounded p-1 hover:bg-secondary transition-colors">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-sm text-right text-muted-foreground">₹{item.mrp}</p>
                  <p className="text-sm text-right font-semibold">₹{(item.mrp * item.qty).toLocaleString()}</p>
                  <button onClick={() => removeItem(item.id)} className="rounded p-1.5 hover:bg-destructive/10 transition-colors">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right - Payment Panel */}
      <div className="w-80 flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-card-foreground">Bill Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span><span>₹{totalGst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span><span>₹0</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-lg font-bold text-card-foreground">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-card-foreground">Payment Method</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Cash", icon: Banknote },
              { label: "UPI", icon: Smartphone },
              { label: "Card", icon: CreditCard },
              { label: "Credit", icon: Users },
            ].map(method => (
              <button
                key={method.label}
                className="flex flex-col items-center gap-1.5 rounded-lg border border-border p-3 text-sm hover:bg-accent hover:border-primary transition-all"
              >
                <method.icon className="h-5 w-5 text-muted-foreground" />
                <span className="text-xs font-medium">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={cart.length === 0}
          className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-primary-foreground shadow-md hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Complete Sale & Print Bill
        </button>
      </div>
    </div>
  );
};

export default POSBilling;
