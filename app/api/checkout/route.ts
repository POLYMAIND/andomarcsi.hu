import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL, SUBSCRIPTION } from '@/lib/config';
import { hufToStripe, stripe } from '@/lib/stripe';
import { withStart, type Course } from '@/lib/types';

// Űrlapból hívjuk (POST), és a Stripe Checkout oldalra irányítunk.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const plan = String(form.get('plan') ?? 'course');
  const courseId = String(form.get('course_id') ?? '');

  const { supabase, user, profile } = await getCurrentUser();
  if (!user) {
    const back = plan === 'subscription' ? '/elofizetes' : '/kurzusok';
    return NextResponse.redirect(new URL(`/belepes?next=${encodeURIComponent(back)}`, SITE_URL), 303);
  }

  const customer = profile?.stripe_customer_id ?? undefined;
  const common: Stripe.Checkout.SessionCreateParams = {
    client_reference_id: user.id,
    customer,
    customer_email: customer ? undefined : user.email,
    customer_update: customer ? { name: 'auto', address: 'auto' } : undefined,
    locale: 'hu',
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
  };

  let session: Stripe.Checkout.Session;
  if (plan === 'subscription') {
    if (!SUBSCRIPTION.enabled) return NextResponse.redirect(new URL('/kurzusok', SITE_URL), 303);
    const { data: hasSub } = await supabase.rpc('has_active_subscription');
    if (hasSub) return NextResponse.redirect(new URL('/dashboard', SITE_URL), 303);
    const price = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;
    session = await stripe().checkout.sessions.create({
      ...common,
      mode: 'subscription',
      line_items: [
        price
          ? { price, quantity: 1 }
          : {
              quantity: 1,
              price_data: {
                currency: 'huf',
                unit_amount: hufToStripe(SUBSCRIPTION.priceHuf),
                recurring: { interval: 'month' },
                product_data: { name: SUBSCRIPTION.name },
              },
            },
      ],
      metadata: { user_id: user.id, plan: 'subscription' },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${SITE_URL}/fizetes/sikeres?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/elofizetes?megszakitva=1`,
    });
  } else {
    const { data: rawCourse } = await supabase.from('courses').select('*').eq('id', courseId).eq('published', true).maybeSingle<Course>();
    const course = rawCourse ? withStart(rawCourse) : null;
    if (!course) return NextResponse.json({ error: 'Ismeretlen kurzus' }, { status: 404 });
    // „Hamarosan” kurzus előre megvásárolható; aki már megvette, ne fizessen kétszer.
    const { data: owned } = await supabase.from('enrollments').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle();
    if (owned) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
    if (course.price_huf === null) return NextResponse.redirect(new URL('/elofizetes', SITE_URL), 303);
    if (course.price_huf === 0) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
    const { data: access } = await supabase.rpc('has_course_access', { cid: course.id });
    if (access) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);

    session = await stripe().checkout.sessions.create({
      ...common,
      mode: 'payment',
      ...(customer ? {} : { customer_creation: 'always' }),
      invoice_creation: { enabled: true },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'huf',
            unit_amount: hufToStripe(course.price_huf as number),
            product_data: { name: course.title, description: course.subtitle || undefined },
          },
        },
      ],
      metadata: { user_id: user.id, course_id: course.id, plan: 'course' },
      success_url: `${SITE_URL}/fizetes/sikeres?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/kurzusok/${course.slug}?megszakitva=1`,
    });
  }

  return NextResponse.redirect(session.url!, 303);
}
