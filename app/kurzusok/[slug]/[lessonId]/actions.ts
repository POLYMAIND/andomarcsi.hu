'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function toggleComplete(formData: FormData) {
  const lessonId = String(formData.get('lesson_id'));
  const done = formData.get('done') === '1';
  const path = String(formData.get('path') ?? '/dashboard');
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  if (done) await supabase.from('lesson_progress').delete().eq('user_id', data.user.id).eq('lesson_id', lessonId);
  else await supabase.from('lesson_progress').upsert({ user_id: data.user.id, lesson_id: lessonId }, { onConflict: 'user_id,lesson_id', ignoreDuplicates: true });
  revalidatePath(path);
}
