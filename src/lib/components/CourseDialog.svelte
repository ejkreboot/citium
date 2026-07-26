<script lang="ts">
	import { planner } from '$lib/planner.svelte';
	import { COURSE_PALETTE } from '$lib/mock';
	import { WEEKDAYS } from '$lib/date';
	import type { Course } from '$lib/types';
	import Icon from './Icon.svelte';

	let { open = $bindable(false), editing = null }: { open?: boolean; editing?: Course | null } =
		$props();

	let dialog = $state<HTMLDialogElement>();

	// A meeting "block": a shared time across one or more weekdays (e.g. MWF 9:00).
	interface Block {
		days: number[];
		start: string;
		end: string;
	}

	let title = $state('');
	let code = $state('');
	let instructor = $state('');
	let location = $state('');
	let color = $state(COURSE_PALETTE[0]);
	let blocks = $state<Block[]>([{ days: [], start: '09:00', end: '09:50' }]);

	function blocksFromMeetings(courseId: string): Block[] {
		const ms = planner.meetingsFor(courseId);
		const map = new Map<string, Block>();
		for (const m of ms) {
			const key = `${m.start_time}-${m.end_time}`;
			if (!map.has(key)) map.set(key, { days: [], start: m.start_time, end: m.end_time });
			map.get(key)!.days.push(m.day_of_week);
		}
		const out = [...map.values()];
		return out.length ? out : [{ days: [], start: '09:00', end: '09:50' }];
	}

	function reset() {
		if (editing) {
			title = editing.title;
			code = editing.code ?? '';
			instructor = editing.instructor ?? '';
			location = editing.location ?? '';
			color = editing.color;
			blocks = blocksFromMeetings(editing.id);
		} else {
			title = '';
			code = '';
			instructor = '';
			location = '';
			color = COURSE_PALETTE[planner.courses.length % COURSE_PALETTE.length];
			blocks = [{ days: [], start: '09:00', end: '09:50' }];
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

	function toggleDay(b: Block, d: number) {
		b.days = b.days.includes(d) ? b.days.filter((x) => x !== d) : [...b.days, d];
	}
	function addBlock() {
		blocks = [...blocks, { days: [], start: '13:00', end: '14:15' }];
	}
	function removeBlock(i: number) {
		blocks = blocks.filter((_, idx) => idx !== i);
	}

	function submit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;
		const term = planner.activeTerm;
		const data = {
			term_id: term?.id ?? null,
			title: title.trim(),
			code: code.trim() || null,
			instructor: instructor.trim() || null,
			location: location.trim() || null,
			color
		};
		const courseId = editing ? editing.id : planner.addCourse(data).id;
		if (editing) planner.updateCourse(courseId, data);

		const meetings = blocks.flatMap((b) =>
			b.days.map((d) => ({ day_of_week: d, start_time: b.start, end_time: b.end }))
		);
		planner.setMeetings(courseId, meetings);
		open = false;
	}

	function remove() {
		if (editing) planner.removeCourse(editing.id);
		open = false;
	}
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} class="dlg">
	<form onsubmit={submit}>
		<div class="dlg-head">
			<h2>{editing ? 'Edit course' : 'New course'}</h2>
			<button type="button" class="btn btn-icon btn-ghost" onclick={() => (open = false)} aria-label="Close">
				<Icon name="close" size={20} />
			</button>
		</div>

		<div class="two">
			<div class="field grow">
				<label for="c-title">Course name</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input id="c-title" type="text" bind:value={title} placeholder="Introduction to Psychology" autofocus />
			</div>
			<div class="field code-field">
				<label for="c-code">Code</label>
				<input id="c-code" type="text" bind:value={code} placeholder="PSY 101" />
			</div>
		</div>

		<div class="two">
			<div class="field">
				<label for="c-inst">Instructor</label>
				<input id="c-inst" type="text" bind:value={instructor} placeholder="Dr. Bennett" />
			</div>
			<div class="field">
				<label for="c-loc">Location</label>
				<input id="c-loc" type="text" bind:value={location} placeholder="Hale Hall 204" />
			</div>
		</div>

		<div class="field">
			<span class="glabel" id="color-lbl">Color</span>
			<div class="swatches" role="group" aria-labelledby="color-lbl">
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

		<div class="field">
			<span class="glabel">Weekly meetings</span>
			<div class="blocks">
				{#each blocks as b, i (i)}
					<div class="block">
						<div class="days">
							{#each WEEKDAYS as name, d (d)}
								<button
									type="button"
									class="day"
									class:on={b.days.includes(d)}
									onclick={() => toggleDay(b, d)}
									aria-pressed={b.days.includes(d)}
								>
									{name[0]}
								</button>
							{/each}
						</div>
						<div class="times">
							<input type="time" bind:value={b.start} aria-label="Start time" />
							<span class="dash">–</span>
							<input type="time" bind:value={b.end} aria-label="End time" />
							{#if blocks.length > 1}
								<button type="button" class="tool" onclick={() => removeBlock(i)} aria-label="Remove meeting time">
									<Icon name="close" size={16} />
								</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
			<button type="button" class="btn btn-ghost add-block" onclick={addBlock}>
				<Icon name="add" size={18} /> Add another meeting time
			</button>
		</div>

		<div class="dlg-foot">
			{#if editing}
				<button type="button" class="btn danger" onclick={remove}>
					<Icon name="delete" size={18} /> Delete
				</button>
			{/if}
			<div class="spacer"></div>
			<button type="button" class="btn" onclick={() => (open = false)}>Cancel</button>
			<button type="submit" class="btn btn-primary">{editing ? 'Save' : 'Add course'}</button>
		</div>
	</form>
</dialog>

<style>
	.dlg {
		border: 1px solid var(--line);
		border-radius: var(--r-xl);
		padding: 0;
		width: min(94vw, 520px);
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
		max-height: 88vh;
		overflow-y: auto;
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
	.code-field {
		max-width: 40%;
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
	.two:has(.grow) {
		grid-template-columns: 1fr auto;
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
		box-shadow: 0 0 0 2px var(--surface), 0 0 0 4px currentColor;
	}

	.blocks {
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
	}
	.block {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 0.7rem;
		background: var(--paper);
		border: 1px solid var(--line);
		border-radius: var(--r-md);
	}
	.days {
		display: flex;
		gap: 0.3rem;
	}
	.day {
		width: 30px;
		height: 30px;
		border-radius: var(--r-pill);
		border: 1px solid var(--line);
		background: var(--surface);
		cursor: pointer;
		font-family: var(--font-mono);
		font-size: var(--t-sm);
		color: var(--muted);
		transition: all 0.12s ease;
	}
	.day.on {
		background: var(--iris);
		border-color: var(--iris);
		color: #fff;
	}
	.times {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}
	.times input[type='time'] {
		max-width: 8rem;
	}
	.dash {
		color: var(--faint);
	}
	.tool {
		border: 0;
		background: transparent;
		color: var(--faint);
		cursor: pointer;
		padding: 0.3rem;
		border-radius: var(--r-sm);
		display: grid;
		place-items: center;
		margin-left: auto;
	}
	.tool:hover {
		color: var(--coral);
		background: var(--coral-tint);
	}
	.add-block {
		align-self: flex-start;
		font-size: var(--t-sm);
		color: var(--iris);
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
	@media (max-width: 480px) {
		.two,
		.two:has(.grow) {
			grid-template-columns: 1fr;
		}
		.code-field {
			max-width: none;
		}
	}
</style>
