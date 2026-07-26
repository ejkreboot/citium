<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { occurrencesOn } from '$lib/schedule';
	import { calendarGrid, orderedWeekdays, dayKey, WEEKDAYS, isToday, parseDay } from '$lib/date';
	import type { Assignment } from '$lib/types';

	let {
		year,
		month,
		weekStart = 0,
		onselect
	}: { year: number; month: number; weekStart?: number; onselect: (d: Date) => void } = $props();

	const cells = $derived(calendarGrid(year, month, weekStart));
	const headers = $derived(orderedWeekdays(weekStart).map((d) => WEEKDAYS[d]));

	const dueByDay = $derived.by(() => {
		const map = new Map<string, Assignment[]>();
		for (const a of planner.assignments) {
			const k = dayKey(new Date(a.due_at));
			(map.get(k) ?? map.set(k, []).get(k)!).push(a);
		}
		return map;
	});

	function classColorsOn(d: Date): string[] {
		const occ = occurrencesOn(d, {
			courses: planner.courses,
			meetings: planner.meetings,
			terms: planner.terms
		});
		return [...new Set(occ.map((o) => o.course.color))];
	}
</script>

<div class="month card">
	<div class="weekdays">
		{#each headers as h (h)}
			<div class="wd">{h}</div>
		{/each}
	</div>
	<div class="grid">
		{#each cells as d (dayKey(d))}
			{@const key = dayKey(d)}
			{@const inMonth = d.getMonth() === month}
			{@const dots = classColorsOn(d)}
			{@const due = dueByDay.get(key) ?? []}
			<button
				class="cell"
				class:out={!inMonth}
				class:today={isToday(key)}
				onclick={() => onselect(d)}
			>
				<div class="cell-top">
					<span class="daynum num" class:today-num={isToday(key)}>{d.getDate()}</span>
					{#if dots.length}
						<span class="dots">
							{#each dots.slice(0, 4) as c (c)}
								<span class="dot" style="background:{c}"></span>
							{/each}
						</span>
					{/if}
				</div>
				<div class="events">
					{#each due.slice(0, 3) as a (a.id)}
						{@const course = planner.courseById(a.course_id)}
						<span class="ev" class:done={a.status === 'done'} style="--c:{course?.color ?? 'var(--faint)'}">
							<span class="ev-dot"></span>
							<span class="ev-title">{a.title}</span>
						</span>
					{/each}
					{#if due.length > 3}
						<span class="more">+{due.length - 3} more</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
</div>

<style>
	.month {
		overflow: hidden;
	}
	.weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		border-bottom: 1px solid var(--line);
	}
	.wd {
		padding: 0.6rem 0.75rem;
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--faint);
		text-align: left;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		grid-auto-rows: minmax(96px, 1fr);
	}
	.cell {
		text-align: left;
		border: 0;
		border-right: 1px solid var(--line-soft);
		border-bottom: 1px solid var(--line-soft);
		background: var(--surface);
		padding: 0.5rem 0.55rem;
		cursor: pointer;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
		transition: background 0.14s ease;
	}
	.cell:hover {
		background: var(--surface-sunk);
	}
	.cell:nth-child(7n) {
		border-right: 0;
	}
	.cell.out {
		background: var(--paper);
	}
	.cell.out .daynum {
		color: var(--faint);
	}
	.cell.today {
		background: var(--amber-tint);
	}

	.cell-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem;
	}
	.daynum {
		font-size: var(--t-sm);
		color: var(--muted);
	}
	.today-num {
		display: inline-grid;
		place-items: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--r-pill);
		background: var(--amber);
		color: #fff;
		font-weight: 500;
	}
	.dots {
		display: inline-flex;
		gap: 3px;
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: var(--r-pill);
	}

	.events {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.ev {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 1px 4px;
		border-radius: 4px;
		background: color-mix(in srgb, var(--c) 12%, transparent);
		font-size: var(--t-xs);
		min-width: 0;
	}
	.ev-dot {
		width: 5px;
		height: 5px;
		border-radius: var(--r-pill);
		background: var(--c);
		flex-shrink: 0;
	}
	.ev-title {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--ink);
	}
	.ev.done .ev-title {
		text-decoration: line-through;
		color: var(--muted);
	}
	.more {
		font-size: var(--t-xs);
		color: var(--faint);
		padding-left: 4px;
	}

	@media (max-width: 720px) {
		.grid {
			grid-auto-rows: minmax(64px, 1fr);
		}
		.ev-title {
			display: none;
		}
		.ev {
			padding: 2px;
			align-self: flex-start;
		}
	}
</style>
