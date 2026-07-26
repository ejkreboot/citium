<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import Icon from '$lib/components/Icon.svelte';
	import { planner } from '$lib/planner.svelte';

	let { data, children } = $props();

	async function signOut() {
		await data.supabase?.auth.signOut();
		planner.seeded = false;
		await goto('/login');
	}

	// Seed the reactive store from Supabase and connect it for persistence.
	// The (app) server load guarantees a user (redirects otherwise).
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

	const nav = [
		{ href: '/', label: 'Today', icon: 'wb_twilight' },
		{ href: '/schedule', label: 'Schedule', icon: 'calendar_month' },
		{ href: '/homework', label: 'Homework', icon: 'checklist' },
		{ href: '/notes', label: 'Notes', icon: 'edit_note' },
		{ href: '/courses', label: 'Courses', icon: 'school' }
	];

	function isActive(href: string): boolean {
		const path = page.url.pathname;
		return href === '/' ? path === '/' : path.startsWith(href);
	}

	// --- Theme ---
	let theme = $state<'light' | 'dark'>('light');

	$effect(() => {
		const saved = localStorage.getItem('calia-theme');
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		theme = (saved as 'light' | 'dark') ?? (prefersDark ? 'dark' : 'light');
		apply();
	});

	function apply() {
		document.documentElement.setAttribute('data-theme', theme);
	}
	function toggleTheme() {
		theme = theme === 'light' ? 'dark' : 'light';
		localStorage.setItem('calia-theme', theme);
		apply();
	}
</script>

<div class="shell">
	<aside class="sidebar">
		<a href="/" class="brand">
			<span class="brand-mark">Calia</span>
			<span class="brand-sub">planner</span>
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
		align-items: baseline;
		gap: 0.45rem;
		padding: 0.25rem 0.6rem 1.5rem;
	}
	.brand-mark {
		font-family: var(--font-display);
		font-size: 1.6rem;
		font-weight: 500;
		letter-spacing: -0.02em;
	}
	.brand-sub {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--faint);
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
