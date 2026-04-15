# CITYGRAM — engineer handoff (secondary)

**Primary source of truth:** [`CITYGRAM.md`](../../CITYGRAM.md) at the repository root. This file summarizes shipped scope, invariants, and operational expectations for onboarding engineers. **When product behavior, routes, or env assumptions change, update `CITYGRAM.md` and this file together** (and keep [`README.md`](../../README.md) links accurate).

---

## Deployment status (repo reality)

| Topic | Status |
|--------|--------|
| **Build / lint** | **READY** — run `npm run lint` and `npm run build` before merge; no automated CI in-repo. |
| **In-repo hosting config** | **Not present** — no `vercel.json`, no `.github/workflows`. **Not required** to launch; use your host’s UI (e.g. Vercel “Import Git Repository”). |
| **Production wiring** | **NEEDS SETUP** — platform env vars, production Supabase project, migrations, Storage bucket `post-media`, `storage.sql`, Auth redirect URLs. See **Production hosting** in `CITYGRAM.md`. |

---

## Product invariants (do not change without explicit product + review)

- **`/feed`** shows posts for **`profile.home_city_id` only** — no global “For You” feed at startup.
- **Onboarding** (`onboarding_completed`) is **enforced in middleware** before non-public app routes.
- **Create post** is **home-city only** (`city_id` from `home_city_id`); **Passport / explore / city** routes are **browse-first** (viewing and discovery), not alternate posting targets.
- **Create flow:** client-direct upload to Supabase Storage (`post-media`), then **server finalize** via Server Actions — see `src/lib/post-media-upload.ts`, `src/actions/post.ts`, `src/components/create/`.

---

## Shipped MVP scope (summary)

See **MVP scope** in [`CITYGRAM.md`](../../CITYGRAM.md): email/password auth, onboarding, home-city feed, Passport/explore/city surfaces, posts with media, social graph, notifications, mentions in captions, reports, basic admin, creator/business schema placeholders.

---

## Launch gate (manual smoke test)

Run the **full checklist** in [`CITYGRAM.md` — Launch gate (manual smoke test)](../../CITYGRAM.md#launch-gate-manual-smoke-test) before calling a release “ready.” Minimum expectations:

1. `npm run lint` and `npm run build` succeed.
2. **Signup** → **onboarding** → **`/feed`** (home city only).
3. **`/explore`**, **`/passport/[slug]`**, **`/city/[slug]`** — browse another city; confirm you **cannot** publish into that city from the app.
4. **`/create`** — publish **one post with media**; it appears on **home** feed, not as a Passport posting surface.
5. **`/notifications`** — sanity-check (e.g. after a follow or mention if you test that path).
6. **Sign out** → **sign in** again.
7. Re-confirm **home-city-only posting** and **no global startup feed**.

---

## Environment variables (truth)

Documented in [`.env.local.example`](../../.env.local.example) and **Setup** / **Production hosting** in `CITYGRAM.md`. Required for the app: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`. Supabase Dashboard must allow **`{NEXT_PUBLIC_APP_URL}/auth/callback`** (plus preview URLs if used).

`SUPABASE_SERVICE_ROLE_KEY` is **optional** and **not used** by current `src/` application code.

---

## Architecture pointers

- **Server Actions:** `src/actions/`
- **Supabase clients:** `src/lib/supabase/client.ts`, `src/lib/supabase/server.ts`
- **Shared types:** `src/types/`
- **Middleware:** `src/middleware.ts` (auth + onboarding gates; Next internals bypassed at top)

---

## Current build handoff (Apr 2026)

### What shipped in this pass

- **Feed/post failure honesty hardening**
  - `src/app/(shell)/feed/error.tsx` added (route-level retry UI for true feed failures).
  - `src/app/(shell)/post/[id]/error.tsx` added (route-level retry UI for true post-query failures).
  - `fetchPostById` now keeps **404 only for true missing/removed posts**; query failures throw and surface as route errors.
- **Load-more clarity**
  - `HomeFeedList` now shows inline load-more failure with retry (`Try again`) and clears spinner on failure.
- **Input guards (fail-closed, narrow scope)**
  - `fetchCityFeed` validates UUIDs + pagination bounds.
  - `loadMoreHomeFeedPosts` validates offset.
  - `finalizeCreatePost` validates `city_id` and optional `neighborhood_id` UUID format.
- **Lightweight structured server logging**
  - `src/lib/server-log.ts` added.
  - Key feed/post throw paths now emit structured logs (function/event + context IDs).

### RLS / policy hardening status

- **Found and fixed mismatch:** DB policy for post insert did not enforce home-city invariant.
- Added migration: `supabase/migrations/003_posts_insert_home_city_policy.sql`
  - Replaces `posts_insert` policy so inserts require:
    - `author_id = auth.uid()`
    - profile is onboarded
    - `profiles.home_city_id = posts.city_id`

> Important: apply this migration in the target Supabase project before calling policy hardening complete.

### Deploy status

- Production redeployed successfully after this pass.
- Current alias: `https://citygram.vercel.app`

### Known risks / watch items

- Structured logging currently uses `console.error` JSON lines; no external sink configured yet.
- `fetchPostById` still returns `null` when post row exists but related `author`/`city` row is missing (intentional conservative behavior to avoid UI leaks on orphaned records).
- Ensure migration `003` is run in all environments (dev/staging/prod) to avoid policy drift.

### Suggested next scoped PRs (in order)

1. **Ops-level verification PR (no feature work):**
   - confirm `003` applied everywhere
   - add a short runbook section for migration verification and rollback path
2. **Targeted test coverage PR:**
   - add focused tests around feed/post error boundaries and invalid input guards
3. **Logging hygiene PR:**
   - standardize event names and add minimal redaction checklist for server log contexts

### Quick verification checklist for next engineer

1. Run `npm run lint` and `npm run build`.
2. Force a feed data failure and confirm `/feed` route error UI (not empty-state fiction).
3. Open `/post/[id]` with:
   - nonexistent UUID -> 404
   - simulated query failure -> route error UI
4. Verify load-more failure shows inline error and retry.
5. Confirm home-city posting still enforced from action + RLS migration.
