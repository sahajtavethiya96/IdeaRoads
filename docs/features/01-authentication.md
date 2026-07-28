# Feature 01 — Authentication

## Overview

IdeaRoads is passwordless by default. People sign in with a **Magic Link** (a one-time link sent to their email) or with **Google**, and a first-time sign-in with either method automatically creates an account — there is no separate registration step for them.

Self-hosted instances can additionally turn on **Email + Password** sign-in — an Orbit Admin opts in per-instance from **Platform → Feature Flags** (`password_auth`, off by default). This exists mainly so a self-hoster isn't forced to configure SMTP or Google OAuth before anyone can sign in: the `/setup` first-run wizard always creates the very first Orbit Admin with a password, regardless of this flag. When the flag is off (the default, and the current behavior of the hosted IdeaRoads instance), `/signup` and the password field on `/signin` simply don't appear — nothing changes from the passwordless experience described below.

The **same sign-in serves all four product roles**: an Orbit Admin, a Brand Admin, a Team Member, and a User all sign in through the same screen. Where they land afterwards depends on what their account already has, not on a different login. (For the role model, see [../PLATFORM.md](../PLATFORM.md).)

Anyone can browse a brand's public boards, roadmap, and changelog without an account. **Creating feedback, voting, commenting, and following the roadmap all require signing in first** — there is no anonymous participation.

---

## Sign-in Methods

| Method | What the person does |
|---|---|
| **Magic Link** | Enters their email, receives a one-time sign-in link, clicks it, and is signed in. A new account is created automatically on first use. |
| **Google** | Clicks "Continue with Google", approves on Google's screen, and is signed in. A new account is created automatically on first use. |
| **Email + Password** *(optional)* | Only offered when an Orbit Admin has enabled the `password_auth` feature flag. Visits `/signup` to create an account with a name, email, and password, then signs in from `/signin` with that email and password. Unlike the other two methods, this one requires an explicit registration step. |

Magic Link and Google live on the sign-in screen for every deployment. The "Continue with Google" option appears only when Google sign-in is enabled; the password field and the "Sign up" link appear only when `password_auth` is enabled.

Product facts:

- Magic Link and Google both create an account automatically on first sign-in — no separate signup form for either.
- Email + password is opt-in per instance and off by default; when off, nothing about the passwordless experience changes.
- When password sign-in is enabled, forgot-password / reset-password is available too — but only once SMTP is configured, since the reset link has to be emailed.
- Signing IN with an existing password always works, even while `password_auth` is off — that flag only gates self-serve *registration* (`/signup` and the password field's visibility). This is what lets the `/setup` first-run wizard create a password-based Orbit Admin on a brand-new instance before any other sign-in method is configured.

---

## Pages

IdeaRoads exposes clean, predictable URLs for the sign-in experience:

| Page | Purpose |
|---|---|
| `/signin` | Sign in or sign up (Magic Link + Google), plus password sign-in when `password_auth` is enabled |
| `/signup` | Password registration form when `password_auth` is enabled; otherwise sends people to `/signin` |
| `/forgot-password` | Request a password-reset email — only reachable when `password_auth` is enabled and SMTP is configured |
| `/reset-password` | Set a new password from the emailed reset link |
| `/setup` | First-run wizard on a brand-new instance (empty `user` table): creates the first Orbit Admin and the first workspace. Redirects to `/signin` once the instance has any user. |
| `/post-auth` | Routes a freshly signed-in person to the right destination |
| `/invite/[token]` | Accept an invitation to join a workspace |

---

## Post Sign-in Routing

After a person signs in, IdeaRoads sends them to the right place automatically:

- **No workspace yet** → onboarding, where they create their first workspace and become its Brand Admin.
- **Already a member of one or more workspaces** → their workspace dashboard.
- **Arrived via an invite link** → the invitation is accepted, then they land on the workspace dashboard.

This routing is the same regardless of how the person signed in.

---

## Sign Out

A signed-in person can sign out at any time from the account menu. Signing out ends their session and returns them to the sign-in screen.

---

## Profile & Account

Any signed-in person can manage their own account:

- **Edit profile** — update their display name and avatar.
- **Delete account** — permanently remove their account. Deletion is irreversible and requires explicit confirmation. After deletion, their feedback is anonymised and their vote counts are preserved, so the brand's data stays intact while the person's identity is erased.

---

## Flows

### Sign in with Magic Link (new person)

```
1. Visit /signin
2. Enter email → request the magic link
3. See a "Check your email" confirmation
4. Open the email and click the one-time link
5. Signed in (account created automatically)
6. Routed via /post-auth → no workspace → onboarding
```

### Sign in with Magic Link (returning person)

```
1–5. Same as above
6.  Routed via /post-auth → existing workspace → workspace dashboard
```

### Sign in with Google

```
1. Visit /signin
2. Choose "Continue with Google"
3. Approve on Google's consent screen
4. Signed in (account created or linked automatically)
5. Routed via /post-auth (same rules as Magic Link)
```

### Accept an invitation

```
1. Open an invite link (/invite/[token])
2. Sign in if not already signed in (Magic Link or Google)
3. The invitation is accepted
4. Land on the workspace dashboard as a Team Member
```

### Sign out

```
1. Open the account menu
2. Choose "Sign out"
3. Session ends → returned to /signin
```

---

## Acceptance Criteria

- A person can always sign in with a Magic Link or with Google.
- Email + password sign-in exists only when an Orbit Admin has enabled the `password_auth` feature flag; while it's off (the default), `/signup` sends people to `/signin` and no password field appears anywhere.
- When `password_auth` is enabled, `/signup` becomes a real registration form, and a password field (plus "Forgot password?" once SMTP is configured) appears on `/signin`.
- Magic Link and Google both create an account automatically on first sign-in; there is no separate registration form for either.
- Signing in with an existing password always works regardless of the `password_auth` flag — only self-serve registration is gated.
- A brand-new instance with no users is routed to `/setup` instead of `/signin`; completing it creates the first Orbit Admin and first workspace, and `/setup` becomes unreachable (redirects to `/signin`) afterwards.
- The same sign-in serves all four roles (Orbit Admin, Brand Admin, Team Member, User).
- After signing in, a person with no workspace reaches onboarding.
- After signing in, a person with one or more workspaces reaches their workspace dashboard.
- A person arriving through an invite link has the invitation accepted and then reaches the workspace dashboard.
- A signed-in person can sign out and is returned to the sign-in screen.
- A signed-in person can edit their display name and avatar.
- A signed-in person can permanently delete their account after explicit confirmation; their feedback is anonymised and vote counts are preserved.
- An expired or already-used Magic Link cannot sign anyone in; the person is told the link is no longer valid.
- The "Continue with Google" option only appears when Google sign-in is enabled.

---

> **Implementation reference.** API endpoints, the sign-in service layer, rate limiting, session handling, and engineering notes live in [../implementation/features/01-authentication.md](../implementation/features/01-authentication.md). The sign-in library and environment configuration are documented in [../implementation/TECH-STACK.md](../implementation/TECH-STACK.md).
