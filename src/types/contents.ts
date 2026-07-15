export interface Content {
  id: string;
  content_name: string;
  path: string;
}

export interface ContentLatest {
  content_id: number;
  issue_date: string;
  update_id: string;
}

export interface ContentDataRow {
  "ARPEGE RUN": string;
  "ECMWF ENS RUN": string;
  "ECMWF HRES RUN": string;
  "From yyyy-mm-dd hh:mm": string;
  "GFS RUN": string;
  "To yyyy-mm-dd hh:mm": string;
  "UTC offset from (UTC+/-hhmm)": string;
  "UTC offset to (UTC+/-hhmm)": string;
  perc10: string;
  perc50: string;
  perc90: string;
}

export interface ContentData {
  content_id: number;
  content_name: string;
  data: ContentDataRow[];
  issue_date: string;
  timezone: string;
  unit: string;
  update_id: string;
}
