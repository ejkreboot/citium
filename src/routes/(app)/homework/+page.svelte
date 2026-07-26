<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { dayKey } from '$lib/date';
	import type { Assignment } from '$lib/types';
	import AssignmentItem from '$lib/components/AssignmentItem.svelte';
	import AssignmentDialog from '$lib/components/AssignmentDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let dialogOpen = $state(false);
	let editing = $state<Assignment | null>(null);
	let courseFilter = $state<string>('all');
	let showDone = $state(false);

	function openNew() {
		editing = null;
		dialogOpen = true;
	}
	function openEdit(a: Assignment) {
		editing = a;
		dialogOpen = true;
	}

	const filtered = $derived(
		planner.assignments.filter((a) => courseFilter === 'all' || a.course_id === courseFilter)
	);

	const todayKey = dayKey(new Date());

	const overdue = $derived(
		filtered
			.filter((a) => a.status !== 'done' && dayKey(new Date(a.due_at)) < todayKey)
			.sort((a, b) => a.due_at.localeCompare(b.due_at))
	);
	const active = $derived(
		filtered
			.filter((a) => a.status !== 'done' && dayKey(new Date(a.due_at)) >= todayKey)
			.sort((a, b) => a.due_at.localeCompare(b.due_at))
	);
	const done = $derived(
		filtered.filter((a) => a.status === 'done').sort((a, b) => b.due_at.localeCompare(a.due_at))
	);

	const remaining = $derived(overdue.length + active.length);
</script>

<header class="head">
	<div class="titles">
		<p class="eyebrow">Homework</p>
		<h1>{remaining} to do</h1>
	</div>
	<button class="btn btn-primary" onclick={openNew}>
		<Icon name="add" size={20} /> Add assignment
	</button>
</header>

<div class="filters">
	<button class="fchip" class:on={courseFilter === 'all'} onclick={() => (courseFilter = 'all')}>
		All
	</button>
	{#each planner.courses as c (c.id)}
		<button
			class="fchip"
			class:on={courseFilter === c.id}
			style="--c:{c.color}"
			onclick={() => (courseFilter = c.id)}
		>
			<span class="fdot"></span>{c.code ?? c.title}
		</button>
	{/each}
</div>

{#if overdue.length}
	<section class="group">
		<h2 class="group-title overdue"><Icon name="error" size={18} /> Overdue</h2>
		<div class="card list">
			{#each overdue as a (a.id)}
				<AssignmentItem assignment={a} onedit={openEdit} />
			{/each}
		</div>
	</section>
{/if}

<section class="group">
	<h2 class="group-title">Upcoming</h2>
	{#if active.length}
		<div class="card list">
			{#each active as a (a.id)}
				<AssignmentItem assignment={a} onedit={openEdit} />
			{/each}
		</div>
	{:else}
		<div class="card empty">
			<Icon name="task_alt" size={26} />
			<p>Nothing on the horizon.</p>
			<p class="faint">Add an assignment to get started.</p>
		</div>
	{/if}
</section>

{#if done.length}
	<section class="group">
		<button class="group-title toggle" onclick={() => (showDone = !showDone)}>
			<Icon name={showDone ? 'expand_more' : 'chevron_right'} size={20} />
			Completed <span class="num faint">{done.length}</span>
		</button>
		{#if showDone}
			<div class="card list">
				{#each done as a (a.id)}
					<AssignmentItem assignment={a} onedit={openEdit} />
				{/each}
			</div>
		{/if}
	</section>
{/if}

<AssignmentDialog bind:open={dialogOpen} {editing} />

<style>
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.25rem;
	}
	.titles h1 {
		font-size: var(--t-xl);
		margin-top: 0.3rem;
	}
	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-bottom: 1.5rem;
	}
	.fchip {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.34em 0.8em;
		border: 1px solid var(--line);
		border-radius: var(--r-pill);
		background: var(--surface);
		font-size: var(--t-sm);
		font-weight: 500;
		color: var(--muted);
		cursor: pointer;
		transition: all 0.14s ease;
	}
	.fchip:hover {
		border-color: var(--faint);
	}
	.fchip.on {
		color: var(--ink);
		border-color: var(--ink);
	}
	.fdot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--c, var(--faint));
	}
	.group {
		margin-bottom: 1.75rem;
	}
	.group-title {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 0.6rem;
	}
	.group-title.overdue {
		color: var(--coral);
	}
	.toggle {
		border: 0;
		background: transparent;
		cursor: pointer;
		padding: 0;
	}
	.list {
		padding: 0.4rem 1.25rem;
	}
	.list > :global(* + *) {
		border-top: 1px solid var(--line-soft);
	}
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		text-align: center;
		padding: 2.25rem 1rem;
		color: var(--muted);
	}
	.empty :global(.sym) {
		color: var(--faint);
		margin-bottom: 0.35rem;
	}
	.empty p {
		font-size: var(--t-sm);
	}
</style>
