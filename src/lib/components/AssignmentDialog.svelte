<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import type { Assignment } from '$lib/types';
	import Icon from './Icon.svelte';

	let { open = $bindable(false), editing = null }: { open?: boolean; editing?: Assignment | null } =
		$props();

	let dialog = $state<HTMLDialogElement>();

	// Form fields
	let title = $state('');
	let courseId = $state<string>('');
	let dueDate = $state('');
	let dueTime = $state('23:59');
	let notes = $state('');
	let high = $state(false);

	function reset() {
		if (editing) {
			const d = new Date(editing.due_at);
			title = editing.title;
			courseId = editing.course_id ?? '';
			dueDate = d.toISOString().slice(0, 10);
			dueTime = d.toTimeString().slice(0, 5);
			notes = editing.notes ?? '';
			high = editing.priority > 0;
		} else {
			title = '';
			courseId = planner.courses[0]?.id ?? '';
			dueDate = new Date().toISOString().slice(0, 10);
			dueTime = '23:59';
			notes = '';
			high = false;
		}
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
		if (!title.trim()) return;
		const due_at = `${dueDate}T${dueTime}:00`;
		if (editing) {
			planner.updateAssignment(editing.id, {
				title: title.trim(),
				course_id: courseId || null,
				due_at,
				notes: notes.trim() || null,
				priority: high ? 1 : 0
			});
		} else {
			planner.addAssignment({
				title: title.trim(),
				course_id: courseId || null,
				due_at,
				notes: notes.trim() || null,
				priority: high ? 1 : 0
			});
		}
		open = false;
	}

	function remove() {
		if (editing) planner.removeAssignment(editing.id);
		open = false;
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} class="dlg">
	<form onsubmit={submit}>
		<div class="dlg-head">
			<h2>{editing ? 'Edit assignment' : 'New assignment'}</h2>
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
			<label for="a-title">Title</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input id="a-title" type="text" bind:value={title} placeholder="Problem Set 3" autofocus />
		</div>

		<div class="two">
			<div class="field">
				<label for="a-course">Course</label>
				<select id="a-course" bind:value={courseId}>
					<option value="">No course</option>
					{#each planner.courses as c (c.id)}
						<option value={c.id}>{c.code ?? c.title}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="a-date">Due</label>
				<div class="due-row">
					<input id="a-date" type="date" bind:value={dueDate} />
					<input type="time" bind:value={dueTime} aria-label="Due time" />
				</div>
			</div>
		</div>

		<div class="field">
			<label for="a-notes">Notes</label>
			<textarea id="a-notes" bind:value={notes} placeholder="Optional details…" rows="2"></textarea>
		</div>

		<label class="checkline">
			<input type="checkbox" bind:checked={high} />
			<span>High priority</span>
		</label>

		<div class="dlg-foot">
			{#if editing}
				<button type="button" class="btn danger" onclick={remove}>
					<Icon name="delete" size={18} /> Delete
				</button>
			{/if}
			<div class="spacer"></div>
			<button type="button" class="btn" onclick={() => (open = false)}>Cancel</button>
			<button type="submit" class="btn btn-primary">{editing ? 'Save' : 'Add'}</button>
		</div>
	</form>
</dialog>

<style>
	.dlg {
		border: 1px solid var(--line);
		border-radius: var(--r-xl);
		padding: 0;
		width: min(94vw, 460px);
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
	.due-row {
		display: flex;
		gap: 0.4rem;
	}
	.due-row input[type='time'] {
		max-width: 7.5rem;
	}
	.checkline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: var(--t-sm);
		cursor: pointer;
	}
	.checkline input {
		width: auto;
		accent-color: var(--iris);
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
	@media (max-width: 460px) {
		.two {
			grid-template-columns: 1fr;
		}
	}
</style>
