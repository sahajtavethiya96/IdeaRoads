export const PRODUCT_NAME = "IdeaRoads";
export const PRODUCT_DESCRIPTION =
  "Open-source customer feedback, voting, and changelog. Self-hosted. MIT licensed.";
export const LOGO_PATH = "/ir-logo.png";

export const GITHUB_REPO_URL = "https://github.com/idearoads/idearoads";
export const DOCS_URL = "https://github.com/idearoads/idearoads#readme";

export const ADMIN_ROLE = "admin";
export const USER_ROLE = "user";

// Workspace member roles
export const WORKSPACE_OWNER = "owner" as const;
export const WORKSPACE_ADMIN = "admin" as const;
export const WORKSPACE_MEMBER = "member" as const;

// Product-facing role labels (PLATFORM.md §2/§11). "Owner/Admin/Member" are
// deprecated as product roles: owner and admin are both the single "Brand Admin"
// role (ownership is a property, not a role); member is a "Team Member".
export const BRAND_ADMIN_LABEL = "Brand Admin";
export const TEAM_MEMBER_LABEL = "Team Member";

export function workspaceRoleLabel(role: string): string {
  return role === WORKSPACE_MEMBER ? TEAM_MEMBER_LABEL : BRAND_ADMIN_LABEL;
}

// Workspace limits
export const MAX_WORKSPACES_PER_USER = 10;
export const MAX_MEMBERS_PER_WORKSPACE: number | null = null;

// Invitation settings
export const INVITE_EXPIRY_DAYS = 7;
export const INVITE_LINK_LABEL_MAX = 100;

// Accountless participation on the Public Portal (Feature 01). A visitor proves
// they control an email address with a one-time code and can then submit
// feedback, vote, and comment — no account, no password, no session.
export const GUEST_OTP_LENGTH = 6;
export const GUEST_OTP_EXPIRY_MINUTES = 10;
// Bounds brute force against the 6-digit space; the row is destroyed once
// exceeded, so a fresh code must be requested.
export const GUEST_OTP_MAX_ATTEMPTS = 5;
export const GUEST_OTP_RESEND_COOLDOWN_SECONDS = 60;
// How long a verified email stays remembered in the visitor's browser before
// they are asked to confirm the address again.
export const GUEST_IDENTITY_DAYS = 30;
export const GUEST_NAME_MAX = 80;

// Default board created with every new workspace
export const DEFAULT_BOARD_NAME = "Feature Requests";
export const DEFAULT_BOARD_SLUG = "feature-requests";
export const DEFAULT_BOARD_DESCRIPTION =
  "Share and vote on the features you want to see built.";

// Slugs that cannot be used as workspace slugs (conflict with app routes)
export const RESERVED_SLUGS: readonly string[] = [
  "api",
  "auth",
  "login",
  "logout",
  "onboarding",
  "post-auth",
  "complete-profile",
  "orbit",
  "setup",
  "dashboard",
  "settings",
  "invite",
  "join",
  "demo",
  "features",
  "privacy",
  "terms",
  "public",
  "static",
  "_next",
  "favicon",
  "icon",
  "admin",
  "superadmin",
  "root",
  "system",
  "support",
  "help",
  "idearoads",
  "ir",
  "notifications",
  "profile",
  "account",
  "billing",
  "sitemap",
  "robots",
  "404",
  "500",
];

// Soft-delete marker for comments
export const DELETED_COMMENT_BODY = "[deleted]";

// Supported emoji reactions on comments
export const REACTION_EMOJIS = ["👍", "❤️", "😄", "🎉", "😮", "😢"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];
