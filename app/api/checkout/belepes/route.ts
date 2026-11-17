import { NextResponse, type NextRequest } from 'next/server';
import { SITE_URL } from '@/lib/config';
import { fulfillCheckoutSession } from '@/lib/fulfillment';
import { guestAutoLoginLink, guestEmail, isGuestSession } from '@/lib/guest-checkout';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

// Vendégvásárlás után: azonnali belépés a frissen létrehozott fiókba, egyenesen a kurzusra.
// Ha ez nem lehetséges (pl. a cím már egy korábbi fiókhoz tartozik), a belépő oldalra visz.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('session_id') ?? '';
  if (!/^cs_[A-Za-z0-9_]+$/.test(id)) return NextResponse.redirect(new URL('/belepes', SITE_URL), 303);
  try {
    const session = await stripe().checkout.sessions.retrieve(id);
    const paid = session.payment_status === 'paid' || session.payment_status === 'no_payment_required';
    if (!isGuestSession(session) || !paid) return NextResponse.redirect(new URL('/belepes', SITE_URL), 303);
    await fulfillCheckoutSession(session);
    const courseId = session.metadata?.course_id;
    const { data: c } = courseId ? await createAdminClient().from('courses').select('slug').eq('id', courseId).maybeSingle() : { data: null };
    const next = c?.slug ? `/kurzusok/${c.slug}` : '/dashboard';
    const link = await guestAutoLoginLink(session, next);
    if (link) return NextResponse.redirect(new URL(link, SITE_URL), 303);
    const email = guestEmail(session) ?? '';
    return NextResponse.redirect(new URL(`/belepes?next=${encodeURIComponent(next)}&email=${encodeURIComponent(email)}`, SITE_URL), 303);
  } catch {
    return NextResponse.redirect(new URL('/belepes', SITE_URL), 303);
  }
}
