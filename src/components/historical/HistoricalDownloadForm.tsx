"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download } from "lucide-react";

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

interface HistoricalDownloadFormProps {
  contentId: string;
}

export default function HistoricalDownloadForm({
  contentId,
}: HistoricalDownloadFormProps) {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));

  const downloadMutation = useMutation({
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
      return blob;
    },
    onSuccess: (blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `historical_data_${contentId}_${year}_${month}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    },
  });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-indigo-100 p-4 shadow-sm">
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

        <Button
          className="cursor-pointer bg-indigo-700 hover:bg-indigo-800"
          onClick={() => downloadMutation.mutate()}
          disabled={downloadMutation.isPending}
        >
          {downloadMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download ZIP
            </>
          )}
        </Button>
      </div>

      {downloadMutation.isError && (
        <p className="text-sm text-red-500">
          {downloadMutation.error instanceof Error
            ? downloadMutation.error.message
            : "Something went wrong."}
        </p>
      )}
    </div>
  );
}
