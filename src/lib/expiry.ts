/**
 * Normalize API / form expiry values to MM/YYYY for display.
 * Handles ISO strings (from Mongo), YYYY-MM (month input), and MM/YYYY.
 */
export function normalizeExpiryDisplay(raw: unknown): string {
  if (raw == null || raw === "") return "—";
  if (typeof raw === "string") {
    const t = raw.trim();
    if (/^\d{1,2}\/\d{4}$/.test(t)) return t;
    if (/^\d{4}-\d{2}$/.test(t)) {
      const [y, m] = t.split("-");
      return `${m.padStart(2, "0")}/${y}`;
    }
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    }
  }
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return `${String(raw.getMonth() + 1).padStart(2, "0")}/${raw.getFullYear()}`;
  }
  return "—";
}

/**
 * A single reference date for shelf-life math: end of month for month-only
 * inputs; full calendar date for ISO timestamps from the API.
 */
export function parseExpiryReferenceDate(expiry: string): Date | null {
  const s = expiry.trim();
  if (!s || s === "—") return null;

  const mmyyyy = /^(\d{1,2})\/(\d{4})$/.exec(s);
  if (mmyyyy) {
    const mm = Number(mmyyyy[1]);
    const yyyy = Number(mmyyyy[2]);
    if (!Number.isFinite(mm) || !Number.isFinite(yyyy) || mm < 1 || mm > 12) return null;
    return new Date(yyyy, mm, 0);
  }

  const ym = /^(\d{4})-(\d{2})$/.exec(s);
  if (ym) {
    const yyyy = Number(ym[1]);
    const mm = Number(ym[2]);
    if (!Number.isFinite(mm) || !Number.isFinite(yyyy) || mm < 1 || mm > 12) return null;
    return new Date(yyyy, mm, 0);
  }

  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export type ExpiryInfoLevel = "expired" | "critical" | "warning" | "safe" | "unknown";

export function getExpiryBadgeInfo(expiry: string): {
  level: ExpiryInfoLevel;
  months: number;
  text: string;
  color: string;
} {
  const exp = parseExpiryReferenceDate(expiry);
  if (!exp) {
    return {
      level: "unknown",
      months: 0,
      text: "Expiry unavailable",
      color: "bg-muted/50 text-muted-foreground border-border",
    };
  }

  const now = new Date();
  const months =
    (exp.getFullYear() - now.getFullYear()) * 12 + (exp.getMonth() - now.getMonth());

  if (!Number.isFinite(months)) {
    return {
      level: "unknown",
      months: 0,
      text: "Expiry unavailable",
      color: "bg-muted/50 text-muted-foreground border-border",
    };
  }

  if (months < 0) {
    return {
      level: "expired",
      months: Math.abs(months),
      text: "Already Expired",
      color: "bg-destructive/10 text-destructive border-destructive/30",
    };
  }
  if (months <= 3) {
    return {
      level: "critical",
      months,
      text: `Expires in ${months} month(s)`,
      color: "bg-destructive/10 text-destructive border-destructive/30",
    };
  }
  if (months <= 6) {
    return {
      level: "warning",
      months,
      text: `Expires in ${months} months`,
      color: "bg-warning/10 text-warning border-warning/30",
    };
  }
  return {
    level: "safe",
    months,
    text: `Expires in ${months} months`,
    color: "bg-chart-2/10 text-chart-2 border-chart-2/30",
  };
}
