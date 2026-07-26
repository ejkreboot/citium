<script lang="ts">
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { quoteForDay } from '$lib/quotes';
	import Icon from '$lib/components/Icon.svelte';

	const supabase = $derived(page.data.supabase!);
	const quote = quoteForDay();

	let step = $state<'email' | 'code'>('email');
	let email = $state('');
	let code = $state('');
	let loading = $state(false);
	let error = $state('');

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

<svelte:head><title>Citium — Sign in</title></svelte:head>

<main class="page">
	<div class="panel rise">
		<div class="brand">
			<span class="mark">Citium</span>
			<span class="sub">planner</span>
		</div>

		<figure class="quote">
			<blockquote>{quote.text}</blockquote>
			<figcaption>— {quote.author}</figcaption>
		</figure>

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
					{#if loading}Sending…{:else}Send me a code <Icon name="arrow_forward" size={18} />{/if}
				</button>
				<p class="hint">
					We'll email you a 6-digit code. No password needed — if it's your first time, we'll set
					you up automatically.
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
</main>

<style>
	.page {
		min-height: 100dvh;
		display: grid;
		place-items: center;
		padding: 2rem 1.25rem;
		background:
			radial-gradient(90% 60% at 50% -10%, var(--iris-tint) 0%, transparent 60%), var(--paper);
	}
	.panel {
		width: min(100%, 400px);
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--r-xl);
		box-shadow: var(--shadow-lg);
		padding: 2.25rem 2rem;
	}
	.brand {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.mark {
		font-family: var(--font-display);
		font-size: 2rem;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	.sub {
		font-family: var(--font-mono);
		font-size: 0.68rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.quote {
		padding: 0 0 1.5rem;
		border-bottom: 1px solid var(--line-soft);
		margin-bottom: 1.5rem;
	}
	.quote blockquote {
		font-family: var(--font-display);
		font-style: italic;
		font-size: 1.05rem;
		line-height: 1.4;
		color: var(--ink);
	}
	.quote figcaption {
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		font-size: var(--t-xs);
		color: var(--muted);
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
</style>
