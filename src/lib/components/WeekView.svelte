<script lang="ts">
	import { getPlanner } from '$lib/planner.svelte';
	import { expandOccurrences } from '$lib/schedule';
	import { dayKey, formatTime, isToday, minutesOf, weekDays, WEEKDAYS } from '$lib/date';
	import type { Assignment, ClassOccurrence } from '$lib/types';
	import Icon from './Icon.svelte';

	const planner = getPlanner();

	let {
		date,
		weekStart = 0,
		onselect
	}: { date: Date; weekStart?: number; onselect: (d: Date) => void } = $props();

	const HOUR_PX = 54;
	// Shown when the week has no classes at all, and used as the minimum span so
	// a single 9am lecture doesn't render as a one-hour sliver.
	const DEFAULT_START = 8 * 60;
	const DEFAULT_END = 18 * 60;

	const days = $derived(weekDays(date, weekStart));

	const occurrences = $derived(
		expandOccurrences(days[0], days[6], {
			courses: planner.courses,
			meetings: planner.meetings,
			terms: planner.terms
		})
	);

	// Grid spans whole hours around the week's earliest start and latest end.
	const bounds = $derived.by(() => {
		if (!occurrences.length) return { start: DEFAULT_START, end: DEFAULT_END };
		let lo = DEFAULT_START;
		let hi = DEFAULT_END;
		for (const o of occurrences) {
			lo = Math.min(lo, minutesOf(o.start));
			hi = Math.max(hi, minutesOf(o.end));
		}
		return { start: Math.floor(lo / 60) * 60, end: Math.ceil(hi / 60) * 60 };
	});

	const hours = $derived(
		Array.from({ length: (bounds.end - bounds.start) / 60 }, (_, i) => bounds.start / 60 + i)
	);

	/**
	 * Pack a day's occurrences into side-by-side lanes so overlapping classes
	 * (a lecture running into a lab) stay readable.
	 *
	 * Lanes are counted per *cluster* of transitively-overlapping classes, not
	 * per day, so one overlapping pair at 3pm doesn't narrow an unrelated 10am
	 * lecture. Within a cluster, greedily reuse the first lane whose previous
	 * class has already ended.
	 */
	interface Placed {
		occ: ClassOccurrence;
		lane: number;
		lanes: number;
	}

	function place(list: ClassOccurrence[]): Placed[] {
		const out: Placed[] = [];
		let cluster: Placed[] = [];
		let laneEnds: number[] = [];
		let clusterEnd = -Infinity;

		// `list` arrives sorted by start time.
		for (const occ of list) {
			const start = minutesOf(occ.start);
			// A gap with every class so far closes the cluster.
			if (start >= clusterEnd) {
				for (const p of cluster) p.lanes = laneEnds.length;
				out.push(...cluster);
				cluster = [];
				laneEnds = [];
				clusterEnd = -Infinity;
			}
			let lane = laneEnds.findIndex((end) => end <= start);
			if (lane === -1) lane = laneEnds.length;
			const end = minutesOf(occ.end);
			laneEnds[lane] = end;
			clusterEnd = Math.max(clusterEnd, end);
			cluster.push({ occ, lane, lanes: 1 });
		}
		for (const p of cluster) p.lanes = laneEnds.length;
		out.push(...cluster);
		return out;
	}

	const byDay = $derived.by(() => {
		// `occurrences` is sorted by date then start, so each day's list stays in
		// start order — which `place` relies on.
		const grouped: Record<string, ClassOccurrence[]> = {};
		for (const o of occurrences) (grouped[o.date] ??= []).push(o);

		const placed: Record<string, Placed[]> = {};
		for (const key of Object.keys(grouped)) placed[key] = place(grouped[key]);
		return placed;
	});

	const dueByDay = $derived.by(() => {
		const byKey: Record<string, Assignment[]> = {};
		for (const a of planner.assignments) {
			const k = dayKey(new Date(a.due_at));
			(byKey[k] ??= []).push(a);
		}
		return byKey;
	});

	const hasDue = $derived(days.some((d) => (dueByDay[dayKey(d)]?.length ?? 0) > 0));

	function top(occ: ClassOccurrence): number {
		return ((minutesOf(occ.start) - bounds.start) / 60) * HOUR_PX;
	}
	function height(occ: ClassOccurrence): number {
		return Math.max(18, ((minutesOf(occ.end) - minutesOf(occ.start)) / 60) * HOUR_PX);
	}
	function isShort(occ: ClassOccurrence): boolean {
		return minutesOf(occ.end) - minutesOf(occ.start) < 50;
	}
</script>

<div class="week card">
	<div class="head-row">
		<div class="gutter-head"></div>
		{#each days as d (dayKey(d))}
			{@const key = dayKey(d)}
			<button class="day-head" class:today={isToday(key)} onclick={() => onselect(d)}>
				<span class="dow">{WEEKDAYS[d.getDay()]}</span>
				<span class="dnum num" class:today-num={isToday(key)}>{d.getDate()}</span>
			</button>
		{/each}
	</div>

	{#if hasDue}
		<div class="due-row">
			<div class="gutter-label">Due</div>
			{#each days as d (dayKey(d))}
				{@const list = dueByDay[dayKey(d)] ?? []}
				<div class="due-cell">
					{#each list as a (a.id)}
						{@const course = planner.courseById(a.course_id)}
						<span
							class="due"
							class:done={a.status === 'done'}
							style="--c:{course?.color ?? 'var(--faint)'}"
							title={a.title}
						>
							<Icon name="assignment" size={12} />
							<span class="due-title">{a.title}</span>
						</span>
					{/each}
				</div>
			{/each}
		</div>
	{/if}

	<div class="body">
		<div class="gutter">
			{#each hours as h (h)}
				<div class="hour-label num" style="height:{HOUR_PX}px">
					{formatTime(`${String(h).padStart(2, '0')}:00`)}
				</div>
			{/each}
		</div>

		{#each days as d (dayKey(d))}
			{@const key = dayKey(d)}
			<div class="col" class:today-col={isToday(key)}>
				{#each hours as h (h)}
					<div class="slot" style="height:{HOUR_PX}px"></div>
				{/each}

				{#each byDay[key] ?? [] as p (p.occ.meeting.id)}
					{@const w = 100 / p.lanes}
					<button
						class="block"
						class:short={isShort(p.occ)}
						style="--c:{p.occ.course.color}; top:{top(p.occ)}px; height:{height(
							p.occ
						)}px; left:calc({p.lane * w}% + 2px); width:calc({w}% - 4px)"
						onclick={() => onselect(d)}
						title="{p.occ.course.title} · {formatTime(p.occ.start)}–{formatTime(p.occ.end)}{p.occ
							.course.location
							? ' · ' + p.occ.course.location
							: ''}"
					>
						<!--
							Only name and time: a week grid block is ~45px tall for a 50-minute
							class, and a third line pushed the name out of view. The room is
							still in the hover title and on the day view.
						-->
						<span class="b-title">{p.occ.course.code ?? p.occ.course.title}</span>
						<span class="b-time num">{formatTime(p.occ.start)}</span>
					</button>
				{/each}
			</div>
		{/each}
	</div>
</div>

<style>
	.week {
		overflow: hidden;
	}

	/* Gutter + 7 equal day columns, shared by every row. */
	.head-row,
	.due-row,
	.body {
		display: grid;
		grid-template-columns: 3.75rem repeat(7, 1fr);
	}

	.head-row {
		border-bottom: 1px solid var(--line);
	}
	.gutter-head {
		border-right: 1px solid var(--line-soft);
	}
	.day-head {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		padding: 0.6rem 0.25rem;
		border: 0;
		border-right: 1px solid var(--line-soft);
		background: transparent;
		cursor: pointer;
		transition: background 0.14s ease;
	}
	.day-head:last-child {
		border-right: 0;
	}
	.day-head:hover {
		background: var(--surface-sunk);
	}
	.dow {
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.dnum {
		font-size: var(--t-md);
		color: var(--ink);
	}
	.today-num {
		display: grid;
		place-items: center;
		width: 1.75rem;
		height: 1.75rem;
		border-radius: var(--r-pill);
		background: var(--amber);
		color: #fff;
		font-weight: 500;
	}

	.due-row {
		border-bottom: 1px solid var(--line);
		background: var(--paper);
	}
	.gutter-label {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		padding: 0.3rem 0.5rem;
		border-right: 1px solid var(--line-soft);
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.due-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding: 0.3rem 0.25rem;
		border-right: 1px solid var(--line-soft);
		min-width: 0;
	}
	.due-cell:last-child {
		border-right: 0;
	}
	.due {
		display: flex;
		align-items: center;
		gap: 0.25rem;
		padding: 1px 4px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--c) 14%, transparent);
		font-size: var(--t-xs);
		min-width: 0;
	}
	.due :global(.sym) {
		color: var(--c);
		flex-shrink: 0;
	}
	.due-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink);
	}
	.due.done .due-title {
		text-decoration: line-through;
		color: var(--muted);
	}

	.body {
		max-height: 62vh;
		overflow-y: auto;
	}
	.gutter {
		border-right: 1px solid var(--line-soft);
	}
	.hour-label {
		display: flex;
		justify-content: flex-end;
		padding: 0 0.5rem;
		font-size: var(--t-xs);
		color: var(--faint);
		/* Nudge the label up so it sits on its gridline. */
		transform: translateY(-0.45em);
	}
	.col {
		position: relative;
		border-right: 1px solid var(--line-soft);
		min-width: 0;
	}
	.col:last-child {
		border-right: 0;
	}
	.today-col {
		background: var(--amber-tint);
	}
	.slot {
		border-bottom: 1px solid var(--line-soft);
	}

	.block {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 1px;
		overflow: hidden;
		text-align: left;
		padding: 0.25rem 0.35rem;
		border: 0;
		border-left: 3px solid var(--c);
		border-radius: 5px;
		background: color-mix(in srgb, var(--c) 16%, var(--surface));
		cursor: pointer;
		transition: filter 0.12s ease;
	}
	.block:hover {
		filter: brightness(0.97);
	}
	.b-title {
		font-size: var(--t-xs);
		font-weight: 500;
		color: var(--ink);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.b-time {
		font-size: 0.66rem;
		color: var(--muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	/* Very short classes put the name and time on one line instead of stacking. */
	.block.short {
		flex-direction: row;
		align-items: baseline;
		gap: 0.3rem;
	}
	/* Side by side, the name gives way — a half-truncated time reads as garbage. */
	.block.short .b-time {
		flex-shrink: 0;
	}

	@media (max-width: 720px) {
		.head-row,
		.due-row,
		.body {
			grid-template-columns: 2.5rem repeat(7, 1fr);
		}
		.b-time,
		.due-title {
			display: none;
		}
		.dow {
			font-size: 0.6rem;
		}
	}
</style>
