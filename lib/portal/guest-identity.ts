import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { GUEST_IDENTITY_DAYS } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";
import { env } from "@/lib/env";
import { isFeatureEnabled } from "@/lib/orbit/feature-flags";

// Identity for an ACCOUNTLESS Public Portal visitor. Once they have proven
// control of an email address (lib/portal/verification.ts), that address plus a
// display name is carried in a signed cookie — there is no `user` row and no
// Better Auth session behind it. The cookie IS the identity, so it is signed
// with APP_SECRET: a visitor cannot hand-edit it into someone else's address.
//
// Signing follows the same shape as lib/email/unsubscribe.ts —
// base64url(payload) "." base64url(HMAC-SHA256(payload)) — widened from a bare
// user id to a JSON payload carrying the email, name, and expiry.

const COOKIE_NAME = "ir_portal_guest";
const SEPARATOR = ".";

export interface GuestIdentity {
  email: string;
  name: string | null;
}

interface GuestPayload {
  email: string;
  exp: number;
  name: string | null;
}

function sign(payload: string): string {
  return createHmac("sha256", env.APP_SECRET)
    .update(payload)
    .digest("base64url");
}

function serialize(identity: GuestIdentity, expiresAt: number): string {
  const payload: GuestPayload = {
    email: identity.email,
    exp: expiresAt,
    name: identity.name,
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url"
  );
  return `${encoded}${SEPARATOR}${sign(encoded)}`;
}

/**
 * Verify a cookie value and return the identity it carries, or null if the
 * signature does not match, the payload is malformed, or it has expired.
 */
export function parseGuestCookie(
  value: string | undefined
): GuestIdentity | null {
  if (!value) {
    return null;
  }

  const [encoded, signature] = value.split(SEPARATOR);
  if (!encoded || !signature) {
    return null;
  }

  // Compare against the expected signature BEFORE trusting the payload, and
  // length-check first — timingSafeEqual throws on a length mismatch.
  const expected = Buffer.from(sign(encoded));
  const provided = Buffer.from(signature);
  if (
    expected.length !== provided.length ||
    !timingSafeEqual(expected, provided)
  ) {
    return null;
  }

  let payload: GuestPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!payload?.email || typeof payload.exp !== "number") {
    return null;
  }
  // The signature covers `exp`, so this cannot be extended by the visitor.
  if (payload.exp < Date.now()) {
    return null;
  }

  return { email: payload.email, name: payload.name ?? null };
}

export async function getGuestIdentity(): Promise<GuestIdentity | null> {
  const store = await cookies();
  return parseGuestCookie(store.get(COOKIE_NAME)?.value);
}

export async function setGuestIdentity(identity: GuestIdentity): Promise<void> {
  const maxAgeSeconds = GUEST_IDENTITY_DAYS * 24 * 60 * 60;
  const store = await cookies();
  store.set(
    COOKIE_NAME,
    serialize(identity, Date.now() + maxAgeSeconds * 1000),
    {
      httpOnly: true,
      maxAge: maxAgeSeconds,
      path: "/",
      // Lax, not None: this is the top-level Public Portal only. The embed widget
      // runs cross-site in an iframe and keeps its own bearer-token auth, which
      // this cookie deliberately does not participate in.
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    }
  );
}

export async function clearGuestIdentity(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export interface PortalActor {
  email: string;
  // Null for a verified guest — the marker that this participation is
  // accountless. Every write path branches on it.
  id: string | null;
  name: string | null;
}

/**
 * Resolve whoever is acting on the Public Portal: a real signed-in account if
 * there is one, otherwise a verified guest, otherwise null.
 *
 * A real session always wins, so a workspace member browsing their own portal
 * keeps acting as their account and never degrades to a guest.
 *
 * The guest fallback is gated on the instance-wide `guest_voting` flag. Every
 * write path goes through here, so flipping that flag off in Orbit Admin
 * reverts the portal to accounts-only with no other change — a guest cookie
 * that already exists simply stops being honored.
 */
export async function getPortalActor(): Promise<PortalActor | null> {
  const session = await getCurrentSession();
  if (session) {
    return {
      email: session.user.email,
      id: session.user.id,
      name: session.user.name ?? null,
    };
  }

  if (!(await isFeatureEnabled("guest_voting"))) {
    return null;
  }

  const guest = await getGuestIdentity();
  if (guest) {
    return { email: guest.email, id: null, name: guest.name };
  }

  return null;
}
