'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

// Hozzáférés megvonása (pl. visszatérítés után vagy téves kézi hozzáadásnál). Csomagnál a vele kapott modulokat is.
// A pénzt NEM téríti vissza – azt a Stripe-ban kell.
export async function revokeAccess(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const qs = String(formData.get('qs') ?? '');
  const { data: row } = await supabase.from('enrollments').select('user_id, course_id, courses(bundle_course_ids)').eq('id', id).maybeSingle();
  if (row) {
    const bundleIds = ((row.courses as unknown as { bundle_course_ids: string[] } | null)?.bundle_course_ids ?? []);
    if (bundleIds.length) {
      await supabase.from('enrollments').delete().eq('user_id', row.user_id).in('course_id', bundleIds).is('stripe_session_id', null).eq('amount_huf', 0);
    }
    await supabase.from('enrollments').delete().eq('id', id);
  }
  revalidatePath('/admin/vasarlok');
  redirect(`/admin/vasarlok?${qs}${qs ? '&' : ''}megvonva=1`);
}
