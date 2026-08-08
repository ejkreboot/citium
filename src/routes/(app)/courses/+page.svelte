<script lang="ts">
	import { getPlanner } from '$lib/planner.svelte';
	import { courseRange, meetingSummary, rangeLabel, sessionLabel } from '$lib/schedule';
	import { dayKey, formatDayKey } from '$lib/date';
	import type { Course, Term } from '$lib/types';
	import CourseDialog from '$lib/components/CourseDialog.svelte';
	import TermDialog from '$lib/components/TermDialog.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const planner = getPlanner();

	let courseOpen = $state(false);
	let editingCourse = $state<Course | null>(null);
	let termOpen = $state(false);
	let editingTerm = $state<Term | null>(null);

	const activeTerm = $derived(planner.activeTerm);

	// One section per term, in chronological order, plus a trailing section for
	// courses that aren't assigned to any term.
	const sections = $derived.by(() => {
		const out: Array<{ term: Term | null; courses: Course[] }> = planner.sortedTerms.map(
			(term) => ({ term, courses: planner.coursesInTerm(term.id) })
		);
		const orphans = planner.coursesInTerm(null);
		if (orphans.length) out.push({ term: null, courses: orphans });
		return out;
	});

	/**
	 * The active term is what new courses default into, so call it out rather
	 * than leaving two identical "Upcoming" chips with only a tint between them.
	 */
	function termStatus(term: Term): string {
		const today = dayKey(new Date());
		if (today >= term.start_date && today <= term.end_date) return 'Current';
		if (term.id === activeTerm?.id) return 'Next up';
		return today > term.end_date ? 'Past' : 'Upcoming';
	}

	function newCourse() {
		editingCourse = null;
		courseOpen = true;
	}
	function editCourse(c: Course) {
		editingCourse = c;
		courseOpen = true;
	}
	function newTerm() {
		editingTerm = null;
		termOpen = true;
	}
	function editTerm(t: Term) {
		editingTerm = t;
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

{#if !planner.terms.length}
	<button class="term-card" onclick={newTerm}>
		<div class="term-info">
			<span class="eyebrow">Term</span>
			<span class="term-name">Set up your first term</span>
			<span class="term-dates">Terms bound when your classes meet.</span>
		</div>
		<span class="edit-hint"><Icon name="add" size={20} /></span>
	</button>
{/if}

{#each sections as section (section.term?.id ?? 'unassigned')}
	<section class="term-section">
		{#if section.term}
			{@const t = section.term}
			<div class="section-head" style="--c:{t.color}">
				<button class="term-title" onclick={() => editTerm(t)}>
					<span class="term-swatch"></span>
					<span class="term-name">{t.name}</span>
					<span class="status" class:now={t.id === activeTerm?.id}>{termStatus(t)}</span>
					<span class="term-dates num">
						{formatDayKey(t.start_date)} – {formatDayKey(t.end_date)}
					</span>
					<span class="edit-hint"><Icon name="edit" size={16} /></span>
				</button>
			</div>
		{:else}
			<div class="section-head">
				<div class="term-title as-text">
					<span class="term-name">Not in a term</span>
					<span class="term-dates">These classes repeat weekly with no end date.</span>
				</div>
			</div>
		{/if}

		{#if section.courses.length}
			<div class="courses">
				{#each section.courses as c (c.id)}
					{@const summary = meetingSummary(planner.meetingsFor(c.id))}
					{@const badge = sessionLabel(c)}
					{@const span = rangeLabel(courseRange(c, section.term ?? undefined))}
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
							{#if badge}
								<div class="session">
									<span class="session-badge">{badge}</span>
									{#if span}<span class="session-span num">{span}</span>{/if}
								</div>
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<p class="section-empty faint">No courses in this term yet.</p>
		{/if}
	</section>
{/each}

{#if !planner.courses.length}
	<div class="card empty">
		<Icon name="school" size={30} />
		<p>No courses yet.</p>
		<p class="faint">Add your first class to build your schedule.</p>
		<button class="btn btn-primary" onclick={newCourse} style="margin-top:0.85rem">
			<Icon name="add" size={18} /> Add course
		</button>
	</div>
{/if}

<button class="btn add-term" onclick={newTerm}>
	<Icon name="add" size={18} /> Add term
</button>

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

	.term-section {
		margin-bottom: 2rem;
	}
	.section-head {
		margin-bottom: 0.85rem;
	}
	.term-title {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		flex-wrap: wrap;
		width: 100%;
		padding: 0 0 0.55rem;
		border: 0;
		border-bottom: 1px solid var(--line);
		background: transparent;
		text-align: left;
		cursor: pointer;
	}
	.term-title.as-text {
		cursor: default;
	}
	.term-title:not(.as-text):hover .term-name {
		color: var(--iris);
	}
	.term-title .term-name {
		font-size: 1.15rem;
	}
	.term-swatch {
		width: 9px;
		height: 9px;
		border-radius: var(--r-pill);
		background: var(--c);
		align-self: center;
		flex-shrink: 0;
	}
	.status {
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--faint);
		padding: 0.15em 0.55em;
		border-radius: var(--r-pill);
		background: var(--surface-sunk);
	}
	.status.now {
		background: var(--iris-tint);
		color: var(--iris-strong);
	}
	.term-title .term-dates {
		margin-left: auto;
		font-size: var(--t-xs);
	}
	.section-empty {
		font-size: var(--t-sm);
		padding: 0.75rem 0;
	}

	.session {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		margin-top: 0.5rem;
	}
	.session-badge {
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.06em;
		text-transform: uppercase;
		padding: 0.2em 0.55em;
		border-radius: var(--r-pill);
		border: 1px dashed color-mix(in srgb, var(--c) 55%, transparent);
		color: var(--muted);
	}
	.session-span {
		font-size: var(--t-xs);
		color: var(--faint);
	}

	.add-term {
		margin-top: 0.5rem;
		color: var(--muted);
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
