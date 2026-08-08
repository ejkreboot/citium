import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, depends, fetch }) => {
	depends('supabase:auth');

	if (!isBrowser()) {
		// During SSR the parent server load has already validated this session with
		// getUser() (via the per-request memo in hooks.server.ts), so reuse its
		// result rather than making the same round-trip a second time.
		return {
			supabase: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: { fetch },
				cookies: { getAll: () => data.cookies ?? [] }
			}),
			session: data.session,
			user: data.user
		};
	}

	// In the browser the cookie is untrusted input, so the session still has to be
	// checked against the auth server.
	const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		global: { fetch }
	});

	const [
		{
			data: { session }
		},
		{
			data: { user }
		}
	] = await Promise.all([supabase.auth.getSession(), supabase.auth.getUser()]);

	return { supabase, session, user };
};
