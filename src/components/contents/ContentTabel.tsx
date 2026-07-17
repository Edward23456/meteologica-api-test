"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Content, ContentLatest } from "@/types/contents";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import ContentUpdatesButton from "./ContentUpdatesButton";
import { Button } from "../ui/button";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 20;

interface ContentTableProps {
  items: Content[];
  showLatest: boolean;
  contentLatest?: ContentLatest;
}

export default function ContentTable({
  items,
  showLatest,
  contentLatest,
}: ContentTableProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);

  const [prevItems, setPrevItems] = useState(items);
  if (items !== prevItems) {
    setPrevItems(items);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePage]);

  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full overflow-hidden rounded-lg border border-indigo-100 shadow-sm"
    >
      <div className="overflow-x-auto font-mono">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="border-b border-indigo-100 bg-indigo-950 hover:bg-indigo-950">
              <TableHead className="w-[35%] text-indigo-200">Title</TableHead>
              <TableHead className="w-[25%] text-indigo-200">
                {showLatest ? "Latest" : "Path"}
              </TableHead>
              <TableHead className="w-[40%] text-right text-indigo-200">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="wait">
              {pagedItems.map((content, i) => (
                <motion.tr
                  key={`${safePage}-${content.id}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: i * 0.02,
                    ease: "easeOut",
                  }}
                  className="border-b border-indigo-50 odd:bg-white even:bg-indigo-50/40 hover:bg-indigo-100/60"
                >
                  <TableCell
                    className="truncate font-medium text-slate-700"
                    title={
                      showLatest
                        ? `${contentLatest?.content_id}`
                        : content.content_name
                    }
                  >
                    {showLatest
                      ? `${contentLatest?.content_id} - `
                      : content.content_name}
                  </TableCell>
                  <TableCell
                    className="truncate text-slate-600"
                    title={
                      showLatest ? `${contentLatest?.issue_date}` : content.path
                    }
                  >
                    {showLatest
                      ? `${contentLatest?.issue_date} - `
                      : content.path}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <ContentUpdatesButton contentId={content.id} />
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => router.push(`/dashboard/${content.id}`)}
                      >
                        View Data
                      </Button>
                      <Button
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/${content.id}/historical`)
                        }
                      >
                        View History
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {items.length > PAGE_SIZE && (
        <div className="flex items-center justify-between border-t border-indigo-100 bg-indigo-50/40 px-4 py-3 text-sm text-slate-600">
          <span>
            Page{" "}
            <span className="font-semibold text-indigo-700">{safePage}</span> of{" "}
            {totalPages} &middot; {items.length} rows
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
                    p === 1 || p === totalPages || Math.abs(p - safePage) <= 1,
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
      )}
    </motion.div>
  );
}
