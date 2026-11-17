import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL, SUBSCRIPTION } from '@/lib/config';
import { formatHuf } from '@/lib/format';
import { hufToStripe, stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { withStart, type Course } from '@/lib/types';

// Űrlapból hívjuk (POST), és a Stripe Checkout oldalra irányítunk.
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const plan = String(form.get('plan') ?? 'course');
  const courseId = String(form.get('course_id') ?? '');

  const { supabase, user, profile } = await getCurrentUser();
  // Előfizetéshez kell fiók; kurzust vendégként is meg lehet venni (a fiók a fizetés után készül el).
  if (!user && plan === 'subscription') {
    return NextResponse.redirect(new URL(`/belepes?next=${encodeURIComponent('/elofizetes')}`, SITE_URL), 303);
  }

  // Kötelező nyilatkozatok (ÁSZF + adatkezelés; digitális tartalomnál az elállási jogról)
  const consentOk = form.get('aszf') === 'on' && form.get('digital') === 'on';
  if (!consentOk) {
    const back = plan === 'subscription' ? '/elofizetes' : '/kurzusok';
    return NextResponse.redirect(new URL(`${back}?hiba=nyilatkozat`, SITE_URL), 303);
  }
  const consentAt = new Date().toISOString();

  if (!user) return guestCourseCheckout(courseId, consentAt);

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
      metadata: { user_id: user.id, plan: 'subscription', consent_aszf_at: consentAt, consent_digital_at: consentAt },
      subscription_data: { metadata: { user_id: user.id } },
      success_url: `${SITE_URL}/fizetes/sikeres?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/elofizetes?megszakitva=1`,
    });
  } else {
    const { data: rawCourse } = await supabase.from('courses').select('*').eq('id', courseId).eq('published', true).maybeSingle<Course>();
    const course = rawCourse ? withStart(rawCourse) : null;
    if (!course) return NextResponse.json({ error: 'Ismeretlen kurzus' }, { status: 404 });
    // „Hamarosan” kurzusra nincs előre fizetés – ott értesítést lehet kérni.
    if (course.coming_soon) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}#ertesites`, SITE_URL), 303);
    // Aki már megvette, ne fizessen kétszer.
    const { data: owned } = await supabase.from('enrollments').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle();
    if (owned) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
    if (course.bundle_course_ids?.length) {
      const { data: have } = await supabase.from('enrollments').select('course_id').eq('user_id', user.id).in('course_id', course.bundle_course_ids);
      if ((have?.length ?? 0) >= course.bundle_course_ids.length) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
    }
    if (course.price_huf === null) return NextResponse.redirect(new URL('/elofizetes', SITE_URL), 303);
    if (course.price_huf === 0) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
    const { data: access } = await supabase.rpc('has_course_access', { cid: course.id });
    if (access) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);

    const amount = course.price_huf as number;

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
            unit_amount: hufToStripe(amount),
            product_data: {
              name: course.title,
              // Akciónál a címke és a kedvezmény is látszik a Stripe fizetési oldalán
              description: [course.was_price_huf != null ? `${course.sale_label?.trim() || 'Akció'} (${formatHuf(course.was_price_huf)} helyett)` : '', course.subtitle].filter(Boolean).join(' · ') || undefined,
            },
          },
        },
      ],
      metadata: { user_id: user.id, course_id: course.id, plan: 'course', consent_aszf_at: consentAt, consent_digital_at: consentAt },
      success_url: `${SITE_URL}/fizetes/sikeres?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/kurzusok/${course.slug}?megszakitva=1`,
    });
  }

  return NextResponse.redirect(session.url!, 303);
}

// Belépés nélküli kurzusvásárlás: a Stripe kéri be az e-mail-címet, a fiók a fizetés után készül el
// (lib/guest-checkout.ts). Ha a cím már regisztrált, a kurzus ahhoz a fiókhoz kerül.
async function guestCourseCheckout(courseId: string, consentAt: string) {
  const { data: rawCourse } = await createAdminClient().from('courses').select('*').eq('id', courseId).eq('published', true).maybeSingle<Course>();
  const course = rawCourse ? withStart(rawCourse) : null;
  if (!course) return NextResponse.json({ error: 'Ismeretlen kurzus' }, { status: 404 });
  if (course.coming_soon) return NextResponse.redirect(new URL(`/kurzusok/${course.slug}#ertesites`, SITE_URL), 303);
  if (!course.price_huf) {
    const to = course.price_huf === null ? '/elofizetes' : `/belepes?next=${encodeURIComponent(`/kurzusok/${course.slug}`)}`;
    return NextResponse.redirect(new URL(to, SITE_URL), 303);
  }

  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    locale: 'hu',
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
    customer_creation: 'always',
    invoice_creation: { enabled: true },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'huf',
          unit_amount: hufToStripe(course.price_huf),
          product_data: {
            name: course.title,
            description: [course.was_price_huf != null ? `${course.sale_label?.trim() || 'Akció'} (${formatHuf(course.was_price_huf)} helyett)` : '', course.subtitle].filter(Boolean).join(' · ') || undefined,
          },
        },
      },
    ],
    metadata: { guest: '1', course_id: course.id, plan: 'course', consent_aszf_at: consentAt, consent_digital_at: consentAt },
    custom_text: { submit: { message: 'A fizetés után ezen az e-mail-címen jön létre a fiókod, és ide küldjük a belépő linket.' } },
    success_url: `${SITE_URL}/fizetes/sikeres?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/kurzusok/${course.slug}?megszakitva=1`,
  });
  return NextResponse.redirect(session.url!, 303);
}
