-- Tests share assignment completion behavior, while study sessions are
-- scheduled one-off time blocks rather than recurring course meetings.

alter table public.assignments
	add column kind text not null default 'homework'
		check (kind in ('homework', 'test'));

create table public.study_sessions (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	course_id uuid references public.courses (id) on delete set null,
	title text not null,
	notes text,
	starts_at timestamptz not null,
	ends_at timestamptz not null,
	created_at timestamptz not null default now(),
	constraint study_sessions_time_range_ck check (starts_at < ends_at)
);

alter table public.study_sessions enable row level security;

create policy "study sessions: read own" on public.study_sessions
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "study sessions: insert own" on public.study_sessions
	for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "study sessions: update own" on public.study_sessions
	for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "study sessions: delete own" on public.study_sessions
	for delete to authenticated using ((select auth.uid()) = user_id);

create index study_sessions_user_time_idx on public.study_sessions (user_id, starts_at);