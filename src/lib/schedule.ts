// Expand recurring weekly class meetings into concrete dated occurrences over a
// range, bounded by each course's term. No per-occurrence rows are stored.

import type { ClassMeeting, ClassOccurrence, Course, Term } from './types';
import { addDays, dayKey, formatTime, minutesOf, parseDay } from './date';

interface ScheduleData {
	courses: Course[];
	meetings: ClassMeeting[];
	terms: Term[];
}

/** Occurrences between `from` and `to` (inclusive), sorted by date then start. */
export function expandOccurrences(
	from: Date,
	to: Date,
	{ courses, meetings, terms }: ScheduleData
): ClassOccurrence[] {
	const courseById = new Map(courses.map((c) => [c.id, c]));
	const termById = new Map(terms.map((t) => [t.id, t]));
	const out: ClassOccurrence[] = [];

	for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
		const key = dayKey(d);
		const dow = d.getDay();
		for (const m of meetings) {
			if (m.day_of_week !== dow) continue;
			const course = courseById.get(m.course_id);
			if (!course) continue;
			// Respect term bounds when the course belongs to a term.
			if (course.term_id) {
				const term = termById.get(course.term_id);
				if (term && (key < term.start_date || key > term.end_date)) continue;
			}
			out.push({ meeting: m, course, date: key, start: m.start_time, end: m.end_time });
		}
	}

	out.sort((a, b) => a.date.localeCompare(b.date) || minutesOf(a.start) - minutesOf(b.start));
	return out;
}

/** Occurrences for a single day. */
export function occurrencesOn(date: Date, data: ScheduleData): ClassOccurrence[] {
	return expandOccurrences(date, date, data);
}

/** Whether any class meets on the given weekday within its term for a date. */
export function hasClassOn(key: string, data: ScheduleData): boolean {
	const d = parseDay(key);
	return occurrencesOn(d, data).length > 0;
}

const DAY_LETTER = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa'];

/** Human summary of a course's weekly meetings, e.g. "MWF 9:00–9:50 AM". */
export function meetingSummary(meetings: ClassMeeting[]): string[] {
	const groups = new Map<string, number[]>();
	for (const m of [...meetings].sort((a, b) => a.day_of_week - b.day_of_week)) {
		const key = `${m.start_time}|${m.end_time}`;
		if (!groups.has(key)) groups.set(key, []);
		groups.get(key)!.push(m.day_of_week);
	}
	return [...groups.entries()].map(([key, days]) => {
		const [start, end] = key.split('|');
		const dayStr = days.map((d) => DAY_LETTER[d]).join('');
		return `${dayStr} ${formatTime(start)}–${formatTime(end)}`;
	});
}
