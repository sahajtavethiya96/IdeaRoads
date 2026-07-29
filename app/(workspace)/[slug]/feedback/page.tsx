import { PlusIcon } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostsPaginationBar } from "@/components/posts/posts-pagination-bar";
import { PostsTable } from "@/components/posts/posts-table";
import { Button } from "@/components/ui/button";
import { PageBody } from "@/components/ui/page";
import { SetPageHeader } from "@/components/workspace/topbar";
import { WORKSPACE_MEMBER } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getWorkspaceBoard } from "@/lib/boards/queries";
import { getActiveCategoriesForWorkspace } from "@/lib/categories/queries";
import { MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "@/lib/posts/constants";
import {
  countWorkspacePostsFiltered,
  listWorkspacePosts,
} from "@/lib/posts/queries";
import { getActiveWorkspaceStatuses } from "@/lib/workspace-statuses/queries";
import {
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/workspaces/queries";
import { FeedbackFilters } from "./_components/feedback-filters";

const DEFAULT_PAGE_SIZE = 25;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    category?: string;
    draft?: string;
    page?: string;
    pageSize?: string;
    q?: string;
    sort?: string;
    status?: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Feedback — ${slug}` };
}

export default async function FeedbackPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { category, draft, page, pageSize, q, sort, status } =
    await searchParams;
  const session = await requireSession();

  const workspace = await getWorkspaceBySlug(slug);
  if (!workspace) {
    notFound();
  }

  const member = await getWorkspaceMember(workspace.id, session.user.id);
  if (!member) {
    notFound();
  }
  const isAdminOrOwner = member.role !== WORKSPACE_MEMBER;

  const validSort: "newest" | "top" = sort === "top" ? "top" : "newest";
  const validStatus = status ?? "";
  const validCategoryId = category ?? "";
  const searchQuery = q ?? "";
  const parsedPage = Number(page);
  const currentPage =
    page && Number.isFinite(parsedPage)
      ? Math.max(1, Math.round(parsedPage))
      : 1;
  const parsedPageSize = Number(pageSize);
  const validPageSize =
    pageSize && Number.isFinite(parsedPageSize)
      ? Math.min(
          MAX_PAGE_SIZE,
          Math.max(MIN_PAGE_SIZE, Math.round(parsedPageSize))
        )
      : DEFAULT_PAGE_SIZE;
  // Draft filter: "only" shows drafts, "published" hides them, default shows all
  // (published + drafts, so authors never lose track of a saved draft).
  const validDraft: "all" | "only" | "published" =
    draft === "only" ? "only" : draft === "published" ? "published" : "all";
  const draftsOpt: "include" | "only" | "exclude" =
    validDraft === "only"
      ? "only"
      : validDraft === "published"
        ? "exclude"
        : "include";

  const filterOpts = {
    sort: validSort,
    status: validStatus || undefined,
    categoryId: validCategoryId || undefined,
    search: searchQuery || undefined,
    includeUnapproved: true,
    drafts: draftsOpt,
    // Merged feedback is folded into its destination — surfaced there via
    // the "Merged feedback" section instead of as its own row here.
    excludeMerged: true,
  };

  const [posts, totalCount, board, categories, workspaceStatuses] =
    await Promise.all([
      listWorkspacePosts(workspace.id, {
        ...filterOpts,
        userId: session.user.id,
        limit: validPageSize,
        offset: (currentPage - 1) * validPageSize,
      }),
      countWorkspacePostsFiltered(workspace.id, filterOpts),
      getWorkspaceBoard(workspace.id),
      getActiveCategoriesForWorkspace(workspace.id),
      getActiveWorkspaceStatuses(workspace.id),
    ]);

  const computedTotalPages = Math.max(1, Math.ceil(totalCount / validPageSize));
  const totalPages = Number.isFinite(computedTotalPages)
    ? computedTotalPages
    : 1;

  // Filter/sort/search params every pagination link needs to preserve —
  // plain data (not a URL-building function: PostsPaginationBar is a Client
  // Component, and functions from a server page can't cross that boundary).
  // page/pageSize are added by the client component per-link, on top of this.
  const paginationBaseParams: Record<string, string> = {
    ...(validSort !== "newest" && { sort: validSort }),
    ...(validStatus && { status: validStatus }),
    ...(validCategoryId && { category: validCategoryId }),
    ...(searchQuery && { q: searchQuery }),
    ...(validDraft !== "all" && { draft: validDraft }),
  };

  return (
    <div className="flex flex-col">
      <SetPageHeader
        actions={
          board ? (
            <Button asChild>
              <Link href={`/${slug}/feedback/new`}>
                <PlusIcon data-icon="inline-start" />
                Add Feedback
              </Link>
            </Button>
          ) : undefined
        }
        description={`Every piece of feedback in ${workspace.name}.`}
        title="All Feedback"
      />

      <FeedbackFilters
        activeCategoryId={validCategoryId}
        activeDraft={validDraft}
        activeSearch={searchQuery}
        activeSort={validSort}
        activeStatus={validStatus}
        categories={categories}
        workspaceStatuses={workspaceStatuses}
      />

      <PageBody>
        {/* No overflow-hidden here: BulkActionBar (rendered by PostsTable)
            sticks to the viewport bottom while the page scrolls, which an
            overflow-hidden ancestor would clip. */}
        <div className="rounded-ir-card border border-ir-border bg-ir-surface shadow-ir-xs">
          <PostsTable
            categories={categories}
            enableBulkActions
            isAdminOrOwner={isAdminOrOwner}
            isMember={true}
            isSignedIn={true}
            mergedIntoHref={(post) =>
              post.mergedIntoId
                ? `/${slug}/feedback/${post.mergedIntoId}`
                : null
            }
            postHref={(post) => `/${slug}/feedback/${post.id}`}
            posts={posts}
            showBoardColumn={false}
            workspaceId={workspace.id}
            workspaceStatuses={workspaceStatuses}
          />

          {totalCount > 0 && (
            <div className="border-t border-ir-border px-4 py-3 sm:px-8">
              <PostsPaginationBar
                baseParams={paginationBaseParams}
                currentPage={currentPage}
                defaultPageSize={DEFAULT_PAGE_SIZE}
                pageSize={validPageSize}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      </PageBody>
    </div>
  );
}
