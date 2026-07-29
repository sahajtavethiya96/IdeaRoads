import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { user, workspaceInvites } from "@/db/schema";
import { db } from "@/lib/db";

// This instance does not offer self-serve registration. Accounts come from
// exactly two places:
//
//   1. The first-run `/setup` wizard, which creates the first Orbit Admin by
//      inserting rows directly (app/actions/setup.ts) and therefore never
//      passes through Better Auth or the checks here.
//   2. An invitation sent by a Brand Admin.
//
// Everything else — magic link, Google, email OTP, the old /sign-up/email
// endpoint — can still SIGN IN an existing account, but must not bring a new
// one into existence. Without this, anyone who reached /signin could type any
// address, click the emailed link, and land in onboarding as the Brand Admin
// of a workspace they created themselves.
//
// Public Portal visitors do not need accounts at all: they participate by
// verifying an email (lib/portal/guest-identity.ts), which creates no user.

export const NO_SELF_SIGNUP_MESSAGE =
  "No account found for that email. Accounts on this instance are created by invitation — ask an admin to invite you.";

/** Does an account already exist for this address? Then it's a sign-in. */
export async function userExistsByEmail(email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(sql`lower(${user.email})`, email.trim().toLowerCase()))
    .limit(1);

  return !!row;
}

/**
 * Is there a live invitation for this address — pending, not revoked, not yet
 * expired? Mirrors checkDuplicateInvite's conditions, but across every
 * workspace rather than one.
 */
export async function hasPendingInvite(email: string): Promise<boolean> {
  const [row] = await db
    .select({ id: workspaceInvites.id })
    .from(workspaceInvites)
    .where(
      and(
        eq(sql`lower(${workspaceInvites.email})`, email.trim().toLowerCase()),
        isNull(workspaceInvites.acceptedAt),
        isNull(workspaceInvites.revokedAt),
        gt(workspaceInvites.expiresAt, new Date())
      )
    )
    .limit(1);

  return !!row;
}

/**
 * May a brand-new account be created for this address?
 *
 * Only when an admin has already invited it. Callers that run BEFORE we know
 * whether the account exists (the sign-in endpoints) should also accept an
 * existing user — see mayAuthenticate.
 */
export async function mayCreateAccount(email: string): Promise<boolean> {
  return hasPendingInvite(email);
}

/**
 * May this address proceed through a sign-in endpoint at all?
 *
 * True when the account already exists (an ordinary sign-in) or an invitation
 * is waiting (a first sign-in that is allowed to create the account). Used to
 * refuse early — before a magic link or one-time code is emailed — so nobody
 * receives a link that would fail at the end.
 */
export async function mayAuthenticate(email: string): Promise<boolean> {
  if (await userExistsByEmail(email)) {
    return true;
  }
  return hasPendingInvite(email);
}
