import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

/**
 * How far back to load dated rows. Everything fetched here is held in memory by
 * the client store for the whole session, so an account that has been active for
 * years would otherwise ship its entire history on every page load.
 *
 * The window only trims the past — all future work is always loaded — and a year
 * is wide enough to keep overdue assignments and the year view intact.
 */
const HISTORY_DAYS = 365;

/** Backstops, not expected to bind at realistic volumes. */
const ASSIGNMENT_LIMIT = 2000;
const NOTE_LIMIT = 500;

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const since = new Date();
	since.setDate(since.getDate() - HISTORY_DAYS);

	const [terms, courses, meetings, assignments, notes] = await Promise.all([
		// Structural tables grow only as fast as courses are taken, and the
		// schedule is wrong if a course's meetings are partially loaded — so these
		// stay complete.
		supabase.from('terms').select('*').order('start_date', { ascending: true }),
		supabase.from('courses').select('*').order('created_at', { ascending: true }),
		supabase.from('class_meetings').select('*'),
		// Uses assignments_user_due_idx (user_id, due_at).
		supabase
			.from('assignments')
			.select('*')
			.gte('due_at', since.toISOString())
			.order('due_at', { ascending: true })
			.limit(ASSIGNMENT_LIMIT),
		// Pinned first so a pinned-but-stale note can never fall outside the limit.
		supabase
			.from('notes')
			.select('*')
			.order('pinned', { ascending: false })
			.order('updated_at', { ascending: false })
			.limit(NOTE_LIMIT)
	]);

	return {
		terms: terms.data ?? [],
		courses: courses.data ?? [],
		meetings: meetings.data ?? [],
		assignments: assignments.data ?? [],
		notes: notes.data ?? []
	};
};
