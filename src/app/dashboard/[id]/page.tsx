"use client";

import { ContentData } from "@/types/contents";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForecastCardList } from "@/components/forecast/ForecastCardList";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import ContentIdSkeleton from "@/components/loading/ContentIdSkeleton";
import * as XLSX from "xlsx";
import { parseRowDate } from "@/lib/utils";
import { DATE_COLUMNS, SortDirection, SortKey } from "@/types/sorting";

const PAGE_SIZE = 20;

export default function ContentId() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("From yyyy-mm-dd hh:mm");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data, isLoading, isError, error } = useQuery<ContentData>({
    queryKey: ["content-data", id],
    queryFn: async () => {
      const response = await fetch(`/api/contents/${id}/data`);

      if (!response.ok) {
        throw new Error(`Failed to fetch content data: ${response.status}`);
      }

      return response.json();
    },
  });

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setPage(1);
    setFromDate("");
    setToDate("");
    setSortKey("From yyyy-mm-dd hh:mm");
    setSortDirection("asc");
  }

  const formatMW = (value: string) => Number(value).toLocaleString();

  const filterKey = `${fromDate}|${toDate}|${sortKey}|${sortDirection}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const filteredRows = useMemo(() => {
    if (!data) return [];

    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

    if (!from && !to) return data.data;

    return data.data.filter((row) => {
      const rowDate = parseRowDate(row["From yyyy-mm-dd hh:mm"]);
      if (!rowDate) return true;
      if (from && rowDate < from) return false;
      if (to && rowDate > to) return false;
      return true;
    });
  }, [data, fromDate, toDate]);

  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    rows.sort((a, b) => {
      let comparison = 0;

      if (DATE_COLUMNS.includes(sortKey)) {
        const aDate = parseRowDate(a[sortKey])?.getTime() ?? 0;
        const bDate = parseRowDate(b[sortKey])?.getTime() ?? 0;
        comparison = aDate - bDate;
      } else {
        const aNum = Number(a[sortKey]);
        const bNum = Number(b[sortKey]);
        comparison = aNum - bNum;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [filteredRows, sortKey, sortDirection]);

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

  const clearFilters = () => {
    setFromDate("");
    setToDate("");
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-indigo-400/60" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-indigo-200" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-indigo-200" />
    );
  };

  const exportColumns = [
    { key: "From yyyy-mm-dd hh:mm", label: "From" },
    { key: "To yyyy-mm-dd hh:mm", label: "To" },
    { key: "perc10", label: "P10" },
    { key: "forecast", label: "Forecast (P50)" },
    { key: "perc90", label: "P90" },
  ] as const;

  const handleDownloadCSV = () => {
    const header = exportColumns.map((c) => c.label).join(",");
    const rows = sortedRows.map((row) =>
      exportColumns.map((c) => `"${row[c.key]}"`).join(","),
    );
    const csvContent = [header, ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${data?.content_name ?? "forecast"}_${fromDate || "all"}_${toDate || "all"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadXLS = () => {
    const rows = sortedRows.map((row) =>
      Object.fromEntries(exportColumns.map((c) => [c.label, row[c.key]])),
    );

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Forecast");
    XLSX.writeFile(
      workbook,
      `${data?.content_name ?? "forecast"}_${fromDate || "all"}_${toDate || "all"}.xlsx`,
    );
  };

  const hasActiveFilter = fromDate !== "" || toDate !== "";

  const columns: { key: SortKey; label: string; align: "left" | "right" }[] = [
    { key: "From yyyy-mm-dd hh:mm", label: "From", align: "left" },
    { key: "To yyyy-mm-dd hh:mm", label: "To", align: "left" },
    { key: "perc10", label: "P10", align: "right" },
    { key: "forecast", label: "Forecast (P50)", align: "right" },
    { key: "perc90", label: "P90", align: "right" },
  ];

  return (
    <div className="flex flex-col p-4">
      {isLoading && <ContentIdSkeleton />}

      {isError && (
        <p className="text-red-500">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="mb-4">
            <h1 className="text-2xl font-bold">{data.content_name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-500">
              <span>Issued: {data.issue_date}</span>
              <span>Timezone: {data.timezone}</span>
              <span>Unit: {data.unit}</span>
              <span>Installed capacity: {data.installed_capacity}</span>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-indigo-100 p-4 shadow-sm">
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

            <div className="ml-auto flex items-center gap-2">
              <span className="text-sm text-slate-500">
                {sortedRows.length} rows
              </span>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleDownloadCSV}
                disabled={sortedRows.length === 0}
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={handleDownloadXLS}
                disabled={sortedRows.length === 0}
              >
                <Download className="h-4 w-4" />
                XLS
              </Button>
            </div>
          </div>

          <div className="md:hidden">
            <ForecastCardList rows={pagedRows} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="hidden md:block rounded-lg border border-indigo-100 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto font-mono">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-indigo-100 bg-indigo-950 hover:bg-indigo-950">
                    {columns.map((col) => (
                      <TableHead
                        key={col.key}
                        className={`text-indigo-200 ${col.align === "right" ? "text-right" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(col.key)}
                          className={`inline-flex cursor-pointer items-center gap-1 hover:text-white ${
                            col.align === "right" ? "flex-row-reverse" : ""
                          }`}
                        >
                          {col.label}
                          <SortIcon column={col.key} />
                        </button>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
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
                          className="border-b border-indigo-50 odd:bg-white even:bg-indigo-50/40 hover:bg-indigo-100/60"
                        >
                          <TableCell className="text-slate-600">
                            {row["From yyyy-mm-dd hh:mm"]}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {row["To yyyy-mm-dd hh:mm"]}
                          </TableCell>
                          <TableCell className="text-right text-slate-500 tabular-nums">
                            {formatMW(row.perc10)}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-indigo-700 tabular-nums">
                            {formatMW(row.forecast)}
                          </TableCell>
                          <TableCell className="text-right text-slate-500 tabular-nums">
                            {formatMW(row.perc90)}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm text-slate-600">
              <span>
                Page{" "}
                <span className="font-semibold text-indigo-700">
                  {safePage}
                </span>{" "}
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

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages })
                    .map((_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - safePage) <= 1,
                    )
                    .reduce<number[]>((acc, p) => {
                      const prev = acc[acc.length - 1];
                      if (prev !== undefined && p - prev > 1) acc.push(-1);
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((p, idx) =>
                      p === -1 ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-1 text-slate-400"
                        >
                          &hellip;
                        </span>
                      ) : (
                        <Button
                          key={p}
                          size="icon"
                          variant={p === safePage ? "default" : "ghost"}
                          className={
                            p === safePage
                              ? "cursor-pointer bg-indigo-700 hover:bg-indigo-700"
                              : "cursor-pointer text-slate-600"
                          }
                          onClick={() => goToPage(p)}
                        >
                          {p}
                        </Button>
                      ),
                    )}
                </div>

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
        </>
      )}
    </div>
  );
}
