"use client";

import { useParams } from "next/navigation";
import HistoricalDownloadForm from "@/components/historical/HistoricalDownloadForm";

export default function ContentIdHistory() {
  const { id } = useParams<{ id: string }>();

  return <HistoricalDownloadForm contentId={id} />;
}
