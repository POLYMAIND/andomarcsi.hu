import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { FORM_TS_FIELD, tooFastSince } from '@/lib/honeypot';
import { ACADEMY } from '@/lib/polyakademia';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mentorprogram-jelentkezés (249 000 Ft, 10 személyes alkalom): nem fizetés, hanem jelentkezés – utána egyeztetés.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const name = String(form.get('name') ?? '').trim().slice(0, 120);
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const phone = String(form.get('phone') ?? '').trim().slice(0, 40) || null;
  const business = String(form.get('business') ?? '').trim().slice(0, 2000);
  const consent = form.get('consent') === 'on';
  const back = (q: string) => NextResponse.redirect(new URL(`${ACADEMY.path}?mentor=${q}#mentor`, SITE_URL), 303);

  if (tooFastSince(form.get(FORM_TS_FIELD))) {
    console.warn('[botvedelem] mentor');
    return back('hiba');
  }
  if (!name) return back('nev');
  if (!EMAIL.test(email) || email.length > 200) return back('email');
  if (!consent) return back('hozzajarulas');

  const { user } = await getCurrentUser();
  const consentAt = new Date().toISOString();
  const { error } = await createAdminClient()
    .from('mentor_applications')
    .insert({ name, email, phone, business, user_id: user?.id ?? null, consent_at: consentAt });
  if (error) return back('hiba');

  await forwardToPolyos({ event: 'mentor.application', email, name, phone, business, consent_at: consentAt, source: 'web' });
  return back('ok');
}
