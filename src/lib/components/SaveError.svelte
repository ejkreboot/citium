<!--
	Surfaces a write the database refused.

	Optimistic mutations revert on failure (see planner.run), so without this the
	UI would just snap back to the previous value — which is exactly how the
	missing-`kind`-column bug went unnoticed until a page reload.
-->
<script lang="ts">
	import Icon from '$lib/components/Icon.svelte';
	import { getPlanner } from '$lib/planner.svelte';

	const planner = getPlanner();
</script>

{#if planner.saveError}
	<div class="save-error" role="alert">
		<Icon name="cloud_off" size={20} />
		<span class="text">
			<strong>Not saved.</strong>
			{planner.saveError.message}
		</span>
		<button class="dismiss" onclick={() => planner.clearSaveError()} aria-label="Dismiss">
			<Icon name="close" size={18} />
		</button>
	</div>
{/if}

<style>
	.save-error {
		position: fixed;
		z-index: 100;
		left: 50%;
		transform: translateX(-50%);
		bottom: 1.25rem;
		display: flex;
		align-items: center;
		gap: 0.7rem;
		max-width: min(34rem, calc(100vw - 2rem));
		padding: 0.7rem 0.8rem 0.7rem 0.9rem;
		border: 1px solid var(--coral);
		border-radius: var(--r-md);
		background: var(--surface);
		box-shadow: var(--shadow-lg);
		color: var(--ink);
		font-size: var(--t-sm);
		line-height: 1.4;
	}
	.save-error > :global(.sym) {
		color: var(--coral);
		flex-shrink: 0;
	}
	.text {
		min-width: 0;
	}
	.dismiss {
		display: flex;
		flex-shrink: 0;
		padding: 0.2rem;
		margin-left: auto;
		border-radius: var(--r-sm);
		color: var(--muted);
	}
	.dismiss:hover {
		background: var(--surface-sunk);
		color: var(--ink);
	}

	/* Clear the bottom tab bar on mobile. */
	@media (max-width: 820px) {
		.save-error {
			bottom: 4.75rem;
		}
	}
</style>
