<script lang="ts">
	import { getPlanner } from '$lib/planner.svelte';
	import Icon from '$lib/components/Icon.svelte';

	const planner = getPlanner();

	// Pinned first, otherwise most-recently-updated first.
	const ordered = $derived(
		[...planner.notes].sort((a, b) => {
			if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
			return b.updated_at.localeCompare(a.updated_at);
		})
	);

	let justAdded = $state<string | null>(null);

	function add() {
		const n = planner.addNote('');
		justAdded = n.id;
	}

	function autofocus(el: HTMLTextAreaElement, id: string) {
		if (id === justAdded) {
			el.focus();
			justAdded = null;
		}
	}
</script>

<header class="head">
	<div class="titles">
		<p class="eyebrow">Scratchpad</p>
		<h1>Notes</h1>
	</div>
	<button class="btn btn-primary" onclick={add}>
		<Icon name="add" size={20} /> New note
	</button>
</header>

{#if ordered.length}
	<div class="wall">
		{#each ordered as n (n.id)}
			<div class="note" class:pinned={n.pinned}>
				<div class="note-tools">
					<button
						class="tool"
						class:active={n.pinned}
						onclick={() => planner.togglePin(n.id)}
						aria-label={n.pinned ? 'Unpin' : 'Pin'}
						title={n.pinned ? 'Unpin' : 'Pin'}
					>
						<Icon name="push_pin" size={17} fill={n.pinned} />
					</button>
					<button
						class="tool del"
						onclick={() => planner.removeNote(n.id)}
						aria-label="Delete note"
						title="Delete"
					>
						<Icon name="delete" size={17} />
					</button>
				</div>
				<textarea
					value={n.content}
					placeholder="Write a reminder…"
					rows="3"
					oninput={(e) => planner.updateNote(n.id, e.currentTarget.value)}
					use:autofocus={n.id}></textarea>
			</div>
		{/each}
	</div>
{:else}
	<div class="card empty">
		<Icon name="edit_note" size={30} />
		<p>Your scratchpad is empty.</p>
		<p class="faint">Jot down reminders, office hours, anything.</p>
		<button class="btn" onclick={add} style="margin-top:0.75rem"
			><Icon name="add" size={18} /> New note</button
		>
	</div>
{/if}

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

	.wall {
		columns: 260px;
		column-gap: 1rem;
	}
	.note {
		break-inside: avoid;
		margin-bottom: 1rem;
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-md);
		box-shadow: var(--shadow-sm);
		padding: 0.5rem 0.5rem 0.25rem;
		transition: box-shadow 0.16s ease;
	}
	.note:hover {
		box-shadow: var(--shadow-md);
	}
	.note.pinned {
		background: linear-gradient(0deg, var(--amber-tint), var(--amber-tint)), var(--surface);
		border-color: color-mix(in srgb, var(--amber) 35%, var(--line));
	}
	.note-tools {
		display: flex;
		justify-content: flex-end;
		gap: 0.1rem;
		opacity: 0;
		transition: opacity 0.14s ease;
	}
	.note:hover .note-tools,
	.note:focus-within .note-tools,
	.note.pinned .note-tools {
		opacity: 1;
	}
	.tool {
		border: 0;
		background: transparent;
		color: var(--faint);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: var(--r-sm);
		display: grid;
		place-items: center;
	}
	.tool:hover {
		color: var(--ink);
		background: var(--surface-sunk);
	}
	.tool.active {
		color: var(--amber);
	}
	.tool.del:hover {
		color: var(--coral);
		background: var(--coral-tint);
	}
	textarea {
		width: 100%;
		border: 0;
		background: transparent;
		box-shadow: none;
		padding: 0.25rem 0.55rem 0.6rem;
		resize: none;
		min-height: 3.5rem;
		field-sizing: content;
		line-height: 1.5;
	}
	textarea:focus {
		outline: none;
		border: 0;
		box-shadow: none;
		background: transparent;
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
