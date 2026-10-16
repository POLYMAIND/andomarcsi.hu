'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { invoiceForCheckout, invoiceForSubscription } from '@/lib/billingo';
import { stripe } from '@/lib/stripe';

// Sikertelen (vagy beragadt) számla újrapróbálása a Stripe-ban tárolt fizetési adatokból.
export async function retryInvoice(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const { data: inv } = await supabase.from('invoices').select('stripe_ref, kind').eq('id', id).maybeSingle();
  let error: string | null = null;
  if (inv) {
    try {
      if (inv.kind === 'checkout') await invoiceForCheckout(await stripe().checkout.sessions.retrieve(inv.stripe_ref), { retry: true });
      else await invoiceForSubscription(await stripe().invoices.retrieve(inv.stripe_ref), { retry: true });
    } catch (e) {
      error = (e as Error).message;
    }
  }
  revalidatePath('/admin/szamlak');
  if (error) redirect(`/admin/szamlak?hiba=${encodeURIComponent(error)}`);
  const { data: after } = await supabase.from('invoices').select('status').eq('id', id).maybeSingle();
  redirect(`/admin/szamlak?eredmeny=${after?.status === 'issued' ? 'kiallitva' : 'hiba'}`);
}
