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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Download, FileJson, Copy, Check } from "lucide-react";
import { CURRENT_YEAR, MONTHS, YEARS } from "@/lib/utils";

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

  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<unknown>(null);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setSelectedContent(null);
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
    setSelectedName(file.name);
    setIsLoadingContent(true);
    setIsDialogOpen(true);
    setCopied(false);

    try {
      const text = await file.async("string");
      try {
        setSelectedContent(JSON.parse(text));
      } catch {
        // Not valid JSON despite the extension — show raw text instead
        setSelectedContent(text);
      }
    } finally {
      setIsLoadingContent(false);
    }
  };

  const handleCopy = async () => {
    const text =
      typeof selectedContent === "string"
        ? selectedContent
        : JSON.stringify(selectedContent, null, 2);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-4">
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
            onClick={() => fetchMutation.mutate()}
            disabled={fetchMutation.isPending}
          >
            {fetchMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Fetch Archive"
            )}
          </Button>

          {zipResult && (
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={handleDownloadZip}
            >
              <Download className="h-4 w-4" />
              Download ZIP
            </Button>
          )}
        </div>

        {fetchMutation.isError && (
          <p className="text-sm text-red-500">
            {fetchMutation.error instanceof Error
              ? fetchMutation.error.message
              : "Something went wrong."}
          </p>
        )}
      </div>

      {zipResult && (
        <div className="rounded-lg border border-indigo-100 shadow-sm">
          <div className="border-b border-indigo-100 bg-indigo-50/40 px-4 py-2 text-sm font-medium text-slate-700">
            {zipResult.jsonFiles.length === 0
              ? "No JSON files found in this archive."
              : `${zipResult.jsonFiles.length} JSON file${zipResult.jsonFiles.length === 1 ? "" : "s"} found — click one to preview`}
          </div>

          {zipResult.jsonFiles.length > 0 && (
            <ul className="divide-y divide-indigo-50">
              {zipResult.jsonFiles.map((file) => (
                <li key={file.name}>
                  <button
                    type="button"
                    onClick={() => handleSelectFile(file)}
                    className="flex w-full cursor-pointer items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-indigo-50/60"
                  >
                    <FileJson className="h-4 w-4 shrink-0 text-indigo-500" />
                    <span className="truncate font-mono">{file.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2 pr-6">
              <span className="truncate font-mono text-sm font-normal text-slate-600">
                {selectedName}
              </span>
              {!isLoadingContent && (
                <Button
                  size="sm"
                  variant="outline"
                  className="cursor-pointer shrink-0"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? "Copied" : "Copy"}
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="overflow-auto rounded-md bg-slate-950 p-4">
            {isLoadingContent ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap break-words font-mono text-xs text-indigo-100">
                {typeof selectedContent === "string"
                  ? selectedContent
                  : JSON.stringify(selectedContent, null, 2)}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
