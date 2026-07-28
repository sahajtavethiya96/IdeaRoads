import { PageBody } from "@/components/ui/page";
import { SetPageHeader } from "@/components/workspace/topbar";

export const metadata = { title: "Plans" };

export default function OrbitPlansPage() {
  return (
    <div className="flex flex-col">
      <SetPageHeader
        description="Manage subscription plan tiers and workspace assignments."
        portalHref={null}
        title="Plans"
      />

      <PageBody>
        <div className="flex flex-col items-center justify-center rounded-ir-card border border-dashed border-ir-border bg-ir-surface px-8 py-16 text-center">
          <div className="mb-4 grid size-12 place-items-center rounded-ir-full bg-ir-muted-surface text-xl text-ir-muted">
            📋
          </div>
          <h2 className="text-base font-semibold text-ir-heading">
            Plans & Billing
          </h2>
          <p className="mt-2 max-w-sm text-sm text-ir-muted">
            The billing and subscription system is not yet implemented. This
            section will allow you to define plan tiers, set limits, and assign
            plans to workspaces.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-eyebrow text-ir-muted">
            Coming in a future release
          </p>
        </div>
      </PageBody>
    </div>
  );
}
