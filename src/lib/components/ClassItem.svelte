<script lang="ts">
	import type { ClassOccurrence } from '$lib/types';
	import { formatTime } from '$lib/date';
	import Icon from './Icon.svelte';

	let { occ }: { occ: ClassOccurrence } = $props();
</script>

<div class="class-item" style="--c:{occ.course.color}">
	<div class="time num">
		<span class="start">{formatTime(occ.start)}</span>
		<span class="end faint">{formatTime(occ.end)}</span>
	</div>
	<div class="bar"></div>
	<div class="body">
		<div class="title">{occ.course.title}</div>
		<div class="meta faint">
			{#if occ.course.code}<span class="num">{occ.course.code}</span>{/if}
			{#if occ.course.location}
				<span class="dot">·</span>
				<Icon name="location_on" size={14} />{occ.course.location}
			{/if}
		</div>
	</div>
</div>

<style>
	.class-item {
		display: grid;
		grid-template-columns: 4.5rem 4px 1fr;
		gap: 0.9rem;
		align-items: stretch;
		padding: 0.7rem 0;
	}
	.time {
		display: flex;
		flex-direction: column;
		text-align: right;
		font-size: var(--t-sm);
		line-height: 1.35;
		padding-top: 0.1rem;
	}
	.time .end {
		font-size: var(--t-xs);
	}
	.bar {
		border-radius: var(--r-pill);
		background: var(--c);
	}
	.body {
		min-width: 0;
	}
	.title {
		font-weight: 500;
		font-size: var(--t-md);
		letter-spacing: -0.01em;
	}
	.meta {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		font-size: var(--t-sm);
		margin-top: 0.1rem;
	}
	.dot {
		margin: 0 0.1rem;
	}
</style>
