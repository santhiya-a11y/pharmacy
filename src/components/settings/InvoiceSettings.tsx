import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Upload, X, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PrintableInvoice, { InvoiceSettings as InvoiceSettingsType, DEFAULT_INVOICE_SETTINGS, InvoiceData } from "@/components/billing/PrintableInvoice";
import { toast } from "sonner";
import { useSettings, useUpdateSettings } from "@/hooks/api/useApi";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const sampleInvoiceData: InvoiceData = {
  invoiceNo: "PHR-1050226020",
  billDate: new Date().toLocaleDateString("en-IN"),
  billTime: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
  customerName: "Mrs. Akshaya V",
  customerPhone: "8248973396",
  customerAge: "26 Y",
  customerSex: "Female",
  customerHN: "A896191",
  tokenNumber: "TK-0042",
  doctorName: "Dr. Saradha D",
  customerAddress: "17B, Poonga Nagar, Coimbatore",
  paymentMethod: "Cash",
  pageNumber: 1,
  totalPages: 1,
  items: [
    { sno: 1, name: "Glimisis MV 2/0.2/500MG Tab 10's", mfr: "ORCH", hsnCode: "30049099", batch: "10159", expiry: "09-27", qty: 6, mrp: 119.06, discPct: 0, gstPct: 12 },
    { sno: 2, name: "Juviana Tab 10's", mfr: "CELA", hsnCode: "30049099", batch: "T2519", expiry: "08-27", qty: 3, mrp: 267.00, discPct: 2.5, gstPct: 12 },
    { sno: 3, name: "Tisaglip D 10/100MG Tab 10's", mfr: "ORCH", hsnCode: "2106", batch: "H054B", expiry: "07-27", qty: 3, mrp: 159.38, discPct: 2.5, gstPct: 12 },
  ],
};

export const InvoiceSettingsPanel = () => {
  const { data: serverSettings, isLoading } = useSettings("invoice");
  const { mutate: saveSettings, isPending: isSaving } = useUpdateSettings();

  const [settings, setSettings] = useState<InvoiceSettingsType>(DEFAULT_INVOICE_SETTINGS);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (serverSettings && typeof serverSettings === "object") {
      setSettings((prev) => ({ ...prev, ...(serverSettings as any) }));
    }
  }, [serverSettings]);

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
    saveSettings(
      { key: "invoice", value: settings },
      {
        onSuccess: () => toast.success("Invoice settings saved to server"),
        onError: (err: any) => toast.error(err.message || "Failed to save invoice settings"),
      }
    );
  };

  const handlePrintPreview = () => {
    if (!previewRef.current) return;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Invoice Preview</title>
      <style>body { margin: 0; padding: 20px; } @media print { body { padding: 0; } @page { margin: 10mm; } }</style>
      </head><body>
      ${previewRef.current.innerHTML}
      <script>setTimeout(() => { window.print(); }, 300);</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const headerFields: { key: keyof InvoiceSettingsType; label: string; placeholder?: string; colSpan?: number }[] = [
    { key: "pharmacyName", label: "Pharmacy Name" },
    { key: "subtitle", label: "Subtitle", placeholder: "e.g. Pharmacy Division" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "website", label: "Website", placeholder: "e.g. www.pharmacare.in" },
    { key: "gstin", label: "GSTIN" },
    { key: "dlNo", label: "Drug License No" },
    { key: "stateNameCode", label: "State Name & Code", placeholder: "e.g. TN-33" },
    { key: "operatingHours", label: "Operating Hours", placeholder: "e.g. 24 Hours - No Holiday" },
    { key: "invoiceTitle", label: "Invoice Title", placeholder: "TAX INVOICE - CASH" },
  ];

  const footerFields: { key: keyof InvoiceSettingsType; label: string; placeholder?: string }[] = [
    { key: "pharmacistName", label: "Pharmacist Name" },
    { key: "billedByName", label: "Billed By", placeholder: "Staff name" },
    { key: "checkedByName", label: "Checked By", placeholder: "Verifier name" },
    { key: "deliveryNote", label: "Delivery Note", placeholder: "e.g. Delivered at Pharmacy" },
    { key: "footerNote", label: "Footer Message", placeholder: "e.g. Thank you" },
  ];

  const columnToggles: { key: keyof InvoiceSettingsType; label: string; desc: string }[] = [
    { key: "showLogo", label: "Pharmacy Logo", desc: "Display logo in header" },
    { key: "showHN", label: "Hospital Number (HN)", desc: "Patient hospital/registration number" },
    { key: "showDoctor", label: "Doctor Name", desc: "Prescribing doctor field" },
    { key: "showPatientAge", label: "Patient Age / Sex", desc: "Age and gender of patient" },
    { key: "showTokenNumber", label: "Token Number", desc: "Queue/token number" },
    { key: "showStateCode", label: "State Name & Code", desc: "GST state code (e.g. TN-33)" },
    { key: "showPageNumber", label: "Page Number", desc: "Page X of Y" },
    { key: "showMFR", label: "Manufacturer (MFR)", desc: "Manufacturer code column" },
    { key: "showHSN", label: "HSN Code", desc: "HSN code for GST compliance" },
    { key: "showBatch", label: "Batch Number", desc: "Batch number column" },
    { key: "showExpiry", label: "Expiry Date", desc: "Expiry date column" },
    { key: "showValue", label: "Value (MRP × Qty)", desc: "Gross value before discount" },
    { key: "showDiscount", label: "Discount %", desc: "Discount percentage column" },
    { key: "showTaxableValue", label: "Taxable Value", desc: "Value after discount, before tax" },
    { key: "showGSTPercent", label: "GST %", desc: "GST rate percentage column" },
    { key: "showSGSTCGST", label: "SGST / CGST Split", desc: "Separate SGST and CGST amount columns" },
    { key: "showPharmacist", label: "Pharmacist Name", desc: "Show pharmacist in footer" },
    { key: "showBilledBy", label: "Billed By", desc: "Staff who created the bill" },
    { key: "showCheckedBy", label: "Checked By", desc: "Staff who verified the bill" },
    { key: "showDeliveryNote", label: "Delivery Note", desc: "e.g. Delivered at Pharmacy" },
  ];

  return (
    <>
      <div className="space-y-4">
        {/* Header Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Header</CardTitle>
            <CardDescription>Pharmacy details printed on every invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Logo */}
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
                    <Upload className="h-3 w-3 mr-1" /> Upload
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

            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <Input value={settings.address} onChange={(e) => update("address", e.target.value)} className="h-9" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              {headerFields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={settings[f.key] as string}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="h-9"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Footer Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice Footer</CardTitle>
            <CardDescription>Staff names, notes, and footer text</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {footerFields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <Label className="text-xs">{f.label}</Label>
                  <Input
                    value={settings[f.key] as string}
                    onChange={(e) => update(f.key, e.target.value)}
                    className="h-9"
                    placeholder={f.placeholder}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Field Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Field Visibility</CardTitle>
            <CardDescription>Toggle which fields and columns appear on the printed invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              {columnToggles.map((f) => (
                <div key={f.key} className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground">{f.desc}</p>
                  </div>
                  <Switch checked={settings[f.key] as boolean} onCheckedChange={(v) => update(f.key, v)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-3">
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Invoice Settings
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
            <DialogDescription>This is how your printed invoice will look with sample data</DialogDescription>
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
