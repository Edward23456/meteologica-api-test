"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContentUpdatesResponse } from "@/types/contents";
import { useState } from "react";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface ContentUpdatesButtonProps {
  contentId: string | number;
}

function formatLocalDate(isoDate: string) {
  const date = new Date(isoDate);

  if (isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ContentUpdatesButton({
  contentId,
}: ContentUpdatesButtonProps) {
  const [updates, setUpdates] = useState<ContentUpdatesResponse["updates"]>([]);
  const [isUpdatesDialogOpen, setIsUpdatesDialogOpen] = useState(false);
  const [isLoadingUpdates, setIsLoadingUpdates] = useState(false);
  const [updatesError, setUpdatesError] = useState<string | null>(null);

  const handleUpdatesClick = async () => {
    if (isUpdatesDialogOpen) {
      setIsUpdatesDialogOpen(false);
      return;
    }

    setIsLoadingUpdates(true);
    setUpdatesError(null);

    try {
      const response = await fetch(`/api/contents/${contentId}/updates`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Failed to fetch updates: ${response.status}`,
        );
      }

      const data: ContentUpdatesResponse = await response.json();
      setUpdates(data.updates ?? []);
      setIsUpdatesDialogOpen(true);
    } catch (error) {
      setUpdatesError(
        error instanceof Error ? error.message : "Something went wrong.",
      );
      setIsUpdatesDialogOpen(false);
    } finally {
      setIsLoadingUpdates(false);
    }
  };

  return (
    <>
      <AlertDialog
        open={isUpdatesDialogOpen}
        onOpenChange={setIsUpdatesDialogOpen}
      >
        <AlertDialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>Updates</AlertDialogTitle>
          </AlertDialogHeader>

          <div className="space-y-2 text-sm text-slate-700">
            {updatesError ? (
              <p className="text-sm text-red-500">{updatesError}</p>
            ) : updates.length === 0 ? (
              <p>No updates available.</p>
            ) : (
              <ul className="space-y-2">
                {updates.map((update, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-2"
                  >
                    <span>{formatLocalDate(update.issue_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel className={"cursor-pointer"}>
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button
        variant="outline"
        className="cursor-pointer"
        onClick={handleUpdatesClick}
        disabled={isLoadingUpdates}
      >
        {isLoadingUpdates ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isUpdatesDialogOpen ? (
          "Hide Updates"
        ) : (
          "Updates"
        )}
      </Button>
    </>
  );
}
