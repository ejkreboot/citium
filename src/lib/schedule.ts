// Expand recurring weekly class meetings into concrete dated occurrences over a
// range, bounded by each course's term. No per-occurrence rows are stored.

import type { ClassMeeting, ClassOccurrence, Course, DateRange, Term } from './types';
import {
	addDays,
	dayKey,
	daysBetween,
	formatDayKey,
	formatTime,
	minutesOf,
	parseDay
} from './date';

interface ScheduleData {
	courses: Course[];
	meetings: ClassMeeting[];
	terms: Term[];
}

/**
 * Where a term splits into halves. The first half absorbs the odd day of an
 * odd-length term, so a 15-week term is 8 + 7.
 */
export function halfTermBoundary(term: Term): { firstEnd: string; secondStart: string } {
	const start = parseDay(term.start_date);
	const total = daysBetween(start, parseDay(term.end_date)) + 1;
	const firstEnd = addDays(start, Math.max(0, Math.ceil(total / 2) - 1));
	return { firstEnd: dayKey(firstEnd), secondStart: dayKey(addDays(firstEnd, 1)) };
}

/**
 * The inclusive dates a course actually meets, or null when it is unbounded
 * (no term and no custom dates — such a course recurs indefinitely).
 *
 * Every result is clamped to the term, so a custom range that overhangs the
 * term is trimmed rather than escaping it. A clamp that inverts the range
 * (start > end) matches no dates, which is the intended "meets never".
 */
export function courseRange(course: Course, term: Term | undefined): DateRange | null {
	const custom =
		course.start_date && course.end_date
			? { start: course.start_date, end: course.end_date }
			: null;

	if (!term) return course.session === 'custom' ? custom : null;

	const full: DateRange = { start: term.start_date, end: term.end_date };
	let range: DateRange;
	switch (course.session) {
		case 'first_half':
			range = { start: full.start, end: halfTermBoundary(term).firstEnd };
			break;
		case 'second_half':
			range = { start: halfTermBoundary(term).secondStart, end: full.end };
			break;
		case 'custom':
			range = custom ?? full;
			break;
		default:
			range = full;
	}

	return {
		start: range.start > full.start ? range.start : full.start,
		end: range.end < full.end ? range.end : full.end
	};
}

/** Occurrences between `from` and `to` (inclusive), sorted by date then start. */
export function expandOccurrences(
	from: Date,
	to: Date,
	{ courses, meetings, terms }: ScheduleData
): ClassOccurrence[] {
	const courseById = new Map(courses.map((c) => [c.id, c]));
	const termById = new Map(terms.map((t) => [t.id, t]));
	// Resolve each course's bounds once rather than per candidate day.
	const rangeByCourse = new Map(
		courses.map((c) => [c.id, courseRange(c, c.term_id ? termById.get(c.term_id) : undefined)])
	);
	const out: ClassOccurrence[] = [];

	for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
		const key = dayKey(d);
		const dow = d.getDay();
		for (const m of meetings) {
			if (m.day_of_week !== dow) continue;
			const course = courseById.get(m.course_id);
			if (!course) continue;
			const range = rangeByCourse.get(course.id);
			if (range && (key < range.start || key > range.end)) continue;
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

/** Badge text for a partial-term course; null when it runs the whole term. */
export function sessionLabel(course: Course): string | null {
	switch (course.session) {
		case 'first_half':
			return 'First half';
		case 'second_half':
			return 'Second half';
		case 'custom':
			return 'Custom dates';
		default:
			return null;
	}
}

/** "Aug 25 – Oct 20" for a course's effective range, or null when unbounded. */
export function rangeLabel(range: DateRange | null): string | null {
	if (!range) return null;
	if (range.start > range.end) return 'No meeting dates';
	return `${formatDayKey(range.start)} – ${formatDayKey(range.end)}`;
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
