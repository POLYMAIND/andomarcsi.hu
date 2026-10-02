'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';

const BACK = '/admin/ertesitesek';

export async function deleteSignup(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('course_waitlist').delete().eq('id', String(formData.get('id')));
  revalidatePath(BACK);
  redirect(`${BACK}?${String(formData.get('qs') ?? '')}`);
}

// Egy kurzus összes (még nem értesített) feliratkozóját „értesítve” állapotba teszi.
export async function markNotified(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = String(formData.get('course_id') ?? '');
  await supabase.from('course_waitlist').update({ notified_at: new Date().toISOString() }).eq('course_id', courseId).is('notified_at', null);
  revalidatePath(BACK);
  redirect(`${BACK}?kurzus=${courseId}&ok=1`);
}
