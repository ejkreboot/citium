<script lang="ts">
	import { untrack, onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { asset, resolve } from '$app/paths';
	import Icon from '$lib/components/Icon.svelte';
	import { createPlanner } from '$lib/planner.svelte';

	let { data, children } = $props();

	// One store per render, published to the subtree. Never a module singleton:
	// on the server that would outlive the request and bleed into the next one.
	const planner = createPlanner();

	async function signOut() {
		// Land any still-debounced note edit while the client is still authorized.
		await planner.flushNotes();
		await data.supabase?.auth.signOut();
		await goto(resolve('/login'));
	}

	// Cancel debounced writes when the subtree goes away (sign-out, navigation).
	onDestroy(() => planner.dispose());

	// Seed the reactive store from Supabase and connect it for persistence.
	// The (app) server load guarantees a user (redirects otherwise).
	//
	// This runs during init rather than in an $effect on purpose: effects are
	// client-only, so seeding there would server-render an empty planner and
	// flash once data arrived. Reading the initial payload is exactly what we
	// want — the store is the source of truth afterwards, and `seeded` guards
	// against a later load clobbering unsaved optimistic edits. `untrack` says
	// that snapshot read is deliberate, which is also what silences
	// `state_referenced_locally`.
	untrack(() => {
		planner.connect(data.supabase ?? null, data.user);
		if (!planner.seeded && data.user) {
			planner.seed(
				{
					terms: data.terms,
					courses: data.courses,
					meetings: data.meetings,
					assignments: data.assignments,
					notes: data.notes
				},
				data.user.id
			);
		}
	});

	// Hrefs are resolved once so they carry any configured base path — which also
	// makes them directly comparable to `page.url.pathname` in isActive().
	const home = resolve('/');

	const nav = [
		{ href: home, label: 'Today', icon: 'wb_twilight' },
		{ href: resolve('/schedule'), label: 'Schedule', icon: 'calendar_month' },
		{ href: resolve('/homework'), label: 'Homework', icon: 'checklist' },
		{ href: resolve('/notes'), label: 'Notes', icon: 'edit_note' },
		{ href: resolve('/courses'), label: 'Courses', icon: 'school' }
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		return href === home ? path === home : path.startsWith(href);
	}

	// --- Theme ---
	let theme = $state<'light' | 'dark'>('light');

	// Init work, so it belongs in onMount rather than an $effect: as an effect it
	// both wrote `theme` and (via apply) read it, so every toggle re-ran the whole
	// localStorage/matchMedia probe to arrive back at the value just set.
	onMount(() => {
		const saved = localStorage.getItem('citium-theme') as 'light' | 'dark' | null;
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		theme = saved ?? (prefersDark ? 'dark' : 'light');
		apply();
	});

	function apply() {
		document.documentElement.setAttribute('data-theme', theme);
	}
	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('citium-theme', theme);
		apply();
	}
</script>

<div class="shell">
	<aside class="sidebar">
		<a href={home} class="brand">
			<!--
				Two files rather than one recoloured asset: the mark is swapped by CSS
				(not by `theme`) so it is correct during SSR and before hydration, and
				so it follows the same data-theme / prefers-color-scheme precedence as
				the palette in app.css. Decorative — the wordmark beside it names the app.
			-->
			<img class="brand-logo on-light" src={asset('/logo.png')} alt="" width="34" height="34" />
			<img
				class="brand-logo on-dark"
				src={asset('/logo_white.png')}
				alt=""
				width="34"
				height="34"
			/>
			<span class="brand-words">
				<span class="brand-mark">Citium</span>
				<span class="brand-sub">planner</span>
			</span>
		</a>

		<nav class="nav">
			{#each nav as item (item.href)}
				<a href={item.href} class="nav-item" class:active={isActive(item.href)}>
					<Icon name={item.icon} size={22} fill={isActive(item.href)} />
					<span>{item.label}</span>
				</a>
			{/each}
		</nav>

		<div class="side-foot">
			<button class="btn btn-ghost theme-btn" onclick={toggleTheme} aria-label="Toggle theme">
				<Icon name={theme === 'light' ? 'dark_mode' : 'light_mode'} size={20} />
				<span>{theme === 'light' ? 'Dark' : 'Light'}</span>
			</button>
			<button class="btn btn-ghost theme-btn" onclick={signOut} aria-label="Sign out">
				<Icon name="logout" size={20} />
				<span>Sign out</span>
			</button>
		</div>
	</aside>

	<main class="content">
		{@render children()}
	</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: var(--sidebar-w) 1fr;
		min-height: 100dvh;
	}

	.sidebar {
		position: sticky;
		top: 0;
		height: 100dvh;
		display: flex;
		flex-direction: column;
		padding: 1.5rem 1rem 1rem;
		border-right: 1px solid var(--line);
		background: var(--surface);
	}

	.brand {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		padding: 0.25rem 0.6rem 1.5rem;
	}
	.brand-logo {
		width: 34px;
		height: 34px;
		flex-shrink: 0;
		/* The mark is a fine line drawing; keep it crisp when it scales. */
		object-fit: contain;
	}
	.brand-words {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.brand-mark {
		font-family: var(--font-display);
		font-size: 1.45rem;
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

	.nav {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		padding: 0.62rem 0.7rem;
		border-radius: var(--r-md);
		color: var(--muted);
		font-weight: 500;
		font-size: var(--t-base);
		transition:
			background 0.15s ease,
			color 0.15s ease;
	}
	.nav-item:hover {
		background: var(--surface-sunk);
		color: var(--ink);
	}
	.nav-item.active {
		background: var(--iris-tint);
		color: var(--iris-strong);
	}

	.side-foot {
		margin-top: auto;
		padding-top: 1rem;
	}
	.theme-btn {
		width: 100%;
		justify-content: flex-start;
	}

	.content {
		min-width: 0;
		padding: 2.5rem clamp(1.25rem, 4vw, 3rem) 4rem;
	}

	/* Mobile: sidebar becomes a bottom tab bar */
	@media (max-width: 820px) {
		.shell {
			grid-template-columns: 1fr;
		}
		.sidebar {
			position: fixed;
			bottom: 0;
			top: auto;
			left: 0;
			right: 0;
			height: auto;
			flex-direction: row;
			align-items: center;
			padding: 0.4rem 0.5rem;
			padding-bottom: max(0.4rem, env(safe-area-inset-bottom));
			border-right: 0;
			border-top: 1px solid var(--line);
			z-index: 50;
			box-shadow: 0 -4px 20px rgba(33, 30, 43, 0.06);
		}
		.brand,
		.side-foot {
			display: none;
		}
		.nav {
			flex-direction: row;
			flex: 1;
			justify-content: space-around;
			gap: 0;
		}
		.nav-item {
			flex-direction: column;
			gap: 0.15rem;
			font-size: 0.66rem;
			padding: 0.35rem 0.5rem;
			border-radius: var(--r-sm);
		}
		.nav-item span {
			font-family: var(--font-mono);
			letter-spacing: 0.02em;
		}
		.content {
			padding: 1.5rem 1.15rem 6rem;
		}
	}
</style>
