import {
  COLUMN_LABELS,
  DATE_COLUMNS,
  NUMERIC_COLUMNS,
  PAGE_SIZE,
  parseMaybeDate,
  PRIORITY_COLUMNS,
} from "@/lib/utils";
import { HistoricalJsonDetailProps } from "@/types/history";
import { SortDirection } from "@/types/sorting";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  LineChartIcon,
  TableIcon,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

export default function HistoricalJsonDetail({
  fileName,
  data,
  onBack,
}: HistoricalJsonDetailProps) {
  const [view, setView] = useState<"table" | "chart">("chart");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string>("From yyyy-mm-dd hh:mm");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const columns = useMemo(() => {
    const allKeys = new Set<string>();
    data.data.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
    const remaining = Array.from(allKeys)
      .filter((k) => !PRIORITY_COLUMNS.includes(k))
      .sort();
    return [...PRIORITY_COLUMNS.filter((k) => allKeys.has(k)), ...remaining];
  }, [data]);

  const filteredRows = useMemo(() => {
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    if (!from && !to) return data.data;

    return data.data.filter((row) => {
      const rowDate = parseMaybeDate(row["From yyyy-mm-dd hh:mm"] ?? "");
      if (!rowDate) return true;
      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;
      return true;
    });
  }, [data, fromDate, toDate]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    rows.sort((a, b) => {
      const aRaw = a[sortKey];
      const bRaw = b[sortKey];

      let comparison = 0;

      if (DATE_COLUMNS.includes(sortKey)) {
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
  }, [filteredRows, sortKey, sortDirection]);

  const pageResetToken = `${sortKey}|${sortDirection}|${fromDate}|${toDate}`;
  const [prevPageResetToken, setPrevPageResetToken] = useState(pageResetToken);
  if (pageResetToken !== prevPageResetToken) {
    setPrevPageResetToken(pageResetToken);
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

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  const hasActiveFilter = fromDate !== "" || toDate !== "";

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-slate-700" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-slate-700" />
    );
  };

  const formatCell = (key: string, value: string | undefined) => {
    if (value === undefined) return "—";
    if (NUMERIC_COLUMNS.has(key)) return Number(value).toLocaleString();
    return value;
  };

  const chartData = useMemo(
    () =>
      filteredRows.map((row) => ({
        time: row["From yyyy-mm-dd hh:mm"]?.slice(5),
        forecast: Number(row.forecast ?? 0),
        perc10: Number(row.perc10 ?? 0),
        perc90: Number(row.perc90 ?? 0),
      })),
    [filteredRows],
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
    link.download = `${fileNameWithoutExt}_${fromDate || "all"}_${toDate || "all"}.csv`;
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
    XLSX.writeFile(
      workbook,
      `${fileNameWithoutExt}_${fromDate || "all"}_${toDate || "all"}.xlsx`,
    );
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
        <h2 className="text-2xl font-bold text-slate-900">
          {data.content_name} - {fileName}
        </h2>
        <div className="mt-2 flex flex-wrap gap-x-4 items-center mt-4 text-sm text-slate-600">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              className="cursor-pointer font-semibold text-black"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to files
            </Button>
          </motion.div>
          <span>Issued: {data.issue_date}</span>
          <span>Timezone: {data.timezone}</span>
          <span>Unit: {data.unit}</span>
          <span>Installed capacity: {data.installed_capacity}</span>
          <span className="font-medium text-slate-700">
            {filteredRows.length} rows
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">From</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-40"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">To</label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-40"
            />
          </div>

          {hasActiveFilter && (
            <Button
              variant="ghost"
              className="cursor-pointer text-slate-500"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-slate-200 bg-white p-0.5">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                size="sm"
                variant={view === "chart" ? "default" : "ghost"}
                className={
                  view === "chart"
                    ? "cursor-pointer bg-slate-900 text-white hover:bg-slate-800"
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
                    ? "cursor-pointer bg-slate-900 text-white hover:bg-slate-800"
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
              className="cursor-pointer font-semibold"
              onClick={handleDownloadCSV}
              disabled={sortedRows.length === 0}
            >
              <Download className="h-4 w-4" />
              CSV
            </Button>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button
              variant="outline"
              className="cursor-pointer font-semibold"
              onClick={handleDownloadXLS}
              disabled={sortedRows.length === 0}
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
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            {chartData.length === 0 ? (
              <div className="flex h-[420px] items-center justify-center text-sm text-slate-500">
                No rows match the selected date range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={420}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient
                      id="forecastLine"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
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
            )}
          </motion.div>
        ) : (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                    {columns.map((col) => (
                      <TableHead
                        key={col}
                        className={`whitespace-nowrap text-slate-700 ${
                          NUMERIC_COLUMNS.has(col) ? "text-right" : ""
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(col)}
                          className={`inline-flex cursor-pointer items-center gap-1 ${
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
                  {sortedRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="py-8 text-center text-slate-500"
                      >
                        No rows match the selected date range.
                      </TableCell>
                    </TableRow>
                  ) : (
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
                          className="border-b border-slate-100 odd:bg-white even:bg-slate-50/60 hover:bg-slate-50"
                        >
                          {columns.map((col) => (
                            <TableCell
                              key={col}
                              className={`whitespace-nowrap ${
                                NUMERIC_COLUMNS.has(col)
                                  ? "text-right tabular-nums " +
                                    (col === "forecast"
                                      ? "font-semibold text-slate-900"
                                      : "text-slate-600")
                                  : "text-slate-600"
                              }`}
                            >
                              {formatCell(col, row[col])}
                            </TableCell>
                          ))}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span>
                Page{" "}
                <span className="font-semibold text-slate-900">{safePage}</span>{" "}
                of {totalPages} &middot; {sortedRows.length} rows
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
