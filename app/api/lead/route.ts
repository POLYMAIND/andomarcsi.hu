import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';
import { FORM_ELAPSED_FIELD, tooFastElapsed } from '@/lib/honeypot';
import { LEAD_MAGNETS, courseLeadCookie, courseLeadKey, downloadPath, leadCookieName, signLead } from '@/lib/lead-magnets';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  // Kétféle anyag: lead magnet PDF (magnet), vagy egy ingyenes (0 Ft-os) csomag a kurzusoldalon (course = slug).
  const courseSlug = String(body.course ?? '');
  const magnet = courseSlug ? '' : String(body.magnet ?? '');
  if (courseSlug) {
    if (!/^[a-z0-9-]{1,120}$/.test(courseSlug)) return NextResponse.json({ error: 'Ismeretlen anyag.' }, { status: 400 });
    const { data: course } = await createAdminClient()
      .from('courses')
      .select('id')
      .eq('slug', courseSlug)
      .eq('published', true)
      .eq('price_huf', 0)
      .eq('coming_soon', false)
      .not('pocket_for', 'is', null)
      .maybeSingle();
    if (!course) return NextResponse.json({ error: 'Ez az anyag nem érhető el így.' }, { status: 400 });
  } else if (!LEAD_MAGNETS[magnet]) {
    return NextResponse.json({ error: 'Ismeretlen anyag.' }, { status: 400 });
  }
  const key = courseSlug ? courseLeadKey(courseSlug) : magnet;

  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim().slice(0, 120) || null;
  // Botvédelem (lib/honeypot.ts). NEM állít sikert: egy tévesen megfogott valódi látogató lássa, hogy nem ment át.
  if (tooFastElapsed(body[FORM_ELAPSED_FIELD])) {
    console.warn('[botvedelem] lead', key);
    return NextResponse.json({ error: 'Nem sikerült, próbáld újra.' }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 200) return NextResponse.json({ error: 'Kérlek, adj meg egy érvényes e-mail címet.' }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: 'A letöltéshez pipáld be a hozzájárulást.' }, { status: 400 });

  const source = `lead:${key}`;
  const { user } = await getCurrentUser();
  const consentAt = new Date().toISOString();
  const { data: inserted, error } = await createAdminClient()
    .from('newsletter_subscribers')
    .upsert({ email, name, user_id: user?.id ?? null, consent_at: consentAt, source }, { onConflict: 'email', ignoreDuplicates: true })
    .select('id');
  if (error) return NextResponse.json({ error: 'Nem sikerült, próbáld újra.' }, { status: 500 });

  if (inserted?.length) await forwardToPolyos({ event: 'newsletter.signup', email, name, consent_at: consentAt, source });
  const res = NextResponse.json(courseSlug ? { ok: true } : { ok: true, download: downloadPath(magnet) });
  res.cookies.set(courseSlug ? courseLeadCookie(courseSlug) : leadCookieName(magnet), signLead(key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
