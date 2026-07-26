<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { occurrencesOn } from '$lib/schedule';
	import { quoteForDay } from '$lib/quotes';
	import { WEEKDAYS_LONG, MONTHS, dayKey } from '$lib/date';
	import ClassItem from '$lib/components/ClassItem.svelte';
	import AssignmentItem from '$lib/components/AssignmentItem.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const now = new Date();
	const quote = quoteForDay(now);

	const greeting = $derived.by(() => {
		const h = now.getHours();
		if (h < 12) return 'Good morning';
		if (h < 17) return 'Good afternoon';
		return 'Good evening';
	});

	const dateLabel = `${WEEKDAYS_LONG[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

	const todayClasses = $derived(
		occurrencesOn(now, {
			courses: planner.courses,
			meetings: planner.meetings,
			terms: planner.terms
		})
	);

	const upcoming = $derived(
		planner.assignments
			.filter((a) => a.status !== 'done')
			.filter((a) => dayKey(new Date(a.due_at)) >= dayKey(now))
			.sort((a, b) => a.due_at.localeCompare(b.due_at))
			.slice(0, 5)
	);

	const pinned = $derived(planner.notes.filter((n) => n.pinned).slice(0, 3));

	const term = $derived(planner.activeTerm);
	const daysToTerm = $derived.by(() => {
		if (!term) return 0;
		const start = new Date(term.start_date);
		return Math.ceil((start.getTime() - now.getTime()) / 86400000);
	});
</script>

<header class="head rise">
	<p class="eyebrow">{dateLabel}</p>
	<h1>{greeting}.</h1>
</header>

<!-- Thought of the day: the editorial centerpiece -->
<figure class="thought card rise" style="animation-delay: 40ms">
	<span class="quote-mark" aria-hidden="true">&ldquo;</span>
	<blockquote>{quote.text}</blockquote>
	<figcaption>— {quote.author}</figcaption>
</figure>

<div class="grid">
	<section class="card panel rise" style="animation-delay: 80ms">
		<div class="panel-head">
			<h2>Today's classes</h2>
			<a href="/schedule" class="see">Schedule <Icon name="arrow_forward" size={16} /></a>
		</div>
		{#if todayClasses.length}
			<div class="list divided">
				{#each todayClasses as occ (occ.meeting.id)}
					<ClassItem {occ} />
				{/each}
			</div>
		{:else}
			<div class="empty">
				<Icon name="wb_sunny" size={26} />
				{#if term && daysToTerm > 0}
					<p>No classes today.</p>
					<p class="faint">{term.name} begins in {daysToTerm} days.</p>
				{:else}
					<p>Nothing scheduled today.</p>
					<p class="faint">Enjoy the quiet.</p>
				{/if}
			</div>
		{/if}
	</section>

	<section class="card panel rise" style="animation-delay: 120ms">
		<div class="panel-head">
			<h2>Up next</h2>
			<a href="/homework" class="see">Homework <Icon name="arrow_forward" size={16} /></a>
		</div>
		{#if upcoming.length}
			<div class="list divided">
				{#each upcoming as a (a.id)}
					<AssignmentItem assignment={a} />
				{/each}
			</div>
		{:else}
			<div class="empty">
				<Icon name="task_alt" size={26} />
				<p>All caught up.</p>
				<p class="faint">No homework due.</p>
			</div>
		{/if}
	</section>
</div>

{#if pinned.length}
	<section class="card panel pins rise" style="animation-delay: 160ms">
		<div class="panel-head">
			<h2>Pinned notes</h2>
			<a href="/notes" class="see">Notes <Icon name="arrow_forward" size={16} /></a>
		</div>
		<div class="pin-grid">
			{#each pinned as n (n.id)}
				<div class="pin">
					<Icon name="push_pin" size={16} fill />
					<p>{n.content}</p>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.head {
		margin-bottom: 1.5rem;
	}
	.head h1 {
		font-size: var(--t-display);
		margin-top: 0.35rem;
	}

	.thought {
		position: relative;
		padding: 2rem 2.25rem;
		margin-bottom: 1.75rem;
		background:
			radial-gradient(120% 140% at 100% 0%, var(--iris-tint) 0%, transparent 55%),
			var(--surface);
		overflow: hidden;
	}
	.quote-mark {
		position: absolute;
		top: -1.2rem;
		left: 1rem;
		font-family: var(--font-display);
		font-size: 8rem;
		line-height: 1;
		color: var(--iris-tint-strong);
		user-select: none;
	}
	.thought blockquote {
		position: relative;
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: clamp(1.25rem, 0.9rem + 1.4vw, 1.7rem);
		line-height: 1.4;
		letter-spacing: -0.01em;
		max-width: 44ch;
	}
	.thought figcaption {
		margin-top: 0.9rem;
		font-family: var(--font-mono);
		font-size: var(--t-sm);
		color: var(--muted);
	}

	.grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}
	.panel {
		padding: 1.35rem 1.5rem;
	}
	.panel-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		margin-bottom: 0.5rem;
	}
	.panel-head h2 {
		font-size: var(--t-lg);
	}
	.see {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		font-size: var(--t-sm);
		font-weight: 500;
		color: var(--iris);
	}
	.see:hover {
		color: var(--iris-strong);
	}

	.list.divided > :global(* + *) {
		border-top: 1px solid var(--line-soft);
	}

	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		text-align: center;
		padding: 1.75rem 1rem;
		color: var(--muted);
	}
	.empty :global(.sym) {
		color: var(--faint);
		margin-bottom: 0.35rem;
	}
	.empty p {
		font-size: var(--t-sm);
	}

	.pins {
		margin-top: 1.25rem;
	}
	.pin-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-top: 0.5rem;
	}
	.pin {
		display: flex;
		gap: 0.55rem;
		padding: 0.85rem 1rem;
		background: var(--amber-tint);
		border-radius: var(--r-md);
		font-size: var(--t-sm);
	}
	.pin :global(.sym) {
		color: var(--amber);
		flex-shrink: 0;
		margin-top: 1px;
	}

	@media (max-width: 720px) {
		.grid {
			grid-template-columns: 1fr;
		}
	}
</style>
