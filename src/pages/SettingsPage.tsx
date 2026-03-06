import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Settings, Building2, Receipt, Bell, Shield, Printer,
  Globe, Database, Users, Save
} from "lucide-react";

type SettingsTab = "store" | "billing" | "notifications" | "security" | "printing" | "integrations";

const tabs: { key: SettingsTab; label: string; icon: React.ElementType }[] = [
  { key: "store", label: "Store Details", icon: Building2 },
  { key: "billing", label: "Billing & GST", icon: Receipt },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "security", label: "Security", icon: Shield },
  { key: "printing", label: "Print Templates", icon: Printer },
  { key: "integrations", label: "Integrations", icon: Globe },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("store");

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your pharmacy system preferences</p>
      </div>

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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs">Pharmacy Name</Label><Input defaultValue="PharmaCare Medical Store" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">License Number</Label><Input defaultValue="DL-2024-MH-12345" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Phone</Label><Input defaultValue="022-12345678" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input defaultValue="info@pharmacare.in" className="h-9" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-xs">Address</Label><Input defaultValue="123, MG Road, Andheri West, Mumbai - 400058" className="h-9" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs">GST Number</Label><Input defaultValue="27AABCM1234L1Z5" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Drug License Expiry</Label><Input type="date" defaultValue="2027-03-31" className="h-9" /></div>
                </div>
                <Button size="sm"><Save className="h-4 w-4 mr-1" />Save Changes</Button>
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
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs">Default GST Rate (%)</Label><Input type="number" defaultValue="12" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Invoice Prefix</Label><Input defaultValue="INV-" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Bill Counter Start</Label><Input type="number" defaultValue="4500" className="h-9" /></div>
                </div>
                <div className="space-y-3">
                  <Label className="text-xs font-semibold">Payment Methods</Label>
                  {["Cash", "UPI / QR", "Credit/Debit Card", "Community Credit", "Insurance"].map(m => (
                    <div key={m} className="flex items-center justify-between py-1">
                      <span className="text-sm">{m}</span>
                      <Switch defaultChecked />
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between py-1">
                  <div><p className="text-sm font-medium">Auto-apply discounts</p><p className="text-[11px] text-muted-foreground">Automatically apply scheme discounts during billing</p></div>
                  <Switch defaultChecked />
                </div>
                <Button size="sm"><Save className="h-4 w-4 mr-1" />Save Changes</Button>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notification Preferences</CardTitle>
                <CardDescription>Configure alerts and reminders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Low Stock Alerts", desc: "Get notified when stock falls below reorder level", on: true },
                  { label: "Expiry Alerts", desc: "Alert 30 days before medicine expiry", on: true },
                  { label: "Patient Refill Reminders", desc: "Send SMS reminders for prescription refills", on: true },
                  { label: "Daily Sales Summary", desc: "Receive end-of-day sales report via email", on: false },
                  { label: "Staff Attendance Alerts", desc: "Notify when staff miss clock-in time", on: true },
                  { label: "WhatsApp Notifications", desc: "Send notifications via WhatsApp", on: false },
                ].map(n => (
                  <div key={n.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div><p className="text-sm font-medium">{n.label}</p><p className="text-[11px] text-muted-foreground">{n.desc}</p></div>
                    <Switch defaultChecked={n.on} />
                  </div>
                ))}
                <Button size="sm"><Save className="h-4 w-4 mr-1" />Save Changes</Button>
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
                {[
                  { label: "Two-Factor Authentication", desc: "Require 2FA for admin accounts", on: false },
                  { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", on: true },
                  { label: "Controlled Drug Logging", desc: "Mandatory log for Schedule H1/X dispensing", on: true },
                  { label: "Price Override Approval", desc: "Require admin approval for price changes", on: true },
                  { label: "Biometric Login", desc: "Allow fingerprint-based staff login", on: false },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div><p className="text-sm font-medium">{s.label}</p><p className="text-[11px] text-muted-foreground">{s.desc}</p></div>
                    <Switch defaultChecked={s.on} />
                  </div>
                ))}
                <Button size="sm"><Save className="h-4 w-4 mr-1" />Save Changes</Button>
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5"><Label className="text-xs">Receipt Width</Label><Input defaultValue="80mm" className="h-9" /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Label Size</Label><Input defaultValue="50x25mm" className="h-9" /></div>
                </div>
                {[
                  { label: "Print Store Logo", on: true },
                  { label: "Print GST Details", on: true },
                  { label: "Print Batch Number", on: true },
                  { label: "Print Dosage Instructions", on: true },
                  { label: "Auto-print on Bill Save", on: false },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between py-1">
                    <span className="text-sm">{p.label}</span>
                    <Switch defaultChecked={p.on} />
                  </div>
                ))}
                <Button size="sm"><Save className="h-4 w-4 mr-1" />Save Changes</Button>
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
