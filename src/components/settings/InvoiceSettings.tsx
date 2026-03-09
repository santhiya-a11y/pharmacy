import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, Upload, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PrintableInvoice, { InvoiceSettings as InvoiceSettingsType, DEFAULT_INVOICE_SETTINGS, InvoiceData } from "@/components/billing/PrintableInvoice";
import { toast } from "sonner";

const sampleInvoiceData: InvoiceData = {
  invoiceNo: "PHR-1050226020",
  billDate: new Date().toLocaleDateString("en-IN"),
  billTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  customerName: "Mrs. Akshaya V",
  customerPhone: "8248973396",
  customerAge: "26 Y",
  customerSex: "Female",
  doctorName: "Dr. Saradha D",
  customerAddress: "17B, Poonga Nagar, Coimbatore",
  paymentMethod: "Cash",
  items: [
    { sno: 1, name: "Glimisis MV 2/0.2/500MG Tab 10's", mfr: "ORCH", hsnCode: "30049099", batch: "10159", expiry: "09-27", qty: 6, mrp: 119.06, discPct: 0, gstPct: 12 },
    { sno: 2, name: "Juviana Tab 10's", mfr: "CELA", hsnCode: "30049099", batch: "T2519", expiry: "08-27", qty: 3, mrp: 267.00, discPct: 2.5, gstPct: 12 },
    { sno: 3, name: "Tisaglip D 10/100MG Tab 10's", mfr: "ORCH", hsnCode: "2106", batch: "H054B", expiry: "07-27", qty: 3, mrp: 159.38, discPct: 2.5, gstPct: 12 },
  ],
};

export const InvoiceSettingsPanel = () => {
  const [settings, setSettings] = useState<InvoiceSettingsType>(DEFAULT_INVOICE_SETTINGS);
  const [showPreview, setShowPreview] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const update = (key: keyof InvoiceSettingsType, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    update("logoUrl", url);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleSave = () => {
    localStorage.setItem("invoiceSettings", JSON.stringify(settings));
    toast.success("Invoice settings saved successfully");
  };

  const handlePrintPreview = () => {
    if (!previewRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice Preview</title>
      <style>
        body { margin: 0; padding: 20px; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${previewRef.current.innerHTML}
      <script>setTimeout(() => { window.print(); }, 300);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const toggleFields: { key: keyof InvoiceSettingsType; label: string; desc: string }[] = [
    { key: "showLogo", label: "Show Logo", desc: "Display pharmacy logo on invoice header" },
    { key: "showDoctor", label: "Doctor Name", desc: "Show prescribing doctor field" },
    { key: "showPatientAge", label: "Patient Age/Sex", desc: "Show patient age and gender" },
    { key: "showHSN", label: "HSN Code", desc: "Show HSN code column for GST compliance" },
    { key: "showBatch", label: "Batch Number", desc: "Show batch number for each item" },
    { key: "showExpiry", label: "Expiry Date", desc: "Show expiry date for each item" },
    { key: "showMFR", label: "Manufacturer", desc: "Show manufacturer column" },
    { key: "showDiscount", label: "Discount Column", desc: "Show discount percentage column" },
    { key: "showSGSTCGST", label: "SGST/CGST Split", desc: "Show separate SGST and CGST columns" },
    { key: "showPharmacist", label: "Pharmacist Name", desc: "Show pharmacist name in footer" },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Pharmacy Details for Invoice */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Header</CardTitle>
            <CardDescription>Pharmacy details that appear on printed invoices</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Pharmacy Logo</Label>
                <div className="flex items-center gap-2">
                  <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => logoInputRef.current?.click()}>
                    <Upload className="h-3 w-3 mr-1" /> Upload Logo
                  </Button>
                  {settings.logoUrl && (
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => update("logoUrl", "")}>
                      <X className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Recommended: 200×80px, PNG or SVG</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Pharmacy Name</Label>
                <Input value={settings.pharmacyName} onChange={(e) => update("pharmacyName", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Subtitle</Label>
                <Input value={settings.subtitle} onChange={(e) => update("subtitle", e.target.value)} className="h-9" placeholder="e.g. Pharmacy Division" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input value={settings.address} onChange={(e) => update("address", e.target.value)} className="h-9" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={settings.phone} onChange={(e) => update("phone", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">GSTIN</Label>
                <Input value={settings.gstin} onChange={(e) => update("gstin", e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Drug License No</Label>
                <Input value={settings.dlNo} onChange={(e) => update("dlNo", e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice Title</Label>
                <Input value={settings.invoiceTitle} onChange={(e) => update("invoiceTitle", e.target.value)} className="h-9" placeholder="TAX INVOICE - CASH" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Pharmacist Name</Label>
                <Input value={settings.pharmacistName} onChange={(e) => update("pharmacistName", e.target.value)} className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Footer Note</Label>
              <Input value={settings.footerNote} onChange={(e) => update("footerNote", e.target.value)} className="h-9" placeholder="e.g. Thank you for your purchase" />
            </div>
          </CardContent>
        </Card>

        {/* Field Visibility */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Fields</CardTitle>
            <CardDescription>Choose which columns and fields appear on the printed invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {toggleFields.map((f) => (
              <div key={f.key} className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium">{f.label}</p>
                  <p className="text-[11px] text-muted-foreground">{f.desc}</p>
                </div>
                <Switch
                  checked={settings[f.key] as boolean}
                  onCheckedChange={(v) => update(f.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" /> Save Invoice Settings
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-1" /> Preview Invoice
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>This is how your printed invoice will look</DialogDescription>
          </DialogHeader>
          <div className="border border-border rounded-lg p-2 bg-white">
            <PrintableInvoice ref={previewRef} data={sampleInvoiceData} settings={settings} />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>Close</Button>
            <Button size="sm" onClick={handlePrintPreview}>Print Test Invoice</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
