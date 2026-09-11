# Citium Agent Guide

Citium is a SvelteKit academic planner using Svelte 5 runes, Supabase Postgres/Auth, and Vercel deployment. See [README.md](README.md) for local setup, database deployment, and environment variables.

## Validate Changes

- Run `npm run check` after TypeScript, Svelte, route, or store changes.
- Run `npm run lint` before finishing changes that affect source or configuration.
- Use `npm run dev` for local UI work; it runs on port 5180.

## Application Conventions

- Runes mode is enforced project-wide. Use Svelte 5 rune patterns, not legacy component reactivity.
- Keep authenticated application pages under `src/routes/(app)/`; authentication flows belong in `src/routes/(auth)/`.
- Use the Supabase clients created in server hooks and root layouts. On the server, obtain the validated user through `event.locals.safeGetSession()` rather than trusting `getSession()` alone.
- Domain row interfaces in `src/lib/types.ts` intentionally mirror Supabase column names in `snake_case`.
- Planner data is owned by the request-scoped store in `src/lib/planner.svelte.ts`. Access it through its context helpers; never make it a module singleton, which can leak SSR state between users.
- The planner applies optimistic local updates and persists them in the background. Keep new mutations consistent with that model and preserve client-generated IDs where relevant.

## Database Changes

- Add schema changes as new timestamped SQL migrations in `supabase/migrations/`; do not alter applied migrations.
- Enable RLS for every user-owned table. Policies must scope access to `auth.uid()`, and user-owned updates must include an ownership `WITH CHECK` predicate.
- Update the matching interfaces and planner queries/mutations whenever a migration changes a public row shape.
- Use only browser-safe `PUBLIC_SUPABASE_*` variables in client code; never add service-role credentials to the app.

## UI Boundaries

- Put reusable domain UI in `src/lib/components/`; keep route files focused on page composition and route loading.
- Preserve the established calm planner design and existing font/icon approach rather than introducing a second design system.
