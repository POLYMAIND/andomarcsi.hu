import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';
import { FORM_ELAPSED_FIELD, tooFastElapsed } from '@/lib/honeypot';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hírlevél-feliratkozás (lábléc). JSON választ ad, az űrlap helyben jelzi az eredményt.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim().slice(0, 120) || null;
  // Botvédelem (lib/honeypot.ts). NEM állít sikert: egy tévesen megfogott valódi látogató lássa, hogy nem ment át.
  if (tooFastElapsed(body[FORM_ELAPSED_FIELD])) {
    console.warn('[botvedelem] newsletter');
    return NextResponse.json({ error: 'Nem sikerült a feliratkozás, próbáld újra.' }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 200) return NextResponse.json({ error: 'Kérlek, adj meg egy érvényes e-mail címet.' }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: 'A feliratkozáshoz pipáld be a hozzájárulást.' }, { status: 400 });

  const { user } = await getCurrentUser();
  const consentAt = new Date().toISOString();
  const { data: inserted, error } = await createAdminClient()
    .from('newsletter_subscribers')
    .upsert({ email, name, user_id: user?.id ?? null, consent_at: consentAt, source: 'footer' }, { onConflict: 'email', ignoreDuplicates: true })
    .select('id');
  if (error) return NextResponse.json({ error: 'Nem sikerült a feliratkozás, próbáld újra.' }, { status: 500 });

  if (inserted?.length) await forwardToPolyos({ event: 'newsletter.signup', email, name, consent_at: consentAt, source: 'footer' });
  return NextResponse.json({ ok: true });
}
