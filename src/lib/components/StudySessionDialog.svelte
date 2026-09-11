<script lang="ts">
	import { dayKey } from '$lib/date';
	import { getPlanner } from '$lib/planner.svelte';
	import type { StudySession } from '$lib/types';
	import Icon from './Icon.svelte';

	const planner = getPlanner();

	let {
		open = $bindable(false),
		editing = null,
		date
	}: { open?: boolean; editing?: StudySession | null; date: Date } = $props();

	let dialog = $state<HTMLDialogElement>();
	let title = $state('');
	let courseId = $state('');
	let sessionDate = $state('');
	let startTime = $state('16:00');
	let endTime = $state('17:00');
	let notes = $state('');

	function reset() {
		if (editing) {
			const start = new Date(editing.starts_at);
			const end = new Date(editing.ends_at);
			title = editing.title;
			courseId = editing.course_id ?? '';
			sessionDate = dayKey(start);
			startTime = start.toTimeString().slice(0, 5);
			endTime = end.toTimeString().slice(0, 5);
			notes = editing.notes ?? '';
		} else {
			title = 'Study session';
			courseId = planner.courses[0]?.id ?? '';
			sessionDate = dayKey(date);
			startTime = '16:00';
			endTime = '17:00';
			notes = '';
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

	function submit(event: Event) {
		event.preventDefault();
		if (!title.trim() || !sessionDate || startTime >= endTime) return;
		const data = {
			title: title.trim(),
			course_id: courseId || null,
			notes: notes.trim() || null,
			starts_at: `${sessionDate}T${startTime}:00`,
			ends_at: `${sessionDate}T${endTime}:00`
		};
		if (editing) planner.updateStudySession(editing.id, data);
		else planner.addStudySession(data);
		open = false;
	}

	function remove() {
		if (editing) planner.removeStudySession(editing.id);
		open = false;
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} class="dlg">
	<form onsubmit={submit}>
		<div class="dlg-head">
			<h2>{editing ? 'Edit study session' : 'New study session'}</h2>
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
			<label for="s-title">Title</label>
			<input id="s-title" type="text" bind:value={title} placeholder="Review chapter 4" />
		</div>

		<div class="two">
			<div class="field">
				<label for="s-course">Course</label>
				<select id="s-course" bind:value={courseId}>
					<option value="">No course</option>
					{#each planner.courses as course (course.id)}
						<option value={course.id}>{course.code ?? course.title}</option>
					{/each}
				</select>
			</div>
			<div class="field">
				<label for="s-date">Date</label>
				<input id="s-date" type="date" bind:value={sessionDate} />
			</div>
		</div>

		<div class="two">
			<div class="field">
				<label for="s-start">Start</label><input id="s-start" type="time" bind:value={startTime} />
			</div>
			<div class="field">
				<label for="s-end">End</label><input id="s-end" type="time" bind:value={endTime} />
			</div>
		</div>

		<div class="field">
			<label for="s-notes">Notes</label>
			<textarea id="s-notes" bind:value={notes} placeholder="Optional focus or materials" rows="2"
			></textarea>
		</div>

		<div class="dlg-foot">
			{#if editing}
				<button type="button" class="btn danger" onclick={remove}
					><Icon name="delete" size={18} /> Delete</button
				>
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
	.dlg-head,
	.dlg-foot {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.dlg-head {
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
	.spacer {
		flex: 1;
	}
	@media (max-width: 440px) {
		.two {
			grid-template-columns: 1fr;
		}
	}
</style>
