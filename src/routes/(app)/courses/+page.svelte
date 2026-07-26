<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { meetingSummary } from '$lib/schedule';
	import { MONTHS_SHORT, parseDay } from '$lib/date';
	import type { Course, Term } from '$lib/types';
	import CourseDialog from '$lib/components/CourseDialog.svelte';
	import TermDialog from '$lib/components/TermDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';

	let courseOpen = $state(false);
	let editingCourse = $state<Course | null>(null);
	let termOpen = $state(false);
	let editingTerm = $state<Term | null>(null);

	const term = $derived(planner.activeTerm);

	function fmtDate(iso: string): string {
		const d = parseDay(iso);
		return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`;
	}

	function newCourse() {
		editingCourse = null;
		courseOpen = true;
	}
	function editCourse(c: Course) {
		editingCourse = c;
		courseOpen = true;
	}
	function editTerm() {
		editingTerm = term ?? null;
		termOpen = true;
	}
</script>

<header class="head">
	<div class="titles">
		<p class="eyebrow">Courses</p>
		<h1>My classes</h1>
	</div>
	<button class="btn btn-primary" onclick={newCourse}>
		<Icon name="add" size={20} /> Add course
	</button>
</header>

<button class="term-card" onclick={editTerm}>
	{#if term}
		<div class="term-info">
			<span class="eyebrow">Current term</span>
			<span class="term-name">{term.name}</span>
			<span class="term-dates num">{fmtDate(term.start_date)} — {fmtDate(term.end_date)}</span>
		</div>
	{:else}
		<div class="term-info">
			<span class="eyebrow">Term</span>
			<span class="term-name">Set up your term</span>
		</div>
	{/if}
	<span class="edit-hint"><Icon name="edit" size={18} /></span>
</button>

{#if planner.courses.length}
	<div class="courses">
		{#each planner.courses as c (c.id)}
			{@const summary = meetingSummary(planner.meetingsFor(c.id))}
			<button class="course" style="--c:{c.color}" onclick={() => editCourse(c)}>
				<div class="spine"></div>
				<div class="course-body">
					<div class="course-top">
						{#if c.code}<span class="code num">{c.code}</span>{/if}
						<span class="edit-hint"><Icon name="edit" size={16} /></span>
					</div>
					<h3>{c.title}</h3>
					<div class="details">
						{#if c.instructor}
							<span class="detail"><Icon name="person" size={15} />{c.instructor}</span>
						{/if}
						{#if c.location}
							<span class="detail"><Icon name="location_on" size={15} />{c.location}</span>
						{/if}
					</div>
					{#if summary.length}
						<div class="meetings">
							{#each summary as s (s)}
								<span class="meeting num">{s}</span>
							{/each}
						</div>
					{:else}
						<span class="no-meet faint">No meeting times yet</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>
{:else}
	<div class="card empty">
		<Icon name="school" size={30} />
		<p>No courses yet.</p>
		<p class="faint">Add your first class to build your schedule.</p>
		<button class="btn btn-primary" onclick={newCourse} style="margin-top:0.85rem">
			<Icon name="add" size={18} /> Add course
		</button>
	</div>
{/if}

<CourseDialog bind:open={courseOpen} editing={editingCourse} />
<TermDialog bind:open={termOpen} editing={editingTerm} />

<style>
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
	}
	.titles h1 {
		font-size: var(--t-xl);
		margin-top: 0.3rem;
	}

	.term-card {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		text-align: left;
		padding: 1.1rem 1.4rem;
		margin-bottom: 1.5rem;
		background:
			radial-gradient(120% 180% at 0% 0%, var(--iris-tint) 0%, transparent 60%), var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		transition: border-color 0.15s ease;
	}
	.term-card:hover {
		border-color: var(--iris);
	}
	.term-info {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.term-name {
		font-family: var(--font-display);
		font-size: 1.35rem;
		font-weight: 500;
	}
	.term-dates {
		font-size: var(--t-sm);
		color: var(--muted);
	}
	.edit-hint {
		color: var(--faint);
	}

	.courses {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
	.course {
		display: flex;
		text-align: left;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-lg);
		overflow: hidden;
		cursor: pointer;
		box-shadow: var(--shadow-sm);
		transition:
			box-shadow 0.16s ease,
			transform 0.12s ease;
	}
	.course:hover {
		box-shadow: var(--shadow-md);
		transform: translateY(-2px);
	}
	.course:hover .edit-hint {
		color: var(--iris);
	}
	.spine {
		width: 5px;
		background: var(--c);
		flex-shrink: 0;
	}
	.course-body {
		padding: 1rem 1.2rem 1.15rem;
		min-width: 0;
		flex: 1;
	}
	.course-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.code {
		font-size: var(--t-xs);
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.course-body h3 {
		font-size: var(--t-md);
		margin: 0.2rem 0 0.5rem;
		letter-spacing: -0.01em;
	}
	.details {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		margin-bottom: 0.7rem;
	}
	.detail {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
		font-size: var(--t-sm);
		color: var(--muted);
	}
	.detail :global(.sym) {
		color: var(--faint);
	}
	.meetings {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.meeting {
		font-size: var(--t-xs);
		padding: 0.24em 0.6em;
		border-radius: var(--r-pill);
		background: color-mix(in srgb, var(--c) 12%, transparent);
		color: var(--ink);
	}
	.no-meet {
		font-size: var(--t-sm);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		text-align: center;
		padding: 3rem 1rem;
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
