import { eq, sql } from "drizzle-orm";
import { posts, votes } from "@/db/schema";
import { db } from "@/lib/db";

// Snapshot of one source vote as it stood immediately before a merge —
// enough to reverse the merge later (see unmergePost in ./unmerge). Persisted
// as-is inside the "post.merged" audit log entry's `metadata.voteSnapshot`
// (no dedicated table: the audit log already captures who/when for a merge,
// this just rides along with it).
export interface MergeVoteSnapshotEntry {
  createdAt: string;
  id: string;
  userEmail: string | null;
  userId: string | null;
  userName: string | null;
  // true if this vote was deleted at merge time because its voter already had
  // a vote on the target (never physically moved); false if it was moved.
  wasDuplicate: boolean;
}

/**
 * Merge the source post into the target post:
 *  - votes transfer to the target (a voter who already voted on the target is
 *    de-duplicated, never double-counted),
 *  - both posts' denormalised vote counts are recomputed,
 *  - the source is locked and marked merged (it leaves active lists and points
 *    to the target).
 *
 * Comments remain on the source post, which stays viewable with a "merged into"
 * notice. Both posts are assumed to belong to the same workspace (enforced by
 * the caller).
 *
 * Returns a snapshot of every source vote as it stood just before the merge —
 * the caller persists this (see mergePostAction) so unmergePost can restore
 * the source's original votes later.
 */
export async function mergePost(
  sourceId: string,
  targetId: string
): Promise<MergeVoteSnapshotEntry[]> {
  return db.transaction(async (tx) => {
    // 0. Snapshot the source's votes, and which of the target's voters they'd
    // collide with, BEFORE anything is deleted or moved.
    const [sourceVotes, targetVotes] = await Promise.all([
      tx
        .select({
          id: votes.id,
          userId: votes.userId,
          userEmail: votes.userEmail,
          userName: votes.userName,
          createdAt: votes.createdAt,
        })
        .from(votes)
        .where(eq(votes.postId, sourceId)),
      tx
        .select({ userId: votes.userId, userEmail: votes.userEmail })
        .from(votes)
        .where(eq(votes.postId, targetId)),
    ]);
    const targetUserIds = new Set(
      targetVotes.map((v) => v.userId).filter((v): v is string => !!v)
    );
    const targetEmails = new Set(
      targetVotes.map((v) => v.userEmail).filter((v): v is string => !!v)
    );
    const voteSnapshot: MergeVoteSnapshotEntry[] = sourceVotes.map((v) => ({
      id: v.id,
      userId: v.userId,
      userEmail: v.userEmail,
      userName: v.userName,
      createdAt: v.createdAt.toISOString(),
      wasDuplicate:
        (!!v.userId && targetUserIds.has(v.userId)) ||
        (!!v.userEmail && targetEmails.has(v.userEmail)),
    }));

    // 1. Drop source votes that would duplicate an existing target vote.
    await tx.execute(sql`
      DELETE FROM votes AS s
      WHERE s.post_id = ${sourceId}
        AND EXISTS (
          SELECT 1 FROM votes t
          WHERE t.post_id = ${targetId}
            AND (
              (s.user_id IS NOT NULL AND t.user_id = s.user_id)
              OR (s.user_email IS NOT NULL AND t.user_email = s.user_email)
            )
        )
    `);

    // 2. Move the remaining source votes onto the target.
    await tx
      .update(votes)
      .set({ postId: targetId })
      .where(eq(votes.postId, sourceId));

    // 3. Recompute the denormalised vote counts for both posts.
    await tx.execute(sql`
      UPDATE posts
      SET upvotes = (SELECT COUNT(*) FROM votes WHERE votes.post_id = posts.id),
          updated_at = now()
      WHERE posts.id IN (${sourceId}, ${targetId})
    `);

    // 4. Lock and mark the source as merged.
    await tx
      .update(posts)
      .set({ mergedIntoId: targetId, isLocked: true, updatedAt: new Date() })
      .where(eq(posts.id, sourceId));

    return voteSnapshot;
  });
}
