// Domain types for Citium. These mirror the Supabase schema (snake_case columns)
// so rows returned by supabase-js can be used directly.

export type UUID = string;

export interface Profile {
	id: UUID;
	display_name: string | null;
	week_starts_on: number; // 0 = Sunday, 1 = Monday
	theme: 'light' | 'dark' | 'system';
}

export interface Term {
	id: UUID;
	user_id: UUID;
	name: string;
	start_date: string; // ISO date (YYYY-MM-DD)
	end_date: string;
	color: string; // hex
}

export interface Course {
	id: UUID;
	user_id: UUID;
	term_id: UUID | null;
	title: string;
	code: string | null;
	instructor: string | null;
	location: string | null;
	color: string; // hex — used across schedule + homework
}

export interface ClassMeeting {
	id: UUID;
	user_id: UUID;
	course_id: UUID;
	day_of_week: number; // 0 = Sunday … 6 = Saturday
	start_time: string; // "HH:MM"
	end_time: string; // "HH:MM"
}

export type AssignmentStatus = 'todo' | 'doing' | 'done';

export interface Assignment {
	id: UUID;
	user_id: UUID;
	course_id: UUID | null;
	title: string;
	notes: string | null;
	due_at: string; // ISO timestamptz
	status: AssignmentStatus;
	priority: number; // 0 normal, 1 high
}

export interface Note {
	id: UUID;
	user_id: UUID;
	content: string;
	pinned: boolean;
	updated_at: string;
}

// A concrete occurrence of a recurring class meeting on a specific date,
// expanded client-side from ClassMeeting + Term bounds.
export interface ClassOccurrence {
	meeting: ClassMeeting;
	course: Course;
	date: string; // YYYY-MM-DD
	start: string; // "HH:MM"
	end: string; // "HH:MM"
}
