import { useState } from "react";
import {
  X, Phone, Mail, Clock, Shield, Calendar, Upload, FileText, Trash2, Eye, Edit2, Save, Plus,
  MapPin, User, GraduationCap, BadgeCheck, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  shift: string;
  joinDate: string;
  avatar: string;
  sales?: number;
  dob?: string;
  gender?: string;
  address?: string;
  emergencyContact?: string;
  qualification?: string;
  university?: string;
  graduationYear?: string;
  regNumber?: string;
  pharmacyCouncil?: string;
  licenseIssue?: string;
  licenseExpiry?: string;
  idType?: string;
  idNumber?: string;
  photo?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  uploadedAt: string;
  size: string;
}

const mockDocuments: Document[] = [
  { id: "1", name: "Aadhar Card", type: "Identity", uploadedAt: "Jan 15, 2024", size: "1.2 MB" },
  { id: "2", name: "Pharmacy License", type: "License", uploadedAt: "Feb 10, 2024", size: "845 KB" },
  { id: "3", name: "PAN Card", type: "Identity", uploadedAt: "Jan 15, 2024", size: "620 KB" },
];

const attendanceData = [
  { date: "Mar 9", status: "present", checkIn: "09:02 AM", checkOut: "06:15 PM", hours: "9h 13m" },
  { date: "Mar 8", status: "present", checkIn: "08:55 AM", checkOut: "06:30 PM", hours: "9h 35m" },
  { date: "Mar 7", status: "late", checkIn: "10:20 AM", checkOut: "06:00 PM", hours: "7h 40m" },
  { date: "Mar 6", status: "present", checkIn: "09:00 AM", checkOut: "06:00 PM", hours: "9h 00m" },
  { date: "Mar 5", status: "absent", checkIn: "-", checkOut: "-", hours: "-" },
];

const statusColors: Record<string, string> = {
  present: "bg-success/10 text-success",
  late: "bg-warning/10 text-warning",
  absent: "bg-destructive/10 text-destructive",
};

interface Props {
  member: StaffMember;
  onClose: () => void;
}

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value?: string }) => (
  <div className="flex items-start gap-2.5 text-sm">
    <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className="text-card-foreground font-medium">{value || "—"}</p>
    </div>
  </div>
);

const StaffDetailPanel = ({ member, onClose }: Props) => {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "attendance">("overview");
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState("");

  const isPharmacist = member.role === "Pharmacist" || member.role === "Admin";

  const handleAddDocument = () => {
    if (!newDocName.trim()) return;
    const doc: Document = {
      id: Date.now().toString(),
      name: newDocName,
      type: newDocType || "Other",
      uploadedAt: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
      size: "—",
    };
    setDocuments(prev => [...prev, doc]);
    setNewDocName("");
    setNewDocType("");
    setShowAddDoc(false);
    toast.success("Document added");
  };

  const handleDeleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success("Document removed");
  };

  const licenseExpiring = (() => {
    if (!member.licenseExpiry) return null;
    const exp = new Date(member.licenseExpiry);
    const now = new Date();
    const months = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
    if (months < 0) return "expired";
    if (months <= 6) return "expiring";
    return null;
  })();

  const tabs = [
    { key: "overview" as const, label: "Overview" },
    { key: "documents" as const, label: `Documents (${documents.length})` },
    { key: "attendance" as const, label: "Attendance" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border px-6 py-5">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold ${
            member.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          }`}>
            {member.avatar}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-card-foreground">{member.name}</h2>
              <Badge variant={member.status === "active" ? "default" : "secondary"} className={`text-[10px] ${member.status === "active" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}`}>
                {member.status === "active" ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{member.role} · {member.id}</p>
            {member.gender && member.dob && (
              <p className="text-xs text-muted-foreground mt-0.5">{member.gender} · DOB: {new Date(member.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 hover:bg-secondary transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {activeTab === "overview" && (
            <>
              {/* Contact & Work — side by side */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
                  <div className="space-y-3">
                    <InfoRow icon={Phone} label="Phone" value={member.phone} />
                    <InfoRow icon={Mail} label="Email" value={member.email} />
                    <InfoRow icon={MapPin} label="Address" value={member.address} />
                    <InfoRow icon={User} label="Emergency Contact" value={member.emergencyContact} />
                  </div>
                </div>
                <div className="rounded-xl border border-border p-4 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Work Details</p>
                  <div className="space-y-3">
                    <InfoRow icon={Shield} label="Role" value={member.role} />
                    <InfoRow icon={Clock} label="Shift" value={`${member.shift} Shift`} />
                    <InfoRow icon={Calendar} label="Joined" value={member.joinDate} />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Education</p>
                <div className="grid grid-cols-3 gap-4">
                  <InfoRow icon={GraduationCap} label="Qualification" value={member.qualification} />
                  <InfoRow icon={GraduationCap} label="University" value={member.university} />
                  <InfoRow icon={Calendar} label="Graduation Year" value={member.graduationYear} />
                </div>
              </div>

              {/* License — only for pharmacists */}
              {isPharmacist && (
                <div className={`rounded-xl border p-4 space-y-3 ${licenseExpiring === "expired" ? "border-destructive/40 bg-destructive/5" : licenseExpiring === "expiring" ? "border-warning/40 bg-warning/5" : "border-border"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pharmacist License</p>
                    {licenseExpiring === "expired" && <Badge className="bg-destructive/15 text-destructive border-0 text-[10px]">Expired</Badge>}
                    {licenseExpiring === "expiring" && <Badge className="bg-warning/15 text-warning border-0 text-[10px]">Expiring Soon</Badge>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InfoRow icon={BadgeCheck} label="Registration No." value={member.regNumber} />
                    <InfoRow icon={Shield} label="Pharmacy Council" value={member.pharmacyCouncil} />
                    <InfoRow icon={Calendar} label="Issue Date" value={member.licenseIssue ? new Date(member.licenseIssue).toLocaleDateString("en-IN") : undefined} />
                    <InfoRow icon={Calendar} label="Expiry Date" value={member.licenseExpiry ? new Date(member.licenseExpiry).toLocaleDateString("en-IN") : undefined} />
                  </div>
                </div>
              )}

              {/* ID Verification */}
              <div className="rounded-xl border border-border p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ID Verification</p>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={CreditCard} label="ID Type" value={member.idType} />
                  <InfoRow icon={CreditCard} label="ID Number" value={member.idNumber} />
                </div>
              </div>

              {/* Performance */}
              <div className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Performance Summary</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center rounded-lg bg-secondary/50 p-3">
                    <p className="text-xl font-bold text-card-foreground">{member.sales ? `₹${member.sales.toLocaleString("en-IN")}` : "N/A"}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">This Month Sales</p>
                  </div>
                  <div className="text-center rounded-lg bg-secondary/50 p-3">
                    <p className="text-xl font-bold text-success">92%</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Attendance Rate</p>
                  </div>
                  <div className="text-center rounded-lg bg-secondary/50 p-3">
                    <p className="text-xl font-bold text-card-foreground">4.5</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Avg Rating</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "documents" && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-card-foreground">Employee Documents</p>
                <Button size="sm" variant="outline" onClick={() => setShowAddDoc(true)} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" /> Add Document
                </Button>
              </div>

              {showAddDoc && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-primary">Add New Document</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Document Name *</Label>
                      <Input value={newDocName} onChange={e => setNewDocName(e.target.value)} placeholder="e.g. Driving License" className="h-9 bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Input value={newDocType} onChange={e => setNewDocType(e.target.value)} placeholder="Identity, License, etc." className="h-9 bg-background" />
                    </div>
                  </div>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Click to upload or drag file here</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PDF, JPG, PNG up to 5MB</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowAddDoc(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleAddDocument} className="gap-1"><Save className="h-3.5 w-3.5" /> Save</Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-3 rounded-xl border border-border p-3.5 hover:shadow-sm transition-shadow group">
                    <div className="rounded-lg bg-primary/10 p-2.5">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{doc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{doc.type} · {doc.size} · Uploaded {doc.uploadedAt}</p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="rounded-md p-1.5 hover:bg-secondary transition-colors" title="View"><Eye className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button className="rounded-md p-1.5 hover:bg-secondary transition-colors" title="Edit"><Edit2 className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDeleteDoc(doc.id)} className="rounded-md p-1.5 hover:bg-destructive/10 transition-colors" title="Remove"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === "attendance" && (
            <>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-xl font-bold text-success">22</p>
                  <p className="text-[10px] text-muted-foreground">Days Present</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-xl font-bold text-warning">2</p>
                  <p className="text-[10px] text-muted-foreground">Late Arrivals</p>
                </div>
                <div className="rounded-xl border border-border p-3 text-center">
                  <p className="text-xl font-bold text-destructive">1</p>
                  <p className="text-[10px] text-muted-foreground">Absences</p>
                </div>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Date</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Status</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Check In</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Check Out</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="px-4 py-2.5 text-sm font-medium text-card-foreground">{row.date}</td>
                        <td className="px-4 py-2.5">
                          <Badge className={`text-[10px] capitalize ${statusColors[row.status] || "bg-muted text-muted-foreground"} border-0`}>{row.status}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.checkIn}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.checkOut}</td>
                        <td className="px-4 py-2.5 text-sm font-medium text-right text-card-foreground">{row.hours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDetailPanel;
