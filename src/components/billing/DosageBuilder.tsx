import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const QUICK_PRESETS: { label: string; full: string; morning: boolean; afternoon: boolean; night: boolean }[] = [
  { label: "OD", full: "Once Daily", morning: true, afternoon: false, night: false },
  { label: "BD", full: "Twice Daily", morning: true, afternoon: false, night: true },
  { label: "TDS", full: "Thrice Daily", morning: true, afternoon: true, night: true },
  { label: "1-0-1", full: "Morning & Night", morning: true, afternoon: false, night: true },
  { label: "1-1-1", full: "Three Times", morning: true, afternoon: true, night: true },
  { label: "SOS", full: "As Needed", morning: false, afternoon: false, night: false },
];

const DOSE_FORMS = ["tablet", "capsule", "ml", "drops", "puff", "sachet", "spoon"];
const FOOD_OPTIONS = ["Before meal", "After meal", "With meal", "Empty stomach", "Any time"];

interface DosageBuilderProps {
  medicineName: string;
  onDosageChange: (dosage: string) => void;
  initialDosage?: string;
}

const DosageBuilder = ({ medicineName, onDosageChange, initialDosage }: DosageBuilderProps) => {
  const [doseAmount, setDoseAmount] = useState("1");
  const [doseForm, setDoseForm] = useState("tablet");
  const [morning, setMorning] = useState(false);
  const [afternoon, setAfternoon] = useState(false);
  const [night, setNight] = useState(false);
  const [foodRelation, setFoodRelation] = useState("After meal");
  const [duration, setDuration] = useState("5");
  const [durationUnit, setDurationUnit] = useState("days");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    setActivePreset(preset.label);
    setMorning(preset.morning);
    setAfternoon(preset.afternoon);
    setNight(preset.night);
  };

  // Generate dosage label
  useEffect(() => {
    const times: string[] = [];
    if (morning) times.push("morning");
    if (afternoon) times.push("afternoon");
    if (night) times.push("night");

    if (activePreset === "SOS") {
      onDosageChange(`Take ${doseAmount} ${doseForm} as needed (SOS)`);
      return;
    }

    if (times.length === 0) {
      onDosageChange("");
      return;
    }

    const freqText = times.length === 3 ? "thrice daily" : times.length === 2 ? "twice daily" : "once daily";
    const timeText = times.join(" and ");
    const label = `Take ${doseAmount} ${doseForm} ${freqText} (${timeText}) ${foodRelation.toLowerCase()} for ${duration} ${durationUnit}`;
    onDosageChange(label);
  }, [doseAmount, doseForm, morning, afternoon, night, foodRelation, duration, durationUnit, activePreset]);

  return (
    <div className="space-y-4">
      {/* Medicine name header */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
        <p className="text-xs text-muted-foreground">Dosage for</p>
        <p className="text-sm font-semibold text-foreground">{medicineName}</p>
      </div>

      {/* Quick Presets */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Quick Dose Presets</Label>
        <div className="flex flex-wrap gap-2">
          {QUICK_PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`flex flex-col items-center rounded-lg border px-3 py-2 transition-all text-center min-w-[56px]
                ${activePreset === p.label
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card border-border hover:border-primary/50 hover:bg-accent"
                }`}
            >
              <span className="text-sm font-bold">{p.label}</span>
              <span className="text-[9px] opacity-75">{p.full}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dose Amount & Form */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Dose Amount</Label>
          <Input
            type="number"
            min="0.5"
            step="0.5"
            value={doseAmount}
            onChange={e => setDoseAmount(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Form</Label>
          <Select value={doseForm} onValueChange={setDoseForm}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DOSE_FORMS.map(f => (
                <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Time of Day */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Time of Day</Label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "morning", label: "Morning", emoji: "🌅", checked: morning, set: setMorning },
            { id: "afternoon", label: "Afternoon", emoji: "☀️", checked: afternoon, set: setAfternoon },
            { id: "night", label: "Night", emoji: "🌙", checked: night, set: setNight },
          ].map(t => (
            <label
              key={t.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 cursor-pointer transition-all
                ${t.checked ? "bg-primary/10 border-primary/30" : "bg-card border-border hover:bg-accent"}`}
            >
              <Checkbox checked={t.checked} onCheckedChange={(v) => { t.set(!!v); setActivePreset(null); }} />
              <span className="text-sm">{t.emoji}</span>
              <span className="text-xs font-medium">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Food Relation */}
      <div className="space-y-1.5">
        <Label className="text-xs">Relation to Food</Label>
        <Select value={foodRelation} onValueChange={setFoodRelation}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FOOD_OPTIONS.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Duration */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Duration</Label>
          <Input
            type="number"
            min="1"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Unit</Label>
          <Select value={durationUnit} onValueChange={setDurationUnit}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="days">Days</SelectItem>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generated Label Preview */}
      <div className="bg-muted rounded-lg px-3 py-2.5 border border-border">
        <p className="text-[10px] text-muted-foreground mb-1 font-medium uppercase tracking-wide">Label Preview</p>
        <p className="text-sm text-foreground font-medium leading-relaxed">
          {(morning || afternoon || night || activePreset === "SOS")
            ? `Take ${doseAmount} ${doseForm} ${
                activePreset === "SOS" ? "as needed (SOS)" :
                `${[morning && "morning", afternoon && "afternoon", night && "night"].filter(Boolean).length === 3 ? "thrice daily" : [morning && "morning", afternoon && "afternoon", night && "night"].filter(Boolean).length === 2 ? "twice daily" : "once daily"} (${[morning && "morning", afternoon && "afternoon", night && "night"].filter(Boolean).join(" & ")}) ${foodRelation.toLowerCase()} for ${duration} ${durationUnit}`
              }`
            : <span className="text-muted-foreground italic">Select timing to generate label</span>
          }
        </p>
      </div>
    </div>
  );
};

export default DosageBuilder;
