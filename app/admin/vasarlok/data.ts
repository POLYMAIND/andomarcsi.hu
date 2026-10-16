import type { SupabaseClient } from '@supabase/supabase-js';

export type Purchase = {
  id: string;
  user_id: string;
  course_id: string;
  source: 'free' | 'stripe' | 'manual';
  amount_huf: number;
  stripe_session_id: string | null;
  created_at: string;
  email: string;
  name: string;
  course: string;
  slug: string;
  invoice: string | null;
  fromBundle: string | null; // ha egy csomag része: a csomag neve
};

export const SOURCE_LABEL: Record<Purchase['source'], string> = { stripe: 'Bankkártya', manual: 'Kézi', free: 'Ingyenes' };

// Minden beiratkozás (vásárlás, kézi hozzáférés, ingyenes) a vevő, a kurzus és a számlaszám adataival.
export async function loadPurchases(supabase: SupabaseClient): Promise<Purchase[]> {
  const [{ data: rows }, { data: invoices }, { data: courses }] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id, user_id, course_id, source, amount_huf, stripe_session_id, created_at, profiles(email, full_name), courses(title, slug)')
      .order('created_at', { ascending: false })
      .limit(2000),
    supabase.from('invoices').select('stripe_ref, invoice_number, status'),
    supabase.from('courses').select('id, title, bundle_course_ids'),
  ]);
  const invoiceOf = new Map((invoices ?? []).map((i) => [i.stripe_ref, i.status === 'issued' ? i.invoice_number : null]));
  const bundles = (courses ?? []).filter((c) => (c.bundle_course_ids ?? []).length);
  const list = (rows ?? []) as unknown as (Omit<Purchase, 'email' | 'name' | 'course' | 'slug' | 'invoice' | 'fromBundle'> & {
    profiles: { email: string; full_name: string | null } | null;
    courses: { title: string; slug: string } | null;
  })[];
  const owned = new Set(list.map((r) => `${r.user_id}:${r.course_id}`));
  return list.map((r) => {
    // csomagból kapott modul: 0 Ft, nincs saját fizetés, és a vevőnek megvan a csomag, ami tartalmazza
    const bundle = !r.stripe_session_id && r.amount_huf === 0 && r.source !== 'free'
      ? bundles.find((b) => b.bundle_course_ids.includes(r.course_id) && owned.has(`${r.user_id}:${b.id}`))
      : undefined;
    return {
      id: r.id, user_id: r.user_id, course_id: r.course_id, source: r.source, amount_huf: r.amount_huf,
      stripe_session_id: r.stripe_session_id, created_at: r.created_at,
      email: r.profiles?.email ?? '—', name: r.profiles?.full_name ?? '',
      course: r.courses?.title ?? '—', slug: r.courses?.slug ?? '',
      invoice: r.stripe_session_id ? invoiceOf.get(r.stripe_session_id) ?? null : null,
      fromBundle: bundle?.title ?? null,
    };
  });
}
