"use client";

import { ContentData } from "@/types/contents";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ContentId() {
  const { id } = useParams<{ id: string }>();

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

  return (
    <div className="flex flex-col p-6">
      {isLoading && <p>Loading...</p>}

      {isError && (
        <p className="text-red-500">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
      )}

      {!isLoading && !isError && data && (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-bold">{data.content_name}</h1>
            <div className="mt-1 flex flex-wrap gap-x-4 text-sm text-gray-500">
              <span>Issued: {data.issue_date}</span>
              <span>Timezone: {data.timezone}</span>
              <span>Unit: {data.unit}</span>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead className="text-right">P10</TableHead>
                  <TableHead className="text-right">P50</TableHead>
                  <TableHead className="text-right">P90</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row["From yyyy-mm-dd hh:mm"]}</TableCell>
                    <TableCell>{row["To yyyy-mm-dd hh:mm"]}</TableCell>
                    <TableCell className="text-right">{row.perc10}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.perc50}
                    </TableCell>
                    <TableCell className="text-right">{row.perc90}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
