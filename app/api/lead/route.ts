import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';
import { FORM_ELAPSED_FIELD, tooFastElapsed } from '@/lib/honeypot';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ingyenes letölthető anyagok (lead magnet): e-mail-címért cserébe adjuk a letöltési linket.
// Csak az itt felsorolt anyagokhoz ad linket – a kliens nem küldhet tetszőleges URL-t.
const LEAD_MAGNETS: Record<string, { download: string }> = {
  'claude-dashboard-motion': { download: '/segedlet/claude-dashboard-motion/claude-dashboard-motion-segedlet.pdf' },
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const magnet = String(body.magnet ?? '');
  const lm = LEAD_MAGNETS[magnet];
  if (!lm) return NextResponse.json({ error: 'Ismeretlen anyag.' }, { status: 400 });

  const email = String(body.email ?? '').trim().toLowerCase();
  const name = String(body.name ?? '').trim().slice(0, 120) || null;
  // Botvédelem (lib/honeypot.ts). NEM állít sikert: egy tévesen megfogott valódi látogató lássa, hogy nem ment át.
  if (tooFastElapsed(body[FORM_ELAPSED_FIELD])) {
    console.warn('[botvedelem] lead', magnet);
    return NextResponse.json({ error: 'Nem sikerült, próbáld újra.' }, { status: 400 });
  }
  if (!EMAIL.test(email) || email.length > 200) return NextResponse.json({ error: 'Kérlek, adj meg egy érvényes e-mail címet.' }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: 'A letöltéshez pipáld be a hozzájárulást.' }, { status: 400 });

  const source = `lead:${magnet}`;
  const { user } = await getCurrentUser();
  const consentAt = new Date().toISOString();
  const { data: inserted, error } = await createAdminClient()
    .from('newsletter_subscribers')
    .upsert({ email, name, user_id: user?.id ?? null, consent_at: consentAt, source }, { onConflict: 'email', ignoreDuplicates: true })
    .select('id');
  if (error) return NextResponse.json({ error: 'Nem sikerült, próbáld újra.' }, { status: 500 });

  if (inserted?.length) await forwardToPolyos({ event: 'newsletter.signup', email, name, consent_at: consentAt, source });
  return NextResponse.json({ ok: true, download: lm.download });
}
