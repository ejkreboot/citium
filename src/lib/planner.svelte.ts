// Central reactive store for planner data (Svelte 5 runes).
//
// Mutations update local state optimistically and, when connected to Supabase,
// persist in the background. RLS scopes every row to the signed-in user, and we
// generate UUIDs client-side so local and remote ids match.

import type { SupabaseClient, User } from '@supabase/supabase-js';
import type {
	Assignment,
	AssignmentStatus,
	ClassMeeting,
	Course,
	Note,
	Term
} from './types';

function uid(): string {
	return typeof crypto !== 'undefined' && crypto.randomUUID
		? crypto.randomUUID()
		: 'id-' + Math.floor(performance.now() * 1000).toString(36);
}

export interface SeedData {
	terms: Term[];
	courses: Course[];
	meetings: ClassMeeting[];
	assignments: Assignment[];
	notes: Note[];
}

class Planner {
	terms = $state<Term[]>([]);
	courses = $state<Course[]>([]);
	meetings = $state<ClassMeeting[]>([]);
	assignments = $state<Assignment[]>([]);
	notes = $state<Note[]>([]);
	userId = $state<string>('demo-user');
	seeded = $state(false);

	private client: SupabaseClient | null = null;
	private noteTimers = new Map<string, ReturnType<typeof setTimeout>>();

	connect(client: SupabaseClient | null, user: User | null) {
		this.client = client;
		if (user) this.userId = user.id;
	}

	seed(data: SeedData, userId = 'demo-user') {
		this.terms = data.terms;
		this.courses = data.courses;
		this.meetings = data.meetings;
		this.assignments = data.assignments;
		this.notes = data.notes;
		this.userId = userId;
		this.seeded = true;
	}

	private async run(op: PromiseLike<{ error: unknown }> | undefined, label: string) {
		if (!this.client || !op) return;
		const { error } = await op;
		if (error) console.error(`[planner] ${label} failed:`, error);
	}

	courseById(id: string | null): Course | undefined {
		if (!id) return undefined;
		return this.courses.find((c) => c.id === id);
	}

	get activeTerm(): Term | undefined {
		const today = new Date().toISOString().slice(0, 10);
		return this.terms.find((t) => t.start_date <= today && today <= t.end_date) ?? this.terms[0];
	}

	// --- Assignments ---
	addAssignment(input: {
		title: string;
		course_id: string | null;
		due_at: string;
		notes?: string | null;
		priority?: number;
	}): Assignment {
		const a: Assignment = {
			id: uid(),
			user_id: this.userId,
			course_id: input.course_id,
			title: input.title,
			notes: input.notes ?? null,
			due_at: input.due_at,
			status: 'todo',
			priority: input.priority ?? 0
		};
		this.assignments = [...this.assignments, a];
		this.run(this.client?.from('assignments').insert(a), 'addAssignment');
		return a;
	}

	updateAssignment(id: string, patch: Partial<Assignment>) {
		this.assignments = this.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a));
		this.run(this.client?.from('assignments').update(patch).eq('id', id), 'updateAssignment');
	}

	cycleStatus(id: string) {
		const order: AssignmentStatus[] = ['todo', 'doing', 'done'];
		const a = this.assignments.find((x) => x.id === id);
		if (!a) return;
		const next = order[(order.indexOf(a.status) + 1) % order.length];
		this.updateAssignment(id, { status: next });
	}

	removeAssignment(id: string) {
		this.assignments = this.assignments.filter((a) => a.id !== id);
		this.run(this.client?.from('assignments').delete().eq('id', id), 'removeAssignment');
	}

	// --- Notes ---
	addNote(content = ''): Note {
		const n: Note = {
			id: uid(),
			user_id: this.userId,
			content,
			pinned: false,
			updated_at: new Date().toISOString()
		};
		this.notes = [n, ...this.notes];
		this.run(this.client?.from('notes').insert(n), 'addNote');
		return n;
	}

	updateNote(id: string, content: string) {
		const updated_at = new Date().toISOString();
		this.notes = this.notes.map((n) => (n.id === id ? { ...n, content, updated_at } : n));
		// Debounce DB writes while typing.
		clearTimeout(this.noteTimers.get(id));
		this.noteTimers.set(
			id,
			setTimeout(() => {
				this.run(
					this.client?.from('notes').update({ content, updated_at }).eq('id', id),
					'updateNote'
				);
			}, 600)
		);
	}

	togglePin(id: string) {
		const note = this.notes.find((n) => n.id === id);
		if (!note) return;
		const pinned = !note.pinned;
		this.notes = this.notes.map((n) => (n.id === id ? { ...n, pinned } : n));
		this.run(this.client?.from('notes').update({ pinned }).eq('id', id), 'togglePin');
	}

	removeNote(id: string) {
		this.notes = this.notes.filter((n) => n.id !== id);
		this.run(this.client?.from('notes').delete().eq('id', id), 'removeNote');
	}

	// --- Courses & terms ---
	addTerm(input: Omit<Term, 'id' | 'user_id'>): Term {
		const t: Term = { ...input, id: uid(), user_id: this.userId };
		this.terms = [...this.terms, t];
		this.run(this.client?.from('terms').insert(t), 'addTerm');
		return t;
	}

	updateTerm(id: string, patch: Partial<Term>) {
		this.terms = this.terms.map((t) => (t.id === id ? { ...t, ...patch } : t));
		this.run(this.client?.from('terms').update(patch).eq('id', id), 'updateTerm');
	}

	addCourse(input: Omit<Course, 'id' | 'user_id'>): Course {
		const c: Course = { ...input, id: uid(), user_id: this.userId };
		this.courses = [...this.courses, c];
		this.run(this.client?.from('courses').insert(c), 'addCourse');
		return c;
	}

	updateCourse(id: string, patch: Partial<Course>) {
		this.courses = this.courses.map((c) => (c.id === id ? { ...c, ...patch } : c));
		this.run(this.client?.from('courses').update(patch).eq('id', id), 'updateCourse');
	}

	removeCourse(id: string) {
		this.courses = this.courses.filter((c) => c.id !== id);
		this.meetings = this.meetings.filter((m) => m.course_id !== id);
		// class_meetings cascade-delete in the DB via FK.
		this.run(this.client?.from('courses').delete().eq('id', id), 'removeCourse');
	}

	async setMeetings(
		courseId: string,
		meetings: Array<Omit<ClassMeeting, 'id' | 'user_id' | 'course_id'>>
	) {
		const others = this.meetings.filter((m) => m.course_id !== courseId);
		const next: ClassMeeting[] = meetings.map((m) => ({
			...m,
			id: uid(),
			user_id: this.userId,
			course_id: courseId
		}));
		this.meetings = [...others, ...next];

		if (this.client) {
			await this.run(
				this.client.from('class_meetings').delete().eq('course_id', courseId),
				'setMeetings:delete'
			);
			if (next.length) {
				await this.run(this.client.from('class_meetings').insert(next), 'setMeetings:insert');
			}
		}
	}

	meetingsFor(courseId: string): ClassMeeting[] {
		return this.meetings.filter((m) => m.course_id === courseId);
	}
}

export const planner = new Planner();
