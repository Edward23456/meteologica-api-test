import JSZip from "jszip";

export interface HistoricalRow {
  [key: string]: string;
}

export interface HistoricalJsonData {
  content_id: number;
  content_name: string;
  data: HistoricalRow[];
  installed_capacity: string;
  issue_date: string;
  timezone: string;
  unit: string;
  update_id: string;
}

export interface HistoricalDownloadFormProps {
  contentId: string;
}

export interface ExtractedZip {
  blob: Blob;
  jsonFiles: JSZip.JSZipObject[];
}

export interface HistoricalJsonDetailProps {
  fileName: string;
  data: HistoricalJsonData;
  onBack: () => void;
}
