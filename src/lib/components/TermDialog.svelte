<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import type { Term } from '$lib/types';
	import Icon from './Icon.svelte';

	let { open = $bindable(false), editing = null }: { open?: boolean; editing?: Term | null } =
		$props();

	let dialog = $state<HTMLDialogElement>();
	let name = $state('');
	let start = $state('');
	let end = $state('');

	function reset() {
		const year = new Date().getFullYear();
		name = editing?.name ?? `Fall ${year}`;
		start = editing?.start_date ?? `${year}-09-01`;
		end = editing?.end_date ?? `${year}-12-18`;
	}

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
		if (!name.trim() || !start || !end) return;
		if (editing) {
			planner.updateTerm(editing.id, { name: name.trim(), start_date: start, end_date: end });
		} else {
			planner.addTerm({ name: name.trim(), start_date: start, end_date: end, color: '#5b5b8a' });
		}
		open = false;
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} class="dlg">
	<form onsubmit={submit}>
		<div class="dlg-head">
			<h2>{editing ? 'Edit term' : 'New term'}</h2>
			<button type="button" class="btn btn-icon btn-ghost" onclick={() => (open = false)} aria-label="Close">
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
		<div class="dlg-foot">
			<button type="button" class="btn" onclick={() => (open = false)}>Cancel</button>
			<button type="submit" class="btn btn-primary">{editing ? 'Save' : 'Add term'}</button>
		</div>
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
		justify-content: flex-end;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}
</style>
