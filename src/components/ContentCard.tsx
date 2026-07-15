import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Content, ContentLatest } from "@/types/contents";
import { useRouter } from "next/navigation";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

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
    <Card
      className="flex h-full w-full max-w-sm cursor-pointer flex-col"
      onClick={() => router.push(`/dashboard/${content.id}`)}
    >
      <CardHeader className="w-[240px]">
        <CardTitle className="w-full">
          <span className="block font-bold text-black">Title:</span>
          <span className="mt-1 block overflow-hidden text-ellipsis whitespace-nowrap">
            {showLatest
              ? `${contentLatest?.content_id} - `
              : content.content_name}
          </span>
        </CardTitle>
        <Separator className="my-2" />
        <CardDescription className="flex w-full flex-col gap-1">
          <span className="font-bold text-black">
            {showLatest ? "Latest " : "Path:"}
          </span>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">
            {showLatest ? `${contentLatest?.issue_date} - ` : content.path}
          </span>
        </CardDescription>
      </CardHeader>
      {showLatest && (
        <CardContent className="mt-auto flex items-end justify-end">
          <Button variant="outline" className="cursor-pointer">
            View Details
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
