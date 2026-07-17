"use client";

import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Download,
  FileJson,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  TableIcon,
  LineChartIcon,
  Archive,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import * as XLSX from "xlsx";

const MONTHS = [
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

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => String(CURRENT_YEAR - i));

const PAGE_SIZE = 20;

const PRIORITY_COLUMNS = [
  "From yyyy-mm-dd hh:mm",
  "To yyyy-mm-dd hh:mm",
  "forecast",
  "perc10",
  "perc90",
];

const COLUMN_LABELS: Record<string, string> = {
  "From yyyy-mm-dd hh:mm": "From",
  "To yyyy-mm-dd hh:mm": "To",
  forecast: "Forecast (P50)",
  perc10: "P10",
  perc90: "P90",
  "UTC offset from (UTC+/-hhmm)": "UTC Offset From",
  "UTC offset to (UTC+/-hhmm)": "UTC Offset To",
};

const NUMERIC_COLUMNS = new Set(["forecast", "perc10", "perc90"]);
const DATE_COLUMNS = new Set(["From yyyy-mm-dd hh:mm", "To yyyy-mm-dd hh:mm"]);

interface HistoricalRow {
  [key: string]: string;
}

interface HistoricalJsonData {
  content_id: number;
  content_name: string;
  data: HistoricalRow[];
  installed_capacity: string;
  issue_date: string;
  timezone: string;
  unit: string;
  update_id: string;
}

interface HistoricalDownloadFormProps {
  contentId: string;
}

interface ExtractedZip {
  blob: Blob;
  jsonFiles: JSZip.JSZipObject[];
}

export default function HistoricalDownloadForm({
  contentId,
}: HistoricalDownloadFormProps) {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [zipResult, setZipResult] = useState<ExtractedZip | null>(null);
  const [openingName, setOpeningName] = useState<string | null>(null);

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<HistoricalJsonData | null>(
    null,
  );

  const fetchMutation = useMutation({
    mutationFn: async () => {
      const query = new URLSearchParams({ year, month }).toString();
      const response = await fetch(
        `/api/contents/${contentId}/historical?${query}`,
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to download: ${response.status}`,
        );
      }

      const blob = await response.blob();
      const zip = await JSZip.loadAsync(blob);

      const jsonFiles = Object.values(zip.files).filter(
        (file) => !file.dir && file.name.toLowerCase().endsWith(".json"),
      );

      return { blob, jsonFiles };
    },
    onSuccess: (result) => {
      setZipResult(result);
      setSelectedName(null);
      setSelectedData(null);
    },
  });

  const handleDownloadZip = () => {
    if (!zipResult) return;

    const blobUrl = window.URL.createObjectURL(zipResult.blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `historical_data_${contentId}_${year}_${month}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleSelectFile = async (file: JSZip.JSZipObject) => {
    setOpeningName(file.name);

    try {
      const text = await file.async("string");
      const parsed: HistoricalJsonData = JSON.parse(text);
      setSelectedName(file.name);
      setSelectedData(parsed);
    } catch {
      setSelectedName(null);
      setSelectedData(null);
    } finally {
      setOpeningName(null);
    }
  };

  const handleBackToList = () => {
    setSelectedName(null);
    setSelectedData(null);
  };

  if (selectedData) {
    return (
      <HistoricalJsonDetail
        fileName={selectedName ?? ""}
        data={selectedData}
        onBack={handleBackToList}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
          Historical Data
        </h1>
        <p className="text-sm text-gray-500">
          Select a year and month, then download the historical data archive.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex flex-col gap-4 rounded-lg border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Year</label>
            <Select
              value={year}
              onValueChange={(value) => setYear(value ?? String(CURRENT_YEAR))}
            >
              <SelectTrigger className="w-32 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y} className="cursor-pointer">
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Month</label>
            <Select
              value={month}
              onValueChange={(value) =>
                setMonth(value ?? String(new Date().getMonth() + 1))
              }
            >
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem
                    key={m.value}
                    value={m.value}
                    className="cursor-pointer"
                  >
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              className="cursor-pointer bg-gradient-to-r from-indigo-700 to-violet-600 hover:from-indigo-800 hover:to-violet-700"
              onClick={() => fetchMutation.mutate()}
              disabled={fetchMutation.isPending}
            >
              {fetchMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Fetch Archive
                </>
              )}
            </Button>
          </motion.div>

          <AnimatePresence>
            {zipResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileTap={{ scale: 0.97 }}
              >
                <Button
                  variant="outline"
                  className="cursor-pointer border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  onClick={handleDownloadZip}
                >
                  <Download className="h-4 w-4" />
                  Download ZIP
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {fetchMutation.isError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-sm text-red-500"
            >
              {fetchMutation.error instanceof Error
                ? fetchMutation.error.message
                : "Something went wrong."}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {zipResult && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="overflow-hidden rounded-lg border border-indigo-100 shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-indigo-100 bg-gradient-to-r from-indigo-950 to-violet-950 px-4 py-2.5 text-sm font-medium text-indigo-100">
              <FolderOpen className="h-4 w-4 text-indigo-300" />
              {zipResult.jsonFiles.length === 0
                ? "No JSON files found in this archive."
                : `${zipResult.jsonFiles.length} JSON file${zipResult.jsonFiles.length === 1 ? "" : "s"} found — click one to view`}
            </div>

            {zipResult.jsonFiles.length > 0 && (
              <ul className="divide-y divide-indigo-50">
                {zipResult.jsonFiles.map((file, i) => (
                  <motion.li
                    key={file.name}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.25,
                      delay: i * 0.02,
                      ease: "easeOut",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectFile(file)}
                      disabled={openingName === file.name}
                      className="group flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-indigo-50/70 disabled:cursor-wait"
                    >
                      {openingName === file.name ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-500" />
                      ) : (
                        <FileJson className="h-4 w-4 shrink-0 text-indigo-400 transition-colors group-hover:text-indigo-600" />
                      )}
                      <span className="truncate font-mono">{file.name}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail view: table + chart for a single selected JSON file
// ---------------------------------------------------------------------------

interface HistoricalJsonDetailProps {
  fileName: string;
  data: HistoricalJsonData;
  onBack: () => void;
}

type SortDirection = "asc" | "desc";

function parseMaybeDate(value: string): Date | null {
  const parsed = new Date(value.replace(" ", "T"));
  return isNaN(parsed.getTime()) ? null : parsed;
}

function HistoricalJsonDetail({
  fileName,
  data,
  onBack,
}: HistoricalJsonDetailProps) {
  const [view, setView] = useState<"table" | "chart">("chart");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("From yyyy-mm-dd hh:mm");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const columns = useMemo(() => {
    const allKeys = new Set<string>();
    data.data.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
    const remaining = Array.from(allKeys)
      .filter((k) => !PRIORITY_COLUMNS.includes(k))
      .sort();
    return [...PRIORITY_COLUMNS.filter((k) => allKeys.has(k)), ...remaining];
  }, [data]);

  const sortedRows = useMemo(() => {
    const rows = [...data.data];

    rows.sort((a, b) => {
      const aRaw = a[sortKey];
      const bRaw = b[sortKey];

      let comparison = 0;

      if (DATE_COLUMNS.has(sortKey)) {
        const aDate = parseMaybeDate(aRaw ?? "")?.getTime() ?? 0;
        const bDate = parseMaybeDate(bRaw ?? "")?.getTime() ?? 0;
        comparison = aDate - bDate;
      } else if (NUMERIC_COLUMNS.has(sortKey)) {
        comparison = Number(aRaw ?? 0) - Number(bRaw ?? 0);
      } else {
        comparison = (aRaw ?? "").localeCompare(bRaw ?? "");
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [data, sortKey, sortDirection]);

  // Reset to page 1 whenever sort changes — adjusted during render, not via effect
  const sortKeyToken = `${sortKey}|${sortDirection}`;
  const [prevSortToken, setPrevSortToken] = useState(sortKeyToken);
  if (sortKeyToken !== prevSortToken) {
    setPrevSortToken(sortKeyToken);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sortedRows.slice(start, start + PAGE_SIZE);
  }, [sortedRows, safePage]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-indigo-300/70" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-indigo-200" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-indigo-200" />
    );
  };

  const formatCell = (key: string, value: string | undefined) => {
    if (value === undefined) return "—";
    if (NUMERIC_COLUMNS.has(key)) return Number(value).toLocaleString();
    return value;
  };

  const chartData = useMemo(
    () =>
      data.data.map((row) => ({
        time: row["From yyyy-mm-dd hh:mm"]?.slice(5), // trim year for a tighter axis label
        forecast: Number(row.forecast ?? 0),
        perc10: Number(row.perc10 ?? 0),
        perc90: Number(row.perc90 ?? 0),
      })),
    [data],
  );

  const fileNameWithoutExt = fileName.replace(/\.json$/i, "");

  const handleDownloadCSV = () => {
    const header = columns.map((c) => COLUMN_LABELS[c] ?? c).join(",");
    const rows = sortedRows.map((row) =>
      columns.map((c) => `"${row[c] ?? ""}"`).join(","),
    );
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileNameWithoutExt}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadXLS = () => {
    const rows = sortedRows.map((row) =>
      Object.fromEntries(
        columns.map((c) => [COLUMN_LABELS[c] ?? c, row[c] ?? ""]),
      ),
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Historical");
    XLSX.writeFile(workbook, `${fileNameWithoutExt}.xlsx`);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4 p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-violet-600 bg-clip-text text-transparent">
          {data.content_name}
        </h2>
        <p className="mt-1 truncate font-mono text-xs text-slate-400">
          {fileName}
        </p>
        <div className="mt-2 flex flex-wrap gap-x-4 text-sm text-gray-500">
          <span>Issued: {data.issue_date}</span>
          <span>Timezone: {data.timezone}</span>
          <span>Unit: {data.unit}</span>
          <span>Installed capacity: {data.installed_capacity}</span>
          <span className="font-medium text-indigo-600">
            {data.data.length} rows
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="ghost"
            className="cursor-pointer text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to files
          </Button>
        </motion.div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-indigo-100 bg-white p-0.5">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant={view === "chart" ? "default" : "ghost"}
                className={
                  view === "chart"
                    ? "cursor-pointer bg-gradient-to-r from-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-600"
                    : "cursor-pointer text-slate-600"
                }
                onClick={() => setView("chart")}
              >
                <LineChartIcon className="h-4 w-4" />
                Chart
              </Button>
            </motion.div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant={view === "table" ? "default" : "ghost"}
                className={
                  view === "table"
                    ? "cursor-pointer bg-gradient-to-r from-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-600"
                    : "cursor-pointer text-slate-600"
                }
                onClick={() => setView("table")}
              >
                <TableIcon className="h-4 w-4" />
                Table
              </Button>
            </motion.div>
          </div>

          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              className="cursor-pointer border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={handleDownloadCSV}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              className="cursor-pointer border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              onClick={handleDownloadXLS}
            >
              <Download className="h-4 w-4" />
              XLS
            </Button>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {view === "chart" ? (
          <motion.div
            key="chart"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-lg border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/20 p-4 shadow-sm"
          >
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData}>
                <defs>
                  <linearGradient id="forecastLine" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#7c3aed" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  interval={Math.ceil(chartData.length / 12)}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  label={{
                    value: data.unit,
                    angle: -90,
                    position: "insideLeft",
                    style: { fontSize: 11, fill: "#64748b" },
                  }}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    borderColor: "#c7d2fe",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.15)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  type="monotone"
                  dataKey="perc90"
                  name="P90"
                  stroke="#c4b5fd"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  name="Forecast (P50)"
                  stroke="url(#forecastLine)"
                  strokeWidth={2.5}
                  dot={false}
                  animationDuration={800}
                />
                <Line
                  type="monotone"
                  dataKey="perc10"
                  name="P10"
                  stroke="#a5b4fc"
                  strokeWidth={1.5}
                  dot={false}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-lg border border-indigo-100 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto font-mono">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-indigo-100 bg-gradient-to-r from-indigo-950 to-violet-950 hover:from-indigo-950 hover:to-violet-950">
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        className={`whitespace-nowrap text-indigo-200 ${
                          NUMERIC_COLUMNS.has(col) ? "text-right" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(col)}
                          className={`inline-flex cursor-pointer items-center gap-1 hover:text-white ${
                            NUMERIC_COLUMNS.has(col) ? "flex-row-reverse" : ""
                          }`}
                        >
                          {COLUMN_LABELS[col] ?? col}
                          <SortIcon column={col} />
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {pagedRows.map((row, i) => (
                      <motion.tr
                        key={`${safePage}-${sortKey}-${sortDirection}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: 0.2,
                          delay: i * 0.01,
                          ease: "easeOut",
                        }}
                        className="border-b border-indigo-50 odd:bg-white even:bg-indigo-50/40 hover:bg-indigo-100/60"
                      >
                        {columns.map((col) => (
                          <TableCell
                            key={col}
                            className={`whitespace-nowrap ${
                              NUMERIC_COLUMNS.has(col)
                                ? "text-right tabular-nums " +
                                  (col === "forecast"
                                    ? "font-semibold text-indigo-700"
                                    : "text-slate-500")
                                : "text-slate-600"
                            }`}
                          >
                            {formatCell(col, row[col])}
                          </TableCell>
                        ))}
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/40 px-4 py-3 text-sm text-slate-600">
              <span>
                Page{" "}
                <span className="font-semibold text-indigo-700">
                  {safePage}
                </span>{" "}
                of {totalPages}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  disabled={safePage === 1}
                  onClick={() => goToPage(safePage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  disabled={safePage === totalPages}
                  onClick={() => goToPage(safePage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
