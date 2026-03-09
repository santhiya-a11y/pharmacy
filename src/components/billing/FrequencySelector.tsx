import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface FrequencyData {
  pattern: string;       // e.g. "1-0-0-0"
  labelEn: string;       // e.g. "Once a Day"
  labelTa: string;       // e.g. "ஒரு வேளை"
  mealEn: string;        // e.g. "After Food"
  mealTa: string;        // e.g. "உணவுக்கு பின்"
  display: string;       // Combined display string
}

const frequencyPatterns = [
  { pattern: "1-0-0-0", labelEn: "Once a Day (Morning)", labelTa: "ஒரு வேளை (காலை)" },
  { pattern: "0-1-0-0", labelEn: "Once a Day (Afternoon)", labelTa: "ஒரு வேளை (மதியம்)" },
  { pattern: "0-0-1-0", labelEn: "Once a Day (Evening)", labelTa: "ஒரு வேளை (மாலை)" },
  { pattern: "0-0-0-1", labelEn: "Once a Day (Night)", labelTa: "ஒரு வேளை (இரவு)" },
  { pattern: "1-0-1-0", labelEn: "Twice a Day", labelTa: "இரண்டு வேளை" },
  { pattern: "1-1-1-0", labelEn: "Three Times a Day", labelTa: "மூன்று வேளை" },
  { pattern: "1-1-1-1", labelEn: "Four Times a Day", labelTa: "நான்கு வேளை" },
  { pattern: "1-0-0-1", labelEn: "Morning & Night", labelTa: "காலை & இரவு" },
  { pattern: "0-0-0-1", labelEn: "At Bedtime", labelTa: "படுக்கும் நேரம்" },
  { pattern: "SOS", labelEn: "When Required (SOS)", labelTa: "தேவைப்படும்போது" },
];

const mealTimings = [
  { en: "Before Food", ta: "உணவுக்கு முன்" },
  { en: "After Food", ta: "உணவுக்கு பின்" },
  { en: "With Food", ta: "உணவுடன்" },
  { en: "Empty Stomach", ta: "வெறும் வயிற்றில்" },
  { en: "Regardless of Food", ta: "உணவு எதுவாக இருந்தாலும்" },
];

interface FrequencySelectorProps {
  open: boolean;
  onClose: () => void;
  medicineName: string;
  onSave: (data: FrequencyData) => void;
  initialData?: FrequencyData | null;
}

const FrequencySelector = ({ open, onClose, medicineName, onSave, initialData }: FrequencySelectorProps) => {
  const [selectedPattern, setSelectedPattern] = useState(initialData?.pattern || "");
  const [selectedMeal, setSelectedMeal] = useState(initialData?.mealEn || "");

  const handleSave = () => {
    const patternData = frequencyPatterns.find(f => f.pattern === selectedPattern);
    const mealData = mealTimings.find(m => m.en === selectedMeal);
    if (!patternData) return;

    const display = `${patternData.pattern}\n(${patternData.labelEn} / ${patternData.labelTa})\n(${mealData?.en || "—"} / ${mealData?.ta || "—"})`;

    onSave({
      pattern: patternData.pattern,
      labelEn: patternData.labelEn,
      labelTa: patternData.labelTa,
      mealEn: mealData?.en || "",
      mealTa: mealData?.ta || "",
      display,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Set Frequency</DialogTitle>
          <DialogDescription className="text-xs">{medicineName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Frequency Pattern */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Frequency *</Label>
            <Select value={selectedPattern} onValueChange={setSelectedPattern}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select frequency..." /></SelectTrigger>
              <SelectContent>
                {frequencyPatterns.map(f => (
                  <SelectItem key={f.pattern} value={f.pattern} className="text-xs">
                    <span className="font-mono font-bold mr-2">{f.pattern}</span>
                    <span className="text-muted-foreground">{f.labelEn}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Meal Timing */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Meal Timing</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {mealTimings.map(m => (
                <button
                  key={m.en}
                  type="button"
                  onClick={() => setSelectedMeal(m.en)}
                  className={`rounded-lg border px-3 py-2 text-left transition-all ${
                    selectedMeal === m.en
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:bg-accent hover:border-primary/30"
                  }`}
                >
                  <p className="text-[11px] font-medium text-card-foreground">{m.en}</p>
                  <p className="text-[10px] text-muted-foreground">{m.ta}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {selectedPattern && (
            <div className="rounded-lg border border-border bg-secondary/30 p-3 space-y-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Preview</p>
              <p className="text-sm font-bold font-mono text-card-foreground">{selectedPattern}</p>
              <p className="text-xs text-muted-foreground">
                ({frequencyPatterns.find(f => f.pattern === selectedPattern)?.labelEn} / {frequencyPatterns.find(f => f.pattern === selectedPattern)?.labelTa})
              </p>
              {selectedMeal && (
                <p className="text-xs text-muted-foreground">
                  ({selectedMeal} / {mealTimings.find(m => m.en === selectedMeal)?.ta})
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={!selectedPattern}>Save Frequency</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FrequencySelector;
