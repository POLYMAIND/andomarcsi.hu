import type Stripe from 'stripe';
import { SITE_URL } from '@/lib/config';
import { createAdminClient, createEmailAuthClient } from '@/lib/supabase/server';

// Vendégvásárlás: belépés nélkül is lehet fizetni, a fiók a fizetés után készül el
// a Stripe-nál megadott e-mail-címre (ha már van ilyen fiók, ahhoz kerül a kurzus).

export const isGuestSession = (s: Stripe.Checkout.Session) => s.metadata?.guest === '1';

export const guestEmail = (s: Stripe.Checkout.Session) =>
  (s.customer_details?.email ?? s.customer_email ?? '').trim().toLowerCase() || null;

async function findProfileId(email: string) {
  const { data } = await createAdminClient().from('profiles').select('id').ilike('email', email).limit(1).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

// Megkeresi vagy létrehozza a vásárló fiókját. A webhook és a sikeres-fizetés oldal
// egyszerre is hívhatja: ha a létrehozás ütközik, a már létező fiókot adja vissza.
export async function resolveGuestUser(session: Stripe.Checkout.Session): Promise<string | null> {
  const email = guestEmail(session);
  if (!email) return null;
  const existing = await findProfileId(email);
  if (existing) return existing;

  const name = session.customer_details?.name?.trim() || undefined;
  const { data, error } = await createAdminClient().auth.admin.createUser({
    email,
    email_confirm: true, // a Stripe-on megadott és a nyugtát is oda kapó cím
    user_metadata: { ...(name ? { full_name: name } : {}), created_via_checkout: session.id },
  });
  if (data.user) return data.user.id;
  if (error) {
    const again = await findProfileId(email);
    if (again) return again;
    throw error;
  }
  return null;
}

// Belépő link a vásárlónak (a Supabase belépő levelét küldi), egyenesen a kurzusra.
export async function sendGuestLoginEmail(email: string, next: string) {
  const { error } = await createEmailAuthClient().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: false, emailRedirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) console.error('Vendégvásárlás: belépő link küldése sikertelen', error.message);
}

// Azonnali belépés a sikeres-fizetés oldalról – csak ha a fiók EZZEL a fizetéssel jött létre,
// és a fizetés friss. Meglévő fiókba így nem lehet bejutni pusztán egy fizetéssel.
const AUTO_LOGIN_WINDOW_MS = 2 * 60 * 60 * 1000;

export async function guestAutoLoginLink(session: Stripe.Checkout.Session, next: string): Promise<string | null> {
  if (!isGuestSession(session)) return null;
  if (Date.now() - session.created * 1000 > AUTO_LOGIN_WINDOW_MS) return null;
  const email = guestEmail(session);
  if (!email) return null;
  const admin = createAdminClient();
  const id = await findProfileId(email);
  if (!id) return null;
  const { data: u } = await admin.auth.admin.getUserById(id);
  if (u.user?.user_metadata?.created_via_checkout !== session.id) return null;
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  const hash = data?.properties?.hashed_token;
  if (error || !hash) return null;
  return `/auth/confirm?token_hash=${encodeURIComponent(hash)}&type=magiclink&next=${encodeURIComponent(next)}`;
}
