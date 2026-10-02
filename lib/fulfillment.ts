import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

// Idempotens: a webhook és a sikeres-fizetés oldal is meghívhatja ugyanarra a sessionre.
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id ?? session.client_reference_id;
  if (!userId) return;
  const admin = createAdminClient();

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (customerId) await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);

  if (session.mode === 'payment') {
    if (session.payment_status !== 'paid') return;
    const courseId = session.metadata?.course_id;
    if (!courseId) return;
    const { error } = await admin.from('enrollments').upsert(
      {
        user_id: userId,
        course_id: courseId,
        source: 'stripe',
        stripe_session_id: session.id,
        amount_huf: Math.round((session.amount_total ?? 0) / 100),
      },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true },
    );
    if (error) throw error;
  } else if (session.mode === 'subscription' && session.subscription) {
    const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    await syncSubscription(await stripe().subscriptions.retrieve(subId), userId);
  }
}

export async function syncSubscription(sub: Stripe.Subscription, knownUserId?: string) {
  const admin = createAdminClient();
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
  let userId = knownUserId ?? sub.metadata?.user_id;
  if (!userId) {
    const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', customerId).maybeSingle();
    userId = data?.id;
  }
  if (!userId) return;

  // Egy régi (lemondott) előfizetés késve érkező eseménye ne írja felül az új, aktív előfizetést.
  const { data: existing } = await admin
    .from('subscriptions')
    .select('stripe_subscription_id, status')
    .eq('user_id', userId)
    .maybeSingle();
  const isLive = (s: string) => ['active', 'trialing', 'past_due'].includes(s);
  if (existing && existing.stripe_subscription_id !== sub.id && isLive(existing.status) && !isLive(sub.status)) return;

  const periodEnd = sub.items.data.reduce<number | null>((max, it) => Math.max(max ?? 0, it.current_period_end), null);
  const { error } = await admin.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) throw error;
}
