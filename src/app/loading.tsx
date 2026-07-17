import { Skeleton } from "@/components/ui/skeleton";

const CARD_SKELETON_COUNT = 6;
const ROW_SKELETON_COUNT = 8;

export default function DashboardLoading() {
  return (
    <div className="flex flex-col w-full p-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="mt-4">
        <div className="grid w-full grid-cols-1 gap-4 md:hidden">
          {Array.from({ length: CARD_SKELETON_COUNT }).map((_, i) => (
            <div
              key={i}
              className="flex h-full w-full flex-col gap-4 rounded-xl border p-6"
            >
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-3/4" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="mt-auto flex items-center justify-end gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>

        <div className="hidden w-full overflow-hidden rounded-lg border border-indigo-100 shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed">
              <thead>
                <tr className="border-b border-indigo-100 bg-indigo-950">
                  <th className="w-[35%] p-4 text-left">
                    <Skeleton className="h-4 w-16 bg-indigo-800" />
                  </th>
                  <th className="w-[25%] p-4 text-left">
                    <Skeleton className="h-4 w-14 bg-indigo-800" />
                  </th>
                  <th className="w-[40%] p-4 text-right">
                    <Skeleton className="ml-auto h-4 w-16 bg-indigo-800" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: ROW_SKELETON_COUNT }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-indigo-50 odd:bg-white even:bg-indigo-50/40 last:border-b-0"
                  >
                    <td className="p-4">
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-full" />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-24" />
                        <Skeleton className="h-9 w-28" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-indigo-100 bg-indigo-50/40 px-4 py-3">
            <Skeleton className="h-4 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
