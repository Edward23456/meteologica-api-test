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
import { ForecastCardList } from "@/components/forecast/ForecastCardList";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ContentIdSkeleton from "@/components/loading/ContentIdSkeleton";

const PAGE_SIZE = 20;

export default function ContentId() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);

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
  }

  const formatMW = (value: string) => Number(value).toLocaleString();

  const totalPages = data ? Math.ceil(data.data.length / PAGE_SIZE) : 1;

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pagedRows = useMemo(() => {
    if (!data) return [];
    const start = (page - 1) * PAGE_SIZE;
    return data.data.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

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

          <div className="md:hidden">
            <ForecastCardList rows={data.data} />
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
                    <TableHead className="text-indigo-200">From</TableHead>
                    <TableHead className="text-indigo-200">To</TableHead>
                    <TableHead className="text-right text-indigo-200">
                      P10
                    </TableHead>
                    <TableHead className="text-right text-indigo-200">
                      Forecast (P50)
                    </TableHead>
                    <TableHead className="text-right text-indigo-200">
                      P90
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="wait">
                    {pagedRows.map((row, i) => (
                      <motion.tr
                        key={`${page}-${i}`}
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
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between border-t border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm text-slate-600">
              <span>
                Page{" "}
                <span className="font-semibold text-indigo-700">
                  {safePage}
                </span>{" "}
                of {totalPages} &middot; {data.data.length} rows
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="cursor-pointer"
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages })
                    .map((_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                    )
                    .reduce<number[]>((acc, p) => {
                      const prev = acc[acc.length - 1];
                      if (prev !== undefined && p - prev > 1) acc.push(-1); // ellipsis marker
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
                          variant={p === page ? "default" : "ghost"}
                          className={
                            p === page
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
                  disabled={page === totalPages}
                  onClick={() => goToPage(page + 1)}
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
