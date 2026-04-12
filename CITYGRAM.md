# CITYGRAM

City-first social: your **home city** is the default world. Everything else is an intentional trip.

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run SQL**  
   - Execute `supabase/migrations/001_citygram_schema.sql` in the SQL editor (or Supabase CLI).  
   - Run `supabase/seed.sql` for three pilot cities (Atlanta, Austin, Portland), neighborhoods, and interests.  
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
| `/` | Landing |
| `/login`, `/signup`, `/forgot-password` | Auth |
| `/onboarding` | Home city + interests (required before app) |
| `/feed` | **Home city feed only** |
| `/explore` | Browse other cities (Passport entry) |
| `/passport`, `/passport/[slug]` | Passport Mode — another city’s feed |
| `/city/[slug]` | City pulse (trending, businesses, events) |
| `/create` | Create post (storage upload) |
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
- Profiles with grid, saved (self), tagged (data-ready; tagging UI is future).
- Notifications for follow, like, comment (inserted from server actions).
- Reports + basic admin remove for moderators/admins.
- Creator/business **placeholders** (`account_type`, `creator_profiles`, `business_profiles`, sponsored flag on posts, events table).

## V2 / future work (explicitly not pretending to be done)

- Rich push notifications, email digests, SMS.
- Real geo “nearby cities” ranking (currently honest pilot copy).
- Mention/tag UI for people in posts (`post_tagged_profiles` is ready).
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

---

CITYGRAM is an original product identity (typography, color tokens, naming). It borrows familiar **interaction patterns** only—not proprietary branding or assets from other social apps.
