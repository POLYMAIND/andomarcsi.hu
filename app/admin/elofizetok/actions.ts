'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { syncSubscription } from '@/lib/fulfillment';
import { stripe } from '@/lib/stripe';

const BACK = '/admin/elofizetok';

// Előfizetés kezelése az adminból. A Stripe-ban módosítunk, majd azonnal szinkronizáljuk
// az adatbázisba (a webhook is megerősíti).
export async function manageSubscription(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = String(formData.get('user_id') ?? '');
  const action = String(formData.get('action') ?? '');
  if (!['cancel_end', 'resume', 'cancel_now'].includes(action)) redirect(BACK);

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (!sub) redirect(`${BACK}?hiba=${encodeURIComponent('Ehhez a felhasználóhoz nem tartozik előfizetés.')}`);

  let msg: string;
  try {
    const id = sub.stripe_subscription_id as string;
    let updated;
    if (action === 'cancel_end') {
      updated = await stripe().subscriptions.update(id, { cancel_at_period_end: true });
      msg = 'Az előfizetés a fizetett időszak végén megszűnik.';
    } else if (action === 'resume') {
      updated = await stripe().subscriptions.update(id, { cancel_at_period_end: false });
      msg = 'A lemondás visszavonva, az előfizetés tovább fut.';
    } else {
      updated = await stripe().subscriptions.cancel(id);
      msg = 'Az előfizetés azonnal megszűnt.';
    }
    await syncSubscription(updated, userId);
  } catch (err) {
    redirect(`${BACK}?hiba=${encodeURIComponent('Stripe hiba: ' + (err as Error).message)}`);
  }
  revalidatePath(BACK);
  redirect(`${BACK}?ok=${encodeURIComponent(msg)}`);
}
