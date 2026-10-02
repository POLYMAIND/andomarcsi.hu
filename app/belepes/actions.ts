'use server';

import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

const safeNext = (n: unknown) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const next = safeNext(formData.get('next'));
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) redirect(`/belepes?hiba=email&next=${encodeURIComponent(next)}`);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      data: name ? { full_name: name } : undefined,
    },
  });
  if (error) {
    const code = error.status === 429 || error.code === 'over_email_send_rate_limit' ? 'limit' : 'kuldes';
    redirect(`/belepes?hiba=${code}&next=${encodeURIComponent(next)}`);
  }
  redirect(`/belepes?elkuldve=${encodeURIComponent(email)}`);
}
