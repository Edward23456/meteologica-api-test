import { Skeleton } from "@/components/ui/skeleton";

const ROW_SKELETON_COUNT = 20;

export default function ContentIdLoading() {
  return (
    <div className="flex flex-col">
      <div className="mb-4">
        <Skeleton className="h-8 w-64" />
        <div className="mt-2 flex flex-wrap gap-x-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
        ))}
      </div>

      <div className="hidden w-full overflow-hidden rounded-lg border border-indigo-100 shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead>
              <tr className="border-b border-indigo-100 bg-indigo-950">
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-12 bg-indigo-800" />
                </th>
                <th className="p-4 text-left">
                  <Skeleton className="h-4 w-8 bg-indigo-800" />
                </th>
                <th className="p-4 text-right">
                  <Skeleton className="ml-auto h-4 w-10 bg-indigo-800" />
                </th>
                <th className="p-4 text-right">
                  <Skeleton className="ml-auto h-4 w-28 bg-indigo-800" />
                </th>
                <th className="p-4 text-right">
                  <Skeleton className="ml-auto h-4 w-10 bg-indigo-800" />
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
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="h-4 w-28" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="ml-auto h-4 w-14" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </td>
                  <td className="p-4">
                    <Skeleton className="ml-auto h-4 w-14" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination bar skeleton */}
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
  );
}
