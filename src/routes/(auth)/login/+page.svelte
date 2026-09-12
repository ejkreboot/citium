<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import { quoteForDay } from '$lib/quotes';
	import Icon from '$lib/components/Icon.svelte';

	const supabase = $derived(page.data.supabase!);
	const quote = quoteForDay();

	let step = $state<'email' | 'code'>('email');
	let email = $state('');
	let code = $state('');
	let loading = $state(false);
	let error = $state('');

	const features = [
		{
			icon: 'calendar_month',
			title: 'Schedule',
			body: 'Classes and study blocks in day, week, month and year views.'
		},
		{
			icon: 'checklist',
			title: 'Homework & tests',
			body: 'Everything due in one list, sorted by date, with anything overdue surfaced rather than buried.'
		},
		{
			icon: 'edit_note',
			title: 'Notes',
			body: 'Quick reminders and scraps of thinking, with the ones that matter pinned to your day.'
		},
		{
			icon: 'wb_twilight',
			title: 'Today',
			body: 'One page each morning: the classes you have, the work that is next, and nothing else.'
		}
	];

	async function sendCode(e: Event) {
		e.preventDefault();
		if (!email.trim()) return;
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.signInWithOtp({
			email: email.trim(),
			options: { shouldCreateUser: true }
		});
		loading = false;
		if (err) {
			error = err.message;
			return;
		}
		step = 'code';
	}

	async function verify(e: Event) {
		e.preventDefault();
		if (code.trim().length < 6) return;
		loading = true;
		error = '';
		const { error: err } = await supabase.auth.verifyOtp({
			email: email.trim(),
			token: code.trim(),
			type: 'email'
		});
		if (err) {
			loading = false;
			error = err.message;
			return;
		}
		await invalidateAll();
		await goto(resolve('/'));
	}

	function restart() {
		step = 'email';
		code = '';
		error = '';
	}
</script>

<svelte:head>
	<title>Citium — a calm academic planner</title>
	<meta
		name="description"
		content="Citium is a free academic planner for classes, homework, tests and notes. No signup form, no password — just your email."
	/>
</svelte:head>

<div class="page">
	<header class="topbar">
		<!--
			Two files rather than one recoloured asset, matching the app sidebar: the
			mark is swapped by CSS (not by `theme`) so it is correct during SSR and
			before hydration. Decorative — the wordmark beside it names the app.
		-->
		<span class="brand">
			<img class="brand-logo on-light" src={asset('/logo.png')} alt="" width="48" height="48" />
			<img
				class="brand-logo on-dark"
				src={asset('/logo_white.png')}
				alt=""
				width="48"
				height="48"
			/>
			<span class="brand-words">
				<span class="brand-mark">Citium</span>
				<span class="brand-sub">planner</span>
			</span>
		</span>
		<span class="chip free">Free · no account to create</span>
	</header>

	<main>
		<section class="hero">
			<div class="pitch rise">
				<p class="eyebrow">An academic planner</p>
				<h1>Your whole term, on one quiet page.</h1>
				<p class="lede">
					Citium holds your classes, homework, tests and notes together — so the shape of your week
					is obvious at a glance.
				</p>
				<ul class="marks">
					<li>
						<Icon name="check_circle" size={20} />
						<span><strong>Free to use.</strong> No plans, no trial, no card.</span>
					</li>
					<li>
						<Icon name="check_circle" size={20} />
						<span>
							<strong>No signup form and no password.</strong> Enter your email, get a 6-digit code, and
							you're in — your planner is created the first time you use it.
						</span>
					</li>
				</ul>
			</div>

			<div class="panel card rise" style="animation-delay: 60ms">
				<h2 class="panel-title">
					{step === 'email' ? 'Start planning' : 'Check your email'}
				</h2>

				{#if step === 'email'}
					<form onsubmit={sendCode}>
						<div class="field">
							<label for="email">Email</label>
							<!-- svelte-ignore a11y_autofocus -->
							<input
								id="email"
								type="email"
								bind:value={email}
								placeholder="you@school.edu"
								autocomplete="email"
								autofocus
								required
							/>
						</div>
						<button class="btn btn-primary submit" type="submit" disabled={loading}>
							{#if loading}Sending…{:else}Send me a code <Icon
									name="arrow_forward"
									size={18}
								/>{/if}
						</button>
						<p class="hint">
							We'll email you a 6-digit code. No password needed — if it's your first time, we'll
							set you up automatically.
						</p>
					</form>
				{:else}
					<form onsubmit={verify}>
						<p class="sent">Enter the code we sent to <strong>{email}</strong>.</p>
						<div class="field">
							<label for="code">6-digit code</label>
							<!-- svelte-ignore a11y_autofocus -->
							<input
								id="code"
								class="code-input num"
								type="text"
								inputmode="numeric"
								autocomplete="one-time-code"
								maxlength="6"
								bind:value={code}
								placeholder="••••••"
								autofocus
								required
							/>
						</div>
						<button class="btn btn-primary submit" type="submit" disabled={loading}>
							{#if loading}Verifying…{:else}Verify & continue{/if}
						</button>
						<button class="btn-link" type="button" onclick={restart}>Use a different email</button>
					</form>
				{/if}

				{#if error}
					<p class="error" role="alert"><Icon name="error" size={16} /> {error}</p>
				{/if}
			</div>
		</section>

		<section class="features rise" style="animation-delay: 120ms" aria-label="What's inside">
			{#each features as f (f.title)}
				<article class="feature">
					<Icon name={f.icon} size={24} />
					<h3>{f.title}</h3>
					<p>{f.body}</p>
				</article>
			{/each}
		</section>

		<figure class="thought rise" style="animation-delay: 160ms">
			<blockquote>{quote.text}</blockquote>
			<figcaption>— {quote.author}</figcaption>
		</figure>
	</main>

</div>

<style>
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		gap: 3rem;
		padding: 1.5rem clamp(1.25rem, 5vw, 3rem) 2rem;
		background:
			radial-gradient(80% 55% at 50% -8%, var(--iris-tint) 0%, transparent 62%), var(--paper);
	}
	main {
		width: min(100%, var(--content-max));
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		gap: 3rem;
	}

	/* --- Top bar --- */
	.topbar {
		width: min(100%, var(--content-max));
		margin-inline: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 0.65rem;
	}
	.brand-logo {
		width: 48px;
		height: 48px;
		flex-shrink: 0;
		/* The mark is a fine line drawing; keep it crisp when it scales. */
		object-fit: contain;
	}
	.brand-words {
		display: flex;
		flex-direction: column;
	}
	.brand-mark {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 500;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}
	.brand-sub {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.chip.free {
		white-space: nowrap;
	}

	/*
	 * Light/dark mark swap, mirroring the palette precedence in app.css:
	 * dark wins on [data-theme='dark'], or on system-dark unless the user has
	 * explicitly pinned [data-theme='light'].
	 */
	.brand-logo.on-dark {
		display: none;
	}
	:global(:root[data-theme='dark']) .brand-logo.on-light {
		display: none;
	}
	:global(:root[data-theme='dark']) .brand-logo.on-dark {
		display: block;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-theme='light'])) .brand-logo.on-light {
			display: none;
		}
		:global(:root:not([data-theme='light'])) .brand-logo.on-dark {
			display: block;
		}
	}

	/* --- Hero --- */
	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
		align-items: start;
		gap: clamp(2rem, 5vw, 4rem);
		padding-top: clamp(1rem, 4vw, 3rem);
	}
	.pitch h1 {
		font-size: var(--t-display);
		margin-top: 0.5rem;
		max-width: 15ch;
	}
	.lede {
		margin-top: 1.1rem;
		font-size: var(--t-md);
		line-height: 1.6;
		color: var(--muted);
		max-width: 46ch;
	}
	.marks {
		list-style: none;
		padding: 0;
		margin: 1.75rem 0 0;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		max-width: 50ch;
	}
	.marks li {
		display: flex;
		gap: 0.65rem;
		font-size: var(--t-base);
		line-height: 1.55;
		color: var(--muted);
	}
	.marks :global(.sym) {
		color: var(--sage);
		flex-shrink: 0;
		margin-top: 1px;
	}
	.marks strong {
		color: var(--ink);
		font-weight: 500;
	}

	/* --- Sign-in panel --- */
	.panel {
		border-radius: var(--r-xl);
		box-shadow: var(--shadow-lg);
		padding: 1.9rem 1.75rem;
		position: sticky;
		top: 1.5rem;
	}
	.panel-title {
		font-size: var(--t-lg);
		margin-bottom: 1.1rem;
	}
	form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.submit {
		width: 100%;
		padding: 0.8em;
		font-size: var(--t-base);
	}
	.hint {
		font-size: var(--t-sm);
		color: var(--muted);
		line-height: 1.45;
	}
	.sent {
		font-size: var(--t-sm);
		color: var(--muted);
	}
	.code-input {
		font-size: 1.5rem;
		letter-spacing: 0.5em;
		text-align: center;
	}
	.btn-link {
		border: 0;
		background: transparent;
		color: var(--iris);
		font-size: var(--t-sm);
		cursor: pointer;
		align-self: center;
	}
	.btn-link:hover {
		text-decoration: underline;
	}
	.error {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1rem;
		padding: 0.6rem 0.8rem;
		background: var(--coral-tint);
		color: var(--coral);
		border-radius: var(--r-md);
		font-size: var(--t-sm);
	}
	.error :global(.sym) {
		flex-shrink: 0;
	}

	/* --- Features --- */
	.features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem 2.5rem;
		padding-top: 2.5rem;
		border-top: 1px solid var(--line);
	}
	.feature :global(.sym) {
		color: var(--iris);
	}
	.feature h3 {
		font-size: var(--t-md);
		margin: 0.6rem 0 0.35rem;
	}
	.feature p {
		font-size: var(--t-sm);
		line-height: 1.6;
		color: var(--muted);
	}

	/* --- Closing thought --- */
	.thought {
		text-align: center;
		max-width: 42ch;
		margin-inline: auto;
	}
	.thought blockquote {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.2rem;
		line-height: 1.45;
	}
	.thought figcaption {
		margin-top: 0.6rem;
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		color: var(--muted);
	}

	footer {
		width: min(100%, var(--content-max));
		margin-inline: auto;
		margin-top: auto;
		padding-top: 2rem;
		font-size: var(--t-xs);
		color: var(--faint);
		text-align: center;
	}

	@media (max-width: 860px) {
		.hero {
			grid-template-columns: 1fr;
			gap: 2.25rem;
		}
		.panel {
			position: static;
		}
		.pitch h1 {
			max-width: none;
		}
	}
	@media (max-width: 520px) {
		.chip.free {
			display: none;
		}
	}
</style>
