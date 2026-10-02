import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type Profile = { id: string; email: string | null; full_name: string | null; is_admin: boolean; stripe_customer_id: string | null };

export const supabaseConfigured = () => !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function getCurrentUser() {
  if (!supabaseConfigured()) throw new Error('Supabase nincs beállítva: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { supabase, user: null, profile: null as Profile | null };
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle<Profile>();
  return { supabase, user: data.user, profile };
}

export async function requireUser(next = '/dashboard') {
  const ctx = await getCurrentUser();
  if (!ctx.user) redirect(`/belepes?next=${encodeURIComponent(next)}`);
  return { ...ctx, user: ctx.user };
}

export async function requireAdmin() {
  const ctx = await requireUser('/admin');
  if (!ctx.profile?.is_admin) redirect('/dashboard');
  return ctx;
}
