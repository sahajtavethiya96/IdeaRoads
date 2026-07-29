import { GaugeIcon } from "@phosphor-icons/react/dist/ssr";
import { Badge } from "@/components/ui/badge";
import { PageBody } from "@/components/ui/page";
import { SetPageHeader } from "@/components/workspace/topbar";
import { getJobQueueStatus } from "@/lib/orbit/jobs";

export const metadata = { title: "Job Queue" };

export default async function OrbitJobsPage() {
  const { active, failed, error } = await getJobQueueStatus();

  return (
    <div className="flex flex-col">
      <SetPageHeader
        description="pg-boss background job status. Start the worker to populate."
        portalHref={null}
        title="Job Queue"
      />

      <PageBody>
        {error && (
          <div className="mb-4 rounded-ir-card border border-ir-warning/30 bg-ir-warning/5 px-4 py-3 text-sm text-ir-warning">
            {error}
          </div>
        )}

        {/* Active jobs */}
        <div className="mb-4 rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
          <div className="border-b border-ir-border px-5 py-4">
            <h2 className="text-sm font-semibold text-ir-heading">
              Active Jobs
            </h2>
          </div>
          {active.length === 0 ? (
            <EmptyState message="No active jobs." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ir-border">
                    <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                      Queue name
                    </th>
                    <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                      State
                    </th>
                    <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ir-border">
                  {active.map((job) => (
                    <tr key={`${job.name}:${job.state}`}>
                      <td className="px-4 py-3 font-mono text-sm text-ir-heading">
                        {job.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            job.state === "completed" ? "default" : "secondary"
                          }
                        >
                          {job.state}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ir-body">
                        {job.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Failed jobs (last 24h) */}
        <div className="rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
          <div className="border-b border-ir-border px-5 py-4">
            <h2 className="text-sm font-semibold text-ir-heading">
              Failed Jobs (last 24h)
            </h2>
          </div>
          {failed.length === 0 ? (
            <EmptyState message="No failures in the last 24 hours." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ir-border">
                    <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                      Queue name
                    </th>
                    <th className="px-4 py-2.5 text-right text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                      Count
                    </th>
                    <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                      Last error
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ir-border">
                  {failed.map((job) => (
                    <tr key={job.name}>
                      <td className="px-4 py-3 font-mono text-sm text-ir-heading">
                        {job.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-ir-danger">
                        {job.count}
                      </td>
                      <td className="max-w-0 px-4 py-3 font-mono text-xs text-ir-muted">
                        <span className="block truncate">
                          {job.lastError ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageBody>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-center">
      <div className="flex size-10 items-center justify-center rounded-ir-full bg-ir-muted-surface text-ir-muted">
        <GaugeIcon className="size-5" />
      </div>
      <p className="text-sm text-ir-muted">{message}</p>
    </div>
  );
}
