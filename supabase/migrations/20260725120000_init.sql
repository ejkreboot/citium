-- Calia — initial schema
-- Every table lives in the exposed `public` schema, so RLS is enabled on all of
-- them and scoped to the owning user via auth.uid(). Policies use `TO
-- authenticated` + an ownership predicate, and every UPDATE carries WITH CHECK.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, auto-created on sign-up
-- ---------------------------------------------------------------------------
create table public.profiles (
	id uuid primary key references auth.users (id) on delete cascade,
	display_name text,
	week_starts_on smallint not null default 0 check (week_starts_on in (0, 1)),
	theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
	created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
	for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: insert own" on public.profiles
	for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: update own" on public.profiles
	for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Auto-create a profile whenever a new auth user is created.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
	insert into public.profiles (id, display_name)
	values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
	return new;
end;
$$;

create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- terms
-- ---------------------------------------------------------------------------
create table public.terms (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	name text not null,
	start_date date not null,
	end_date date not null,
	color text not null default '#5b5b8a',
	created_at timestamptz not null default now()
);

alter table public.terms enable row level security;

create policy "terms: read own" on public.terms
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "terms: insert own" on public.terms
	for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "terms: update own" on public.terms
	for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "terms: delete own" on public.terms
	for delete to authenticated using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
create table public.courses (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	term_id uuid references public.terms (id) on delete set null,
	title text not null,
	code text,
	instructor text,
	location text,
	color text not null default '#5b5b8a',
	created_at timestamptz not null default now()
);

alter table public.courses enable row level security;

create policy "courses: read own" on public.courses
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "courses: insert own" on public.courses
	for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "courses: update own" on public.courses
	for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "courses: delete own" on public.courses
	for delete to authenticated using ((select auth.uid()) = user_id);

create index courses_user_idx on public.courses (user_id);

-- ---------------------------------------------------------------------------
-- class_meetings: recurring weekly meeting for a course
-- ---------------------------------------------------------------------------
create table public.class_meetings (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	course_id uuid not null references public.courses (id) on delete cascade,
	day_of_week smallint not null check (day_of_week between 0 and 6),
	start_time time not null,
	end_time time not null
);

alter table public.class_meetings enable row level security;

create policy "meetings: read own" on public.class_meetings
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "meetings: insert own" on public.class_meetings
	for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "meetings: update own" on public.class_meetings
	for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "meetings: delete own" on public.class_meetings
	for delete to authenticated using ((select auth.uid()) = user_id);

create index meetings_course_idx on public.class_meetings (course_id);

-- ---------------------------------------------------------------------------
-- assignments (homework)
-- ---------------------------------------------------------------------------
create table public.assignments (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	course_id uuid references public.courses (id) on delete set null,
	title text not null,
	notes text,
	due_at timestamptz not null,
	status text not null default 'todo' check (status in ('todo', 'doing', 'done')),
	priority smallint not null default 0,
	created_at timestamptz not null default now()
);

alter table public.assignments enable row level security;

create policy "assignments: read own" on public.assignments
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "assignments: insert own" on public.assignments
	for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "assignments: update own" on public.assignments
	for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "assignments: delete own" on public.assignments
	for delete to authenticated using ((select auth.uid()) = user_id);

create index assignments_user_due_idx on public.assignments (user_id, due_at);

-- ---------------------------------------------------------------------------
-- notes (scratchpad)
-- ---------------------------------------------------------------------------
create table public.notes (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
	content text not null default '',
	pinned boolean not null default false,
	updated_at timestamptz not null default now()
);

alter table public.notes enable row level security;

create policy "notes: read own" on public.notes
	for select to authenticated using ((select auth.uid()) = user_id);
create policy "notes: insert own" on public.notes
	for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "notes: update own" on public.notes
	for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "notes: delete own" on public.notes
	for delete to authenticated using ((select auth.uid()) = user_id);

create index notes_user_idx on public.notes (user_id);
