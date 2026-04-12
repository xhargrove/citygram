# CITYGRAM

City-first social: your **home city** is the default world. Everything else is an intentional trip.

On the web, CITYGRAM leads with a **landing page** presence at `/` (positioning, join, log in). The product app—feed, explore, create, profiles—lives behind auth and onboarding on the routes below.

**Figma (marketing landing):** Full creative brief and section copy for the flagship landing — [`docs/figma-landing-page-prompt.md`](docs/figma-landing-page-prompt.md). Align tokens with `src/app/globals.css`; production page is [`src/app/page.tsx`](src/app/page.tsx).

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run SQL**  
   - Execute `supabase/migrations/001_citygram_schema.sql` in the SQL editor (or Supabase CLI).  
   - Run `supabase/seed.sql` for reference cities (US metros + neighborhoods), and interests.  
   - Create bucket `post-media` (public read for MVP), then run `supabase/storage.sql` for policies.
3. **Environment** — copy `.env.local.example` to `.env.local` and set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
4. **Auth URL** — in Supabase Auth settings, add redirect URL:  
   `{NEXT_PUBLIC_APP_URL}/auth/callback`
5. **Install & dev** — `npm install` then `npm run dev` (mobile: use your LAN IP or tunnel; app is responsive).

## Folder & route map

- `src/app` — App Router pages (landing, auth, onboarding, `(shell)` app with bottom nav).
- `src/components` — UI, feed, profile, layout, providers.
- `src/actions` — Server Actions (auth, posts, social, onboarding, moderation, notifications).
- `src/lib` — Supabase clients, data fetchers, media URL helper, utilities.
- `src/types` — Shared TypeScript types.
- `supabase/` — Schema, seed, storage policies.

Primary routes:

| Path | Purpose |
|------|---------|
| `/` | Landing / marketing presence (not the signed-in app shell) |
| `/login`, `/signup`, `/forgot-password` | Auth |
| `/onboarding` | Home city + interests (required before app) |
| `/feed` | **Home city feed only** |
| `/explore` | Browse other cities (Passport entry) |
| `/passport`, `/passport/[slug]` | Passport Mode — another city’s feed |
| `/city/[slug]` | City pulse (trending, businesses, events) |
| `/create` | Create post (client-direct Storage upload + server finalize) |
| `/post/[id]` | Post + comments |
| `/u/[username]` | Profile, follow, saved/tagged |
| `/creator/[username]`, `/business/[username]` | Alias → profile (badges from `account_type`) |
| `/search` | Cities, people, hashtags |
| `/notifications` | Alerts |
| `/settings` | Theme, sign-out, admin link |
| `/admin` | Moderation desk (moderator/admin role) |

## How city-first logic is enforced

1. **Data model** — Every profile has `home_city_id` (required after onboarding via `CHECK` constraint with `onboarding_completed`). Every post has `city_id` (NOT NULL).
2. **Middleware** — Authenticated users without `onboarding_completed` are sent to `/onboarding` for any non-public route.
3. **Home feed** — `/feed` loads posts with `city_id === profile.home_city_id` only. There is no global “for you” feed at startup.
4. **Passport / explore** — Other cities are reached via `/explore`, `/passport/[slug]`, or `/city/[slug]`. The UI copy states that this does not replace the home feed.
5. **Create post** — Defaults `city_id` to the member’s home city; user can change city when traveling.

## Mobile-first layout

- **`(shell)/layout`** wraps primary app screens with `AppShell`: bottom navigation, `max-w-lg` content column, touch-friendly targets (min ~44–48px), `safe-area` padding via CSS utilities (`safe-pt`, `safe-pb`, `env(safe-area-inset-*)`).
- **Create** uses full-height flow with sticky back header; bottom nav hides on `/create` for more canvas.
- **Feeds** use smooth scrolling (`feed-scroll`, `-webkit-overflow-scrolling: touch`).
- **Theme** — `next-themes` with `class` strategy; tokens in `globals.css` for light/dark.
- **Responsive** — Single column on phones; centered column on tablet/desktop (`max-w-lg` / `max-w-3xl` where noted).

## MVP scope (shipped in this repo)

- Email/password auth, forgot password, Supabase session + middleware refresh.
- Onboarding: handle, display name, **home city**, optional neighborhood, interests.
- Home city feed; Passport city feed; city pulse page; explore hub.
- Posts with multi-image/video, captions, hashtags, storage upload, likes/saves/shares (share count via RPC), comments, follows.
- Profiles with grid, saved (self), tagged posts list; **captions support `@username` mentions** (stored in `post_tagged_profiles`, in-app notification).
- Notifications for follow, like, comment (inserted from server actions).
- Reports + basic admin remove for moderators/admins.
- Creator/business **placeholders** (`account_type`, `creator_profiles`, `business_profiles`, sponsored flag on posts, events table).

## V2 / future work (explicitly not pretending to be done)

- Rich push notifications, email digests, SMS.
- Real geo “nearby cities” ranking (currently honest pilot copy).
- Rich @mention autocomplete, comment-level mentions, and mention permissions beyond caption parsing.
- Full-text search, discovery ranking, reels-length video processing.
- Payments, branded campaigns, self-serve business tools.
- Advanced moderation queues, appeals, ML classifiers.

## Main product risks

- **Cold start / empty cities** — Without seeding and local champions, feeds feel quiet (see strategy below).
- **Geographic fairness** — City boundaries and migration need clear policies to avoid exclusion debates.
- **Moderation scale** — Manual desk does not scale; workflows must harden early.
- **Sponsored / business trust** — “Local spotlight” must stay transparent to avoid feeling like generic ads.

## Launch strategy to reduce empty-city syndrome

- **Seed each launch city** with curated accounts, weekly “city hosts,” and calendar hooks (markets, music, school cycles).
- **Start hyperlocal** — Neighborhood prompts (“Midtown tonight”) before metro-wide reach.
- **Partner with locals** — Small businesses and creators bring the first 50 posts per city.
- **Highlight rituals** — Weekly themes (#FoodFriday, city-specific tags) to concentrate activity.
- **Honest UX** — Empty states explain *why* and invite the first post instead of faking engagement.

## Building with a team (and Claude)

Use this doc as the shared context for humans and assistants. Point Claude at **`CITYGRAM.md`** (and specific files) at the start of each task.

### Workflow

- **`main` stays deployable.** Use short-lived branches (`feat/…`, `fix/…`) and small PRs.
- **PRs** should say what changed, how to test, and call out risk for **auth**, **middleware**, **RLS / Supabase policies**, or **storage**.
- **Human review** is required for auth, database policies, and anything that changes who can see or write data.

### Shared rules for AI-assisted work

- **Scope** — One feature or bug per session; name files or areas to touch and what *not* to change.
- **Match the codebase** — Follow existing patterns (App Router, Server Actions, Supabase clients in `src/lib`). Avoid drive-by refactors and new dependencies unless the team agrees.
- **Product invariants** — Preserve **city-first** behavior: home feed tied to `home_city_id`, onboarding enforced in middleware, no surprise “global For You” feed unless explicitly designed.
- **Secrets** — Never commit real keys. Use `.env.local` locally; compare names to `.env.local.example`. Do not paste production credentials into chats.

### Before you merge

- Run **`npm run lint`** and **`npm run build`** (and tests if the repo has them).
- **Smoke-test** the core loop: signup → onboarding → home-city feed → explore/Passport → create post (if your branch touches those paths).
- If behavior or routes change, **update this file** in the same PR.

---

CITYGRAM is an original product identity (typography, color tokens, naming). It borrows familiar **interaction patterns** only—not proprietary branding or assets from other social apps.
