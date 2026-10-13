'use server';

import { redirect } from 'next/navigation';
import { SITE_URL } from '@/lib/config';
import { createClient, createEmailAuthClient } from '@/lib/supabase/server';

const safeNext = (n: unknown) => (typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;
const isRateLimit = (e: { status?: number; code?: string }) => e.status === 429 || e.code === 'over_email_send_rate_limit';

const back = (mode: string, params: Record<string, string>) => {
  const q = new URLSearchParams({ ...(mode ? { mod: mode } : {}), ...params });
  return `/belepes?${q.toString()}`;
};

// Belépés jelszóval
export async function signInWithPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));
  if (!EMAIL.test(email) || !password) redirect(back('', { hiba: 'adatok', next, email }));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const code = error.code === 'email_not_confirmed' ? 'megerosites' : isRateLimit(error) ? 'limit' : 'jelszo';
    redirect(back('', { hiba: code, next, email }));
  }
  redirect(next);
}

// Regisztráció jelszóval (a megerősítő levél linkje után lehet belépni)
export async function signUpWithPassword(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim().slice(0, 120);
  const password = String(formData.get('password') ?? '');
  const next = safeNext(formData.get('next'));
  if (!EMAIL.test(email)) redirect(back('regisztracio', { hiba: 'email', next }));
  if (password.length < MIN_PASSWORD) redirect(back('regisztracio', { hiba: 'rovid', next, email }));

  const supabase = createEmailAuthClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`, data: name ? { full_name: name } : undefined },
  });
  if (error) {
    const code = isRateLimit(error) ? 'limit' : error.code === 'weak_password' ? 'gyenge' : error.code === 'user_already_exists' ? 'letezik' : 'kuldes';
    redirect(back('regisztracio', { hiba: code, next, email }));
  }
  // Ha a Supabase-ben nincs bekapcsolva az e-mail megerősítés, azonnal van session.
  if (data.session) {
    await (await createClient()).auth.setSession(data.session);
    redirect(next);
  }
  redirect(back('', { kesz: 'regisztracio', email }));
}

// Elfelejtett jelszó / jelszó beállítása (a linkkel belépők is így kapnak jelszót)
export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!EMAIL.test(email)) redirect(back('elfelejtett', { hiba: 'email' }));
  const supabase = createEmailAuthClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/auth/callback?next=/jelszo` });
  if (error) redirect(back('elfelejtett', { hiba: isRateLimit(error) ? 'limit' : 'kuldes', email }));
  redirect(back('', { kesz: 'jelszo', email }));
}

// Belépés jelszó nélkül, e-mailben kapott linkkel
export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const name = String(formData.get('name') ?? '').trim();
  const next = safeNext(formData.get('next'));
  if (!EMAIL.test(email)) redirect(back('link', { hiba: 'email', next }));

  const supabase = createEmailAuthClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      data: name ? { full_name: name } : undefined,
    },
  });
  if (error) redirect(back('link', { hiba: isRateLimit(error) ? 'limit' : 'kuldes', next, email }));
  redirect(back('', { kesz: 'link', email }));
}
