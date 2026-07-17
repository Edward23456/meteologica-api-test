import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PAGE_SIZE = 20;

export function parseRowDate(value: string): Date | null {
  const parsed = new Date(value.replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

export function parseMaybeDate(value: string): Date | null {
  const parsed = new Date(value.replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

export const MONTHS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const PRIORITY_COLUMNS = [
  "From yyyy-mm-dd hh:mm",
  "To yyyy-mm-dd hh:mm",
  "forecast",
  "perc10",
  "perc90",
];

export const COLUMN_LABELS: Record<string, string> = {
  "From yyyy-mm-dd hh:mm": "From",
  "To yyyy-mm-dd hh:mm": "To",
  forecast: "Forecast (P50)",
  perc10: "P10",
  perc90: "P90",
  "UTC offset from (UTC+/-hhmm)": "UTC Offset From",
  "UTC offset to (UTC+/-hhmm)": "UTC Offset To",
};

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 10 }, (_, i) =>
  String(CURRENT_YEAR - i),
);

export const NUMERIC_COLUMNS = new Set(["forecast", "perc10", "perc90"]);

export const DATE_COLUMNS = ["From yyyy-mm-dd hh:mm", "To yyyy-mm-dd hh:mm"];
