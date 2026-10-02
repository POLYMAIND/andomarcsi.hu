import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { stripe } from '@/lib/stripe';

// Stripe ügyfélportál: kártyacsere, számlák, előfizetés lemondása.
export async function POST() {
  const { user, profile } = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/belepes', SITE_URL), 303);
  if (!profile?.stripe_customer_id) return NextResponse.redirect(new URL('/dashboard', SITE_URL), 303);
  const portal = await stripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${SITE_URL}/dashboard`,
    locale: 'hu',
  });
  return NextResponse.redirect(portal.url, 303);
}
