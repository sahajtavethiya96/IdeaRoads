"use client";

import {
  ArrowRight,
  Bell,
  CornerDownRight,
  FileText,
  MailOpen,
  Megaphone,
  MessageCircle,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useNotificationsContext } from "@/components/notifications/notifications-context";
import { RelativeTime } from "@/components/ui/relative-time";
import type { NotificationType } from "@/db/schema/notifications";
import type { NotificationListItem } from "@/lib/notifications/queries";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  new_post: FileText,
  status_change: ArrowRight,
  new_comment: MessageCircle,
  reply: CornerDownRight,
  invite_accepted: UserCheck,
  member_removed: UserX,
  changelog_published: Megaphone,
  assignment: UserPlus,
};

const REMOVED_MESSAGE =
  "This item is no longer available because it has been removed.";

interface NotificationItemProps {
  notification: NotificationListItem;
  onRead: (id: string) => void;
  onRequestClear: (notification: NotificationListItem) => void;
}

export function NotificationItem({
  notification,
  onRead,
  onRequestClear,
}: NotificationItemProps) {
  const Icon = TYPE_ICONS[notification.type as NotificationType] ?? Bell;
  const isRead = notification.isRead;
  const isRemoved = notification.targetMissing;
  const notificationsCtx = useNotificationsContext();

  // Marks read without navigating (used by both opening the notification and
  // the hover "mark as read" action). Decrementing the shared context here —
  // not just the list's local state — is what makes the sidebar bell update
  // on the same click instead of the next poll.
  function markRead() {
    if (!isRead) {
      onRead(notification.id);
      notificationsCtx?.decrementUnread(1);
      fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      }).catch(() => {
        // best-effort; the list already reflects the optimistic update
      });
    }
  }

  function handleRemovedClick() {
    markRead();
    toast(REMOVED_MESSAGE);
  }

  // Only opens the confirmation dialog (owned by NotificationList) — the
  // actual delete happens on confirm, so a mis-click can't silently disappear
  // a notification with no way to know where it went.
  function handleRequestClear(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    onRequestClear(notification);
  }

  function handleMarkReadClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    markRead();
  }

  return (
    <div
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-ir-md border border-l-[3px] px-4 py-3.5 shadow-ir-xs transition-all duration-150 ease-ir-standard hover:shadow-ir-sm",
        isRead
          ? "border-ir-border border-l-transparent bg-ir-surface hover:bg-ir-muted-surface/40"
          : "border-ir-primary/15 border-l-ir-primary bg-ir-primary/[0.045] hover:bg-ir-primary/[0.07]"
      )}
    >
      {/* Icon */}
      <span
        className={`mt-0.5 shrink-0 flex size-8 items-center justify-center rounded-ir-sm ${
          isRemoved
            ? "bg-ir-muted-surface/60 text-ir-muted/60"
            : isRead
              ? "bg-ir-muted-surface text-ir-muted"
              : "bg-ir-primary/10 text-ir-primary"
        }`}
      >
        <Icon className="size-4" />
      </span>

      {/* Content — the title itself is the single real navigation target,
          stretched via ::after to cover the whole row so the entire row
          stays clickable without nesting interactive elements. */}
      <div className="flex-1 min-w-0 pr-14">
        <div className="flex items-start gap-2">
          {!isRead && !isRemoved && (
            <span
              aria-hidden
              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-ir-primary"
            />
          )}
          {isRemoved ? (
            <button
              className="cursor-pointer text-left text-[15px] leading-snug text-ir-muted after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
              onClick={handleRemovedClick}
              type="button"
            >
              {notification.title}
            </button>
          ) : (
            <Link
              className={`text-[15px] leading-snug after:absolute after:inset-0 after:content-[''] focus-visible:outline-none ${
                isRead
                  ? "font-normal text-ir-body"
                  : "font-semibold text-ir-heading"
              }`}
              href={notification.link}
              onClick={markRead}
            >
              {notification.title}
            </Link>
          )}
          {isRemoved && (
            <span className="mt-0.5 shrink-0 rounded-full bg-ir-muted-surface px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-ir-muted">
              Removed
            </span>
          )}
        </div>
        {notification.body && !isRemoved && (
          <p className="mt-1 text-sm leading-relaxed text-ir-muted line-clamp-2">
            {notification.body}
          </p>
        )}
        {isRemoved && (
          <p className="mt-1 text-sm leading-relaxed text-ir-muted/70">
            {REMOVED_MESSAGE}
          </p>
        )}
        <p className="mt-2 text-xs text-ir-muted/60">
          <RelativeTime
            date={notification.createdAt}
            options={{ addSuffix: true }}
          />
        </p>
      </div>

      {/* Hover actions — Gmail-style: mark as read (unread only) + clear,
          layered above the stretched title link so they stay clickable. */}
      <div className="absolute right-3.5 top-3.5 z-10 hidden items-center gap-1 group-hover:flex">
        {!isRead && !isRemoved && (
          <button
            aria-label="Mark as read"
            className="flex size-7 cursor-pointer items-center justify-center rounded-ir-sm text-ir-muted transition-colors hover:bg-ir-surface hover:text-ir-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
            onClick={handleMarkReadClick}
            title="Mark as read"
            type="button"
          >
            <MailOpen className="size-3.5" />
          </button>
        )}
        <button
          aria-label="Remove notification"
          className="flex size-7 cursor-pointer items-center justify-center rounded-ir-sm text-ir-muted transition-colors hover:bg-ir-surface hover:text-ir-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40"
          onClick={handleRequestClear}
          title="Remove notification"
          type="button"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
