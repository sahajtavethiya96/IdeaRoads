import { FlagIcon } from "@phosphor-icons/react/dist/ssr";
import { FeatureFlagToggle } from "@/components/orbit/feature-flag-toggle";
import { SetPageHeader } from "@/components/workspace/topbar";
import { listFeatureFlags } from "@/lib/orbit/feature-flags";

export const metadata = { title: "Feature Flags" };

export default async function FeatureFlagsPage() {
  const flags = await listFeatureFlags();

  return (
    <div>
      <SetPageHeader
        description="Toggle platform-wide boolean features. Changes propagate within 60 seconds."
        portalHref={null}
        title="Feature Flags"
      />

      <div className="rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
        {flags.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 px-4 py-16 text-center">
            <div className="flex size-10 items-center justify-center rounded-ir-full bg-ir-muted-surface text-ir-muted">
              <FlagIcon className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-ir-heading">
                No feature flags yet
              </p>
              <p className="mt-1 text-xs text-ir-muted">
                Start the worker to seed the default flags.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-ir-border">
            {flags.map((flag) => (
              <div
                className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                key={flag.key}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm font-semibold text-ir-heading">
                    {flag.key}
                  </p>
                  <p className="mt-0.5 text-xs text-ir-muted">
                    {flag.description}
                  </p>
                </div>
                <FeatureFlagToggle
                  flagKey={flag.key}
                  isEnabled={flag.isEnabled}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
