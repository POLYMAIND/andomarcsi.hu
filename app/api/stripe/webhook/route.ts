import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { fulfillCheckoutSession, syncSubscription } from '@/lib/fulfillment';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return NextResponse.json({ error: 'Hiányzó aláírás' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = await stripe().webhooks.constructEventAsync(await request.text(), signature, secret);
  } catch (err) {
    return NextResponse.json({ error: `Érvénytelen aláírás: ${(err as Error).message}` }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      await fulfillCheckoutSession(event.data.object);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await syncSubscription(event.data.object);
      break;
  }
  return NextResponse.json({ received: true });
}
