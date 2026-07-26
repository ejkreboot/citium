<script lang="ts">
	import type { Assignment } from '$lib/types';
	import { planner } from '$lib/planner.svelte';
	import { relativeDue } from '$lib/date';
	import Icon from './Icon.svelte';

	let {
		assignment,
		showDue = true,
		onedit
	}: { assignment: Assignment; showDue?: boolean; onedit?: (a: Assignment) => void } = $props();

	const course = $derived(planner.courseById(assignment.course_id));
	const overdue = $derived(
		assignment.status !== 'done' && new Date(assignment.due_at) < new Date()
	);

	const statusIcon = {
		todo: 'radio_button_unchecked',
		doing: 'timelapse',
		done: 'task_alt'
	} as const;
</script>

<div class="assignment" class:done={assignment.status === 'done'} style="--c:{course?.color ?? 'var(--faint)'}">
	<button
		class="check"
		onclick={() => planner.cycleStatus(assignment.id)}
		aria-label="Cycle status (currently {assignment.status})"
		title="Mark {assignment.status === 'done' ? 'to-do' : 'done'}"
	>
		<Icon name={statusIcon[assignment.status]} size={22} fill={assignment.status === 'done'} />
	</button>

	<div class="body">
		{#if onedit}
			<button class="title editable" onclick={() => onedit?.(assignment)}>{assignment.title}</button>
		{:else}
			<div class="title">{assignment.title}</div>
		{/if}
		<div class="meta">
			{#if course}
				<span class="course-chip"><span class="swatch"></span>{course.code ?? course.title}</span>
			{/if}
			{#if assignment.priority > 0 && assignment.status !== 'done'}
				<span class="flag" title="High priority"><Icon name="priority_high" size={14} /></span>
			{/if}
		</div>
	</div>

	{#if showDue}
		<div class="due num" class:overdue class:soft={assignment.status === 'done'}>
			{relativeDue(assignment.due_at)}
		</div>
	{/if}
</div>

<style>
	.assignment {
		display: grid;
		grid-template-columns: auto 1fr auto;
		gap: 0.75rem;
		align-items: center;
		padding: 0.55rem 0;
	}
	.check {
		border: 0;
		background: transparent;
		cursor: pointer;
		color: var(--c);
		display: grid;
		place-items: center;
		padding: 0.1rem;
		border-radius: var(--r-pill);
		transition: transform 0.12s ease;
	}
	.check:hover {
		transform: scale(1.12);
	}
	.body {
		min-width: 0;
	}
	.title {
		font-weight: 500;
		letter-spacing: -0.005em;
		font-size: inherit;
		font-family: inherit;
		color: inherit;
	}
	button.title {
		border: 0;
		background: transparent;
		padding: 0;
		text-align: left;
		cursor: pointer;
		display: block;
	}
	button.title:hover {
		color: var(--iris);
	}
	.done .title {
		text-decoration: line-through;
		color: var(--muted);
		text-decoration-color: var(--faint);
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 0.15rem;
	}
	.course-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		color: var(--muted);
	}
	.swatch {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--c);
	}
	.flag {
		display: inline-grid;
		place-items: center;
		color: var(--coral);
		background: var(--coral-tint);
		border-radius: var(--r-pill);
		width: 18px;
		height: 18px;
	}
	.due {
		font-size: var(--t-sm);
		color: var(--muted);
		white-space: nowrap;
	}
	.due.overdue {
		color: var(--coral);
	}
	.due.soft {
		color: var(--faint);
	}
</style>
