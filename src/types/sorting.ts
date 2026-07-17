export type SortKey =
  | "From yyyy-mm-dd hh:mm"
  | "To yyyy-mm-dd hh:mm"
  | "perc10"
  | "forecast"
  | "perc90";

export type SortDirection = "asc" | "desc";

export const DATE_COLUMNS: SortKey[] = [
  "From yyyy-mm-dd hh:mm",
  "To yyyy-mm-dd hh:mm",
];
