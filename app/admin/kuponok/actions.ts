'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type Stripe from 'stripe';
import { requireAdmin } from '@/lib/auth';
import { budapestLocalToIso } from '@/lib/format';
import { hufToStripe, stripe } from '@/lib/stripe';

const BACK = '/admin/kuponok';
const fail = (msg: string) => redirect(`${BACK}?hiba=${encodeURIComponent(msg)}`);

// Kupon + beírható kód létrehozása a Stripe-ban. A pénztár (allow_promotion_codes) automatikusan elfogadja.
export async function createCoupon(formData: FormData) {
  await requireAdmin();
  const code = String(formData.get('code') ?? '').trim().toUpperCase();
  const type = String(formData.get('type') ?? 'percent');
  const value = Number(String(formData.get('value') ?? '').replace(',', '.'));
  const expires = String(formData.get('expires') ?? '');
  const maxRaw = String(formData.get('max_redemptions') ?? '').trim();
  const duration = String(formData.get('duration') ?? 'once') === 'forever' ? 'forever' : 'once';

  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) fail('A kód 3–40 karakter lehet: betűk (ékezet nélkül), számok, kötőjel.');
  if (type === 'percent' && !(value > 0 && value <= 100)) fail('A százalék 1 és 100 között lehet.');
  if (type === 'amount' && !(value >= 1 && Number.isInteger(value))) fail('A kedvezmény összege egész forint legyen.');
  const expiresIso = expires ? budapestLocalToIso(`${expires}T23:59`) : null;
  const expiresAt = expiresIso ? Math.floor(new Date(expiresIso).getTime() / 1000) : undefined;
  if (expiresAt && expiresAt * 1000 < Date.now()) fail('A lejárat nem lehet a múltban.');
  const max = maxRaw ? Number(maxRaw) : undefined;
  if (max !== undefined && !(Number.isInteger(max) && max >= 1)) fail('A felhasználások száma pozitív egész szám legyen.');

  let error: string | null = null;
  try {
    const s = stripe();
    const coupon = await s.coupons.create({
      name: code,
      duration,
      ...(type === 'percent' ? { percent_off: value } : { amount_off: hufToStripe(value), currency: 'huf' }),
      metadata: { created_from: 'admin' },
    });
    await s.promotionCodes.create({
      promotion: { type: 'coupon', coupon: coupon.id },
      code,
      ...(expiresAt ? { expires_at: expiresAt } : {}),
      ...(max ? { max_redemptions: max } : {}),
      restrictions: { first_time_transaction: formData.get('first_time') === 'on' },
    });
  } catch (e) {
    const msg = (e as Stripe.errors.StripeError)?.message ?? '';
    error = /already exists|already in use/i.test(msg) ? 'Ilyen kód már létezik.' : `A Stripe hibát adott: ${msg || 'ismeretlen hiba'}`;
  }
  if (error) fail(error);
  revalidatePath(BACK);
  redirect(`${BACK}?ok=${encodeURIComponent(code)}`);
}

// Kód ki- vagy bekapcsolása (törölni a Stripe-ban nem lehet, csak inaktiválni).
export async function toggleCode(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const active = formData.get('active') === 'true';
  let error: string | null = null;
  try {
    await stripe().promotionCodes.update(id, { active });
  } catch (e) {
    error = (e as Error).message;
  }
  if (error) fail(`Nem sikerült: ${error}`);
  revalidatePath(BACK);
  redirect(BACK);
}
