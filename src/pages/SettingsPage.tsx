import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Building2, Receipt, Bell, Shield, Printer,
  Globe, Database, Users, Save, ShoppingBag, Upload, X, Image, FileText, Plus, Trash2, Pencil
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InvoiceSettingsPanel } from "@/components/settings/InvoiceSettings";
import { useSettings, useUpdateSettings } from "@/hooks/api/useApi";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type SettingsTab = "store" | "billing" | "invoice" | "notifications" | "security" | "printing" | "bags" | "integrations";

const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "store", label: "Store Details", icon: Building2 },
  { key: "billing", label: "Billing & GST", icon: Receipt },
  { key: "invoice", label: "Invoice Format", icon: FileText },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "printing", label: "Print Templates", icon: Printer },
  { key: "bags", label: "Bag Management", icon: ShoppingBag },
  { key: "integrations", label: "Integrations", icon: Globe },
];

interface BagConfig {
  id: string;
  name: string;
  size: string;
  price: number;
  icon: string;
  imageUrl?: string;
}

const DEFAULT_BAG_CONFIGS: BagConfig[] = [
  { id: "bag-sm-white", name: "Small White Bag", size: "Small", price: 2, icon: "🛍️" },
  { id: "bag-md-white", name: "Medium White Bag", size: "Medium", price: 3, icon: "🛍️" },
  { id: "bag-lg-white", name: "Large White Bag", size: "Large", price: 5, icon: "🛍️" },
  { id: "bag-sm-brown", name: "Small Paper Bag", size: "Small", price: 3, icon: "📦" },
  { id: "bag-md-brown", name: "Medium Paper Bag", size: "Medium", price: 5, icon: "📦" },
  { id: "bag-lg-brown", name: "Large Paper Bag", size: "Large", price: 7, icon: "📦" },
  { id: "bag-branded", name: "Branded Bag", size: "Standard", price: 10, icon: "🏷️" },
  { id: "bag-eco", name: "Eco Cloth Bag", size: "Standard", price: 15, icon: "♻️" },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("store");
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();

  // Store Settings
  const { data: storeData, isLoading: loadingStore } = useSettings("store");
  const [store, setStore] = useState({ name: "", license: "", phone: "", email: "", address: "", gstin: "", dlExpiry: "" });
  useEffect(() => { if (storeData) setStore(prev => ({ ...prev, ...(storeData as any) })); }, [storeData]);

  // Billing Settings
  const { data: billingData, isLoading: loadingBilling } = useSettings("billing");
  const [billing, setBilling] = useState({ defaultGst: "12", prefix: "INV-", start: "4500", methods: ["Cash", "UPI / QR", "Credit/Debit Card"], autoDiscount: true });
  useEffect(() => { if (billingData) setBilling(prev => ({ ...prev, ...(billingData as any) })); }, [billingData]);

  // Notification Settings
  const { data: notifyData, isLoading: loadingNotify } = useSettings("notifications");
  const [notify, setNotify] = useState({ lowStock: true, expiry: true, refill: true, dailySales: false, attendance: true, whatsapp: false });
  useEffect(() => { if (notifyData) setNotify(prev => ({ ...prev, ...(notifyData as any) })); }, [notifyData]);

  // Security Settings
  const { data: securityData, isLoading: loadingSecurity } = useSettings("security");
  const [security, setSecurity] = useState({ tfa: false, timeout: true, controlledLogs: true, approval: true, biometric: false });
  useEffect(() => { if (securityData) setSecurity(prev => ({ ...prev, ...(securityData as any) })); }, [securityData]);

  // Printing Settings
  const { data: printData, isLoading: loadingPrint } = useSettings("printing");
  const [print, setPrint] = useState({ receiptWidth: "80mm", labelSize: "50x25mm", showLogo: true, showGst: true, showBatch: true, showDosage: true, autoprint: false });
  useEffect(() => { if (printData) setPrint(prev => ({ ...prev, ...(printData as any) })); }, [printData]);

  // Bag Settings
  const { data: bagsData, isLoading: loadingBags } = useSettings("bags");
  const [bagConfigs, setBagConfigs] = useState<BagConfig[]>(DEFAULT_BAG_CONFIGS);
  useEffect(() => { if (bagsData && Array.isArray(bagsData)) setBagConfigs(bagsData); }, [bagsData]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBagId, setUploadingBagId] = useState<string | null>(null);
  const [showAddBag, setShowAddBag] = useState(false);
  const [editingBag, setEditingBag] = useState<BagConfig | null>(null);
  const [newBag, setNewBag] = useState({ name: "", size: "Medium", price: 0, icon: "🛍️" });

  const save = (key: string, value: any) => {
    updateSettings({ key, value }, {
      onSuccess: () => toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} settings saved`),
      onError: (err: any) => toast.error(err.message || "Failed to save settings")
    });
  };

  const handleBagImageUpload = (bagId: string) => {
    setUploadingBagId(bagId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingBagId) return;
    const url = URL.createObjectURL(file);
    setBagConfigs(prev => prev.map(b => b.id === uploadingBagId ? { ...b, imageUrl: url } : b));
    setUploadingBagId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeBagImage = (bagId: string) => {
    setBagConfigs(prev => prev.map(b => b.id === bagId ? { ...b, imageUrl: undefined } : b));
  };

  const updateBagPrice = (bagId: string, price: number) => {
    setBagConfigs(prev => prev.map(b => b.id === bagId ? { ...b, price } : b));
  };

  const handleAddBag = () => {
    if (!newBag.name.trim()) return;
    const id = `bag-custom-${Date.now()}`;
    setBagConfigs(prev => [...prev, { id, name: newBag.name, size: newBag.size, price: newBag.price, icon: newBag.icon }]);
    setNewBag({ name: "", size: "Medium", price: 0, icon: "🛍️" });
    setShowAddBag(false);
  };

  const handleDeleteBag = (bagId: string) => {
    setBagConfigs(prev => prev.filter(b => b.id !== bagId));
  };

  const handleEditBag = (bag: BagConfig) => {
    setEditingBag({ ...bag });
  };

  const handleSaveEdit = () => {
    if (!editingBag || !editingBag.name.trim()) return;
    setBagConfigs(prev => prev.map(b => b.id === editingBag.id ? editingBag : b));
    setEditingBag(null);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your pharmacy system preferences</p>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      <div className="flex gap-5">
        {/* Sidebar Tabs */}
        <div className="w-52 space-y-1 flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === tab.key ? "bg-accent text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeTab === "store" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Store Information</CardTitle>
                <CardDescription>Your pharmacy details for invoices and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingStore ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /><p className="text-xs">Loading store info...</p></div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs">Pharmacy Name</Label><Input value={store.name} onChange={e => setStore(p=>({...p, name: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">License Number</Label><Input value={store.license} onChange={e => setStore(p=>({...p, license: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input value={store.phone} onChange={e => setStore(p=>({...p, phone: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input value={store.email} onChange={e => setStore(p=>({...p, email: e.target.value}))} className="h-9" /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">Address</Label><Input value={store.address} onChange={e => setStore(p=>({...p, address: e.target.value}))} className="h-9" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs">GST Number</Label><Input value={store.gstin} onChange={e => setStore(p=>({...p, gstin: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Drug License Expiry</Label><Input type="date" value={store.dlExpiry} onChange={e => setStore(p=>({...p, dlExpiry: e.target.value}))} className="h-9" /></div>
                    </div>
                    <Button size="sm" onClick={() => save("store", store)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save Changes
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "billing" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Billing & Tax Configuration</CardTitle>
                <CardDescription>GST rates, invoice settings, and payment modes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingBilling ? <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs">Default GST Rate (%)</Label><Input type="number" value={billing.defaultGst} onChange={e=>setBilling(p=>({...p, defaultGst: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Invoice Prefix</Label><Input value={billing.prefix} onChange={e=>setBilling(p=>({...p, prefix: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Bill Counter Start</Label><Input type="number" value={billing.start} onChange={e=>setBilling(p=>({...p, start: e.target.value}))} className="h-9" /></div>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold">Payment Methods</Label>
                      {["Cash", "UPI / QR", "Credit/Debit Card", "Community Credit", "Insurance"].map(m => (
                        <div key={m} className="flex items-center justify-between py-1">
                          <span className="text-sm">{m}</span>
                          <Switch checked={billing.methods.includes(m)} onCheckedChange={on => setBilling(p => ({ ...p, methods: on ? [...p.methods, m] : p.methods.filter(x => x !== m) }))} />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between py-1 border-t pt-3">
                      <div><p className="text-sm font-medium">Auto-apply discounts</p><p className="text-[11px] text-muted-foreground">Automatically apply scheme discounts during billing</p></div>
                      <Switch checked={billing.autoDiscount} onCheckedChange={v => setBilling(p => ({ ...p, autoDiscount: v }))} />
                    </div>
                    <Button size="sm" onClick={() => save("billing", billing)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save Changes
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "invoice" && <InvoiceSettingsPanel />}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>Configure alerts and reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingNotify ? <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
                  <>
                    {[
                      { key: "lowStock", label: "Low Stock Alerts", desc: "Get notified when stock falls below reorder level" },
                      { key: "expiry", label: "Expiry Alerts", desc: "Alert 30 days before medicine expiry" },
                      { key: "refill", label: "Patient Refill Reminders", desc: "Send SMS reminders for prescription refills" },
                      { key: "dailySales", label: "Daily Sales Summary", desc: "Receive end-of-day sales report via email" },
                      { key: "attendance", label: "Staff Attendance Alerts", desc: "Notify when staff miss clock-in time" },
                      { key: "whatsapp", label: "WhatsApp Notifications", desc: "Send notifications via WhatsApp" },
                    ].map(n => (
                      <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div><p className="text-sm font-medium">{n.label}</p><p className="text-[11px] text-muted-foreground">{n.desc}</p></div>
                        <Switch checked={(notify as any)[n.key]} onCheckedChange={v => setNotify(p => ({ ...p, [n.key]: v }))} />
                      </div>
                    ))}
                    <Button className="mt-2" size="sm" onClick={() => save("notifications", notify)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save Changes
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security Settings</CardTitle>
                <CardDescription>Access control and compliance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingSecurity ? <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
                  <>
                    {[
                      { key: "tfa", label: "Two-Factor Authentication", desc: "Require 2FA for admin accounts" },
                      { key: "timeout", label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity" },
                      { key: "controlledLogs", label: "Controlled Drug Logging", desc: "Mandatory log for Schedule H1/X dispensing" },
                      { key: "approval", label: "Price Override Approval", desc: "Require admin approval for price changes" },
                      { key: "biometric", label: "Biometric Login", desc: "Allow fingerprint-based staff login" },
                    ].map(s => (
                      <div key={s.key} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div><p className="text-sm font-medium">{s.label}</p><p className="text-[11px] text-muted-foreground">{s.desc}</p></div>
                        <Switch checked={(security as any)[s.key]} onCheckedChange={v => setSecurity(p => ({ ...p, [s.key]: v }))} />
                      </div>
                    ))}
                    <Button className="mt-2" size="sm" onClick={() => save("security", security)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save Changes
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "printing" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Print Templates</CardTitle>
                <CardDescription>Configure receipt and label printing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingPrint ? <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5"><Label className="text-xs">Receipt Width</Label><Input value={print.receiptWidth} onChange={e=>setPrint(p=>({...p, receiptWidth: e.target.value}))} className="h-9" /></div>
                      <div className="space-y-1.5"><Label className="text-xs">Label Size</Label><Input value={print.labelSize} onChange={e=>setPrint(p=>({...p, labelSize: e.target.value}))} className="h-9" /></div>
                    </div>
                    {[
                      { key: "showLogo", label: "Print Store Logo" },
                      { key: "showGst", label: "Print GST Details" },
                      { key: "showBatch", label: "Print Batch Number" },
                      { key: "showDosage", label: "Print Dosage Instructions" },
                      { key: "autoprint", label: "Auto-print on Bill Save" },
                    ].map(p => (
                      <div key={p.key} className="flex items-center justify-between py-1">
                        <span className="text-sm">{p.label}</span>
                        <Switch checked={(print as any)[p.key]} onCheckedChange={v => setPrint(pr => ({ ...pr, [p.key]: v }))} />
                      </div>
                    ))}
                    <Button size="sm" onClick={() => save("printing", print)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save Changes
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "bags" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  Bag Management
                </CardTitle>
                <CardDescription>Upload real product images and configure bag prices for POS billing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {bagConfigs.map(bag => (
                    <div key={bag.id} className="rounded-xl border border-border p-3 space-y-2 relative group/card">
                      <div className="absolute top-1.5 right-1.5 z-10 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                        <button onClick={() => handleEditBag(bag)} className="bg-muted/90 rounded-full p-1 hover:bg-accent" title="Edit bag">
                          <Pencil className="h-3 w-3 text-foreground" />
                        </button>
                        <button onClick={() => handleDeleteBag(bag.id)} className="bg-destructive/90 rounded-full p-1" title="Delete bag">
                          <Trash2 className="h-3 w-3 text-destructive-foreground" />
                        </button>
                      </div>
                      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center group">
                        {bag.imageUrl ? (
                          <>
                            <img src={bag.imageUrl} alt={bag.name} className="w-full h-full object-cover" />
                            <button onClick={() => removeBagImage(bag.id)} className="absolute top-1 right-1 bg-destructive/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3 text-destructive-foreground" /></button>
                            <button onClick={() => handleBagImageUpload(bag.id)} className="absolute bottom-1 right-1 bg-background/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity border border-border"><Upload className="h-3 w-3 text-foreground" /></button>
                          </>
                        ) : (
                          <button onClick={() => handleBagImageUpload(bag.id)} className="w-full h-full flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors rounded-lg">
                            <span className="text-2xl">{bag.icon}</span>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="h-3 w-3" />Upload</div>
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-foreground truncate">{bag.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] h-4 px-1">{bag.size}</Badge>
                        <div className="flex items-center gap-0.5 flex-1">
                          <span className="text-[10px] text-muted-foreground">₹</span>
                          <input type="number" min={0} value={bag.price} onChange={e => updateBagPrice(bag.id, parseFloat(e.target.value) || 0)} className="w-full rounded border border-border bg-background px-1.5 py-0.5 text-xs text-right tabular-nums focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Add New Bag Card */}
                  <button
                    onClick={() => setShowAddBag(true)}
                    className="rounded-xl border-2 border-dashed border-border p-3 flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-muted/30 transition-colors min-h-[180px]"
                  >
                    <Plus className="h-8 w-8 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Add New Bag</span>
                  </button>
                </div>
                <div className="mt-4">
                  <Button size="sm" onClick={() => save("bags", bagConfigs)} disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Bag Settings
                  </Button>
                </div>

                {/* Add Bag Dialog */}
                <Dialog open={showAddBag} onOpenChange={setShowAddBag}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Add New Bag</DialogTitle>
                      <DialogDescription>Configure a new bag type for POS billing</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Bag Name</Label>
                        <Input className="h-9" placeholder="e.g. Premium Gift Bag" value={newBag.name} onChange={e => setNewBag(p => ({ ...p, name: e.target.value }))} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Size</Label>
                          <Select value={newBag.size} onValueChange={v => setNewBag(p => ({ ...p, size: v }))}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Small">Small</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Large">Large</SelectItem>
                              <SelectItem value="Standard">Standard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Price (₹)</Label>
                          <Input type="number" min={0} className="h-9" value={newBag.price} onChange={e => setNewBag(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Icon</Label>
                        <div className="flex gap-2">
                          {["🛍️", "📦", "🏷️", "♻️", "🎁", "👜"].map(icon => (
                            <button key={icon} onClick={() => setNewBag(p => ({ ...p, icon }))} className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${newBag.icon === icon ? "border-primary bg-primary/5" : "border-transparent hover:border-border"}`}>{icon}</button>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full" size="sm" onClick={handleAddBag} disabled={!newBag.name.trim()}>
                        <Plus className="h-4 w-4 mr-1" />Add Bag
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Edit Bag Dialog */}
                <Dialog open={!!editingBag} onOpenChange={open => !open && setEditingBag(null)}>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Edit Bag</DialogTitle>
                      <DialogDescription>Update bag details</DialogDescription>
                    </DialogHeader>
                    {editingBag && (
                      <div className="space-y-3 pt-2">
                        {/* Image Upload */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">Image</Label>
                          <div className="relative w-full h-28 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center group border border-border">
                            {editingBag.imageUrl ? (
                              <>
                                <img src={editingBag.imageUrl} alt={editingBag.name} className="w-full h-full object-cover" />
                                <button onClick={() => setEditingBag(p => p ? { ...p, imageUrl: undefined } : p)} className="absolute top-1 right-1 bg-destructive/90 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3 text-destructive-foreground" /></button>
                              </>
                            ) : (
                              <span className="text-3xl">{editingBag.icon}</span>
                            )}
                            <label className="absolute bottom-1 right-1 bg-background/90 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity border border-border cursor-pointer">
                              <Upload className="h-3.5 w-3.5 text-foreground" />
                              <input type="file" accept="image/*" className="hidden" onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const url = URL.createObjectURL(file);
                                  setEditingBag(p => p ? { ...p, imageUrl: url } : p);
                                }
                                e.target.value = "";
                              }} />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Bag Name</Label>
                          <Input className="h-9" value={editingBag.name} onChange={e => setEditingBag(p => p ? { ...p, name: e.target.value } : p)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Size</Label>
                            <Select value={editingBag.size} onValueChange={v => setEditingBag(p => p ? { ...p, size: v } : p)}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Small">Small</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Large">Large</SelectItem>
                                <SelectItem value="Standard">Standard</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Price (₹)</Label>
                            <Input type="number" min={0} className="h-9" value={editingBag.price} onChange={e => setEditingBag(p => p ? { ...p, price: parseFloat(e.target.value) || 0 } : p)} />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Icon</Label>
                          <div className="flex gap-2">
                            {["🛍️", "📦", "🏷️", "♻️", "🎁", "👜"].map(icon => (
                              <button key={icon} onClick={() => setEditingBag(p => p ? { ...p, icon } : p)} className={`text-xl p-1.5 rounded-lg border-2 transition-colors ${editingBag.icon === icon ? "border-primary bg-primary/5" : "border-transparent hover:border-border"}`}>{icon}</button>
                            ))}
                          </div>
                        </div>
                        <Button className="w-full" size="sm" onClick={handleSaveEdit} disabled={!editingBag.name.trim()}>
                          <Save className="h-4 w-4 mr-1" />Save Changes
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {activeTab === "integrations" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Integrations</CardTitle>
                <CardDescription>Connect external services</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "SMS Gateway", desc: "Send SMS alerts to patients", status: "connected" },
                  { name: "WhatsApp Business API", desc: "Send WhatsApp notifications", status: "not_connected" },
                  { name: "E-Prescription Portal", desc: "Import digital prescriptions", status: "not_connected" },
                  { name: "Insurance / PBM", desc: "Process insurance claims", status: "not_connected" },
                  { name: "Biometric Device", desc: "ZKTeco / Mantra fingerprint scanner", status: "connected" },
                  { name: "Tally Export", desc: "Export accounting data to Tally", status: "connected" },
                ].map(int => (
                  <div key={int.name} className="flex items-center justify-between py-2.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{int.name}</p>
                      <p className="text-[11px] text-muted-foreground">{int.desc}</p>
                    </div>
                    {int.status === "connected" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Connected</Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 text-xs">Connect</Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
