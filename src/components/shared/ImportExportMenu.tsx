import { Upload, Download, FileSpreadsheet } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface Column {
  key: string;
  label: string;
}

interface ImportExportMenuProps {
  data: Record<string, any>[];
  columns: Column[];
  filenamePrefix: string;
  onImport?: (rows: Record<string, string>[]) => void;
}

function exportToCSV(data: Record<string, any>[], columns: Column[], filename: string) {
  const header = columns.map(c => c.label).join(",");
  const rows = data.map(row =>
    columns.map(c => {
      const val = String(row[c.key] ?? "");
      return val.includes(",") || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows as CSV`);
}

function exportToJSON(data: Record<string, any>[], columns: Column[], filename: string) {
  const filtered = data.map(row => {
    const obj: Record<string, any> = {};
    columns.forEach(c => { obj[c.key] = row[c.key]; });
    return obj;
  });
  const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`Exported ${data.length} rows as JSON`);
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map(line => {
    const values = line.split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
}

const ImportExportMenu = ({ data, columns, filenamePrefix, onImport }: ImportExportMenuProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timestamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${timestamp}`;

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        let rows: Record<string, string>[];

        if (file.name.endsWith(".json")) {
          rows = JSON.parse(text);
        } else {
          rows = parseCSV(text);
        }

        if (rows.length === 0) {
          toast.error("No data found in file");
          return;
        }

        onImport?.(rows);
        toast.success(`Imported ${rows.length} rows from ${file.name}`);
      } catch {
        toast.error("Failed to parse file. Please check the format.");
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={handleImport}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Import / Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => exportToCSV(data, columns, filename)}>
            <Download className="h-4 w-4 mr-2" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportToJSON(data, columns, filename)}>
            <Download className="h-4 w-4 mr-2" />
            Export as JSON
          </DropdownMenuItem>
          {onImport && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Import</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV / JSON
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default ImportExportMenu;
