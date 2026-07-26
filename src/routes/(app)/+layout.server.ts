import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session, user } = await safeGetSession();
	if (!session || !user) redirect(303, '/login');

	const [terms, courses, meetings, assignments, notes] = await Promise.all([
		supabase.from('terms').select('*').order('start_date', { ascending: true }),
		supabase.from('courses').select('*').order('created_at', { ascending: true }),
		supabase.from('class_meetings').select('*'),
		supabase.from('assignments').select('*').order('due_at', { ascending: true }),
		supabase.from('notes').select('*').order('updated_at', { ascending: false })
	]);

	return {
		terms: terms.data ?? [],
		courses: courses.data ?? [],
		meetings: meetings.data ?? [],
		assignments: assignments.data ?? [],
		notes: notes.data ?? []
	};
};
