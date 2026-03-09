import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone,
  ShoppingBag, Pill, ArrowLeft, Keyboard, Clock, User, Pause, Printer, Hash,
  AlertTriangle, FileText, ChevronRight, X, SplitSquareHorizontal, Paperclip,
  Camera, Upload, Star, Gift, Phone, CalendarClock, Monitor
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import DosageBuilder from "@/components/billing/DosageBuilder";
import FrequencySelector, { FrequencyData } from "@/components/billing/FrequencySelector";
import BagSelector, { BagItem } from "@/components/billing/BagSelector";
import CustomerSelector, { Customer } from "@/components/billing/CustomerSelector";
import SaleReceiptDialog from "@/components/billing/SaleReceiptDialog";

interface CartItem {
  sno: number;
  id: number;
  name: string;
  description: string;
  mfr: string;
  batch: string;
  expiry: string;
  hsn: string;
  mrp: number;
  qty: number;
  sgst: number;
  cgst: number;
  discPct: number;
  dosageLabel?: string;
  frequency?: FrequencyData | null;
  isBag?: boolean;
  requiresRx?: boolean;
  rxVerified?: boolean;
  rxDoctorName?: string;
  rxImageUrl?: string;
}

interface HeldBill {
  id: string;
  timestamp: number;
  customer: Customer | null;
  customerName: string;
  cart: CartItem[];
  rxDoctorName?: string;
  rxImageUrl?: string;
}

interface SplitPayment {
  method: string;
  amount: number;
}

const sampleMedicines = [
  { id: 1, name: "Dolo 650mg", description: "Paracetamol 650mg Tablet", generic: "Paracetamol", mfr: "Micro Labs", batch: "B102", expiry: "08/2026", hsn: "3004", mrp: 30, cost: 18, stock: 250, gstPct: 12, requiresRx: false },
  { id: 2, name: "Azithromycin 500mg", description: "Azithromycin 500mg Tablet", generic: "Azithromycin", mfr: "Cipla Ltd", batch: "A45", expiry: "12/2026", hsn: "3004", mrp: 100, cost: 62, stock: 45, gstPct: 12, requiresRx: true },
  { id: 3, name: "Cetirizine 10mg", description: "Cetirizine HCl 10mg Tablet", generic: "Cetirizine", mfr: "Dr. Reddy's", batch: "C78", expiry: "03/2027", hsn: "3004", mrp: 30, cost: 12, stock: 180, gstPct: 12, requiresRx: false },
  { id: 4, name: "Pantoprazole 40mg", description: "Pantoprazole Sodium 40mg", generic: "Pantoprazole", mfr: "Sun Pharma", batch: "P12", expiry: "06/2026", hsn: "3004", mrp: 60, cost: 28, stock: 92, gstPct: 12, requiresRx: true },
  { id: 5, name: "Amoxicillin 250mg", description: "Amoxicillin Trihydrate 250mg", generic: "Amoxicillin", mfr: "GSK Pharma", batch: "AM33", expiry: "05/2026", hsn: "3004", mrp: 50, cost: 22, stock: 8, gstPct: 12, requiresRx: true },
  { id: 6, name: "Metformin 500mg", description: "Metformin HCl 500mg Tablet", generic: "Metformin", mfr: "USV Ltd", batch: "M90", expiry: "11/2026", hsn: "3004", mrp: 25, cost: 10, stock: 300, gstPct: 5, requiresRx: true },
  { id: 7, name: "Crocin Advance", description: "Paracetamol 500mg Tablet", generic: "Paracetamol", mfr: "GSK Pharma", batch: "CR55", expiry: "09/2026", hsn: "3004", mrp: 28, cost: 15, stock: 150, gstPct: 12, requiresRx: false },
];

const paymentMethods = [
  { label: "Cash", icon: Banknote, shortcut: "F5", color: "text-chart-2" },
  { label: "UPI", icon: Smartphone, shortcut: "F6", color: "text-chart-5" },
  { label: "Card", icon: CreditCard, shortcut: "F7", color: "text-chart-1" },
  { label: "Split", icon: SplitSquareHorizontal, shortcut: "F8", color: "text-chart-3" },
];

const splitMethods = ["Cash", "UPI", "Card"];

const SAMPLE_CUSTOMERS_INLINE = [
  { id: 1, name: "Rajesh Kumar", phone: "9876543210", address: "MG Road, Andheri", type: "regular" as const, lastVisit: "2 days ago" },
  { id: 2, name: "Priya Sharma", phone: "9876543211", address: "Hill Road, Bandra", type: "regular" as const, lastVisit: "Today" },
  { id: 3, name: "Dr. Anil Mehta", phone: "9876543212", address: "Link Road, Goregaon", type: "regular" as const, lastVisit: "1 week ago" },
  { id: 4, name: "Sunita Patil", phone: "9876543213", address: "Station Road, Dadar", type: "regular" as const, lastVisit: "3 days ago" },
  { id: 5, name: "Mohammed Ali", phone: "9876543214", address: "JM Road, Pune", type: "regular" as const, lastVisit: "Yesterday" },
];

const POSBilling = () => {
  const navigate = useNavigate();
  const searchRef = useRef<HTMLInputElement>(null);
  const rxFileRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showBagSelector, setShowBagSelector] = useState(false);
  const [showCustomerSelector, setShowCustomerSelector] = useState(false);
  const [dosageTarget, setDosageTarget] = useState<CartItem | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNo] = useState(() => `INV-${Date.now().toString(36).toUpperCase()}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);

  // Hold
  const [heldBills, setHeldBills] = useState<HeldBill[]>([]);
  const [showHeldBills, setShowHeldBills] = useState(false);

  // Rx prescription dialog
  const [showRxDialog, setShowRxDialog] = useState(false);
  const [rxTargetItemId, setRxTargetItemId] = useState<number | null>(null);
  const [rxDoctorInput, setRxDoctorInput] = useState("");
  const [rxImagePreview, setRxImagePreview] = useState<string | null>(null);

  // Frequency selector
  const [showFrequency, setShowFrequency] = useState(false);
  const [frequencyTargetId, setFrequencyTargetId] = useState<number | null>(null);

  // Split
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);

  // Loyalty
  const [redeemPoints, setRedeemPoints] = useState(0);
  const customerLoyaltyPoints = selectedCustomer ? 320 : 0; // mock
  const pointsValue = redeemPoints * 0.25; // 1 point = ₹0.25

  const filtered = search.length > 0
    ? sampleMedicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.generic.toLowerCase().includes(search.toLowerCase()) ||
        m.mfr.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F1") { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === "F2") { e.preventDefault(); setShowBagSelector(true); }
      if (e.key === "F3") { e.preventDefault(); heldBills.length > 0 ? setShowHeldBills(true) : handleHoldBill(); }
      if (e.key === "F5") { e.preventDefault(); setSelectedPayment("Cash"); setIsSplitPayment(false); }
      if (e.key === "F6") { e.preventDefault(); setSelectedPayment("UPI"); setIsSplitPayment(false); }
      if (e.key === "F7") { e.preventDefault(); setSelectedPayment("Card"); setIsSplitPayment(false); }
      if (e.key === "F8") { e.preventDefault(); setSelectedPayment("Split"); setIsSplitPayment(true); }
      if (e.key === "F9") { e.preventDefault(); handleCompleteSale(); }
      if (e.key === "Escape") { setShowSuggestions(false); setSearch(""); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, selectedPayment, isSplitPayment, splitPayments]);

  const addToCart = useCallback((med: typeof sampleMedicines[0]) => {
    const sgst = med.gstPct / 2;
    const cgst = med.gstPct / 2;
    setCart(prev => {
      const existing = prev.find(c => c.id === med.id);
      if (existing) return prev.map(c => c.id === med.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, {
        sno: prev.length + 1, id: med.id, name: med.name, description: med.description,
        mfr: med.mfr, batch: med.batch, expiry: med.expiry, hsn: med.hsn,
        mrp: med.mrp, qty: 1, sgst, cgst, discPct: 0,
        requiresRx: med.requiresRx, rxVerified: false,
      }];
    });
    setSearch(""); setShowSuggestions(false);
    if (med.requiresRx) {
      toast.warning(`${med.name} requires a prescription`, { description: "Attach Rx with doctor name & image to verify." });
    }
    if (med.stock < 10) {
      toast.info(`Low stock: Only ${med.stock} units of ${med.name} remaining`);
    }
  }, []);

  const addBagToCart = (bag: BagItem) => {
    setCart(prev => [...prev, {
      sno: prev.length + 1, id: 9000 + Math.random() * 1000,
      name: bag.name, description: bag.size + " bag", mfr: "—",
      batch: "—", expiry: "—", hsn: "3923", mrp: bag.price, qty: 1,
      sgst: 9, cgst: 9, discPct: 0, isBag: true,
    }]);
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(1, c.qty + delta) } : c));
  };

  const updateDiscount = (id: number, disc: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, discPct: Math.min(100, Math.max(0, disc)) } : c));
  };

  const removeItem = (id: number) => {
    setCart(prev => prev.filter(c => c.id !== id).map((c, i) => ({ ...c, sno: i + 1 })));
  };

  const setDosageLabel = (id: number, label: string) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, dosageLabel: label } : c));
  };

  // Rx / Frequency click — context-aware
  const handleRxClick = (itemId: number) => {
    const item = cart.find(c => c.id === itemId);
    if (!item) return;
    if (item.requiresRx) {
      // Prescription item → open Rx dialog
      openRxDialog(itemId);
    } else {
      // Non-prescription item → open frequency selector
      setFrequencyTargetId(itemId);
      setShowFrequency(true);
    }
  };

  const openRxDialog = (itemId: number) => {
    const item = cart.find(c => c.id === itemId);
    setRxTargetItemId(itemId);
    setRxDoctorInput(item?.rxDoctorName || "");
    setRxImagePreview(item?.rxImageUrl || null);
    setShowRxDialog(true);
  };

  const handleFrequencySave = (data: FrequencyData) => {
    setCart(prev => prev.map(c =>
      c.id === frequencyTargetId ? { ...c, frequency: data } : c
    ));
    toast.success("Frequency set", { description: data.pattern });
  };

  const handleRxImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setRxImagePreview(url);
    }
  };

  const handleRxSave = () => {
    if (!rxDoctorInput.trim()) { toast.error("Doctor name is required"); return; }
    setCart(prev => prev.map(c =>
      c.id === rxTargetItemId
        ? { ...c, rxVerified: true, rxDoctorName: rxDoctorInput.trim(), rxImageUrl: rxImagePreview || undefined }
        : c
    ));
    toast.success("Prescription verified", { description: `Dr. ${rxDoctorInput.trim()}` });
    setShowRxDialog(false);
    setRxDoctorInput("");
    setRxImagePreview(null);
    setRxTargetItemId(null);
  };

  const getItemAmount = (item: CartItem) => {
    const base = item.mrp * item.qty;
    const afterDisc = base - (base * item.discPct / 100);
    const sgstAmt = afterDisc * (item.sgst / 100);
    const cgstAmt = afterDisc * (item.cgst / 100);
    return afterDisc + sgstAmt + cgstAmt;
  };

  const getItemTaxable = (item: CartItem) => {
    const base = item.mrp * item.qty;
    return base - (base * item.discPct / 100);
  };

  const subtotal = cart.reduce((s, c) => s + c.mrp * c.qty, 0);
  const totalDiscount = cart.reduce((s, c) => s + (c.mrp * c.qty * c.discPct / 100), 0);
  const totalTaxable = subtotal - totalDiscount;
  const totalSgst = cart.reduce((s, c) => s + getItemTaxable(c) * (c.sgst / 100), 0);
  const totalCgst = cart.reduce((s, c) => s + getItemTaxable(c) * (c.cgst / 100), 0);
  const grandTotal = totalTaxable + totalSgst + totalCgst - pointsValue;
  const totalQty = cart.reduce((s, c) => s + c.qty, 0);
  const rxItems = cart.filter(c => c.requiresRx);
  const unverifiedRx = rxItems.filter(c => !c.rxVerified);

  // Hold Bill
  const handleHoldBill = () => {
    if (cart.length === 0) { toast.error("Add items to hold"); return; }
    const heldBill: HeldBill = {
      id: `HLD-${Date.now().toString(36).toUpperCase()}`,
      timestamp: Date.now(),
      customer: selectedCustomer,
      customerName: customerName || "Walk-in",
      cart: [...cart],
    };
    setHeldBills(prev => [...prev, heldBill]);
    toast.success(`Bill held: ${heldBill.id}`, { description: `${cart.length} items · ₹${grandTotal.toFixed(2)}` });
    handleClearBill();
  };

  const handleRecallBill = (bill: HeldBill) => {
    if (cart.length > 0) handleHoldBill();
    setCart(bill.cart);
    setSelectedCustomer(bill.customer);
    setCustomerName(bill.customerName);
    setHeldBills(prev => prev.filter(b => b.id !== bill.id));
    setShowHeldBills(false);
    toast.success(`Recalled: ${bill.id}`);
  };

  const handleDeleteHeldBill = (billId: string) => {
    setHeldBills(prev => prev.filter(b => b.id !== billId));
    toast.success("Held bill deleted");
  };

  const handleClearBill = () => {
    setCart([]);
    setSelectedPayment(null);
    setSelectedCustomer(null);
    setCustomerName("");
    setCustomerPhone("");
    setIsSplitPayment(false);
    setSplitPayments([]);
    setRedeemPoints(0);
  };

  // Split
  const splitPaymentTotal = splitPayments.reduce((s, p) => s + p.amount, 0);
  const splitRemaining = grandTotal - splitPaymentTotal;

  const addSplitPayment = (method: string) => {
    if (splitRemaining <= 0) return;
    const existing = splitPayments.find(p => p.method === method);
    if (existing) {
      setSplitPayments(prev => prev.map(p => p.method === method ? { ...p, amount: p.amount + Math.min(100, splitRemaining) } : p));
    } else {
      setSplitPayments(prev => [...prev, { method, amount: Math.min(splitRemaining, grandTotal) }]);
    }
  };

  const updateSplitAmount = (method: string, amount: number) => {
    setSplitPayments(prev => prev.map(p => p.method === method ? { ...p, amount: Math.max(0, amount) } : p));
  };

  const removeSplitPayment = (method: string) => {
    setSplitPayments(prev => prev.filter(p => p.method !== method));
  };

  const handleCompleteSale = async () => {
    if (cart.length === 0) { toast.error("Add items to cart first"); return; }
    if (!isSplitPayment && !selectedPayment) { toast.error("Select a payment method"); return; }
    if (isSplitPayment && Math.abs(splitRemaining) > 0.5) { toast.error(`Split payment incomplete: ₹${splitRemaining.toFixed(2)} remaining`); return; }
    if (unverifiedRx.length > 0) {
      toast.error(`${unverifiedRx.length} medicine(s) require prescription verification`, {
        description: unverifiedRx.map(i => i.name).join(", "),
      });
      return;
    }
    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success("Sale completed successfully!");
      setShowReceipt(true);
    } catch {
      toast.error("Failed to complete sale.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewSale = () => {
    handleClearBill();
    setShowReceipt(false);
    searchRef.current?.focus();
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setRedeemPoints(0);
    toast.success(`Customer: ${customer.name}`);
  };

  const getPaymentLabel = () => {
    if (isSplitPayment && splitPayments.length > 0) return splitPayments.map(p => p.method).join(" + ");
    return selectedPayment || "Cash";
  };

  return (
    <div className="flex h-screen bg-background">
      {/* ─── Left: Main Cart Area ─── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="flex items-center gap-3 border-b border-border bg-card px-4 h-14 shrink-0">
          <button onClick={() => navigate("/")} className="rounded-lg p-2 hover:bg-secondary transition-colors" title="Back to Dashboard">
            <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">Rx</div>
          <div className="mr-4">
            <h1 className="text-sm font-bold text-foreground leading-none">Point of Sale</h1>
            <p className="text-[10px] text-muted-foreground">{invoiceNo}</p>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Search medicine — name, generic, manufacturer (F1)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              className="h-10 pl-10 pr-3 text-sm bg-secondary/50 border-0 focus-visible:ring-1"
              autoFocus
            />
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden max-h-80 overflow-y-auto">
                {filtered.map(med => (
                  <button
                    key={med.id}
                    onClick={() => addToCart(med)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent transition-colors border-b border-border/40 last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-card-foreground">{med.name}</p>
                        {med.requiresRx && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-destructive/40 text-destructive">Rx</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">{med.description} · {med.mfr}</p>
                      <p className="text-[11px] text-muted-foreground">Batch: {med.batch} · Exp: {med.expiry} · HSN: {med.hsn}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-bold text-card-foreground">₹{med.mrp}</p>
                      <p className={`text-[11px] font-medium ${med.stock < 10 ? "text-destructive" : "text-muted-foreground"}`}>
                        Stock: {med.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => setShowBagSelector(true)} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 h-10 hover:bg-accent hover:border-primary/40 transition-all">
                <ShoppingBag className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium hidden sm:inline">Bag</span>
                <kbd className="hidden lg:inline text-[9px] bg-secondary rounded px-1 py-0.5 text-muted-foreground ml-1">F2</kbd>
              </button>
            </TooltipTrigger>
            <TooltipContent>Add bag to bill (F2)</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => heldBills.length > 0 ? setShowHeldBills(true) : handleHoldBill()} className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 h-10 hover:bg-accent hover:border-warning/40 transition-all">
                <Pause className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium hidden sm:inline">{heldBills.length > 0 ? "Recall" : "Hold"}</span>
                {heldBills.length > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-warning text-[9px] font-bold text-warning-foreground">
                    {heldBills.length}
                  </span>
                )}
                <kbd className="hidden lg:inline text-[9px] bg-secondary rounded px-1 py-0.5 text-muted-foreground ml-1">F3</kbd>
              </button>
            </TooltipTrigger>
            <TooltipContent>{heldBills.length > 0 ? `View ${heldBills.length} held bill(s) (F3)` : "Hold current bill (F3)"}</TooltipContent>
          </Tooltip>

          <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </header>

        {/* Rx Warning Banner */}
        {unverifiedRx.length > 0 && (
          <div className="flex items-center gap-3 bg-destructive/5 border-b border-destructive/20 px-4 py-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-xs text-destructive font-medium flex-1">
              {unverifiedRx.length} item(s) require prescription: {unverifiedRx.map(i => i.name).join(", ")}
            </p>
          </div>
        )}

        {/* Cart Table — S.No, ITEM, MFR, BATCH, EXPIRY, HSN, MRP, QTY, SGST, CGST, DISC%, AMOUNT */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto scrollbar-thin">
            <table className="w-full text-xs table-fixed">
              <colgroup>
                <col style={{ width: "40px" }} />   {/* S.No */}
                <col style={{ width: "auto" }} />    {/* Item - flexible */}
                <col style={{ width: "80px" }} />    {/* MFR */}
                <col style={{ width: "60px" }} />    {/* Batch */}
                <col style={{ width: "64px" }} />    {/* Expiry */}
                <col style={{ width: "52px" }} />    {/* HSN */}
                <col style={{ width: "64px" }} />    {/* MRP */}
                <col style={{ width: "76px" }} />    {/* Qty */}
                <col style={{ width: "48px" }} />    {/* SGST */}
                <col style={{ width: "48px" }} />    {/* CGST */}
                <col style={{ width: "52px" }} />    {/* Disc% */}
                <col style={{ width: "76px" }} />    {/* Amount */}
                <col style={{ width: "110px" }} />   {/* Frequency */}
                <col style={{ width: "32px" }} />    {/* Rx */}
                <col style={{ width: "32px" }} />    {/* Delete */}
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-secondary/70 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="text-left pl-3 pr-1 py-2.5">S.No</th>
                  <th className="text-left px-2 py-2.5">Item</th>
                  <th className="text-left px-2 py-2.5">MFR</th>
                  <th className="text-left px-2 py-2.5">Batch</th>
                  <th className="text-left px-2 py-2.5">Expiry</th>
                  <th className="text-left px-2 py-2.5">HSN</th>
                  <th className="text-right px-2 py-2.5">MRP</th>
                  <th className="text-center px-1 py-2.5">Qty</th>
                  <th className="text-right px-2 py-2.5">SGST</th>
                  <th className="text-right px-2 py-2.5">CGST</th>
                  <th className="text-right px-2 py-2.5">Disc%</th>
                  <th className="text-right px-2 py-2.5">Amount</th>
                  <th className="text-left px-2 py-2.5">Frequency</th>
                  <th className="text-center px-1 py-2.5">Rx</th>
                  <th className="px-1 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="text-center py-24">
                      <div className="flex flex-col items-center text-muted-foreground">
                        <div className="w-16 h-16 rounded-full bg-secondary/60 flex items-center justify-center mb-4">
                          <Search className="h-7 w-7 opacity-40" />
                        </div>
                        <p className="text-sm font-medium">No items yet</p>
                        <p className="text-[11px] mt-1">Press <kbd className="bg-secondary rounded px-1.5 py-0.5 text-[10px] font-mono">F1</kbd> to search & add medicines</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cart.map(item => (
                    <tr key={item.id} className={`border-b border-border/40 hover:bg-accent/30 transition-colors ${item.requiresRx && !item.rxVerified ? "bg-destructive/[0.03]" : ""}`}>
                      <td className="pl-3 pr-1 py-2 text-muted-foreground font-medium tabular-nums">{item.sno}</td>
                      <td className="px-2 py-2 overflow-hidden">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {item.requiresRx && !item.rxVerified && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold text-card-foreground truncate leading-tight">{item.name}</p>
                            {item.dosageLabel && <p className="text-[9px] text-primary truncate leading-tight">💊 {item.dosageLabel}</p>}
                            {item.rxDoctorName && <p className="text-[9px] text-chart-2 truncate leading-tight">Dr. {item.rxDoctorName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-muted-foreground truncate text-[10px]">{item.mfr}</td>
                      <td className="px-2 py-2 font-mono text-muted-foreground text-[10px]">{item.batch}</td>
                      <td className="px-2 py-2 text-muted-foreground text-[10px]">{item.expiry}</td>
                      <td className="px-2 py-2 text-muted-foreground font-mono text-[10px]">{item.hsn}</td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums">₹{item.mrp}</td>
                      <td className="px-1 py-2">
                        <div className="flex items-center justify-center gap-0.5">
                          <button onClick={() => updateQty(item.id, -1)} className="rounded p-0.5 hover:bg-secondary transition-colors active:scale-95">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold tabular-nums">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, 1)} className="rounded p-0.5 hover:bg-secondary transition-colors active:scale-95">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-right text-muted-foreground tabular-nums text-[10px]">{item.sgst}%</td>
                      <td className="px-2 py-2 text-right text-muted-foreground tabular-nums text-[10px]">{item.cgst}%</td>
                      <td className="px-2 py-2">
                        <input
                          type="number" min={0} max={100} value={item.discPct}
                          onChange={e => updateDiscount(item.id, parseFloat(e.target.value) || 0)}
                          className="w-full rounded border border-border bg-background px-1 py-0.5 text-[10px] text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-bold tabular-nums text-card-foreground">₹{getItemAmount(item).toFixed(2)}</td>
                      {/* Frequency column */}
                      <td className="px-2 py-2">
                        {!item.isBag && (
                          item.frequency ? (
                            <button
                              onClick={() => { setFrequencyTargetId(item.id); setShowFrequency(true); }}
                              className="text-left w-full"
                              title="Edit frequency"
                            >
                              <p className="text-[10px] font-bold font-mono text-card-foreground leading-tight">{item.frequency.pattern}</p>
                              <p className="text-[8px] text-muted-foreground leading-tight truncate">{item.frequency.labelEn}</p>
                              <p className="text-[8px] text-muted-foreground leading-tight truncate">{item.frequency.mealEn}</p>
                            </button>
                          ) : (
                            <button
                              onClick={() => { setFrequencyTargetId(item.id); setShowFrequency(true); }}
                              className="rounded p-1 hover:bg-secondary text-muted-foreground transition-colors"
                              title="Set frequency"
                            >
                              <CalendarClock className="h-3 w-3" />
                            </button>
                          )
                        )}
                      </td>
                      {/* Rx column — always visible */}
                      <td className="px-1 py-2">
                        {!item.isBag && (
                          <button
                            onClick={() => handleRxClick(item.id)}
                            className={`rounded p-1 transition-colors ${
                              item.requiresRx
                                ? item.rxVerified
                                  ? "bg-chart-2/10 text-chart-2"
                                  : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                : item.frequency
                                  ? "bg-primary/10 text-primary"
                                  : "hover:bg-secondary text-muted-foreground"
                            }`}
                            title={
                              item.requiresRx
                                ? item.rxVerified ? `Verified · Dr. ${item.rxDoctorName}` : "Attach prescription"
                                : item.frequency ? item.frequency.pattern : "Set frequency"
                            }
                          >
                            {item.requiresRx ? <Paperclip className="h-3 w-3" /> : <Pill className="h-3 w-3" />}
                          </button>
                        )}
                      </td>
                      <td className="px-1 py-2">
                        <button onClick={() => removeItem(item.id)} className="rounded p-1 hover:bg-destructive/10 transition-colors active:scale-95">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between border-t border-border bg-card px-4 h-10 shrink-0 text-xs">
          <div className="flex items-center gap-4 text-muted-foreground">
            <span><strong className="text-foreground">{cart.length}</strong> item(s)</span>
            <span><strong className="text-foreground">{totalQty}</strong> units</span>
            {rxItems.length > 0 && (
              <span className={unverifiedRx.length > 0 ? "text-destructive" : "text-chart-2"}>
                <strong>{rxItems.length - unverifiedRx.length}/{rxItems.length}</strong> Rx verified
              </span>
            )}
            {heldBills.length > 0 && (
              <button onClick={() => setShowHeldBills(true)} className="text-warning hover:underline cursor-pointer">
                <strong>{heldBills.length}</strong> held
              </button>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-bold text-foreground text-sm tabular-nums">Total: ₹{Math.max(0, grandTotal).toFixed(2)}</span>
            <span className="hidden md:flex items-center gap-1 text-muted-foreground"><Keyboard className="h-3 w-3" /> F1 Search · F3 Hold · F5-F8 Pay · F9 Complete</span>
          </div>
        </div>
      </div>

      {/* ─── Right: Payment Panel ─── */}
      <div className="w-80 shrink-0 border-l border-border bg-card flex flex-col">
        {/* Customer Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Customer</span>
            </div>
            <button
              onClick={() => setShowCustomerSelector(true)}
              className="text-[10px] font-medium text-primary hover:underline flex items-center gap-1"
            >
              <Search className="h-3 w-3" /> Search
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Name</Label>
              <div className="relative">
                <Input
                  placeholder="Customer name"
                  value={customerName}
                  onChange={e => {
                    setCustomerName(e.target.value);
                    setSelectedCustomer(null);
                    setRedeemPoints(0);
                  }}
                  className="h-8 text-xs"
                />
                {selectedCustomer && (
                  <button onClick={() => { setSelectedCustomer(null); setCustomerName(""); setCustomerPhone(""); setRedeemPoints(0); }} className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-secondary">
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input
                  placeholder="Phone number"
                  value={customerPhone}
                  onChange={e => {
                    setCustomerPhone(e.target.value);
                    const match = SAMPLE_CUSTOMERS_INLINE.find(c => c.phone === e.target.value);
                    if (match) {
                      setSelectedCustomer(match);
                      setCustomerName(match.name);
                    } else if (selectedCustomer) {
                      setSelectedCustomer(null);
                      setRedeemPoints(0);
                    }
                  }}
                  className="h-8 text-xs pl-7"
                />
              </div>
            </div>
          </div>
          {/* Quick search dropdown */}
          {!selectedCustomer && (customerName.length >= 2 || customerPhone.length >= 3) && (
            (() => {
              const matches = SAMPLE_CUSTOMERS_INLINE.filter(c =>
                (customerName.length >= 2 && c.name.toLowerCase().includes(customerName.toLowerCase())) ||
                (customerPhone.length >= 3 && c.phone.includes(customerPhone))
              );
              return matches.length > 0 ? (
                <div className="mt-2 border border-border rounded-lg bg-background shadow-md max-h-28 overflow-y-auto">
                  {matches.map(c => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedCustomer(c);
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-accent transition-colors text-xs"
                    >
                      <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{c.name}</span>
                      <span className="text-muted-foreground ml-auto text-[10px]">{c.phone}</span>
                    </button>
                  ))}
                </div>
              ) : null;
            })()
          )}
          {selectedCustomer && (
            <div className="flex items-center gap-2 mt-2 bg-primary/5 rounded-lg px-2.5 py-1.5">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[10px] text-primary font-medium">Linked</span>
              {customerLoyaltyPoints > 0 && (
                <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-chart-4/40 text-chart-4 ml-auto">{customerLoyaltyPoints} pts</Badge>
              )}
            </div>
          )}
        </div>

        {/* Loyalty Points Redemption */}
        {selectedCustomer && customerLoyaltyPoints > 0 && (
          <div className="px-4 py-2.5 border-b border-border bg-chart-4/5">
            <div className="flex items-center gap-2">
              <Star className="h-3.5 w-3.5 text-chart-4" />
              <span className="text-[11px] font-medium text-foreground">Redeem Points</span>
              <input
                type="number"
                min={0}
                max={Math.min(customerLoyaltyPoints, Math.floor(grandTotal / 0.25))}
                value={redeemPoints}
                onChange={e => setRedeemPoints(Math.min(customerLoyaltyPoints, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-14 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring ml-auto"
              />
              <span className="text-[10px] text-muted-foreground">pts</span>
            </div>
            {redeemPoints > 0 && (
              <p className="text-[10px] text-chart-2 font-medium mt-1 text-right">Saving ₹{pointsValue.toFixed(2)}</p>
            )}
          </div>
        )}

        {/* Bill Summary */}
        <div className="px-4 py-3 border-b border-border flex-1 overflow-y-auto">
          <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">Bill Summary</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({cart.length} items, {totalQty} qty)</span>
              <span className="tabular-nums font-medium">₹{subtotal.toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Discount</span>
                <span className="text-destructive tabular-nums font-medium">−₹{totalDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>SGST</span>
              <span className="tabular-nums font-medium">₹{totalSgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>CGST</span>
              <span className="tabular-nums font-medium">₹{totalCgst.toFixed(2)}</span>
            </div>
            {pointsValue > 0 && (
              <div className="flex justify-between text-chart-4">
                <span className="flex items-center gap-1"><Star className="h-3 w-3" /> Loyalty</span>
                <span className="tabular-nums font-medium">−₹{pointsValue.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="border-t border-border mt-3 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-foreground">Grand Total</span>
              <span className="text-xl font-extrabold text-primary tabular-nums">₹{Math.max(0, grandTotal).toFixed(2)}</span>
            </div>
            {totalDiscount > 0 && (
              <p className="text-[10px] text-chart-2 font-semibold text-right mt-1">You save ₹{totalDiscount.toFixed(2)} 🎉</p>
            )}
          </div>
        </div>

        {/* Payment Methods — compact grid */}
        <div className="p-3 border-b border-border">
          <h3 className="text-[11px] font-semibold text-foreground mb-2">Payment</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {paymentMethods.map(m => (
              <button
                key={m.label}
                onClick={() => {
                  setSelectedPayment(m.label);
                  if (m.label === "Split") { setIsSplitPayment(true); } else { setIsSplitPayment(false); setSplitPayments([]); }
                }}
                className={`flex flex-col items-center gap-0.5 rounded-lg border-2 p-2 text-xs transition-all active:scale-95
                  ${selectedPayment === m.label
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:bg-accent hover:border-primary/30"
                  }`}
              >
                <m.icon className={`h-4 w-4 ${selectedPayment === m.label ? "text-primary" : m.color}`} />
                <span className="text-[9px] font-semibold">{m.label}</span>
                <kbd className="text-[7px] bg-secondary rounded px-1 py-0.5 text-muted-foreground">{m.shortcut}</kbd>
              </button>
            ))}
          </div>

          {/* Split details */}
          {isSplitPayment && (
            <div className="mt-2 space-y-1.5">
              <div className="grid grid-cols-3 gap-1">
                {splitMethods.map(m => (
                  <button
                    key={m}
                    onClick={() => addSplitPayment(m)}
                    className="rounded-lg border border-border p-1.5 text-[10px] font-medium hover:bg-accent hover:border-primary/30 transition-all text-center"
                  >
                    {m}
                  </button>
                ))}
              </div>
              {splitPayments.length > 0 && (
                <div className="space-y-1 pt-1.5">
                  {splitPayments.map(p => (
                    <div key={p.method} className="flex items-center gap-1.5 bg-accent/50 rounded-lg px-2 py-1.5">
                      <span className="text-[11px] font-medium flex-1">{p.method}</span>
                      <span className="text-muted-foreground text-[11px]">₹</span>
                      <input
                        type="number" value={p.amount}
                        onChange={e => updateSplitAmount(p.method, parseFloat(e.target.value) || 0)}
                        className="w-16 rounded border border-border bg-background px-1.5 py-0.5 text-[11px] text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <button onClick={() => removeSplitPayment(p.method)} className="p-0.5 rounded hover:bg-destructive/10">
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <div className="flex justify-between text-[11px] pt-1 border-t border-border">
                    <span className="text-muted-foreground">Remaining</span>
                    <span className={`font-bold tabular-nums ${Math.abs(splitRemaining) < 0.5 ? "text-chart-2" : "text-destructive"}`}>
                      ₹{splitRemaining.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions — sticky bottom */}
        <div className="p-3 space-y-1.5 mt-auto">
          <button
            onClick={handleCompleteSale}
            disabled={cart.length === 0 || (!selectedPayment) || (isSplitPayment && Math.abs(splitRemaining) > 0.5) || isProcessing}
            className="w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <Printer className="h-4 w-4" />
            )}
            {isProcessing ? "Processing…" : "Complete Sale & Print"}
            {!isProcessing && <kbd className="text-[9px] bg-primary-foreground/20 rounded px-1.5 py-0.5 ml-1">F9</kbd>}
          </button>
          <button
            onClick={handleHoldBill}
            disabled={cart.length === 0}
            className="w-full rounded-xl border border-warning/40 bg-warning/5 py-2 text-xs font-medium text-warning hover:bg-warning/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Pause className="h-3.5 w-3.5" />
            Hold Bill
            <kbd className="text-[9px] bg-warning/20 rounded px-1.5 py-0.5">F3</kbd>
          </button>
        </div>
      </div>

      {/* ─── Dialogs ─── */}

      {/* Rx Prescription Dialog */}
      <Dialog open={showRxDialog} onOpenChange={setShowRxDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              Attach Prescription
            </DialogTitle>
            <DialogDescription>Enter doctor name and optionally attach/take photo of prescription</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Doctor Name *</Label>
              <Input
                placeholder="Dr. Sharma"
                value={rxDoctorInput}
                onChange={e => setRxDoctorInput(e.target.value)}
                className="h-9"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Prescription Image (optional)</Label>
              <div className="flex gap-2">
                <input ref={rxFileRef} type="file" accept="image/*" className="hidden" onChange={handleRxImageUpload} />
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => rxFileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" /> Upload
                </Button>
                <input type="file" accept="image/*" capture="environment" className="hidden" id="rx-camera" onChange={handleRxImageUpload} />
                <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => document.getElementById("rx-camera")?.click()}>
                  <Camera className="h-3.5 w-3.5" /> Camera
                </Button>
              </div>
              {rxImagePreview && (
                <div className="relative mt-2 rounded-lg border border-border overflow-hidden">
                  <img src={rxImagePreview} alt="Prescription" className="w-full max-h-48 object-contain bg-muted" />
                  <button
                    onClick={() => setRxImagePreview(null)}
                    className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowRxDialog(false)}>Cancel</Button>
            <Button size="sm" onClick={handleRxSave} disabled={!rxDoctorInput.trim()}>
              <FileText className="h-3.5 w-3.5 mr-1" /> Verify & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Frequency Selector */}
      <FrequencySelector
        open={showFrequency}
        onClose={() => { setShowFrequency(false); setFrequencyTargetId(null); }}
        medicineName={cart.find(c => c.id === frequencyTargetId)?.name || ""}
        onSave={handleFrequencySave}
        initialData={cart.find(c => c.id === frequencyTargetId)?.frequency}
      />

      {/* Dosage Builder Dialog */}
      <Dialog open={!!dosageTarget} onOpenChange={() => setDosageTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-primary" />
              Dosage Builder
            </DialogTitle>
            <DialogDescription>Build structured dosage instructions</DialogDescription>
          </DialogHeader>
          {dosageTarget && (
            <DosageBuilder
              medicineName={dosageTarget.name}
              onDosageChange={(label) => setDosageLabel(dosageTarget.id, label)}
              initialDosage={dosageTarget.dosageLabel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bag Selector */}
      <BagSelector open={showBagSelector} onOpenChange={setShowBagSelector} onSelect={addBagToCart} />

      {/* Customer Selector */}
      <CustomerSelector open={showCustomerSelector} onOpenChange={setShowCustomerSelector} onSelect={handleCustomerSelect} />

      {/* Held Bills Dialog */}
      <Dialog open={showHeldBills} onOpenChange={setShowHeldBills}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pause className="h-5 w-5 text-warning" />
              Held Bills
            </DialogTitle>
            <DialogDescription>
              {heldBills.length > 0 ? `${heldBills.length} bill(s) on hold` : "No bills on hold"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {heldBills.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Pause className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No held bills</p>
              </div>
            ) : (
              heldBills.map(bill => (
                <div key={bill.id} className="flex items-center gap-3 rounded-xl border border-border p-3 hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{bill.id}</p>
                    <p className="text-[11px] text-muted-foreground">{bill.customerName} · {bill.cart.length} items</p>
                    <p className="text-xs font-semibold text-primary tabular-nums">
                      ₹{bill.cart.reduce((s, c) => s + getItemAmount(c), 0).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(bill.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" onClick={() => handleRecallBill(bill)}>Recall</Button>
                    <button onClick={() => handleDeleteHeldBill(bill.id)} className="rounded-lg p-2 hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Sale Receipt */}
      <SaleReceiptDialog
        open={showReceipt}
        onOpenChange={setShowReceipt}
        invoiceNo={invoiceNo}
        customerName={customerName}
        items={cart.map(c => ({
          sno: c.sno, name: c.name, batch: c.batch, qty: c.qty, mrp: c.mrp, discPct: c.discPct,
          total: getItemAmount(c), dosageLabel: c.dosageLabel, manufacturer: c.mfr,
          expiry: c.expiry, gst: c.sgst + c.cgst
        }))}
        subtotal={totalTaxable}
        discount={totalDiscount}
        gst={totalSgst + totalCgst}
        total={grandTotal}
        paymentMethod={getPaymentLabel()}
        onNewSale={handleNewSale}
      />
    </div>
  );
};

export default POSBilling;
