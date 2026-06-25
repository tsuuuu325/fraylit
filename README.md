# Fraylit

A creative-writing social platform where stories live as fragments — their **beginnings & endings**, or the single **plot twist** that turns everything.

Built with **Next.js (App Router)** + **Tailwind CSS** + **Supabase** (auth, database, realtime), fully typed in **TypeScript**, internationalized with **next-intl** (7 languages), and ready to deploy on **Vercel**.

---

## Features

- **Public timeline** — anyone can read; writing requires an account.
- **Two post modes**
  - *Opening & Closing* — the first and last lines of a story (max 2 sentences each).
  - *Plot Twist* — the one or two lines where everything changes.
- **Auth** — email/password + Google OAuth (Supabase Auth).
- **Profiles** — avatar, display name, bio, and a feed of the user's posts. Owners can edit.
- **Likes** (optimistic UI) and **comments**, gated behind login but visible to everyone.
- **i18n** — English (default) + 日本語, Español, Français, Deutsch, 한국어, 中文. Language switcher in the navbar; only UI is translated, never user content.
- **Literary dark aesthetic** — Playfair Display for prose, Inter for UI.
- **Row Level Security** — read-for-all, write-your-own enforced in Postgres.

---

## Tech stack

| Layer    | Choice |
| -------- | ------ |
| Framework | Next.js 15 (App Router, React 19) |
| Styling  | Tailwind CSS v3 |
| Backend  | Supabase (Postgres + Auth + Realtime) |
| i18n     | next-intl v4 (cookie-based, clean URLs) |
| Language | TypeScript |
| Hosting  | Vercel |

---

## Getting started

### 1. Prerequisites

- Node.js 18.18+ (Node 20 LTS recommended)
- A free [Supabase](https://supabase.com) project

### 2. Install dependencies

```bash
npm install
```

### 3. Configure the database

In the Supabase dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/schema.sql
```

This creates the `profiles`, `posts`, `likes`, and `comments` tables, the `post_mode` enum, all RLS policies, a trigger that auto-creates a profile on signup, and enables realtime.

### 4. Configure authentication

In Supabase → **Authentication → Providers**:

- **Email**: enabled by default. (For instant login during local dev you may disable "Confirm email".)
- **Google**: enable it and add your Google OAuth client ID/secret.

In Supabase → **Authentication → URL Configuration**, add redirect URLs:

```
http://localhost:3000/auth/callback
https://YOUR-DOMAIN.vercel.app/auth/callback
```

### 5. Environment variables

Copy the example and fill in values from Supabase → **Project Settings → API**:

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add the three environment variables in the Vercel project settings.
   Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g. `https://fraylit.vercel.app`).
3. Add the production `/auth/callback` URL to Supabase's redirect allow-list (step 4).
4. Deploy.

---

## Project structure

```
messages/                 # Translation files (en, ja, es, fr, de, ko, zh)
supabase/schema.sql       # Database schema + RLS + triggers
src/
  app/
    page.tsx              # Timeline (public)
    create/               # Post creation (login required)
    login/ signup/        # Auth pages
    profile/[username]/   # Public profiles
    auth/callback/        # OAuth / email-confirm handler
  components/             # Navbar, PostCard, LikeButton, CommentSection, …
  i18n/                   # next-intl config, request, locale action
  lib/
    supabase/             # Browser / server / middleware clients
    queries.ts            # Typed data access
    validation.ts         # Sentence + character + username rules
    types.ts              # App-level types
  middleware.ts           # Refreshes Supabase session cookies
```

---

## Validation rules

- Opening / closing / twist lines: **max 2 sentences**, **max 300 characters** each.
- Comments: **max 500 characters**.
- Username: **3–20 characters**, letters / numbers / underscores only.

These are enforced client-side (live counters) and in the database (CHECK constraints).
