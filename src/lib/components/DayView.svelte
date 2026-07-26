<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { occurrencesOn } from '$lib/schedule';
	import { dayKey, isToday } from '$lib/date';
	import ClassItem from './ClassItem.svelte';
	import AssignmentItem from './AssignmentItem.svelte';

	let { date }: { date: Date } = $props();

	const key = $derived(dayKey(date));

	const classes = $derived(
		occurrencesOn(date, {
			courses: planner.courses,
			meetings: planner.meetings,
			terms: planner.terms
		})
	);

	const due = $derived(
		planner.assignments
			.filter((a) => dayKey(new Date(a.due_at)) === key)
			.sort((a, b) => a.due_at.localeCompare(b.due_at))
	);
</script>

<div class="day">
	<div class="col">
		<div class="col-head">
			<h3>Classes</h3>
			{#if isToday(key)}<span class="chip">Today</span>{/if}
		</div>
		{#if classes.length}
			<div class="divided">
				{#each classes as occ (occ.meeting.id)}
					<ClassItem {occ} />
				{/each}
			</div>
		{:else}
			<p class="none faint">No classes on this day.</p>
		{/if}
	</div>

	<div class="col">
		<div class="col-head">
			<h3>Due</h3>
			{#if due.length}<span class="count num">{due.length}</span>{/if}
		</div>
		{#if due.length}
			<div class="divided">
				{#each due as a (a.id)}
					<AssignmentItem assignment={a} showDue={false} />
				{/each}
			</div>
		{:else}
			<p class="none faint">Nothing due.</p>
		{/if}
	</div>
</div>

<style>
	.day {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}
	.col {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		box-shadow: var(--shadow-sm);
		padding: 1.25rem 1.4rem 1rem;
	}
	.col-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.4rem;
	}
	.col-head h3 {
		font-size: var(--t-md);
		font-family: var(--font-mono);
		font-weight: 500;
		letter-spacing: 0.02em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.count {
		font-size: var(--t-sm);
		color: var(--faint);
	}
	.divided > :global(* + *) {
		border-top: 1px solid var(--line-soft);
	}
	.none {
		padding: 1.25rem 0;
		font-size: var(--t-sm);
	}
	@media (max-width: 720px) {
		.day {
			grid-template-columns: 1fr;
		}
	}
</style>
