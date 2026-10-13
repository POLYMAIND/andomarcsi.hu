'use server';

import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export async function setPassword(formData: FormData) {
  const { supabase } = await requireUser();
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (password.length < 8) redirect('/jelszo?hiba=rovid');
  if (password !== confirm) redirect('/jelszo?hiba=egyezes');
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/jelszo?hiba=${error.code === 'weak_password' ? 'gyenge' : error.code === 'same_password' ? 'ugyanaz' : 'hiba'}`);
  redirect('/dashboard?jelszo=ok');
}
