import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileText, Search, Plus, Clock, UserCheck, FlaskConical,
  CheckCircle2, Package, AlertTriangle, ArrowRight, Phone, User
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Stage = "new" | "verification" | "preparing" | "ready" | "picked_up";

interface Prescription {
  id: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  stage: Stage;
  priority: "normal" | "urgent";
  items: { drug: string; dosage: string; qty: number }[];
  createdAt: string;
  notes?: string;
  interactions?: string[];
}

const stages: { key: Stage; label: string; icon: React.ElementType; color: string }[] = [
  { key: "new", label: "New Rx", icon: FileText, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { key: "verification", label: "Verification", icon: UserCheck, color: "bg-amber-100 text-amber-700 border-amber-200" },
  { key: "preparing", label: "Preparing", icon: FlaskConical, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { key: "ready", label: "Ready", icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  { key: "picked_up", label: "Picked Up", icon: Package, color: "bg-muted text-muted-foreground border-border" },
];

const initialPrescriptions: Prescription[] = [
  {
    id: "RX-1001", patientName: "Rahul Sharma", patientPhone: "9876543210",
    doctorName: "Dr. Anita Gupta", stage: "new", priority: "urgent",
    items: [{ drug: "Amoxicillin 500mg", dosage: "1-0-1", qty: 14 }, { drug: "Pantoprazole 40mg", dosage: "1-0-0", qty: 7 }],
    createdAt: "10:15 AM", interactions: ["Amoxicillin + Warfarin: Monitor INR"]
  },
  {
    id: "RX-1002", patientName: "Priya Nair", patientPhone: "9988776655",
    doctorName: "Dr. Suresh Menon", stage: "new", priority: "normal",
    items: [{ drug: "Metformin 500mg", dosage: "1-0-1", qty: 30 }],
    createdAt: "10:32 AM"
  },
  {
    id: "RX-1003", patientName: "Amit Patel", patientPhone: "8877665544",
    doctorName: "Dr. Rajan Iyer", stage: "verification", priority: "normal",
    items: [{ drug: "Atorvastatin 10mg", dosage: "0-0-1", qty: 30 }, { drug: "Aspirin 75mg", dosage: "0-1-0", qty: 30 }],
    createdAt: "09:45 AM"
  },
  {
    id: "RX-1004", patientName: "Sunita Devi", patientPhone: "7766554433",
    doctorName: "Dr. Anita Gupta", stage: "preparing", priority: "normal",
    items: [{ drug: "Insulin Glargine", dosage: "10 units bedtime", qty: 1 }],
    createdAt: "09:20 AM"
  },
  {
    id: "RX-1005", patientName: "Vikram Singh", patientPhone: "6655443322",
    doctorName: "Dr. Meera Joshi", stage: "ready", priority: "normal",
    items: [{ drug: "Paracetamol 650mg", dosage: "SOS", qty: 10 }],
    createdAt: "08:50 AM"
  },
];

const PrescriptionsPage = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(initialPrescriptions);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);

  const moveToNext = (id: string) => {
    const order: Stage[] = ["new", "verification", "preparing", "ready", "picked_up"];
    setPrescriptions(prev =>
      prev.map(rx => {
        if (rx.id !== id) return rx;
        const idx = order.indexOf(rx.stage);
        if (idx < order.length - 1) return { ...rx, stage: order[idx + 1] };
        return rx;
      })
    );
  };

  const filtered = prescriptions.filter(rx =>
    !search || rx.patientName.toLowerCase().includes(search.toLowerCase()) ||
    rx.id.toLowerCase().includes(search.toLowerCase())
  );

  const getStageCount = (stage: Stage) => filtered.filter(rx => rx.stage === stage).length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Prescription Queue</h1>
          <p className="text-sm text-muted-foreground">Track prescriptions from entry to pickup</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Rx or patient..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" />New Rx</Button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-5 gap-3">
        {stages.map(s => (
          <div key={s.key} className={`flex items-center gap-2.5 rounded-lg border px-4 py-3 ${s.color}`}>
            <s.icon className="h-4.5 w-4.5" />
            <div>
              <p className="text-lg font-bold leading-tight">{getStageCount(s.key)}</p>
              <p className="text-[11px] font-medium opacity-80">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-5 gap-3 min-h-[60vh]">
        {stages.map(stage => (
          <div key={stage.key} className="flex flex-col">
            <div className={`flex items-center gap-2 rounded-t-lg border px-3 py-2 ${stage.color}`}>
              <stage.icon className="h-4 w-4" />
              <span className="text-xs font-semibold">{stage.label}</span>
              <Badge variant="secondary" className="ml-auto text-[10px] h-5 px-1.5">{getStageCount(stage.key)}</Badge>
            </div>
            <div className="flex-1 space-y-2 rounded-b-lg border border-t-0 bg-muted/30 p-2 overflow-y-auto max-h-[55vh]">
              {filtered.filter(rx => rx.stage === stage.key).map(rx => (
                <Card key={rx.id} className="cursor-pointer hover:shadow-md transition-shadow border" onClick={() => setSelectedRx(rx)}>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold text-primary">{rx.id}</p>
                      {rx.priority === "urgent" && <Badge variant="destructive" className="text-[9px] h-4 px-1.5">URGENT</Badge>}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{rx.patientName}</p>
                      <p className="text-[11px] text-muted-foreground">{rx.doctorName}</p>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {rx.items.map(i => i.drug).join(", ")}
                    </div>
                    {rx.interactions && rx.interactions.length > 0 && (
                      <div className="flex items-center gap-1 text-[10px] text-destructive bg-destructive/10 rounded px-1.5 py-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Drug interaction alert</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{rx.createdAt}</span>
                      {stage.key !== "picked_up" && (
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={e => { e.stopPropagation(); moveToNext(rx.id); }}>
                          Move <ArrowRight className="h-3 w-3 ml-0.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filtered.filter(rx => rx.stage === stage.key).length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">No prescriptions</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRx} onOpenChange={() => setSelectedRx(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedRx?.id}
              {selectedRx?.priority === "urgent" && <Badge variant="destructive" className="text-[10px]">URGENT</Badge>}
            </DialogTitle>
            <DialogDescription>Prescription details and workflow</DialogDescription>
          </DialogHeader>
          {selectedRx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />Patient</p>
                  <p className="text-sm font-semibold">{selectedRx.patientName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Phone</p>
                  <p className="text-sm font-semibold">{selectedRx.patientPhone}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Doctor</p>
                <p className="text-sm font-semibold">{selectedRx.doctorName}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground mb-2">Medications</p>
                <div className="space-y-1.5">
                  {selectedRx.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between bg-muted rounded-md px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">{item.drug}</p>
                        <p className="text-[11px] text-muted-foreground">Dosage: {item.dosage}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">Qty: {item.qty}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              {selectedRx.interactions && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-destructive flex items-center gap-1 mb-1"><AlertTriangle className="h-3.5 w-3.5" />Interaction Alerts</p>
                  {selectedRx.interactions.map((int, i) => (
                    <p key={i} className="text-[11px] text-destructive/80">{int}</p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">Current Stage:</p>
                <Badge className={stages.find(s => s.key === selectedRx.stage)?.color}>{stages.find(s => s.key === selectedRx.stage)?.label}</Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            {selectedRx && selectedRx.stage !== "picked_up" && (
              <Button size="sm" onClick={() => { moveToNext(selectedRx.id); setSelectedRx(null); }}>
                Move to Next Stage <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Rx Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Prescription</DialogTitle>
            <DialogDescription>Enter prescription details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Patient Name *</Label>
                <Input placeholder="Full name" className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone *</Label>
                <Input placeholder="10-digit" className="h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Doctor Name *</Label>
              <Input placeholder="Prescribing doctor" className="h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Medications</Label>
              <Textarea placeholder="Enter medications, dosage, quantity..." className="min-h-[80px]" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs">Priority:</Label>
              <Badge variant="outline" className="cursor-pointer text-[10px]">Normal</Badge>
              <Badge variant="destructive" className="cursor-pointer text-[10px]">Urgent</Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button size="sm" onClick={() => setShowAdd(false)}>Add Prescription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrescriptionsPage;
