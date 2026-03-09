import { useState } from "react";
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type DateRange = { from: Date; to: Date };

const presets = [
  { label: "Today", getRange: () => ({ from: new Date(), to: new Date() }) },
  { label: "Yesterday", getRange: () => ({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) }) },
  { label: "This Week", getRange: () => ({ from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: endOfWeek(new Date(), { weekStartsOn: 1 }) }) },
  { label: "This Month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Last Month", getRange: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: "Last 90 Days", getRange: () => ({ from: subDays(new Date(), 90), to: new Date() }) },
];

interface DateRangeFilterProps {
  value?: DateRange;
  onChange?: (range: DateRange) => void;
  className?: string;
}

export const DateRangeFilter = ({ value, onChange, className }: DateRangeFilterProps) => {
  const [range, setRange] = useState<DateRange>(value || presets[3].getRange());
  const [open, setOpen] = useState(false);

  const handlePreset = (preset: typeof presets[0]) => {
    const r = preset.getRange();
    setRange(r);
    onChange?.(r);
    setOpen(false);
  };

  const handleSelect = (selected: { from?: Date; to?: Date } | undefined) => {
    if (selected?.from) {
      const r = { from: selected.from, to: selected.to || selected.from };
      setRange(r);
      if (selected.to) {
        onChange?.(r);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 justify-start text-left font-normal gap-2 text-sm",
            !range && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          {format(range.from, "dd MMM")} – {format(range.to, "dd MMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r border-border p-2 space-y-1 min-w-[130px]">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-accent transition-colors text-foreground"
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="p-2">
            <Calendar
              mode="range"
              selected={{ from: range.from, to: range.to }}
              onSelect={handleSelect as any}
              numberOfMonths={2}
              className={cn("pointer-events-auto")}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
