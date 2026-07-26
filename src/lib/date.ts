// Small, dependency-free date helpers. All "day keys" are local YYYY-MM-DD
// strings so they compare cleanly and avoid timezone drift.

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAYS_LONG = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];
export const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December'
];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

/** Local YYYY-MM-DD for a Date. */
export function dayKey(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
export function parseDay(key: string): Date {
	const [y, m, d] = key.split('-').map(Number);
	return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
	const r = new Date(d);
	r.setDate(r.getDate() + n);
	return r;
}

export function addMonths(d: Date, n: number): Date {
	const r = new Date(d);
	r.setMonth(r.getMonth() + n);
	return r;
}

export function startOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
	return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

export function isSameDay(a: Date, b: Date): boolean {
	return dayKey(a) === dayKey(b);
}

export function isToday(key: string): boolean {
	return key === dayKey(new Date());
}

/** Days in a month as Date objects. */
export function monthDays(year: number, month: number): Date[] {
	const days: Date[] = [];
	const last = new Date(year, month + 1, 0).getDate();
	for (let i = 1; i <= last; i++) days.push(new Date(year, month, i));
	return days;
}

/**
 * Build a 6-row calendar grid (42 cells) for a month, honoring weekStart.
 * Returns Date objects including leading/trailing days from adjacent months.
 */
export function calendarGrid(year: number, month: number, weekStart = 0): Date[] {
	const first = new Date(year, month, 1);
	const offset = (first.getDay() - weekStart + 7) % 7;
	const start = addDays(first, -offset);
	return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function orderedWeekdays(weekStart = 0): number[] {
	return Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7);
}

/** "9:30 AM" from "09:30". */
export function formatTime(hhmm: string): string {
	const [h, m] = hhmm.split(':').map(Number);
	const period = h < 12 ? 'AM' : 'PM';
	const h12 = h % 12 === 0 ? 12 : h % 12;
	return m === 0 ? `${h12} ${period}` : `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

/** Minutes since midnight from "HH:MM". */
export function minutesOf(hhmm: string): number {
	const [h, m] = hhmm.split(':').map(Number);
	return h * 60 + m;
}

/** Human relative label for a due date, e.g. "Today", "Tomorrow", "in 3 days". */
export function relativeDue(iso: string, now = new Date()): string {
	const due = new Date(iso);
	const dueKey = dayKey(due);
	const nowKey = dayKey(now);
	const diffDays = Math.round(
		(parseDay(dueKey).getTime() - parseDay(nowKey).getTime()) / 86400000
	);
	if (diffDays === 0) return 'Today';
	if (diffDays === 1) return 'Tomorrow';
	if (diffDays === -1) return 'Yesterday';
	if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
	if (diffDays < 7) return `in ${diffDays} days`;
	return `${MONTHS_SHORT[due.getMonth()]} ${due.getDate()}`;
}
