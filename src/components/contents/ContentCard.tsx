"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Content, ContentLatest } from "@/types/contents";
import { useRouter } from "next/navigation";
import ContentUpdatesButton from "./ContentUpdatesButton";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";

interface ContentCardProps {
  content: Content;
  showLatest: boolean;
  contentLatest?: ContentLatest;
}

export default function ContentCard({
  content,
  showLatest,
  contentLatest,
}: ContentCardProps) {
  const router = useRouter();

  return (
    <Card className="flex h-full w-full flex-col">
      <CardHeader className="w-full px-4">
        <CardTitle className="max-w-sm break-words">
          <span className="block font-bold text-black">Title:</span>
          <span className="mt-1 block break-words">
            {showLatest
              ? `${contentLatest?.content_id} - `
              : content.content_name}
          </span>
        </CardTitle>
        <Separator className="my-2" />
        <CardDescription className="flex max-w-sm flex-col gap-1">
          <span className="font-bold text-black">
            {showLatest ? "Latest " : "Path:"}
          </span>
          <span className="break-words">
            {showLatest ? `${contentLatest?.issue_date} - ` : content.path}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto flex flex-col gap-4">
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
            onClick={() => router.push(`/dashboard/${content.id}/historical`)}
          >
            View History
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
