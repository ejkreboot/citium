// Preview seed data — lets the app render richly before Supabase is connected.
// Once auth + DB are wired, loaders return the same shapes from Supabase and
// this module is no longer imported by the views.

import type { Assignment, Course, ClassMeeting, Note, Term } from './types';

const U = 'demo-user';

export const COURSE_PALETTE = [
	'#5b5b8a', // iris
	'#6f8a6b', // sage
	'#c29b4a', // amber
	'#4f8288', // teal
	'#a86a86', // rose
	'#7a6cae' // violet
];

export const mockTerm: Term = {
	id: 'term-fall-2026',
	user_id: U,
	name: 'Fall 2026',
	start_date: '2026-08-25',
	end_date: '2026-12-18',
	color: '#5b5b8a'
};

export const mockSpringTerm: Term = {
	id: 'term-spring-2027',
	user_id: U,
	name: 'Spring 2027',
	start_date: '2027-01-19',
	end_date: '2027-05-07',
	color: '#4f8288'
};

// `full` runs the whole term; the half-term courses show the split in action.
const full = { session: 'full' as const, start_date: null, end_date: null };

export const mockCourses: Course[] = [
	{
		id: 'c1',
		user_id: U,
		term_id: mockTerm.id,
		title: 'Introduction to Psychology',
		code: 'PSY 101',
		instructor: 'Dr. Aria Bennett',
		location: 'Hale Hall 204',
		color: '#5b5b8a',
		...full
	},
	{
		id: 'c2',
		user_id: U,
		term_id: mockTerm.id,
		title: 'Calculus I',
		code: 'MATH 141',
		instructor: 'Prof. Nguyen',
		location: 'Science 118',
		color: '#6f8a6b',
		...full
	},
	{
		id: 'c3',
		user_id: U,
		term_id: mockTerm.id,
		title: 'World Literature',
		code: 'ENGL 120',
		instructor: 'Dr. Okafor',
		location: 'Barnard 3B',
		color: '#c29b4a',
		...full
	},
	{
		id: 'c4',
		user_id: U,
		term_id: mockTerm.id,
		title: 'General Chemistry',
		code: 'CHEM 111',
		instructor: 'Dr. Silva',
		location: 'Lab Wing 12',
		color: '#4f8288',
		...full
	},
	{
		id: 'c5',
		user_id: U,
		term_id: mockTerm.id,
		title: 'Foundations of Art History',
		code: 'ARTH 105',
		instructor: 'Prof. Lindqvist',
		location: 'Fine Arts 220',
		color: '#a86a86',
		...full
	},
	// Two seven-week seminars that share a slot, one after the other.
	{
		id: 'c6',
		user_id: U,
		term_id: mockTerm.id,
		title: 'Research Methods Workshop',
		code: 'PSY 180',
		instructor: 'Dr. Aria Bennett',
		location: 'Hale Hall 110',
		color: '#7a6cae',
		session: 'first_half',
		start_date: null,
		end_date: null
	},
	{
		id: 'c7',
		user_id: U,
		term_id: mockTerm.id,
		title: 'Statistics for Psychology',
		code: 'PSY 181',
		instructor: 'Prof. Adeyemi',
		location: 'Hale Hall 110',
		color: '#c29b4a',
		session: 'second_half',
		start_date: null,
		end_date: null
	}
];

// Weekly meeting patterns: 1=Mon … 5=Fri
export const mockMeetings: ClassMeeting[] = [
	// PSY 101 — MWF 9:00
	{ id: 'm1', user_id: U, course_id: 'c1', day_of_week: 1, start_time: '09:00', end_time: '09:50' },
	{ id: 'm2', user_id: U, course_id: 'c1', day_of_week: 3, start_time: '09:00', end_time: '09:50' },
	{ id: 'm3', user_id: U, course_id: 'c1', day_of_week: 5, start_time: '09:00', end_time: '09:50' },
	// MATH 141 — MWF 11:00
	{ id: 'm4', user_id: U, course_id: 'c2', day_of_week: 1, start_time: '11:00', end_time: '11:50' },
	{ id: 'm5', user_id: U, course_id: 'c2', day_of_week: 3, start_time: '11:00', end_time: '11:50' },
	{ id: 'm6', user_id: U, course_id: 'c2', day_of_week: 5, start_time: '11:00', end_time: '11:50' },
	// ENGL 120 — TTh 13:00
	{ id: 'm7', user_id: U, course_id: 'c3', day_of_week: 2, start_time: '13:00', end_time: '14:15' },
	{ id: 'm8', user_id: U, course_id: 'c3', day_of_week: 4, start_time: '13:00', end_time: '14:15' },
	// CHEM 111 — TTh 10:00 + Thu lab 14:30
	{ id: 'm9', user_id: U, course_id: 'c4', day_of_week: 2, start_time: '10:00', end_time: '11:15' },
	{
		id: 'm10',
		user_id: U,
		course_id: 'c4',
		day_of_week: 4,
		start_time: '10:00',
		end_time: '11:15'
	},
	{
		id: 'm11',
		user_id: U,
		course_id: 'c4',
		day_of_week: 4,
		start_time: '14:30',
		end_time: '16:20'
	},
	// ARTH 105 — MW 15:00
	{
		id: 'm12',
		user_id: U,
		course_id: 'c5',
		day_of_week: 1,
		start_time: '15:00',
		end_time: '16:15'
	},
	{
		id: 'm13',
		user_id: U,
		course_id: 'c5',
		day_of_week: 3,
		start_time: '15:00',
		end_time: '16:15'
	},
	// PSY 180 / PSY 181 — Tue 15:30, back-to-back halves of the term
	{
		id: 'm14',
		user_id: U,
		course_id: 'c6',
		day_of_week: 2,
		start_time: '15:30',
		end_time: '17:00'
	},
	{ id: 'm15', user_id: U, course_id: 'c7', day_of_week: 2, start_time: '15:30', end_time: '17:00' }
];

export const mockAssignments: Assignment[] = [
	{
		id: 'a1',
		user_id: U,
		course_id: 'c2',
		title: 'Problem Set 1',
		notes: 'Sections 1.1–1.4',
		due_at: '2026-09-04T23:59:00',
		status: 'todo',
		priority: 1
	},
	{
		id: 'a2',
		user_id: U,
		course_id: 'c1',
		title: 'Reading response: Chapter 2',
		notes: null,
		due_at: '2026-09-02T09:00:00',
		status: 'doing',
		priority: 0
	},
	{
		id: 'a3',
		user_id: U,
		course_id: 'c3',
		title: 'Close reading essay',
		notes: 'The Odyssey, Books 9–12',
		due_at: '2026-09-15T13:00:00',
		status: 'todo',
		priority: 0
	},
	{
		id: 'a4',
		user_id: U,
		course_id: 'c4',
		title: 'Lab report — Titration',
		notes: null,
		due_at: '2026-09-10T14:30:00',
		status: 'todo',
		priority: 0
	},
	{
		id: 'a5',
		user_id: U,
		course_id: 'c5',
		title: 'Museum visit reflection',
		notes: '2 pages, any local gallery',
		due_at: '2026-09-25T23:59:00',
		status: 'todo',
		priority: 0
	},
	{
		id: 'a6',
		user_id: U,
		course_id: 'c2',
		title: 'Problem Set 2',
		notes: null,
		due_at: '2026-09-18T23:59:00',
		status: 'todo',
		priority: 0
	},
	{
		id: 'a7',
		user_id: U,
		course_id: 'c1',
		title: 'Study for Quiz 1',
		notes: 'Chapters 1–3',
		due_at: '2026-09-09T09:00:00',
		status: 'todo',
		priority: 1
	}
];

export const mockNotes: Note[] = [
	{
		id: 'n1',
		user_id: U,
		content: 'Buy the MATH 141 course packet from the campus store',
		pinned: true,
		updated_at: '2026-08-20T10:00:00'
	},
	{
		id: 'n2',
		user_id: U,
		content: 'Office hours: Dr. Bennett — Tue 2–4pm, Hale 210',
		pinned: false,
		updated_at: '2026-08-21T10:00:00'
	},
	{
		id: 'n3',
		user_id: U,
		content: 'Ask about the writing center for the ENGL essay',
		pinned: false,
		updated_at: '2026-08-22T10:00:00'
	}
];

export const mockData = {
	term: mockTerm,
	terms: [mockTerm, mockSpringTerm],
	courses: mockCourses,
	meetings: mockMeetings,
	assignments: mockAssignments,
	notes: mockNotes
};
