import {
  Bell,
  CircleDashed,
  Code,
  MapTrifold,
  Megaphone,
  Scroll,
  Shield,
  Sliders,
  SquaresFour,
  Tag,
  Tray,
  UserCircle,
  Users,
} from "@phosphor-icons/react";
import type { ComponentType } from "react";

export type SearchCategory = "Navigation" | "Settings" | "Quick Actions";

export interface SearchablePage {
  adminOnly?: boolean;
  category: SearchCategory;
  href: (workspaceSlug: string) => string;
  icon: ComponentType<{ className?: string }>;
  id: string;
  keywords?: string[];
  label: string;
}

// Local, static index of real workspace pages — no server query, matches
// what's actually reachable in the app today (cross-checked against
// workspace-sidebar.tsx and account-menu.tsx). Adding a future async source
// (e.g. feedback posts, roadmap items) means adding another array + another
// grouped section in GlobalSearch, not changing this shape.
export const SEARCHABLE_PAGES: SearchablePage[] = [
  // Navigation
  {
    id: "dashboard",
    label: "Dashboard",
    category: "Navigation",
    icon: SquaresFour,
    href: (slug) => `/${slug}`,
  },
  {
    id: "all-feedback",
    label: "All Feedback",
    category: "Navigation",
    icon: Tray,
    href: (slug) => `/${slug}/feedback`,
    keywords: ["posts", "ideas", "requests"],
  },
  {
    id: "notifications",
    label: "Notifications",
    category: "Navigation",
    icon: Bell,
    href: (slug) => `/${slug}/notifications`,
    keywords: ["inbox", "activity"],
  },
  {
    id: "roadmap",
    label: "Roadmap",
    category: "Navigation",
    icon: MapTrifold,
    href: (slug) => `/${slug}/settings/roadmap`,
  },
  {
    id: "changelog",
    label: "Changelog",
    category: "Navigation",
    icon: Megaphone,
    href: (slug) => `/${slug}/settings/changelog`,
    keywords: ["updates", "release notes"],
  },

  // Settings — admin/owner only unless noted
  {
    id: "members",
    label: "Members",
    category: "Settings",
    icon: Users,
    href: (slug) => `/${slug}/settings/members`,
    adminOnly: true,
    keywords: ["team", "invite"],
  },
  {
    id: "member-invites",
    label: "Invite Members",
    category: "Settings",
    icon: Users,
    href: (slug) => `/${slug}/settings/members/invites`,
    adminOnly: true,
    keywords: ["invite", "team"],
  },
  {
    id: "categories",
    label: "Categories",
    category: "Settings",
    icon: Tag,
    href: (slug) => `/${slug}/settings/categories`,
    adminOnly: true,
  },
  {
    id: "statuses",
    label: "Statuses",
    category: "Settings",
    icon: CircleDashed,
    href: (slug) => `/${slug}/settings/statuses`,
    adminOnly: true,
    keywords: ["workflow", "state"],
  },
  {
    id: "embed",
    label: "Embed",
    category: "Settings",
    icon: Code,
    href: (slug) => `/${slug}/settings/embed`,
    adminOnly: true,
    keywords: ["widget", "script", "install"],
  },
  {
    id: "general-settings",
    label: "General Settings",
    category: "Settings",
    icon: Sliders,
    href: (slug) => `/${slug}/settings/general`,
    adminOnly: true,
    keywords: ["workspace settings"],
  },
  {
    id: "moderation",
    label: "Moderation",
    category: "Settings",
    icon: Shield,
    href: (slug) => `/${slug}/settings/moderation`,
    adminOnly: true,
  },
  {
    id: "audit-log",
    label: "Audit Log",
    category: "Settings",
    icon: Scroll,
    href: (slug) => `/${slug}/settings/audit-log`,
    adminOnly: true,
    keywords: ["history", "activity log"],
  },
  {
    id: "account-settings",
    label: "Account Settings",
    category: "Settings",
    icon: UserCircle,
    href: (slug) => `/${slug}/settings/account`,
    keywords: ["profile", "sessions"],
  },
  {
    id: "notification-preferences",
    label: "Notification Preferences",
    category: "Settings",
    icon: Bell,
    href: (slug) => `/${slug}/settings/notifications`,
    keywords: ["email", "alerts"],
  },

  // Quick Actions
  {
    id: "new-feedback",
    label: "New Feedback",
    category: "Quick Actions",
    icon: Tray,
    href: (slug) => `/${slug}/feedback/new`,
    keywords: ["create", "submit", "add"],
  },
  {
    id: "new-changelog-entry",
    label: "New Changelog Entry",
    category: "Quick Actions",
    icon: Megaphone,
    href: (slug) => `/${slug}/settings/changelog/new`,
    adminOnly: true,
    keywords: ["create", "publish", "add"],
  },
];
