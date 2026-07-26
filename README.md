# Citium

A calm academic planner — schedule (year / month / day), homework tracker, a
scratchpad, and a daily inspiring thought. Built with SvelteKit + Supabase.

- **Framework:** SvelteKit (Svelte 5 runes), Vite
- **Backend:** Supabase (Postgres + Auth), row-level security per user
- **Auth:** passwordless email OTP (6-digit code); first-time users are created automatically
- **Design:** Google Fonts (Fraunces / Inter / IBM Plex Mono) + Material Symbols, light & dark

## Features

- **Today** — greeting, thought of the day, today's classes, next homework, pinned notes
- **Schedule** — Year (an "almanac" with term bands + a workload heatmap), Month, and Day views
- **Homework** — grouped by Overdue / Upcoming / Completed, course filters, one-tap status
- **Notes** — sticky-note scratchpad with autosave and pinning
- **Courses** — simple weekly-meeting entry (tap the days that share a time, e.g. "MWF 9:00")

## Local development

```sh
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable key
npm run dev
```

Open http://localhost:5180.

Environment variables (`.env.local`):

| Variable | Where to find it |
| --- | --- |
| `PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API |
| `PUBLIC_SUPABASE_ANON_KEY` | Same page — the publishable / anon key (browser-safe) |

## Database

The schema lives in `supabase/migrations/`. To apply it to a Supabase project:

```sh
supabase link --project-ref <your-project-ref>
supabase db push
supabase config push   # applies auth settings + the OTP email template
```

The email template (`supabase/templates/magic_link.html`) shows a 6-digit code so
sign-in is code-entry rather than a magic link.

## Deploy (Vercel)

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new)
   (or run `npx vercel` from this folder).
2. Set the two `PUBLIC_SUPABASE_*` env vars in the Vercel project.
3. After the first deploy, add your production URL to Supabase → Authentication →
   URL Configuration (**Site URL** + **Redirect URLs**), or update `site_url` in
   `supabase/config.toml` and run `supabase config push`.

The app uses `@sveltejs/adapter-vercel`; no extra Vercel config is required.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 5180 |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check with `svelte-check` |
| `npm run lint` / `npm run format` | Prettier + ESLint |
