'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth';

export async function toggleHandled(formData: FormData) {
  const { supabase } = await requireAdmin();
  const handled = formData.get('handled') === '1';
  await supabase.from('mentor_applications').update({ handled_at: handled ? null : new Date().toISOString() }).eq('id', String(formData.get('id')));
  revalidatePath('/admin/mentor');
}
