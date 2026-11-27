import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { FORM_TS_FIELD, tooFastSince } from '@/lib/honeypot';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Ingyenes anyag letöltése e-mail megadásával. Siker után a /ingyenes/[slug]?kesz=<id> oldal adja a linket.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const resourceId = String(form.get('resource_id') ?? '');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const name = String(form.get('name') ?? '').trim().slice(0, 120) || null;
  const consent = form.get('consent') === 'on';
  const newsletter = form.get('newsletter') === 'on';

  const admin = createAdminClient();
  const { data: resource } = await admin.from('free_resources').select('id, slug, title').eq('id', resourceId).eq('published', true).maybeSingle();
  if (!resource) return NextResponse.json({ error: 'Ismeretlen anyag' }, { status: 404 });
  const back = (q: string) => NextResponse.redirect(new URL(`/ingyenes/${resource.slug}?${q}#letoltes`, SITE_URL), 303);

  // Botvédelem (lib/honeypot.ts). NEM állít sikert.
  if (tooFastSince(form.get(FORM_TS_FIELD))) {
    console.warn('[botvedelem] download', resource.slug);
    return back('hiba=1');
  }
  if (!EMAIL.test(email) || email.length > 200) return back('hiba=email');
  if (!consent) return back('hiba=hozzajarulas');

  const { user } = await getCurrentUser();
  const consentAt = new Date().toISOString();
  const { data: inserted, error } = await admin
    .from('resource_downloads')
    .upsert(
      { resource_id: resource.id, email, name, user_id: user?.id ?? null, consent_at: consentAt, newsletter, source: 'web' },
      { onConflict: 'resource_id,email', ignoreDuplicates: true },
    )
    .select('id');
  if (error) return back('hiba=1');
  let downloadId = inserted?.[0]?.id as string | undefined;
  if (!downloadId) {
    // Már letöltötte korábban: ugyanazt a linket kapja meg újra.
    const { data: existing } = await admin.from('resource_downloads').select('id').eq('resource_id', resource.id).eq('email', email).maybeSingle();
    downloadId = existing?.id;
    if (!downloadId) return back('hiba=1');
  } else {
    await forwardToPolyos({
      event: 'resource.download',
      email,
      name,
      resource: { id: resource.id, slug: resource.slug, title: resource.title },
      newsletter,
      consent_at: consentAt,
      source: 'web',
    });
  }

  // Kért hírlevelet is → a hírlevél-listára is felkerül (ha még nincs rajta).
  if (newsletter) {
    const { data: nl } = await admin
      .from('newsletter_subscribers')
      .upsert({ email, name, user_id: user?.id ?? null, consent_at: consentAt, source: `letoltes:${resource.slug}` }, { onConflict: 'email', ignoreDuplicates: true })
      .select('id');
    if (nl?.length) await forwardToPolyos({ event: 'newsletter.signup', email, name, consent_at: consentAt, source: `letoltes:${resource.slug}` });
  }

  return back(`kesz=${downloadId}`);
}
