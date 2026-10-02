import Stripe from 'stripe';

let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY nincs beállítva');
    client = new Stripe(key);
  }
  return client;
}

// A Stripe a HUF összegeket kétdecimálisként várja (fillér), egész forintra kerekítve.
export const hufToStripe = (huf: number) => Math.round(huf) * 100;
