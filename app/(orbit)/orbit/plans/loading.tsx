import { PageBody } from "@/components/ui/page";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrbitPlansLoading() {
  return (
    <PageBody>
      <div className="flex flex-col items-center justify-center gap-3 rounded-ir-card border border-dashed border-ir-border bg-ir-surface px-8 py-16">
        <Skeleton className="size-12 rounded-ir-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-64" />
      </div>
    </PageBody>
  );
}
