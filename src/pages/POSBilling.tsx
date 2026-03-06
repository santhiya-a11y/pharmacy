import { useState } from "react";
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, Users } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CartItem {
  sno: number;
  id: number;
  name: string;
  description: string;
  mfCode: string;
  manufacturer: string;
  batch: string;
  expiry: string;
  mrp: number;
  cost: number;
  qty: number;
  gst: number;
  taxCat: string;
  discPct: number;
}

const sampleMedicines = [
  { id: 1, name: "Dolo 650mg", description: "Paracetamol 650mg Tablet", generic: "Paracetamol", mfCode: "ML-DOL", manufacturer: "Micro Labs", batch: "B102", expiry: "08/2026", mrp: 30, cost: 18, stock: 250, gst: 12, taxCat: "GST 12%" },
  { id: 2, name: "Azithromycin 500mg", description: "Azithromycin 500mg Tablet", generic: "Azithromycin", mfCode: "CP-AZI", manufacturer: "Cipla Ltd", batch: "A45", expiry: "12/2026", mrp: 100, cost: 62, stock: 45, gst: 12, taxCat: "GST 12%" },
  { id: 3, name: "Cetirizine 10mg", description: "Cetirizine HCl 10mg Tablet", generic: "Cetirizine", mfCode: "DR-CET", manufacturer: "Dr. Reddy's", batch: "C78", expiry: "03/2027", mrp: 30, cost: 12, stock: 180, gst: 12, taxCat: "GST 12%" },
  { id: 4, name: "Pantoprazole 40mg", description: "Pantoprazole Sodium 40mg", generic: "Pantoprazole", mfCode: "SN-PAN", manufacturer: "Sun Pharma", batch: "P12", expiry: "06/2026", mrp: 60, cost: 28, stock: 92, gst: 12, taxCat: "GST 12%" },
  { id: 5, name: "Amoxicillin 250mg", description: "Amoxicillin Trihydrate 250mg", generic: "Amoxicillin", mfCode: "GS-AMX", manufacturer: "GSK Pharma", batch: "AM33", expiry: "05/2026", mrp: 50, cost: 22, stock: 8, gst: 12, taxCat: "GST 12%" },
  { id: 6, name: "Metformin 500mg", description: "Metformin HCl 500mg Tablet", generic: "Metformin", mfCode: "US-MET", manufacturer: "USV Ltd", batch: "M90", expiry: "11/2026", mrp: 25, cost: 10, stock: 300, gst: 5, taxCat: "GST 5%" },
  { id: 7, name: "Crocin Advance", description: "Paracetamol 500mg Tablet", generic: "Paracetamol", mfCode: "GS-CRO", manufacturer: "GSK Pharma", batch: "CR55", expiry: "09/2026", mrp: 28, cost: 15, stock: 150, gst: 12, taxCat: "GST 12%" },
];

const POSBilling = () => {
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = search.length > 0
    ? sampleMedicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic.toLowerCase().includes(search.toLowerCase()) ||
        m.mfCode.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const addToCart = (med: typeof sampleMedicines[0]) => {
    const existing = cart.find(c => c.id === med.id);
    if (existing) {
      setCart(cart.map(c => c.id === med.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, {
        sno: cart.length + 1,
        id: med.id,
        name: med.name,
        description: med.description,
        mfCode: med.mfCode,
        manufacturer: med.manufacturer,
        batch: med.batch,
        expiry: med.expiry,
        mrp: med.mrp,
        cost: med.cost,
        qty: 1,
        gst: med.gst,
        taxCat: med.taxCat,
        discPct: 0,
      }]);
    }
    setSearch("");
    setShowSuggestions(false);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const updateDiscount = (id: number, disc: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, discPct: Math.min(100, Math.max(0, disc)) } : c));
  };

  const removeItem = (id: number) => {
    setCart(cart.filter(c => c.id !== id).map((c, i) => ({ ...c, sno: i + 1 })));
  };

  const getItemTotal = (item: CartItem) => {
    const base = item.mrp * item.qty;
    const discounted = base - (base * item.discPct / 100);
    return discounted;
  };

  const subtotal = cart.reduce((s, c) => s + getItemTotal(c), 0);
  const totalGst = cart.reduce((s, c) => s + (getItemTotal(c) * c.gst) / 100, 0);
  const totalDiscount = cart.reduce((s, c) => s + (c.mrp * c.qty * c.discPct / 100), 0);
  const total = subtotal + totalGst;

  return (
    <div className="flex h-[calc(100vh-7rem)] gap-4">
      {/* Left - Search & Cart */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search medicine (name / generic / MF code / barcode)..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            className="h-12 pl-11 text-base bg-card border-border"
            autoFocus
          />
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
                    <p className="text-xs text-muted-foreground">{med.description} • {med.manufacturer}</p>
                    <p className="text-xs text-muted-foreground">MF: {med.mfCode} • Batch: {med.batch} • Exp: {med.expiry}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold text-card-foreground">₹{med.mrp}</p>
                    <p className="text-xs text-muted-foreground">Cost: ₹{med.cost}</p>
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
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <div className="bg-secondary/50 px-3 py-2.5 grid grid-cols-[32px_56px_1.5fr_1fr_60px_70px_70px_64px_70px_64px_70px_32px] gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                <span>S.</span>
                <span>MF Code</span>
                <span>Description</span>
                <span>Manufacture</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Cost</span>
                <span className="text-center">Tax Cat</span>
                <span>Batch</span>
                <span>Expiry</span>
                <span className="text-right">MRP</span>
                <span className="text-right">Disc %</span>
                <span></span>
              </div>
              <div className="max-h-[calc(100vh-22rem)] overflow-y-auto scrollbar-thin">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Search className="h-10 w-10 mb-3 opacity-30" />
                    <p className="text-sm">Search and add medicines to start billing</p>
                  </div>
                ) : (
                  <>
                    {cart.map(item => (
                      <div key={item.id} className="grid grid-cols-[32px_56px_1.5fr_1fr_60px_70px_70px_64px_70px_64px_70px_32px] gap-1 items-center px-3 py-2.5 border-b border-border/50 animate-fade-in text-xs">
                        <span className="text-muted-foreground font-medium">{item.sno}</span>
                        <span className="text-muted-foreground font-mono truncate" title={item.mfCode}>{item.mfCode}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>
                        </div>
                        <span className="text-muted-foreground truncate" title={item.manufacturer}>{item.manufacturer}</span>
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => updateQty(item.id, -1)} className="rounded p-0.5 hover:bg-secondary transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-semibold">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="rounded p-0.5 hover:bg-secondary transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-right text-muted-foreground">₹{item.cost}</p>
                        <p className="text-center text-muted-foreground">{item.taxCat}</p>
                        <span className="font-mono text-muted-foreground">{item.batch}</span>
                        <span className="text-muted-foreground">{item.expiry}</span>
                        <p className="text-right font-semibold">₹{item.mrp}</p>
                        <div className="flex justify-end">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discPct}
                            onChange={e => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="w-12 rounded border border-border bg-background px-1 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-ring"
                          />
                        </div>
                        <button onClick={() => removeItem(item.id)} className="rounded p-1 hover:bg-destructive/10 transition-colors">
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                    {/* Totals row */}
                    <div className="grid grid-cols-[32px_56px_1.5fr_1fr_60px_70px_70px_64px_70px_64px_70px_32px] gap-1 items-center px-3 py-2.5 bg-secondary/30 text-xs font-semibold">
                      <span></span>
                      <span></span>
                      <span className="text-card-foreground">{cart.length} item(s)</span>
                      <span></span>
                      <span className="text-center text-card-foreground">{cart.reduce((s, c) => s + c.qty, 0)}</span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                      <span className="text-right text-card-foreground">₹{subtotal.toFixed(2)}</span>
                      <span></span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Payment Panel */}
      <div className="w-72 shrink-0 flex flex-col gap-3">
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-card-foreground text-sm">Bill Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span><span>₹{(subtotal + totalDiscount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span><span className="text-destructive">-₹{totalDiscount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST</span><span>₹{totalGst.toFixed(2)}</span>
            </div>
            <div className="border-t border-border pt-2 flex justify-between text-lg font-bold text-card-foreground">
              <span>Total</span><span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h3 className="font-semibold text-card-foreground text-sm">Payment Method</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Cash", icon: Banknote },
              { label: "UPI", icon: Smartphone },
              { label: "Card", icon: CreditCard },
              { label: "Credit", icon: Users },
            ].map(method => (
              <button
                key={method.label}
                className="flex flex-col items-center gap-1 rounded-lg border border-border p-2.5 text-sm hover:bg-accent hover:border-primary transition-all"
              >
                <method.icon className="h-4 w-4 text-muted-foreground" />
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
