import { useState } from "react";
import { Search, Plus, MoreVertical, Shield, Phone, Mail, Clock, UserCheck, UserX, X, Save, CalendarDays, Upload, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

import { useStaff, useCreateStaff, useUpdateStaff, useDeleteStaff } from "@/hooks/api/useApi";
import { useMemo } from "react";
import { Loader2, Eye, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

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
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [certPreview, setCertPreview] = useState<string | null>(null);
  const [idDocPreview, setIdDocPreview] = useState<string | null>(null);

  const { data: staffResponse, isLoading } = useStaff({
    page: 1,
    pageSize: 100,
    q: search || undefined
  });

  const { mutate: createStaff, isPending: isSaving } = useCreateStaff();
  const { mutate: updateStaff } = useUpdateStaff();
  const { mutate: deleteStaff } = useDeleteStaff();

  const staffMembers = useMemo(() => (staffResponse?.rows as any[]) || [], [staffResponse]);
  const stats = (staffResponse?.meta as any)?.stats;

  const [newStaff, setNewStaff] = useState({
    name: "", dob: "", gender: "", phone: "", email: "", address: "", emergencyContact: "", role: "", shift: "",
    qualification: "", university: "", graduationYear: "",
    regNumber: "", pharmacyCouncil: "", licenseIssue: "", licenseExpiry: "",
    idType: "", idNumber: "",
  });

  const isPharmacist = newStaff.role === "Pharmacist" || newStaff.role === "Admin";
  const totalSteps = isPharmacist ? 4 : 3;

  const update = (field: string, value: string) => setNewStaff(prev => ({ ...prev, [field]: value }));

  const selectedStaff = useMemo(() => {
    if (!selectedStaffId) return null;
    return staffMembers.find((s: any) => s._id === selectedStaffId) || null;
  }, [staffMembers, selectedStaffId]);

  const filtered = useMemo(() => {
    return staffMembers.filter(s => {
      const matchRole = filterRole === "all" || s.role === filterRole;
      return matchRole;
    });
  }, [staffMembers, filterRole]);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      deleteStaff(id, {
        onSuccess: () => toast.success("Staff member deleted"),
        onError: (err: any) => toast.error(err.message || "Failed to delete staff"),
      });
    }
  };

  const handleStatusToggle = (id: string, current: string) => {
    updateStaff(
      { id, body: { status: current === "active" ? "inactive" : "active" } },
      {
        onSuccess: () => toast.success("Status updated"),
        onError: (err: any) => toast.error(err.message || "Update failed"),
      }
    );
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!newStaff.name.trim()) return "Full name is required";
      if (!newStaff.dob) return "Date of birth is required";
      if (!newStaff.gender) return "Gender is required";
      if (!newStaff.phone.trim() || newStaff.phone.length !== 10) return "Phone number must be exactly 10 digits";
      if (!newStaff.emergencyContact.trim() || newStaff.emergencyContact.length !== 10) return "Emergency contact must be exactly 10 digits";
      if (!newStaff.address.trim()) return "Address is required";
      if (!newStaff.role) return "Role is required";
      if (!newStaff.shift) return "Shift is required";
    }
    if (step === 2) {
      if (!newStaff.qualification) return "Qualification is required";
    }
    if (step === 3 && isPharmacist) {
      if (!newStaff.regNumber.trim()) return "Registration number is required";
      if (!newStaff.pharmacyCouncil) return "Pharmacy council is required";
      if (!newStaff.licenseIssue) return "License issue date is required";
      if (!newStaff.licenseExpiry) return "License expiry date is required";
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(addStep);
    if (error) {
      toast.error(error);
      return;
    }
    setAddStep(s => s + 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStep(addStep) || (isPharmacist ? null : validateStep(3)); 
    // Double check all data for last step
    const finalError = validateStep(1) || validateStep(2) || (isPharmacist ? validateStep(3) : null);
    if (finalError) {
      toast.error(finalError);
      return;
    }

    createStaff(newStaff, {
      onSuccess: () => {
        toast.success("Staff member added successfully");
        setShowAddDialog(false);
        setAddStep(1);
        setNewStaff({ name: "", dob: "", gender: "", phone: "", email: "", address: "", emergencyContact: "", role: "", shift: "", qualification: "", university: "", graduationYear: "", regNumber: "", pharmacyCouncil: "", licenseIssue: "", licenseExpiry: "", idType: "", idNumber: "" });
        setPhotoPreview(null);
        setCertPreview(null);
        setIdDocPreview(null);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to add staff member");
      }
    });
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
      {/* <div className="flex rounded-lg border border-border bg-card overflow-hidden w-fit">
        <button onClick={() => setActiveTab("staff")} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeTab === "staff" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
          <UserCheck className="h-4 w-4" /> Staff Directory
        </button>
        <button onClick={() => setActiveTab("attendance")} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeTab === "attendance" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`}>
          <CalendarDays className="h-4 w-4" /> Attendance
        </button>
      </div> */}

      {activeTab === "attendance" ? (
        <AdminAttendanceView />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Staff</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">{isLoading ? "…" : (stats?.total || 0)}</p>
            </div>
            <div className="rounded-xl border border-success/30 bg-success/5 p-4">
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-success" />
                <p className="text-xs text-success font-medium">Active</p>
              </div>
              <p className="text-2xl font-bold text-success mt-1">{isLoading ? "…" : (stats?.active || 0)}</p>
            </div>
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-center gap-1.5">
                <UserX className="h-3.5 w-3.5 text-destructive" />
                <p className="text-xs text-destructive font-medium">Inactive</p>
              </div>
              <p className="text-2xl font-bold text-destructive mt-1">{isLoading ? "…" : (stats?.inactive || 0)}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">Roles</p>
              </div>
              <p className="text-2xl font-bold text-card-foreground mt-1">{isLoading ? "…" : (stats?.rolesCount || 0)}</p>
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary/30" />
              <p className="text-sm font-medium">Loading staff members...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.length === 0 ? (
                <div className="col-span-full text-center py-12 text-sm text-muted-foreground italic">
                  No staff members found.
                </div>
              ) : (
                filtered.map((member: any) => (
                  <div key={member._id} className="rounded-xl border border-border bg-card p-5 hover:shadow-md transition-shadow group cursor-pointer" onClick={() => setSelectedStaffId(member._id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold ${member.status === "active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {member.avatar || member.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-mono">{member.employeeCode}</p>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium mt-0.5 ${roleColors[member.role] || "bg-secondary text-secondary-foreground"}`}>{member.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={member.status === "active" ? "default" : "secondary"} className={`text-[10px] ${member.status === "active" ? "bg-success/15 text-success hover:bg-success/20 border-0" : "bg-muted text-muted-foreground border-0"}`}>
                          {member.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                            <button className="rounded-md p-1 hover:bg-secondary transition-all">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40" onClick={e => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => setSelectedStaffId(member._id)} className="gap-2">
                              <Eye className="h-3.5 w-3.5" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusToggle(member._id, member.status)} className="gap-2">
                              <Edit2 className="h-3.5 w-3.5" /> {member.status === "active" ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleDelete(member._id, member.name)} className="gap-2 text-destructive focus:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" /> Delete Member
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /><span>{member.phone || "—"}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /><span className="truncate">{member.email || "—"}</span></div>
                      <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" /><span>{member.shift || "N/A"} Shift · Since {member.joinDate ? format(new Date(member.joinDate), "dd MMM yyyy") : "N/A"}</span></div>
                    </div>
                    {member.sales !== undefined && (
                      <div className="mt-4 rounded-lg bg-secondary/50 px-3 py-2">
                        <p className="text-[11px] text-muted-foreground">This Month Sales</p>
                        <p className="text-sm font-bold text-card-foreground">₹{(member.sales || 0).toLocaleString("en-IN")}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Staff Detail Panel */}
      {selectedStaff && <StaffDetailPanel member={selectedStaff} onClose={() => setSelectedStaffId(null)} />}

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
                      <Input 
                        placeholder="10-digit number" 
                        value={newStaff.phone} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          update("phone", val);
                        }} 
                        maxLength={10}
                        required 
                        className="bg-background" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input type="email" placeholder="name@pharmacare.in" value={newStaff.email} onChange={e => update("email", e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Emergency Contact *</Label>
                      <Input 
                        placeholder="10-digit number" 
                        value={newStaff.emergencyContact} 
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          update("emergencyContact", val);
                        }} 
                        maxLength={10}
                        required 
                        className="bg-background" 
                      />
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
                  <Button type="button" onClick={handleNext} className="gap-2">Next Step →</Button>
                ) : (
                  <Button type="submit" className="gap-2" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Add Staff Member
                  </Button>
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
