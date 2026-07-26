<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { dayKey, isToday, MONTHS_SHORT } from '$lib/date';
	import type { Assignment, Term } from '$lib/types';

	let {
		year,
		onselectday,
		onselectmonth
	}: {
		year: number;
		onselectday: (d: Date) => void;
		onselectmonth: (month: number) => void;
	} = $props();

	const dueByDay = $derived.by(() => {
		const byDay: Record<string, Assignment[]> = {};
		for (const a of planner.assignments) {
			const k = dayKey(new Date(a.due_at));
			(byDay[k] ??= []).push(a);
		}
		return byDay;
	});

	function termFor(key: string): Term | undefined {
		return planner.terms.find((t) => t.start_date <= key && key <= t.end_date);
	}

	// One tinted cell descriptor per real day of a month.
	function daysOf(month: number) {
		const last = new Date(year, month + 1, 0).getDate();
		const lead = new Date(year, month, 1).getDay(); // 0=Sun
		const out: Array<{
			n: number | null;
			key: string;
			today: boolean;
			color: string;
			alpha: number;
		}> = [];
		for (let i = 0; i < lead; i++)
			out.push({ n: null, key: `b${month}-${i}`, today: false, color: '', alpha: 0 });
		for (let day = 1; day <= last; day++) {
			const key = dayKey(new Date(year, month, day));
			const term = termFor(key);
			const load = dueByDay[key]?.length ?? 0;
			const color = term?.color ?? '#5b5b8a';
			let alpha = 0;
			if (term) alpha = 0.09; // term band
			if (load === 1) alpha = 0.28;
			else if (load === 2) alpha = 0.44;
			else if (load >= 3) alpha = 0.62;
			out.push({ n: day, key, today: isToday(key), color, alpha });
		}
		return out;
	}

	const dow = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
	const hasToday = $derived(new Date().getFullYear() === year);
</script>

<div class="year">
	{#each MONTHS_SHORT as name, m (name)}
		<div class="mini card">
			<button class="mini-head" onclick={() => onselectmonth(m)}>
				<span class="mname">{name}</span>
				{#if hasToday && new Date().getMonth() === m}<span class="now-dot"></span>{/if}
			</button>
			<div class="dow">
				{#each dow as d, i (i)}<span>{d}</span>{/each}
			</div>
			<div class="days">
				{#each daysOf(m) as cell (cell.key)}
					{#if cell.n === null}
						<span class="pad"></span>
					{:else}
						<button
							class="d"
							class:today={cell.today}
							style="background:{cell.alpha
								? `color-mix(in srgb, ${cell.color} ${cell.alpha * 100}%, transparent)`
								: 'transparent'}"
							onclick={() => onselectday(new Date(year, m, cell.n!))}
							title={cell.key}
						>
							{cell.n}
						</button>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>

<div class="legend">
	<span class="lg-title">Workload</span>
	<span class="swatch" style="background: color-mix(in srgb, var(--iris) 9%, transparent)"></span>
	<span class="faint">term</span>
	<span class="swatch" style="background: color-mix(in srgb, var(--iris) 28%, transparent)"></span>
	<span class="swatch" style="background: color-mix(in srgb, var(--iris) 44%, transparent)"></span>
	<span class="swatch" style="background: color-mix(in srgb, var(--iris) 62%, transparent)"></span>
	<span class="faint">busier</span>
	<span class="sep"></span>
	<span class="swatch today-swatch"></span>
	<span class="faint">today</span>
</div>

<style>
	.year {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 1rem;
	}
	.mini {
		padding: 0.85rem 0.9rem 0.95rem;
	}
	.mini-head {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		border: 0;
		background: transparent;
		cursor: pointer;
		padding: 0 0 0.5rem;
		width: 100%;
	}
	.mname {
		font-family: var(--font-display);
		font-size: 1.05rem;
		font-weight: 500;
		letter-spacing: -0.01em;
	}
	.mini-head:hover .mname {
		color: var(--iris);
	}
	.now-dot {
		width: 6px;
		height: 6px;
		border-radius: var(--r-pill);
		background: var(--amber);
	}
	.dow {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		margin-bottom: 2px;
	}
	.dow span {
		text-align: center;
		font-family: var(--font-mono);
		font-size: 0.6rem;
		color: var(--faint);
	}
	.days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 1px;
	}
	.pad {
		aspect-ratio: 1;
	}
	.d {
		aspect-ratio: 1;
		border: 0;
		border-radius: 5px;
		background: transparent;
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: 0.66rem;
		color: var(--muted);
		display: grid;
		place-items: center;
		transition:
			outline 0.12s ease,
			transform 0.12s ease;
	}
	.d:hover {
		outline: 1.5px solid var(--iris);
		transform: scale(1.08);
	}
	.d.today {
		background: var(--amber) !important;
		color: #fff;
		font-weight: 500;
	}

	.legend {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1.25rem;
		font-size: var(--t-xs);
	}
	.lg-title {
		font-family: var(--font-mono);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--faint);
		margin-right: 0.3rem;
	}
	.legend .swatch {
		width: 14px;
		height: 14px;
		border-radius: 4px;
		border: 1px solid var(--line);
	}
	.today-swatch {
		background: var(--amber);
		border-color: var(--amber);
	}
	.sep {
		width: 1px;
		height: 16px;
		background: var(--line);
		margin: 0 0.35rem;
	}

	@media (max-width: 960px) {
		.year {
			grid-template-columns: repeat(3, 1fr);
		}
	}
	@media (max-width: 680px) {
		.year {
			grid-template-columns: repeat(2, 1fr);
		}
	}
</style>
