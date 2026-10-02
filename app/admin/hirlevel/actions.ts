'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

const BACK = '/admin/hirlevel';

// Leiratkozási kérésre: a feliratkozó törlése a listáról.
export async function deleteSubscriber(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('newsletter_subscribers').delete().eq('id', String(formData.get('id')));
  revalidatePath(BACK);
  redirect(`${BACK}?${String(formData.get('qs') ?? '')}`);
}
