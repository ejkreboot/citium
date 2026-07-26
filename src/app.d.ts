import type { SupabaseClient, Session, User } from '@supabase/supabase-js';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
			session: Session | null;
			user: User | null;
		}
		interface PageData {
			session: Session | null;
			supabase?: SupabaseClient;
		}
		// interface Error {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
