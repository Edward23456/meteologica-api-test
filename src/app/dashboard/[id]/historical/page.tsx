"use client";

import { useParams } from "next/navigation";
import HistoricalDownloadForm from "@/components/historical/HistoricalDownloadForm";

export default function ContentIdHistory() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">Historical Data</h1>
      <p className="text-sm text-gray-500">
        Select a year and month, then download the historical data archive.
      </p>

      <HistoricalDownloadForm contentId={id} />
    </div>
  );
}
