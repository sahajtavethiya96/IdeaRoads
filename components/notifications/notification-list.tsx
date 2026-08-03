"use client";

import { CheckCheck, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { NotificationEmptyState } from "@/components/notifications/notification-empty-state";
import { NotificationItem } from "@/components/notifications/notification-item";
import { useNotificationsContext } from "@/components/notifications/notifications-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SetPageHeader } from "@/components/workspace/topbar";
import type { NotificationListItem } from "@/lib/notifications/queries";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  hasMore: boolean;
  initialItems: NotificationListItem[];
  total: number;
  workspaceId: string;
}

type FilterTab = "all" | "unread";

export function NotificationList({
  initialItems,
  hasMore: initialHasMore,
  total: initialTotal,
  workspaceId,
}: NotificationListProps) {
  const notificationsCtx = useNotificationsContext();
  const [items, setItems] = useState<NotificationListItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearTarget, setClearTarget] = useState<NotificationListItem | null>(
    null
  );
  const [isClearingOne, setIsClearingOne] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleRead(id: string) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }

  // Deleting a single notification is irreversible and easy to trigger by
  // mistake with a stray hover-click, so it's confirmed here rather than
  // removed the instant the row's icon is clicked.
  function handleConfirmClearOne() {
    if (!clearTarget) {
      return;
    }
    const target = clearTarget;
    setIsClearingOne(true);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/notifications/${target.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("Failed to remove notification");
        }
        setItems((prev) => prev.filter((n) => n.id !== target.id));
        setTotal((prev) => Math.max(0, prev - 1));
        if (!target.isRead) {
          notificationsCtx?.decrementUnread(1);
        }
      } catch {
        toast.error("Failed to remove notification");
      } finally {
        setIsClearingOne(false);
        setClearTarget(null);
      }
    });
  }

  function handleMarkAllRead() {
    // Optimistic: flip every row to read and clear the shared badge right
    // away, then confirm with the server in the background. Roll back only
    // if the request actually fails — this is what keeps the count "always
    // synchronized" instead of waiting on the next poll or a page refresh.
    const previousItems = items;
    const previousUnread = notificationsCtx?.unreadCount;
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    notificationsCtx?.setUnreadCount(0);

    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!res.ok) {
          throw new Error("Failed to mark all notifications as read");
        }
        toast.success("All notifications marked as read");
      } catch {
        setItems(previousItems);
        if (previousUnread !== undefined) {
          notificationsCtx?.setUnreadCount(previousUnread);
        }
        toast.error("Failed to mark all as read");
      }
    });
  }

  function handleClearAll() {
    const previousItems = items;
    const previousTotal = total;
    const previousUnread = notificationsCtx?.unreadCount;

    // Optimistic: empty the list and badge immediately so the empty state
    // and sidebar count update on this click, not on the next round trip.
    setItems([]);
    setTotal(0);
    setHasMore(false);
    notificationsCtx?.setUnreadCount(0);
    setIsClearing(true);

    startTransition(async () => {
      try {
        const res = await fetch("/api/notifications", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!res.ok) {
          throw new Error("Failed to clear notifications");
        }
        toast.success("All notifications cleared");
      } catch {
        setItems(previousItems);
        setTotal(previousTotal);
        setHasMore(initialHasMore);
        if (previousUnread !== undefined) {
          notificationsCtx?.setUnreadCount(previousUnread);
        }
        toast.error("Failed to clear notifications");
      } finally {
        setIsClearing(false);
        setClearConfirmOpen(false);
      }
    });
  }

  function handleLoadMore() {
    startTransition(async () => {
      try {
        const nextPage = page + 1;
        const res = await fetch(`/api/notifications?page=${nextPage}&limit=30`);
        if (!res.ok) {
          throw new Error("Failed to load more notifications");
        }
        const data = await res.json();
        setItems((prev) => [...prev, ...data.notifications]);
        setHasMore(data.hasMore);
        setPage(nextPage);
      } catch {
        toast.error("Failed to load more notifications");
      }
    });
  }

  const unreadCount = items.filter((n) => !n.isRead).length;
  const visibleItems =
    filter === "unread" ? items.filter((n) => !n.isRead) : items;

  // Group notifications by recency (Today / This week / Earlier). Items arrive
  // already sorted newest-first, so each group preserves that order.
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const startOfWeek = startOfToday - 6 * 24 * 60 * 60 * 1000;
  const groups: { label: string; items: NotificationListItem[] }[] = [
    { label: "Today", items: [] },
    { label: "This week", items: [] },
    { label: "Earlier", items: [] },
  ];
  for (const n of visibleItems) {
    const t = new Date(n.createdAt).getTime();
    if (t >= startOfToday) {
      groups[0].items.push(n);
    } else if (t >= startOfWeek) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  }
  const visibleGroups = groups.filter((g) => g.items.length > 0);
  const showToolbar = items.length > 0;

  return (
    <div>
      {/* Reports title/description/toolbar up to the shared, layout-owned
          Topbar (see components/workspace/topbar.tsx) instead of rendering a
          second sticky header locally — this page used to render its own
          "Notifications" heading + toolbar here, which duplicated and
          visually overlapped the Topbar's own sticky bar. */}
      <SetPageHeader
        actions={
          showToolbar ? (
            <>
              {unreadCount > 0 && (
                <button
                  className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-ir-button px-3 py-2 text-sm font-medium text-ir-muted transition-colors duration-150 ease-ir-standard hover:bg-ir-muted-surface hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isPending}
                  onClick={handleMarkAllRead}
                  type="button"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all as read
                </button>
              )}
              <button
                className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-ir-button px-3 py-2 text-sm font-medium text-ir-muted transition-colors duration-150 ease-ir-standard hover:bg-ir-danger/10 hover:text-ir-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
                onClick={() => setClearConfirmOpen(true)}
                type="button"
              >
                <Trash2 className="size-3.5" />
                Clear all
              </button>
            </>
          ) : undefined
        }
        beforeActions={
          showToolbar ? (
            <div className="flex shrink-0 items-center gap-0.5 rounded-ir-button border border-ir-border bg-ir-surface p-1 shadow-ir-xs">
              <button
                className={cn(
                  "cursor-pointer rounded-ir-sm px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-ir-standard",
                  filter === "all"
                    ? "bg-ir-muted-surface text-ir-heading"
                    : "text-ir-muted hover:text-ir-heading"
                )}
                onClick={() => setFilter("all")}
                type="button"
              >
                All
              </button>
              <button
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-ir-sm px-2.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-ir-standard",
                  filter === "unread"
                    ? "bg-ir-muted-surface text-ir-heading"
                    : "text-ir-muted hover:text-ir-heading"
                )}
                onClick={() => setFilter("unread")}
                type="button"
              >
                Unread
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-ir-primary/15 px-1 text-2xs font-semibold text-ir-primary">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          ) : undefined
        }
        description={
          total > 0 ? (
            <>
              {total} notification{total === 1 ? "" : "s"}
              {unreadCount > 0 && (
                <span className="ml-1.5 font-medium text-ir-primary">
                  · {unreadCount} unread
                </span>
              )}
            </>
          ) : (
            "Updates on the feedback you're following."
          )
        }
        title="Notifications"
      />

      {/* List */}
      {items.length === 0 ? (
        <NotificationEmptyState />
      ) : visibleGroups.length === 0 ? (
        <div className="px-5 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            You're all caught up — no unread notifications.
          </p>
        </div>
      ) : (
        <div className="pt-2 pb-6">
          {visibleGroups.map((group) => (
            <div className="mb-2 mt-5 first:mt-0" key={group.label}>
              <div className="mb-2.5 flex items-center gap-3">
                <p className="shrink-0 text-2xs font-semibold uppercase tracking-eyebrow text-ir-muted">
                  {group.label}
                </p>
                <span className="h-px flex-1 bg-ir-border" />
              </div>
              <div className="space-y-2">
                {group.items.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleRead}
                    onRequestClear={setClearTarget}
                  />
                ))}
              </div>
            </div>
          ))}

          {hasMore && filter === "all" && (
            <div className="pt-2 pb-2 text-center">
              <button
                className="cursor-pointer text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPending}
                onClick={handleLoadMore}
                type="button"
              >
                {isPending ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        confirmLabel="Clear All"
        description={`Remove all ${total} notification${total === 1 ? "" : "s"}? This cannot be undone.`}
        isPending={isClearing}
        onConfirm={handleClearAll}
        onOpenChange={setClearConfirmOpen}
        open={clearConfirmOpen}
        title="Clear all notifications"
        variant="destructive"
      />

      <ConfirmDialog
        confirmLabel="Remove"
        description={`Remove "${clearTarget?.title}"? This cannot be undone.`}
        isPending={isClearingOne}
        onConfirm={handleConfirmClearOne}
        onOpenChange={(open) => !open && setClearTarget(null)}
        open={!!clearTarget}
        title="Remove notification"
        variant="destructive"
      />
    </div>
  );
}
