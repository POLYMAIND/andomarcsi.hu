import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { createAdminClient } from '@/lib/supabase/server';
import { withStart, type Course } from '@/lib/types';
import { forwardToPolyos } from '@/lib/waitlist';
import { HONEYPOT_FIELD, honeypotTripped } from '@/lib/honeypot';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// „Értesítést kérek” egy „Hamarosan” kurzushoz – fizetés nélkül, csak e-mail.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const courseId = String(form.get('course_id') ?? '');
  const email = String(form.get('email') ?? '').trim().toLowerCase();
  const name = String(form.get('name') ?? '').trim().slice(0, 120) || null;
  const consent = form.get('consent') === 'on';
  const honeypot = form.get(HONEYPOT_FIELD); // botoknak (lásd lib/honeypot.ts)

  const admin = createAdminClient();
  const { data: raw } = await admin.from('courses').select('*').eq('id', courseId).eq('published', true).maybeSingle<Course>();
  if (!raw) return NextResponse.json({ error: 'Ismeretlen kurzus' }, { status: 404 });
  const course = withStart(raw);
  const back = (q: string) => NextResponse.redirect(new URL(`/kurzusok/${course.slug}?${q}#ertesites`, SITE_URL), 303);

  // A csapda NEM állít sikert: egy tévesen megfogott valódi látogató így látja, hogy nem ment át.
  if (honeypotTripped(honeypot)) {
    console.warn('[botcsapda] waitlist', course.slug);
    return back('ertesites=hiba');
  }
  if (!EMAIL.test(email) || email.length > 200) return back('ertesites=email');
  if (!consent) return back('ertesites=hozzajarulas');

  const { user } = await getCurrentUser();
  const consentAt = new Date().toISOString();
  const { data: inserted, error } = await admin
    .from('course_waitlist')
    .upsert(
      { course_id: course.id, email, name, user_id: user?.id ?? null, consent_at: consentAt, source: 'web' },
      { onConflict: 'course_id,email', ignoreDuplicates: true },
    )
    .select('id');
  if (error) return back('ertesites=hiba');

  // Csak új feliratkozást továbbítunk.
  if (inserted?.length) {
    await forwardToPolyos({
      event: 'waitlist.signup',
      email,
      name,
      course: { id: course.id, slug: course.slug, title: course.title },
      consent_at: consentAt,
      source: 'web',
    });
  }
  return back('ertesites=ok');
}
