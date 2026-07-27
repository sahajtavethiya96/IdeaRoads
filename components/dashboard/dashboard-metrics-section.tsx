"use client";

import { useState, useTransition } from "react";
import {
  getDashboardActivityAction,
  getDashboardPeriodDataAction,
} from "@/app/actions/dashboard";
import { BreakdownCard } from "@/components/dashboard/breakdown-card";
import { FeedbackTrendCard } from "@/components/dashboard/feedback-trend-card";
import { LiveStreamCard } from "@/components/dashboard/live-stream-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { PERIOD_LABELS } from "@/lib/dashboard/constants";
import type {
  ActivityItem,
  ActivityType,
  BreakdownMetrics,
  BreakdownPeriod,
  FeedbackTrendPoint,
  StatusCountSnapshot,
} from "@/lib/dashboard/queries";

interface DashboardMetricsSectionProps {
  initialActivity: ActivityItem[];
  initialActivityType: ActivityType;
  initialBreakdown: BreakdownMetrics;
  initialFeedbackTrend: FeedbackTrendPoint[];
  initialPeriod: BreakdownPeriod;
  initialPreviousSnapshot: StatusCountSnapshot | null;
  isAdminOrOwner: boolean;
  memberCount: number;
  slug: string;
  statusCounts: Record<string, number>;
  workspaceCreatedAt: Date;
  workspaceId: string;
}

// Keeps ?period=/?activityType= in the URL for shareable/bookmarkable links,
// without going through Next.js's router — a real navigation would re-run
// the whole page (every card, not just these two) and jump scroll to top.
function syncSearchParam(name: string, value: string) {
  const url = new URL(window.location.href);
  url.searchParams.set(name, value);
  window.history.replaceState(null, "", url);
}

// Feedback trend, stat cards, Breakdown, and Live Stream all live in one
// client component because "period" drives all of the first three at once
// (stat card deltas, the Breakdown rows, and the trend chart) — filtering it
// re-fetches just that data via a Server Action and updates local state, so
// nothing above (Workspace Overview, Quick Actions) or below (Roadmap
// Preview, Newest Feedback) re-renders, and the page never navigates or
// scrolls.
export function DashboardMetricsSection({
  initialActivity,
  initialActivityType,
  initialBreakdown,
  initialFeedbackTrend,
  initialPeriod,
  initialPreviousSnapshot,
  isAdminOrOwner,
  memberCount,
  slug,
  statusCounts,
  workspaceCreatedAt,
  workspaceId,
}: DashboardMetricsSectionProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [feedbackTrend, setFeedbackTrend] = useState(initialFeedbackTrend);
  const [previousSnapshot, setPreviousSnapshot] = useState(
    initialPreviousSnapshot
  );
  const [isPeriodPending, startPeriodTransition] = useTransition();

  const [activityType, setActivityType] = useState(initialActivityType);
  const [activity, setActivity] = useState(initialActivity);
  const [isActivityPending, startActivityTransition] = useTransition();

  function handlePeriodChange(next: BreakdownPeriod) {
    setPeriod(next);
    syncSearchParam("period", next);
    startPeriodTransition(async () => {
      const data = await getDashboardPeriodDataAction(
        workspaceId,
        next,
        workspaceCreatedAt
      );
      setBreakdown(data.breakdown);
      setFeedbackTrend(data.feedbackTrend);
      setPreviousSnapshot(data.previousSnapshot);
    });
  }

  function handleActivityTypeChange(next: ActivityType) {
    setActivityType(next);
    syncSearchParam("activityType", next);
    startActivityTransition(async () => {
      const data = await getDashboardActivityAction(workspaceId, next);
      setActivity(data);
    });
  }

  const totalPosts = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const openPosts = statusCounts.open ?? 0;
  const underReviewPosts = statusCounts.under_review ?? 0;
  const plannedPosts = statusCounts.planned ?? 0;
  const inProgressPosts = statusCounts.in_progress ?? 0;
  const completedPosts = statusCounts.completed ?? 0;
  const closedPosts = statusCounts.closed ?? 0;

  const periodLabel = PERIOD_LABELS[period] ?? undefined;
  const previousMemberCount = previousSnapshot?.memberCount ?? null;
  const previousTotalPosts = previousSnapshot
    ? Object.values(previousSnapshot.statusCounts).reduce(
        (sum, n) => sum + n,
        0
      )
    : null;
  const previousOpenPosts = previousSnapshot?.statusCounts.open ?? null;
  const previousUnderReviewPosts =
    previousSnapshot?.statusCounts.under_review ?? null;
  const previousPlannedPosts = previousSnapshot?.statusCounts.planned ?? null;
  const previousInProgressPosts =
    previousSnapshot?.statusCounts.in_progress ?? null;
  const previousCompletedPosts =
    previousSnapshot?.statusCounts.completed ?? null;
  const previousClosedPosts = previousSnapshot?.statusCounts.closed ?? null;

  return (
    <>
      {/* Feedback trend */}
      <FeedbackTrendCard
        isPending={isPeriodPending}
        points={feedbackTrend}
        weekly={period === "all"}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          href={isAdminOrOwner ? `/${slug}/settings/members` : undefined}
          label="Members"
          periodLabel={periodLabel}
          previousValue={previousMemberCount}
          value={memberCount}
        />
        <StatCard
          href={`/${slug}/feedback`}
          label="Total posts"
          periodLabel={periodLabel}
          previousValue={previousTotalPosts}
          value={totalPosts}
        />
        <StatCard
          href={`/${slug}/feedback?status=open`}
          label="Open"
          periodLabel={periodLabel}
          previousValue={previousOpenPosts}
          value={openPosts}
        />
        <StatCard
          href={`/${slug}/feedback?status=under_review`}
          label="Under Review"
          periodLabel={periodLabel}
          previousValue={previousUnderReviewPosts}
          value={underReviewPosts}
          valueClassName="text-ir-primary"
        />
        <StatCard
          href={`/${slug}/feedback?status=planned`}
          label="Planned"
          periodLabel={periodLabel}
          previousValue={previousPlannedPosts}
          value={plannedPosts}
          valueClassName="text-ir-primary"
        />
        <StatCard
          href={`/${slug}/feedback?status=in_progress`}
          label="In Progress"
          periodLabel={periodLabel}
          previousValue={previousInProgressPosts}
          value={inProgressPosts}
          valueClassName="text-ir-warning"
        />
        <StatCard
          href={`/${slug}/feedback?status=completed`}
          label="Completed"
          periodLabel={periodLabel}
          previousValue={previousCompletedPosts}
          value={completedPosts}
          valueClassName="text-ir-success"
        />
        <StatCard
          href={`/${slug}/feedback?status=closed`}
          label="Closed"
          periodLabel={periodLabel}
          previousValue={previousClosedPosts}
          value={closedPosts}
          valueClassName="text-ir-muted"
        />
      </div>

      {/* Breakdown + Live Stream */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BreakdownCard
          isPending={isPeriodPending}
          metrics={breakdown}
          onPeriodChange={handlePeriodChange}
          period={period}
        />
        <LiveStreamCard
          activity={activity}
          activityType={activityType}
          isPending={isActivityPending}
          onActivityTypeChange={handleActivityTypeChange}
          workspaceSlug={slug}
        />
      </div>
    </>
  );
}
