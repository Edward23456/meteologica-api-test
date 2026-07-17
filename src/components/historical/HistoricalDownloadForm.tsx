"use client";

import { useState } from "react";
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
  Loader2,
  Download,
  FileJson,
  Archive,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ExtractedZip,
  HistoricalDownloadFormProps,
  HistoricalJsonData,
} from "@/types/history";
import HistoricalJsonDetail from "./HistoricalJsonDetail";
import { CURRENT_YEAR, MONTHS, YEARS } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function HistoricalDownloadForm({
  contentId,
}: HistoricalDownloadFormProps) {
  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [zipResult, setZipResult] = useState<ExtractedZip | null>(null);
  const [openingName, setOpeningName] = useState<string | null>(null);
  const router = useRouter();
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
        <h1 className="text-2xl font-bold text-slate-900">Historical Data</h1>
        <p className="text-sm text-slate-500">
          Select a year and month, then download the historical data archive.
        </p>
        <Button
          variant="outline"
          className="cursor-pointer mt-4 font-semibold text-black"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to contents
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-700">Year</label>
            <Select
              value={year}
              onValueChange={(value) => setYear(value ?? String(CURRENT_YEAR))}
            >
              <SelectTrigger className="w-32 cursor-pointer border-slate-200">
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
              <SelectTrigger className="w-40 cursor-pointer border-slate-200">
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
              className="cursor-pointer bg-slate-900 font-semibold text-white hover:bg-slate-800"
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
                  className="cursor-pointer font-semibold"
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
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700">
              <FolderOpen className="h-4 w-4 text-slate-500" />
              {zipResult.jsonFiles.length === 0
                ? "No JSON files found in this archive."
                : `${zipResult.jsonFiles.length} JSON file${zipResult.jsonFiles.length === 1 ? "" : "s"} found — click one to view`}
            </div>

            {zipResult.jsonFiles.length > 0 && (
              <ul className="divide-y divide-slate-100">
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
                      className="group flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait"
                    >
                      {openingName === file.name ? (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-500" />
                      ) : (
                        <FileJson className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-slate-600" />
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
