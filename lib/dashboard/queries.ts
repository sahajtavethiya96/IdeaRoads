import { and, count, desc, eq, gte, lt, lte } from "drizzle-orm";
import { boards, comments, posts, votes, workspaceMembers } from "@/db/schema";
import { db } from "@/lib/db";
import type { BreakdownPeriod } from "./constants";

export type { BreakdownPeriod } from "./constants";
export { PERIOD_LABELS } from "./constants";

const PERIOD_DAYS: Record<Exclude<BreakdownPeriod, "all">, number> = {
  "7d": 7,
  "30d": 30,
};

interface DateRange {
  from: Date;
  to: Date;
}

interface BreakdownCounts {
  activeUsers: number;
  newComments: number;
  newFeedback: number;
  totalUpvotes: number;
}

export interface BreakdownMetrics extends BreakdownCounts {
  previous: BreakdownCounts | null;
}

/**
 * Current-period counts, plus the immediately preceding period of equal
 * length for a % change comparison. "All time" has no prior period to
 * compare against, so `previous` is null and callers should hide the delta.
 */
export async function getBreakdownMetrics(
  workspaceId: string,
  period: BreakdownPeriod,
  now: Date
): Promise<BreakdownMetrics> {
  if (period === "all") {
    const current = await computeBreakdownCounts(workspaceId, null);
    return { ...current, previous: null };
  }

  const days = PERIOD_DAYS[period];
  const dayMs = 86_400_000;
  const [current, previous] = await Promise.all([
    computeBreakdownCounts(workspaceId, {
      from: new Date(now.getTime() - days * dayMs),
      to: now,
    }),
    computeBreakdownCounts(workspaceId, {
      from: new Date(now.getTime() - days * 2 * dayMs),
      to: new Date(now.getTime() - days * dayMs),
    }),
  ]);
  return { ...current, previous };
}

export interface StatusCountSnapshot {
  memberCount: number;
  statusCounts: Record<string, number>;
}

/**
 * Cumulative totals (member count + post counts by status) as they stood at
 * the start of the given period, so the dashboard can show "+N% vs previous
 * period" growth alongside each stat card. "All time" has no prior cutoff to
 * compare against, so callers should hide the delta in that case.
 */
export async function getPreviousPeriodSnapshot(
  workspaceId: string,
  period: BreakdownPeriod,
  now: Date
): Promise<StatusCountSnapshot | null> {
  if (period === "all") {
    return null;
  }

  const days = PERIOD_DAYS[period];
  const cutoff = new Date(now.getTime() - days * 86_400_000);

  const [statusRows, memberRows] = await Promise.all([
    db
      .select({ status: posts.status, value: count() })
      .from(posts)
      .where(
        and(eq(posts.workspaceId, workspaceId), lte(posts.createdAt, cutoff))
      )
      .groupBy(posts.status),
    db
      .select({ value: count() })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          lte(workspaceMembers.joinedAt, cutoff)
        )
      ),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statusRows) {
    statusCounts[row.status] = row.value;
  }

  return {
    memberCount: memberRows[0]?.value ?? 0,
    statusCounts,
  };
}

async function computeBreakdownCounts(
  workspaceId: string,
  range: DateRange | null
): Promise<BreakdownCounts> {
  const postConditions = [eq(posts.workspaceId, workspaceId)];
  const voteConditions = [eq(votes.workspaceId, workspaceId)];
  if (range) {
    postConditions.push(
      gte(posts.createdAt, range.from),
      lt(posts.createdAt, range.to)
    );
    voteConditions.push(
      gte(votes.createdAt, range.from),
      lt(votes.createdAt, range.to)
    );
  }

  const commentConditions = [eq(posts.workspaceId, workspaceId)];
  if (range) {
    commentConditions.push(
      gte(comments.createdAt, range.from),
      lt(comments.createdAt, range.to)
    );
  }

  const [postRows, voteRows, commentRows] = await Promise.all([
    db
      .select({ authorId: posts.authorId })
      .from(posts)
      .where(and(...postConditions)),
    db
      .select({ userId: votes.userId })
      .from(votes)
      .where(and(...voteConditions)),
    db
      .select({ authorId: comments.authorId })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .where(and(...commentConditions)),
  ]);

  const activeUserIds = new Set<string>();
  for (const row of postRows) {
    if (row.authorId) {
      activeUserIds.add(row.authorId);
    }
  }
  for (const row of voteRows) {
    if (row.userId) {
      activeUserIds.add(row.userId);
    }
  }
  for (const row of commentRows) {
    if (row.authorId) {
      activeUserIds.add(row.authorId);
    }
  }

  return {
    newFeedback: postRows.length,
    totalUpvotes: voteRows.length,
    newComments: commentRows.length,
    activeUsers: activeUserIds.size,
  };
}

export interface FeedbackTrendPoint {
  count: number;
  // ISO date (yyyy-mm-dd) of the bucket's start — a day for 7d/30d, the
  // Monday of the week for "all" (matches JS's own Monday-start bucketing
  // below, not Postgres's, so grouping and gap-filling always agree).
  date: string;
}

const DAY_MS = 86_400_000;

function bucketStart(date: Date, weekly: boolean): Date {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  if (weekly) {
    const day = start.getUTCDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? 6 : day - 1;
    start.setUTCDate(start.getUTCDate() - diffToMonday);
  }
  return start;
}

/**
 * New feedback posts bucketed by day (7d/30d) or by week (all time, from the
 * workspace's creation date) — gaps are filled with a zero count so a quiet
 * stretch reads as a flat line on the chart, not a skipped point. Bucketing
 * is done in JS (not Postgres's `date_trunc`) to sidestep any mismatch
 * between the DB session's timezone and the UTC arithmetic used here.
 */
export async function getFeedbackTrend(
  workspaceId: string,
  period: BreakdownPeriod,
  now: Date,
  workspaceCreatedAt: Date
): Promise<FeedbackTrendPoint[]> {
  const weekly = period === "all";
  const from =
    period === "all"
      ? workspaceCreatedAt
      : new Date(now.getTime() - PERIOD_DAYS[period] * DAY_MS);

  const rows = await db
    .select({ createdAt: posts.createdAt })
    .from(posts)
    .where(and(eq(posts.workspaceId, workspaceId), gte(posts.createdAt, from)));

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = bucketStart(row.createdAt, weekly).toISOString().slice(0, 10);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const stepMs = (weekly ? 7 : 1) * DAY_MS;
  const end = bucketStart(now, weekly);
  const points: FeedbackTrendPoint[] = [];
  for (
    let cursor = bucketStart(from, weekly);
    cursor.getTime() <= end.getTime();
    cursor = new Date(cursor.getTime() + stepMs)
  ) {
    const key = cursor.toISOString().slice(0, 10);
    points.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return points;
}

export type ActivityType = "all" | "post" | "comment" | "vote";

export interface ActivityItem {
  authorName: string | null;
  boardName: string;
  boardSlug: string;
  createdAt: Date;
  id: string;
  postId: string;
  postSlug: string;
  postTitle: string;
  type: "post" | "comment" | "vote";
}

/** Recent posts/comments/votes across the workspace, merged and sorted newest first. */
export async function getRecentActivity(
  workspaceId: string,
  opts: { limit?: number; type?: ActivityType } = {}
): Promise<ActivityItem[]> {
  const { limit = 10, type = "all" } = opts;

  const [postItems, commentItems, voteItems] = await Promise.all([
    type === "all" || type === "post"
      ? db
          .select({
            id: posts.id,
            createdAt: posts.createdAt,
            authorName: posts.authorName,
            postId: posts.id,
            postSlug: posts.slug,
            postTitle: posts.title,
            boardSlug: boards.slug,
            boardName: boards.name,
          })
          .from(posts)
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(eq(posts.workspaceId, workspaceId))
          .orderBy(desc(posts.createdAt))
          .limit(limit)
      : Promise.resolve([]),
    type === "all" || type === "comment"
      ? db
          .select({
            id: comments.id,
            createdAt: comments.createdAt,
            authorName: comments.authorName,
            postId: posts.id,
            postSlug: posts.slug,
            postTitle: posts.title,
            boardSlug: boards.slug,
            boardName: boards.name,
          })
          .from(comments)
          .innerJoin(posts, eq(comments.postId, posts.id))
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(
            and(
              eq(posts.workspaceId, workspaceId),
              eq(comments.isDeleted, false)
            )
          )
          .orderBy(desc(comments.createdAt))
          .limit(limit)
      : Promise.resolve([]),
    type === "all" || type === "vote"
      ? db
          .select({
            id: votes.id,
            createdAt: votes.createdAt,
            authorName: votes.userName,
            postId: posts.id,
            postSlug: posts.slug,
            postTitle: posts.title,
            boardSlug: boards.slug,
            boardName: boards.name,
          })
          .from(votes)
          .innerJoin(posts, eq(votes.postId, posts.id))
          .innerJoin(boards, eq(posts.boardId, boards.id))
          .where(eq(votes.workspaceId, workspaceId))
          .orderBy(desc(votes.createdAt))
          .limit(limit)
      : Promise.resolve([]),
  ]);

  const merged: ActivityItem[] = [
    ...postItems.map((row) => ({ ...row, type: "post" as const })),
    ...commentItems.map((row) => ({ ...row, type: "comment" as const })),
    ...voteItems.map((row) => ({ ...row, type: "vote" as const })),
  ];

  merged.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return merged.slice(0, limit);
}
