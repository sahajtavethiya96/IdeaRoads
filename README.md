# IdeaRoads

[![CI](https://github.com/sahajtavethiya96/IdeaRoads/actions/workflows/ci.yml/badge.svg)](https://github.com/sahajtavethiya96/IdeaRoads/actions/workflows/ci.yml)
[![Docker build](https://github.com/sahajtavethiya96/IdeaRoads/actions/workflows/docker-build.yml/badge.svg)](https://github.com/sahajtavethiya96/IdeaRoads/actions/workflows/docker-build.yml)
[![Release](https://github.com/sahajtavethiya96/IdeaRoads/actions/workflows/release.yml/badge.svg)](https://github.com/sahajtavethiya96/IdeaRoads/actions/workflows/release.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

IdeaRoads is an open-source, self-hostable user feedback and feature voting platform. Teams use it to collect product feedback, let users vote on feature requests, track work on a public roadmap, and publish a changelog — all under their own domain.

Inspired by Canny and Fider. MIT licensed. No paid services or cloud vendor lock-in.

---

## Contents

- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Running it with Docker](#running-it-with-docker)
- [Health checks](#health-checks)
- [What's Implemented](#whats-implemented)
- [What's Documented but Not Yet Built](#whats-documented-but-not-yet-built)
- [Project Structure](#project-structure)
- [Commands](#commands)
- [Contributing](#contributing)
- [License](#license)

---

## Tech Stack

| Layer           | Choice                                    |
| --------------- | ----------------------------------------- |
| Framework       | Next.js 16 (App Router, TypeScript)       |
| UI              | daisyUI + Tailwind CSS v4, custom `ir-*` design tokens |
| Database        | PostgreSQL + Drizzle ORM                  |
| Auth            | Better Auth — Magic Link + Google OAuth   |
| Background Jobs | pg-boss (same PostgreSQL DB, no Redis)    |
| Email           | Nodemailer + SMTP + React Email templates |
| Linting         | Biome (replaces ESLint + Prettier)        |
| Deployment      | Docker Compose, or manual/Node            |

---

## Quick Start

For local development, without Docker:

```bash
pnpm install
cp .env.example .env
pnpm db:local       # spin up embedded PostgreSQL (dev only)
pnpm db:migrate
pnpm dev            # starts Next.js + background worker concurrently
```

Open `http://localhost:3000` and sign in with a magic link.

Deploying this somewhere real? See [Running it with Docker](#running-it-with-docker) below.

### Two-host mode (Workspace vs Public Portal)

The Workspace/Admin app and the Public Portal can run as independent
applications with **isolated sessions** — signing into one never authenticates
the other. Set two hosts in `.env`:

```bash
NEXT_PUBLIC_ADMIN_URL=http://app.localhost:3000
NEXT_PUBLIC_PORTAL_URL=http://portal.localhost:3000
```

Then use `http://app.localhost:3000` for the admin app and
`http://portal.localhost:3000` for a workspace's public portal
(`portal.localhost:3000/{slug}/roadmap`, etc.). Browsers resolve `*.localhost`
to loopback automatically; plain `http://localhost:3000` keeps working as a
single-origin full app. Leave both vars unset for single-origin mode. See
[`docs/migration/01-portal-subdomain-auth.md`](./docs/migration/01-portal-subdomain-auth.md).

To promote yourself to superadmin:

```bash
pnpm make:admin you@example.com
```

Without `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` set, the worker logs emails to stdout instead of sending them.

### Configuration

`.env` only needs the handful of values required before the database is even
reachable (`DATABASE_URL`, `APP_SECRET`, `NEXT_PUBLIC_APP_URL`). Everything
optional — SMTP, Google OAuth, S3/R2 file storage, the inbound email webhook
secret — can instead be set from **Admin → Integrations** or the first-run
setup wizard, backed by the database, with secrets encrypted at rest. `.env`
still works for all of these as a fallback for existing installs. See
[`docs/implementation/INTEGRATIONS.md`](./docs/implementation/INTEGRATIONS.md)
for the full picture, including which settings need an app restart to take
effect.

---

## Running it with Docker

**You need:** Docker and Docker Compose v2 (`docker compose version`), and
nothing else — no local Node.js or PostgreSQL install.

```bash
git clone <this-repo-url> idearoads && cd idearoads
cp .env.example .env
# set DATABASE_URL (matching the bundled Postgres below is fine), APP_SECRET
# (32+ chars — openssl rand -base64 36), and NEXT_PUBLIC_APP_URL
docker compose up -d
```

This builds [`Dockerfile`](./Dockerfile) (app) and
[`Dockerfile.worker`](./Dockerfile.worker) (used for both the one-shot
`migrate` step and the `worker` service) from source, then starts
PostgreSQL, applies migrations, and leaves `app` and `worker` running. The
app publishes on `http://localhost:3000` — change the host port with
`APP_PORT=8080` in `.env` if 3000 is already taken.

Already have a Postgres database (managed service, or your own instance)?

```bash
docker compose -f docker-compose.yml -f docker-compose.external-db.yml up -d
```

Point `DATABASE_URL` at your own database in `.env` first — see the comments
in [`docker-compose.external-db.yml`](./docker-compose.external-db.yml) if
your database runs on the Docker host itself rather than a remote server.

### Prebuilt images

Every push to `main` that passes CI also builds and publishes versioned,
multi-arch (amd64 + arm64) images via [`.github/workflows/release.yml`](./.github/workflows/release.yml) —
useful if you're pointing a platform (Coolify, Dokploy, Kubernetes, ECS,
etc.) directly at an image instead of building from this repo:

```bash
docker pull ghcr.io/sahajtavethiya96/idearoads:latest          # app
docker pull ghcr.io/sahajtavethiya96/idearoads-worker:latest   # worker
```

Available tags: `latest`, the `major`/`minor`/`patch` ladder for each
tagged release (e.g. `0`, `0.1`, `0.1.0`), `main` (rebuilt on every push,
expect rough edges), and a fixed `sha-<short>` per build. Pin a version in
production rather than tracking `latest`. The Compose files above always
build from source; using a prebuilt image directly means running
`docker run`/your platform's config against these image names yourself with
the same env vars as `.env.example`.

> **First release only:** a new GitHub Packages entry defaults to
> **private**, even in a public repository. Repository → Packages →
> `idearoads` / `idearoads-worker` → Package settings → Change visibility →
> Public — otherwise `docker pull` fails for anyone not signed in. CI's
> `verify-public` job in `release.yml` checks this automatically and fails
> loudly until it's done.

### Where your data lives

| Volume | Mounted at | Holds |
|--------|-----------|-------|
| `idearoads_pgdata` | `/var/lib/postgresql/data` | Everything: workspaces, posts, votes, accounts, sessions |
| `idearoads_uploads` | `/app/public/uploads` | Uploaded files, on the default local storage setting only |

Volume names are pinned literally (not derived from the Compose project
name) so a redeploy always reattaches to the same volume instead of
silently creating a new empty one. They survive `down`, `pull`, and
`up -d` — only `docker compose down -v` destroys them.

### Updating

```bash
git pull
docker compose up -d --build
```

The `migrate` service re-applies before `app`/`worker` start; it's safe to
run repeatedly. Check [CHANGELOG.md](./CHANGELOG.md) for anything needing
manual work before updating a production instance.

---

## Health checks

`GET /api/health` needs no authentication and checks real database
connectivity (not just "the process is up"):

```bash
curl http://localhost:3000/api/health
# {"ok":true,"db":"connected"}       -> 200
# {"ok":false,"db":"disconnected"}   -> 503
```

The `app` service's Docker `HEALTHCHECK` uses this, so `docker compose ps`
reports real health with no extra configuration.

---

## What's Implemented

### Authentication

- Magic link sign-in (no passwords)
- Google OAuth
- Secure cookie sessions with IP and User-Agent tracking
- Post-auth redirect: users go to their workspace (`/{slug}`), admins go to `/orbit`

### Account Settings (`/account/profile`)

- Edit name and email
- View and revoke active sessions
- Export account data as JSON
- Delete account

### Platform Admin (`/orbit/*`)

Superadmin-only panel — returns 404 for everyone else.

- **Overview** — user count, email queue size, job queue summary
- **Users** — table of all users with inline role promotion and ban/unban
- **Email** — outbox status (queued → sending → sent/failed) and inbound SMTP webhook events (bounces, deliveries, opens, clicks)
- **Queues** — pg-boss job states grouped by queue name

### Background Worker

Runs as a separate process alongside Next.js. Uses pg-boss (no Redis required).

| Job                    | Trigger                 | Description                                     |
| ---------------------- | ----------------------- | ------------------------------------------------ |
| `email.send`           | `enqueueEmail()` called | Process `email_outbox` row → Nodemailer SMTP    |
| `email.outbox-reap`    | Cron every 15 min       | Re-queue emails stuck in `queued` state         |
| `email.events-prune`   | Cron 3 AM daily         | Delete email events older than retention period |
| `scaffold.healthcheck` | Cron every 10 min       | System health check                             |

### Durable Email Outbox

Email is never sent inline. `enqueueEmail()` writes to `email_outbox` first, then enqueues the pg-boss job. If the app crashes between those two steps, the reap cron re-queues any stuck rows. Zero email loss.

### Audit Logging

Fire-and-forget audit trail on user creation, magic link send, logout, data export, and account deletion. Never blocks the primary action.

---

## What's Documented but Not Yet Built

The full product specification lives in [`/docs`](./docs). Features are documented in build order:

| #   | Feature                         |
| --- | -------------------------------- |
| 02  | Workspaces                      |
| 03  | Team Members & Invites          |
| 04  | Feedback Boards                 |
| 05  | Feedback Posts                  |
| 06  | Voting                          |
| 07  | Comments                        |
| 08  | Categories & Status             |
| 09  | Public Roadmap                  |
| 10  | Changelog                       |
| 11  | Notifications                   |
| 12  | Workspace Settings & Moderation |

Start with [`docs/MASTER.md`](./docs/MASTER.md) — it is the single source of truth: full database schema, folder structure, all background jobs, environment variables, and the build order.

---

## Project Structure

```
app/
├── page.tsx                     Landing / sign-in prompt
├── (auth)/login/                Magic link + Google OAuth sign-in
├── post-auth/                   Role-based redirect after sign-in
├── account/                     Account settings (profile, sessions, export)
├── (orbit)/orbit/               Admin panel (workspaces, users, feature flags, settings)
└── api/                         Auth handler, account export, email webhook

lib/
├── auth.ts                      Better Auth config (magic link, Google, admin plugin)
├── authz.ts                     requireSession / requireAdmin helpers
├── audit.ts                     Fire-and-forget audit logging
├── email/                       enqueueEmail(), React Email templates, renderer
└── worker/                      pg-boss init, job handlers, cron schedules

db/
├── schema/                      Drizzle table definitions
└── migrations/                  Auto-generated SQL (drizzle-kit)

scripts/
├── worker.ts                    Worker entry point
├── make-admin.ts                Promote user to superadmin by email
└── dev-db.ts                    Embedded PostgreSQL for local development

docs/
├── MASTER.md                    Complete project blueprint
└── features/                    Per-feature specifications (00–13)
```

---

## Commands

| Command            | Description                              |
| ------------------- | ----------------------------------------- |
| `pnpm dev`         | Start Next.js + worker in watch mode     |
| `pnpm dev:next`    | Start Next.js only                       |
| `pnpm worker`      | Start worker only (watch mode)           |
| `pnpm build`       | Production build                         |
| `pnpm typecheck`   | Run TypeScript type checker              |
| `pnpm lint`        | Lint with Biome                          |
| `pnpm lint:fix`    | Lint and auto-fix                        |
| `pnpm test`        | Run tests (Vitest)                       |
| `pnpm db:local`    | Start embedded PostgreSQL (dev)          |
| `pnpm db:migrate`  | Run pending migrations                   |
| `pnpm db:generate` | Generate migration files from schema     |
| `pnpm db:push`     | Push schema directly (no migration file) |
| `pnpm db:reset`    | Drop all tables and re-migrate           |
| `pnpm make:admin`  | Promote user to superadmin               |

See [`docs/MASTER.md`](./docs/MASTER.md) for the full environment variable reference.

---

## Contributing

Read [CLAUDE.md](./CLAUDE.md) first — it documents the design rules, component conventions, and hard rules every change is expected to follow. For anything beyond a small fix, open an issue first to discuss the approach.

Before opening a PR, run:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## License

MIT — see [LICENSE](./LICENSE) for details.
