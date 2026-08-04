import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/ui/relative-time";
import { SquareAvatar } from "@/components/ui/square-avatar";
import { cn } from "@/lib/utils";

interface WorkspaceOverviewCardProps {
  boardIsPublic: boolean | null;
  categoriesCount: number;
  changelogPublic: boolean;
  createdAt: Date;
  description: string | null;
  isSuspended: boolean;
  logoUrl: string | null;
  memberCount: number;
  name: string;
  ownerName: string | null;
  postsCount: number;
  roadmapPublic: boolean;
  slug: string;
  statusesCount: number;
  updatedAt: Date;
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="min-w-0">
      <p className="text-2xs font-semibold tracking-eyebrow text-ir-muted uppercase">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-medium text-ir-heading">
        {value}
      </p>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
}

function StatTile({ label, value }: StatTileProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-ir-md border border-ir-border bg-ir-muted-surface px-2 py-2 text-center transition-colors duration-150 ease-ir-standard hover:border-ir-primary/25">
      <span className="text-2xs font-semibold tracking-eyebrow text-ir-muted uppercase">
        {label}
      </span>
      <span className="text-lg font-semibold tabular-nums text-ir-heading">
        {value}
      </span>
    </div>
  );
}

export function WorkspaceOverviewCard({
  boardIsPublic,
  categoriesCount,
  changelogPublic,
  createdAt,
  description,
  isSuspended,
  logoUrl,
  memberCount,
  name,
  ownerName,
  postsCount,
  roadmapPublic,
  slug,
  statusesCount,
  updatedAt,
}: WorkspaceOverviewCardProps) {
  const boardLabel =
    boardIsPublic === null ? "No board" : boardIsPublic ? "Public" : "Private";

  return (
    <div className="rounded-ir-card border border-ir-border bg-ir-surface px-5 py-4 shadow-ir-xs transition-shadow duration-200 ease-ir-standard hover:shadow-ir-sm">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-center lg:divide-x lg:divide-ir-border">
        {/* Workspace identity */}
        <div className="flex min-w-0 items-center gap-3.5 lg:pr-5">
          <SquareAvatar
            alt={name}
            className="size-14 shrink-0 rounded-ir-md bg-ir-primary-light/20 text-base font-semibold text-ir-primary ring-2 ring-ir-primary/15 sm:size-16"
            fallback={name.charAt(0).toUpperCase()}
            imageUrl={logoUrl}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-xl font-semibold text-ir-heading">
                {name}
              </h2>
              <Badge variant={boardIsPublic ? "default" : "secondary"}>
                {boardLabel}
              </Badge>
              <Badge
                className={cn(
                  "gap-1",
                  isSuspended
                    ? "border-ir-danger/30 bg-ir-danger/10 text-ir-danger"
                    : "border-ir-success/30 bg-ir-success/10 text-ir-success"
                )}
                variant="outline"
              >
                <span
                  aria-hidden
                  className={cn(
                    "size-1.5 rounded-full",
                    isSuspended ? "bg-ir-danger" : "bg-ir-success"
                  )}
                />
                {isSuspended ? "Suspended" : "Active"}
              </Badge>
            </div>
            {description && (
              <p className="mt-0.5 line-clamp-1 text-sm text-ir-body/80">
                {description}
              </p>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-ir-muted">
              <span className="font-mono">/{slug}</span>
              <span aria-hidden>•</span>
              <span>
                Created{" "}
                <RelativeTime date={createdAt} options={{ addSuffix: true }} />
              </span>
              <span aria-hidden>•</span>
              <span>
                Updated{" "}
                <RelativeTime date={updatedAt} options={{ addSuffix: true }} />
              </span>
            </div>
          </div>
        </div>

        {/* Workspace information */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 lg:px-5">
          <InfoRow label="Owner" value={ownerName ?? "Unassigned"} />
          <InfoRow label="Visibility" value={boardLabel} />
          <InfoRow
            label="Roadmap"
            value={roadmapPublic ? "Public" : "Private"}
          />
          <InfoRow
            label="Changelog"
            value={changelogPublic ? "Public" : "Private"}
          />
        </div>

        {/* Workspace statistics */}
        <div className="grid grid-cols-2 gap-2 lg:pl-5">
          <StatTile label="Members" value={memberCount} />
          <StatTile label="Posts" value={postsCount} />
          <StatTile label="Categories" value={categoriesCount} />
          <StatTile label="Statuses" value={statusesCount} />
        </div>
      </div>
    </div>
  );
}
