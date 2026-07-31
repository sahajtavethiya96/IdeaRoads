import { BulkActionBar } from "@/components/posts/bulk-action-bar";
import {
  BulkSelectionProvider,
  SelectAllCheckbox,
} from "@/components/posts/bulk-selection-context";
import { PostRow } from "@/components/posts/post-row";
import { PostsEmptyState } from "@/components/posts/posts-empty-state";

export interface PostsTableRow {
  authorEmail: string;
  authorName: string | null;
  boardIsPublic: boolean;
  boardName: string;
  boardSlug: string;
  body: string | null;
  categoryId: string | null;
  commentCount: number;
  createdAt: Date;
  hasVoted: boolean;
  id: string;
  isApproved: boolean;
  isDraft: boolean;
  isPinned: boolean;
  // Count of other posts merged into this one — renders a "N merged" badge
  // on the parent row so merge history is visible without opening the post.
  mergedCount?: number;
  // Set when this post was merged into another. mergedIntoTitle/Slug/BoardSlug
  // are resolved via a join so the row can show a "Merged into" badge/link
  // without a follow-up query; they're null if the target itself is gone.
  mergedIntoBoardSlug?: string | null;
  mergedIntoId?: string | null;
  mergedIntoSlug?: string | null;
  mergedIntoTitle?: string | null;
  slug: string;
  status: string;
  title: string;
  upvotes: number;
}

interface Category {
  color: string;
  id: string;
  name: string;
}

interface WorkspaceStatus {
  color: string;
  id: string;
  isArchived: boolean;
  isSystem: boolean;
  name: string;
  slug: string;
}

interface PostsTableProps {
  categories: Category[];
  // Opt-in bulk select + floating action bar — only the admin feedback list
  // page enables this; Dashboard and the public profile page never pass it,
  // so they render exactly as before.
  enableBulkActions?: boolean;
  isAdminOrOwner: boolean;
  isMember: boolean;
  isSignedIn: boolean;
  // Builds the link target for a merged row's "Merged into <title>" badge —
  // same admin-vs-public split as postHref below, applied to the merge
  // target instead of the row itself. Returns null when there's nowhere
  // sensible to link (no target info resolved), in which case the badge
  // still shows but as plain text.
  mergedIntoHref?: (post: PostsTableRow) => string | null;
  // Builds the link target for a post row — differs between the admin
  // (workspace-shelled) and public post-detail routes, which are genuinely
  // separate pages so members never get redirected out of their admin shell.
  postHref: (post: PostsTableRow) => string;
  posts: PostsTableRow[];
  showBoardColumn?: boolean;
  workspaceId: string;
  workspaceStatuses: WorkspaceStatus[];
}

export function PostsTable({
  posts,
  categories,
  workspaceStatuses,
  postHref,
  mergedIntoHref,
  isSignedIn,
  isAdminOrOwner,
  isMember,
  workspaceId,
  showBoardColumn = true,
  enableBulkActions = false,
}: PostsTableProps) {
  if (posts.length === 0) {
    return <PostsEmptyState />;
  }

  const selectable = enableBulkActions && isMember;

  const table = (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ir-border">
            {selectable && (
              <th className="sticky left-0 z-10 w-10 rounded-tl-ir-card border-r border-ir-border bg-ir-surface px-4 py-2.5">
                <SelectAllCheckbox />
              </th>
            )}
            <th className="w-16 px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
              Votes
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
              Title
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted lg:table-cell">
              Description
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted sm:table-cell">
              Author
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted sm:table-cell">
              Created
            </th>
            <th className="hidden px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted md:table-cell">
              Category
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
              Status
            </th>
            <th className="px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
              Visibility
            </th>
            {isMember && (
              <th className="w-12 px-4 py-2.5 text-left text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                <span className="sr-only">Actions</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-ir-border">
          {posts.map((post) => (
            <PostRow
              categories={categories}
              href={postHref(post)}
              isAdminOrOwner={isAdminOrOwner}
              isMember={isMember}
              isSignedIn={isSignedIn}
              key={post.id}
              mergedIntoHref={mergedIntoHref ? mergedIntoHref(post) : null}
              post={post}
              selectable={selectable}
              showBoardColumn={showBoardColumn}
              workspaceId={workspaceId}
              workspaceStatuses={workspaceStatuses}
            />
          ))}
        </tbody>
      </table>
    </div>
  );

  if (!selectable) {
    return table;
  }

  return (
    <BulkSelectionProvider allIds={posts.map((p) => p.id)}>
      {table}
      <BulkActionBar
        categories={categories}
        posts={posts}
        workspaceId={workspaceId}
        workspaceStatuses={workspaceStatuses}
      />
    </BulkSelectionProvider>
  );
}
