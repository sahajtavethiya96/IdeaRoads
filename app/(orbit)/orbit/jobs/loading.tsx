import { PageBody } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";

function QueuePanelSkeleton({ rows }: { rows: number }) {
  return (
    <div className="rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
      <div className="border-b border-ir-border px-5 py-4">
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="divide-y divide-ir-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            className="flex items-center gap-4 px-4 py-3"
            key={`row-${
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton placeholders, order never changes
              i
            }`}
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-16 rounded-ir-full" />
            <Skeleton className="h-4 flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrbitJobsLoading() {
  return (
    <PageBody>
      <div className="mb-4">
        <QueuePanelSkeleton rows={3} />
      </div>
      <QueuePanelSkeleton rows={2} />
    </PageBody>
  );
}
