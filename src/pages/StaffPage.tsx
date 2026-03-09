import { useState } from "react";
import { Search, Plus, MoreVertical, Shield, Phone, Mail, Clock, UserCheck, UserX, X, Save, CalendarDays, Upload, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import AdminAttendanceView from "@/components/staff/AdminAttendanceView";
import StaffDetailPanel from "@/components/staff/StaffDetailPanel";
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

const staffData: StaffMember[] = [
  { id: "EMP-0001", name: "Priya Sharma", role: "Admin", phone: "+91 98765 43210", email: "priya@pharmacare.in", status: "active", shift: "Full Day", joinDate: "Jan 2023", avatar: "PS", sales: 45200, dob: "1992-05-14", gender: "Female", address: "12, MG Road, Andheri West, Mumbai", emergencyContact: "+91 99887 76655", qualification: "B.Pharm", university: "Mumbai University", graduationYear: "2014", regNumber: "MH-PH-2014-3421", pharmacyCouncil: "Maharashtra", licenseIssue: "2014-08-10", licenseExpiry: "2029-08-09", idType: "Aadhar", idNumber: "XXXX-XXXX-4321" },
  { id: "EMP-0002", name: "Rahul Kumar", role: "Pharmacist", phone: "+91 87654 32109", email: "rahul@pharmacare.in", status: "active", shift: "Morning", joinDate: "Mar 2023", avatar: "RK", sales: 38900, dob: "1995-11-22", gender: "Male", address: "45, Hill Road, Bandra, Mumbai", emergencyContact: "+91 88776 54321", qualification: "D.Pharm", university: "SNDT University", graduationYear: "2017", regNumber: "MH-PH-2017-5678", pharmacyCouncil: "Maharashtra", licenseIssue: "2017-06-15", licenseExpiry: "2032-06-14", idType: "PAN", idNumber: "ABCDE1234F" },
  { id: "EMP-0003", name: "Anita Devi", role: "Cashier", phone: "+91 76543 21098", email: "anita@pharmacare.in", status: "active", shift: "Evening", joinDate: "Jun 2023", avatar: "AD", sales: 29400, dob: "1998-03-08", gender: "Female", address: "78, Station Road, Dadar, Mumbai" },
  { id: "EMP-0004", name: "Suresh Babu", role: "Inventory Manager", phone: "+91 65432 10987", email: "suresh@pharmacare.in", status: "active", shift: "Morning", joinDate: "Aug 2023", avatar: "SB", dob: "1990-07-19", gender: "Male", address: "23, Link Road, Goregaon, Mumbai" },
  { id: "EMP-0005", name: "Meera Nair", role: "Pharmacist", phone: "+91 54321 09876", email: "meera@pharmacare.in", status: "inactive", shift: "Night", joinDate: "Nov 2023", avatar: "MN", sales: 12300, dob: "1994-12-01", gender: "Female" },
  { id: "EMP-0006", name: "Vikram Singh", role: "Delivery", phone: "+91 43210 98765", email: "vikram@pharmacare.in", status: "active", shift: "Full Day", joinDate: "Feb 2024", avatar: "VS", dob: "1997-09-25", gender: "Male" },
];

const roleColors: Record<string, string> = {
  Admin: "bg-primary/10 text-primary",
  Pharmacist: "bg-success/10 text-success",
  Cashier: "bg-warning/10 text-warning",
  "Inventory Manager": "bg-accent text-accent-foreground",
  Delivery: "bg-secondary text-secondary-foreground",
};

const roles = ["Admin", "Pharmacist", "Cashier", "Inventory Manager", "Delivery"];
const shifts = ["Morning", "Evening", "Night", "Full Day"];
const genders = ["Male", "Female", "Other"];
const idTypes = ["Aadhar Card", "PAN Card", "Driving License"];
const pharmacyCouncils = ["Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "Gujarat", "Rajasthan", "UP", "Kerala", "West Bengal", "Telangana"];

const StaffPage = () => {
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addStep, setAddStep] = useState(1);
  const [activeTab, setActiveTab] = useState<"staff" | "attendance">("staff");
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null);

  const [newStaff, setNewStaff] = useState({
    name: "", dob: "", gender: "", phone: "", email: "", address: "", emergencyContact: "", role: "", shift: "",
    qualification: "", university: "", graduationYear: "",
    regNumber: "", pharmacyCouncil: "", licenseIssue: "", licenseExpiry: "",
    idType: "", idNumber: "",
  });

  const update = (field: string, value: string) => setNewStaff(prev => ({ ...prev, [field]: value }));

  const filtered = staffData.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || s.role === filterRole;
    return matchSearch && matchRole;
  });

  const activeCount = staffData.filter(s => s.status === "active").length;

  const isPharmacist = newStaff.role === "Pharmacist" || newStaff.role === "Admin";
  const totalSteps = isPharmacist ? 4 : 3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Staff member added successfully");
    setShowAddDialog(false);
    setAddStep(1);
    setNewStaff({ name: "", dob: "", gender: "", phone: "", email: "", address: "", emergencyContact: "", role: "", shift: "", qualification: "", university: "", graduationYear: "", regNumber: "", pharmacyCouncil: "", licenseIssue: "", licenseExpiry: "", idType: "", idNumber: "" });
    setPhotoPreview(null);
    setCertPreview(null);
    setIdDocPreview(null);
  };

  const handleImageUpload = (setter: (v: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setter(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">Manage team roles, shifts, and attendance</p>
        </div>
        <Button onClick={() => { setShowAddDialog(true); setAddStep(1); }} className="gap-2 shadow-md">
          <Plus className="h-4 w-4" /> Add Staff
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex rounded-lg border border-border bg-card overflow-hidden w-fit">
        <button onClick={() => setActiveTab("staff")} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeTab === "staff" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
          <UserCheck className="h-4 w-4" /> Staff Directory
        </button>
        <button onClick={() => setActiveTab("attendance")} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeTab === "attendance" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
          <CalendarDays className="h-4 w-4" /> Attendance
        </button>
      </div>

      {activeTab === "attendance" ? (
        <AdminAttendanceView />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Staff</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">{staffData.length}</p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-success" />
                <p className="text-xs text-success font-medium">Active</p>
              </div>
              <p className="text-2xl font-bold text-success mt-1">{activeCount}</p>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-1.5">
                <UserX className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs text-destructive font-medium">Inactive</p>
              </div>
              <p className="text-2xl font-bold text-destructive mt-1">{staffData.length - activeCount}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Roles</p>
              </div>
              <p className="text-2xl font-bold text-card-foreground mt-1">{new Set(staffData.map(s => s.role)).size}</p>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by name or role..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48 bg-card border-border"><SelectValue placeholder="All Roles" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(member => (
              <div key={member.id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setSelectedStaff(member)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${member.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">{member.id}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 ${roleColors[member.role] || "bg-secondary text-secondary-foreground"}`}>{member.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={member.status === "active" ? "default" : "secondary"} className={`text-[10px] ${member.status === "active" ? "bg-success/15 text-success hover:bg-success/20 border-0" : "bg-muted text-muted-foreground border-0"}`}>
                      {member.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                    <button className="rounded-md p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary transition-all">
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span>{member.phone}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="truncate">{member.email}</span></div>
                  <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /><span>{member.shift} Shift · Since {member.joinDate}</span></div>
                </div>
                {member.sales !== undefined && (
                  <div className="mt-4 rounded-lg bg-secondary/50 px-3 py-2">
                    <p className="text-[11px] text-muted-foreground">This Month Sales</p>
                    <p className="text-sm font-bold text-card-foreground">₹{member.sales.toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Staff Detail Panel */}
      {selectedStaff && <StaffDetailPanel member={selectedStaff} onClose={() => setSelectedStaff(null)} />}

      {/* Add Staff Dialog — Multi-step */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={() => setShowAddDialog(false)}>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4 rounded-t-2xl">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">Add New Staff Member</h2>
                <p className="text-xs text-muted-foreground">Step {addStep} of {totalSteps}</p>
              </div>
              <button onClick={() => setShowAddDialog(false)} className="rounded-lg p-2 hover:bg-secondary transition-colors">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < addStep ? "bg-primary" : "bg-border"}`} />
                ))}
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                <span className={addStep >= 1 ? "text-primary font-medium" : ""}>Personal</span>
                <span className={addStep >= 2 ? "text-primary font-medium" : ""}>Education</span>
                {isPharmacist && <span className={addStep >= 3 ? "text-primary font-medium" : ""}>License</span>}
                <span className={addStep >= totalSteps ? "text-primary font-medium" : ""}>ID & Photo</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Step 1: Personal Details */}
              {addStep === 1 && (
                <>
                  <p className="text-sm font-semibold text-card-foreground">Personal Information</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Full Name *</Label>
                      <Input placeholder="e.g. Arun Patel" value={newStaff.name} onChange={e => update("name", e.target.value)} required className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date of Birth *</Label>
                      <Input type="date" value={newStaff.dob} onChange={e => update("dob", e.target.value)} required className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gender *</Label>
                      <Select value={newStaff.gender} onValueChange={v => update("gender", v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>{genders.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phone Number *</Label>
                      <Input placeholder="+91 XXXXX XXXXX" value={newStaff.phone} onChange={e => update("phone", e.target.value)} required className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" placeholder="name@pharmacare.in" value={newStaff.email} onChange={e => update("email", e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Emergency Contact *</Label>
                      <Input placeholder="+91 XXXXX XXXXX" value={newStaff.emergencyContact} onChange={e => update("emergencyContact", e.target.value)} required className="bg-background" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label>Residential Address *</Label>
                      <Textarea placeholder="Full address..." value={newStaff.address} onChange={e => update("address", e.target.value)} className="bg-background h-20 resize-none" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Role *</Label>
                      <Select value={newStaff.role} onValueChange={v => update("role", v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>{roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Shift *</Label>
                      <Select value={newStaff.shift} onValueChange={v => update("shift", v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select shift" /></SelectTrigger>
                        <SelectContent>{shifts.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Education */}
              {addStep === 2 && (
                <>
                  <p className="text-sm font-semibold text-card-foreground">Education & Qualification</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Qualification *</Label>
                      <Select value={newStaff.qualification} onValueChange={v => update("qualification", v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select qualification" /></SelectTrigger>
                        <SelectContent>
                          {["D.Pharm", "B.Pharm", "M.Pharm", "Pharm.D", "B.Sc", "M.Sc", "12th Pass", "Other"].map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>University / College</Label>
                      <Input placeholder="e.g. Mumbai University" value={newStaff.university} onChange={e => update("university", e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Year of Graduation</Label>
                      <Input type="number" min="1980" max="2030" placeholder="e.g. 2020" value={newStaff.graduationYear} onChange={e => update("graduationYear", e.target.value)} className="bg-background" />
                    </div>
                  </div>
                  <div className="space-y-1.5 pt-2">
                    <Label>Certificate Copy (optional)</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-pointer relative">
                      <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload(setCertPreview)} />
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Click to upload certificate</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">PDF, JPG, PNG up to 5MB</p>
                    </div>
                    {certPreview && (
                      <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2 text-xs text-success">
                        ✓ Certificate uploaded
                        <button type="button" onClick={() => setCertPreview(null)} className="ml-auto"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: License (only for Pharmacist/Admin) */}
              {addStep === 3 && isPharmacist && (
                <>
                  <p className="text-sm font-semibold text-card-foreground">Pharmacist License Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Registration Number *</Label>
                      <Input placeholder="e.g. MH-PH-2020-1234" value={newStaff.regNumber} onChange={e => update("regNumber", e.target.value)} required className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>State Pharmacy Council *</Label>
                      <Select value={newStaff.pharmacyCouncil} onValueChange={v => update("pharmacyCouncil", v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select state" /></SelectTrigger>
                        <SelectContent>{pharmacyCouncils.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>License Issue Date *</Label>
                      <Input type="date" value={newStaff.licenseIssue} onChange={e => update("licenseIssue", e.target.value)} required className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>License Expiry Date *</Label>
                      <Input type="date" value={newStaff.licenseExpiry} onChange={e => update("licenseExpiry", e.target.value)} required className="bg-background" />
                    </div>
                  </div>
                  {newStaff.licenseExpiry && (() => {
                    const exp = new Date(newStaff.licenseExpiry);
                    const now = new Date();
                    const months = (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());
                    if (months < 0) return <div className="rounded-lg bg-destructive/10 text-destructive px-4 py-2.5 text-sm font-medium">⚠ License has expired — renewal required</div>;
                    if (months <= 6) return <div className="rounded-lg bg-warning/10 text-warning px-4 py-2.5 text-sm font-medium">⚠ License expires in {months} month(s)</div>;
                    return null;
                  })()}
                </>
              )}

              {/* Last Step: ID Verification & Photo */}
              {addStep === totalSteps && (
                <>
                  <p className="text-sm font-semibold text-card-foreground">ID Verification & Photo</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>ID Type *</Label>
                      <Select value={newStaff.idType} onValueChange={v => update("idType", v)}>
                        <SelectTrigger className="bg-background"><SelectValue placeholder="Select ID type" /></SelectTrigger>
                        <SelectContent>{idTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>ID Number *</Label>
                      <Input placeholder="Enter ID number" value={newStaff.idNumber} onChange={e => update("idNumber", e.target.value)} required className="bg-background" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>ID Document Copy</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/40 transition-colors cursor-pointer relative">
                      <input type="file" accept="image/*,.pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload(setIdDocPreview)} />
                      <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Upload ID document</p>
                    </div>
                    {idDocPreview && (
                      <div className="flex items-center gap-2 rounded-lg bg-success/5 border border-success/20 px-3 py-2 text-xs text-success">
                        ✓ ID document uploaded
                        <button type="button" onClick={() => setIdDocPreview(null)} className="ml-auto"><X className="h-3 w-3" /></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label>Staff Photo</Label>
                    <div className="flex gap-3 items-start">
                      <div className="border-2 border-dashed border-border rounded-xl w-28 h-28 flex flex-col items-center justify-center hover:border-primary/40 transition-colors cursor-pointer relative overflow-hidden">
                        {photoPreview ? (
                          <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          <>
                            <Camera className="h-6 w-6 text-muted-foreground mb-1" />
                            <p className="text-[10px] text-muted-foreground">Photo</p>
                          </>
                        )}
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload(setPhotoPreview)} />
                      </div>
                      {photoPreview && (
                        <Button type="button" size="sm" variant="ghost" onClick={() => setPhotoPreview(null)} className="text-destructive text-xs mt-1">Remove</Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                {addStep > 1 ? (
                  <Button type="button" variant="outline" onClick={() => setAddStep(s => s - 1)}>Back</Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                )}
                {addStep < totalSteps ? (
                  <Button type="button" onClick={() => setAddStep(s => s + 1)} className="gap-2">Next Step →</Button>
                ) : (
                  <Button type="submit" className="gap-2"><Save className="h-4 w-4" /> Add Staff Member</Button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPage;
