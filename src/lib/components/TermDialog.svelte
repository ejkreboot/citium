<script lang="ts">
	import { getPlanner } from '$lib/planner.svelte';
	import { COURSE_PALETTE } from '$lib/mock';
	import { halfTermBoundary } from '$lib/schedule';
	import { formatDayKey } from '$lib/date';
	import type { Term } from '$lib/types';
	import Icon from './Icon.svelte';

	const planner = getPlanner();

	let { open = $bindable(false), editing = null }: { open?: boolean; editing?: Term | null } =
		$props();

	let dialog = $state<HTMLDialogElement>();
	let name = $state('');
	let start = $state('');
	let end = $state('');
	let color = $state(COURSE_PALETTE[0]);

	function reset() {
		const year = new Date().getFullYear();
		name = editing?.name ?? `Fall ${year}`;
		start = editing?.start_date ?? `${year}-09-01`;
		end = editing?.end_date ?? `${year}-12-18`;
		color = editing?.color ?? COURSE_PALETTE[planner.terms.length % COURSE_PALETTE.length];
	}

	const invalid = $derived(!name.trim() || !start || !end || start > end);

	// Show where this term splits, since courses can be assigned to either half.
	const halves = $derived(
		invalid ? null : halfTermBoundary({ start_date: start, end_date: end } as Term)
	);

	// Courses lose their term (and any half-term setting becomes a full range)
	// when a term is deleted — worth saying out loud before it happens.
	const affected = $derived(editing ? planner.coursesInTerm(editing.id).length : 0);

	$effect(() => {
		if (open && dialog && !dialog.open) {
			reset();
			dialog.showModal();
		} else if (!open && dialog?.open) {
			dialog.close();
		}
	});

	function submit(e: Event) {
		e.preventDefault();
		if (invalid) return;
		const data = { name: name.trim(), start_date: start, end_date: end, color };
		if (editing) planner.updateTerm(editing.id, data);
		else planner.addTerm(data);
		open = false;
	}

	function remove() {
		if (editing) planner.removeTerm(editing.id);
		open = false;
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} class="dlg">
	<form onsubmit={submit}>
		<div class="dlg-head">
			<h2>{editing ? 'Edit term' : 'New term'}</h2>
			<button
				type="button"
				class="btn btn-icon btn-ghost"
				onclick={() => (open = false)}
				aria-label="Close"
			>
				<Icon name="close" size={20} />
			</button>
		</div>
		<div class="field">
			<label for="t-name">Term name</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input id="t-name" type="text" bind:value={name} placeholder="Fall 2026" autofocus />
		</div>
		<div class="two">
			<div class="field">
				<label for="t-start">Starts</label>
				<input id="t-start" type="date" bind:value={start} />
			</div>
			<div class="field">
				<label for="t-end">Ends</label>
				<input id="t-end" type="date" bind:value={end} />
			</div>
		</div>

		{#if start && end && start > end}
			<p class="hint warn">
				<Icon name="error" size={15} />
				The end date must fall on or after the start date.
			</p>
		{:else if halves}
			<p class="hint">
				<Icon name="content_cut" size={15} />
				Halves split at {formatDayKey(halves.firstEnd)} / {formatDayKey(halves.secondStart)}
			</p>
		{/if}

		<div class="field">
			<span class="glabel" id="t-color-lbl">Color</span>
			<div class="swatches" role="group" aria-labelledby="t-color-lbl">
				{#each COURSE_PALETTE as c (c)}
					<button
						type="button"
						class="sw"
						class:sel={color === c}
						style="background:{c}"
						onclick={() => (color = c)}
						aria-label="Select color {c}"
					>
						{#if color === c}<Icon name="check" size={15} />{/if}
					</button>
				{/each}
			</div>
		</div>

		<div class="dlg-foot">
			{#if editing}
				<button type="button" class="btn danger" onclick={remove}>
					<Icon name="delete" size={18} /> Delete
				</button>
			{/if}
			<div class="spacer"></div>
			<button type="button" class="btn" onclick={() => (open = false)}>Cancel</button>
			<button type="submit" class="btn btn-primary" disabled={invalid}>
				{editing ? 'Save' : 'Add term'}
			</button>
		</div>

		{#if editing && affected > 0}
			<p class="hint faint-hint">
				Deleting keeps {affected}
				{affected === 1 ? 'course' : 'courses'} but unassigns {affected === 1 ? 'it' : 'them'} from this
				term.
			</p>
		{/if}
	</form>
</dialog>

<style>
	.dlg {
		border: 1px solid var(--line);
		border-radius: var(--r-xl);
		padding: 0;
		width: min(94vw, 420px);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-lg);
	}
	.dlg::backdrop {
		background: rgba(33, 30, 43, 0.35);
		backdrop-filter: blur(2px);
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.5rem;
	}
	.dlg-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.dlg-head h2 {
		font-size: var(--t-lg);
	}
	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.85rem;
	}
	.dlg-foot {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
	.spacer {
		flex: 1;
	}
	.danger {
		color: var(--coral);
		border-color: transparent;
	}
	.danger:hover {
		background: var(--coral-tint);
		border-color: transparent;
	}

	.glabel {
		display: block;
		margin-bottom: 0.4rem;
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.swatches {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.sw {
		width: 30px;
		height: 30px;
		border-radius: var(--r-pill);
		border: 2px solid transparent;
		cursor: pointer;
		display: grid;
		place-items: center;
		color: #fff;
	}
	.sw.sel {
		box-shadow:
			0 0 0 2px var(--surface),
			0 0 0 4px currentColor;
	}

	.hint {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: -0.4rem;
		padding: 0.5rem 0.7rem;
		border-radius: var(--r-md);
		background: var(--paper);
		font-size: var(--t-sm);
		color: var(--muted);
	}
	.hint :global(.sym) {
		color: var(--iris);
		flex-shrink: 0;
	}
	.hint.warn {
		background: var(--coral-tint);
		color: var(--coral);
	}
	.hint.warn :global(.sym) {
		color: var(--coral);
	}
	.faint-hint {
		margin-top: 0;
		background: transparent;
		padding: 0 0.1rem;
		font-size: var(--t-xs);
		color: var(--faint);
	}
</style>
