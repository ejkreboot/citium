<script lang="ts">
	import { page } from '$app/state';
	import { planner } from '$lib/planner.svelte';
	import {
		addDays,
		addMonths,
		addWeeks,
		endOfWeek,
		formatDayRange,
		startOfWeek,
		WEEKDAYS_LONG,
		MONTHS,
		dayKey
	} from '$lib/date';
	import DayView from '$lib/components/DayView.svelte';
	import WeekView from '$lib/components/WeekView.svelte';
	import MonthView from '$lib/components/MonthView.svelte';
	import YearView from '$lib/components/YearView.svelte';
	import Icon from '$lib/components/Icon.svelte';

	type ViewMode = 'year' | 'month' | 'week' | 'day';

	const VIEWS: ViewMode[] = ['year', 'month', 'week', 'day'];

	const initialView = (
		VIEWS.includes((page.url.searchParams.get('v') ?? '') as ViewMode)
			? page.url.searchParams.get('v')
			: 'month'
	) as ViewMode;

	const weekStart = 0;

	// Open on today, but if we're before the active term, jump to its start so
	// the schedule opens on something meaningful.
	function initialCursor(): Date {
		const today = new Date();
		const term = planner.activeTerm;
		if (term && dayKey(today) < term.start_date) return new Date(term.start_date + 'T00:00');
		return today;
	}

	let view = $state<ViewMode>(initialView);
	let cursor = $state(initialCursor());

	const title = $derived.by(() => {
		if (view === 'year') return String(cursor.getFullYear());
		if (view === 'month') return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
		if (view === 'week')
			return formatDayRange(startOfWeek(cursor, weekStart), endOfWeek(cursor, weekStart));
		return `${WEEKDAYS_LONG[cursor.getDay()]}, ${MONTHS[cursor.getMonth()]} ${cursor.getDate()}`;
	});

	function step(dir: number) {
		if (view === 'year') cursor = new Date(cursor.getFullYear() + dir, cursor.getMonth(), 1);
		else if (view === 'month') cursor = addMonths(cursor, dir);
		else if (view === 'week') cursor = addWeeks(cursor, dir);
		else cursor = addDays(cursor, dir);
	}

	function goToday() {
		cursor = new Date();
		if (view === 'year') view = 'month';
	}

	function openDay(d: Date) {
		cursor = d;
		view = 'day';
	}
	function openMonth(month: number) {
		cursor = new Date(cursor.getFullYear(), month, 1);
		view = 'month';
	}
</script>

<header class="head">
	<div class="titles">
		<p class="eyebrow">Schedule</p>
		<h1>{title}</h1>
	</div>

	<div class="controls">
		<div class="segmented">
			{#each VIEWS as v (v)}
				<button aria-pressed={view === v} onclick={() => (view = v)}>
					{v[0].toUpperCase() + v.slice(1)}
				</button>
			{/each}
		</div>

		<div class="nav">
			<button class="btn btn-icon" onclick={() => step(-1)} aria-label="Previous">
				<Icon name="chevron_left" size={20} />
			</button>
			<button class="btn today-btn" onclick={goToday}>Today</button>
			<button class="btn btn-icon" onclick={() => step(1)} aria-label="Next">
				<Icon name="chevron_right" size={20} />
			</button>
		</div>
	</div>
</header>

<div class="stage rise">
	{#if view === 'day'}
		<DayView date={cursor} />
	{:else if view === 'week'}
		<WeekView date={cursor} {weekStart} onselect={openDay} />
	{:else if view === 'month'}
		<MonthView
			year={cursor.getFullYear()}
			month={cursor.getMonth()}
			{weekStart}
			onselect={openDay}
		/>
	{:else}
		<YearView year={cursor.getFullYear()} onselectday={openDay} onselectmonth={openMonth} />
	{/if}
</div>

<style>
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1.25rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	.titles h1 {
		font-size: var(--t-xl);
		margin-top: 0.3rem;
	}
	.controls {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}
	.nav {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.today-btn {
		font-size: var(--t-sm);
	}
	.stage {
		min-height: 40vh;
	}
	@media (max-width: 560px) {
		.controls {
			width: 100%;
			justify-content: space-between;
		}
	}
</style>
