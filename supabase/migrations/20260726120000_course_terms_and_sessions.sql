-- Course/term assignment + half-term (session) support.
--
-- `courses.term_id` already existed; this migration adds the session model that
-- lets a course run for only part of its term, and indexes the term lookup that
-- schedule expansion now performs for every course.

alter table public.courses
	add column session text not null default 'full'
		check (session in ('full', 'first_half', 'second_half', 'custom')),
	add column start_date date,
	add column end_date date;

-- Custom sessions must carry a well-formed range; the other sessions derive
-- their range from the term and leave these columns null.
alter table public.courses
	add constraint courses_custom_range_ck check (
		session <> 'custom'
		or (start_date is not null and end_date is not null and start_date <= end_date)
	);

create index courses_term_idx on public.courses (term_id);

-- Terms are read on every schedule expansion; keep the per-user scan cheap.
create index terms_user_idx on public.terms (user_id, start_date);

-- Guard against inverted term ranges, which would silently hide every class in
-- the term (a course range clamped to an inverted term matches no dates).
alter table public.terms
	add constraint terms_range_ck check (start_date <= end_date);
