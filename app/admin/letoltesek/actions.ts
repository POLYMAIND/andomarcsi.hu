'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { slugify } from '@/lib/format';

const BACK = '/admin/letoltesek';

export async function saveResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const title = String(formData.get('title') ?? '').trim();
  const fileUrl = String(formData.get('file_url') ?? '').trim();
  const slug = slugify(String(formData.get('slug') ?? '').trim() || title);
  if (!title || !slug || !/^https?:\/\//.test(fileUrl)) redirect(`${BACK}?hiba=adatok${id ? `&szerk=${id}` : ''}`);
  const row = {
    title,
    slug,
    file_url: fileUrl,
    description: String(formData.get('description') ?? '').trim(),
    published: formData.get('published') === 'on',
    sort_order: Number(formData.get('sort_order') ?? 0) || 0,
  };
  const { error } = id ? await supabase.from('free_resources').update(row).eq('id', id) : await supabase.from('free_resources').insert(row);
  if (error) redirect(`${BACK}?hiba=${error.code === '23505' ? 'slug' : 'mentes'}${id ? `&szerk=${id}` : ''}`);
  revalidatePath(BACK);
  revalidatePath('/ingyenes');
  redirect(`${BACK}?mentve=1`);
}

export async function deleteResource(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('free_resources').delete().eq('id', String(formData.get('id')));
  revalidatePath(BACK);
  redirect(`${BACK}?torolve=1`);
}

// Leiratkozási kérésre: a letöltő törlése (az összes anyagnál).
export async function deleteDownloader(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('resource_downloads').delete().eq('email', String(formData.get('email') ?? ''));
  revalidatePath(BACK);
  redirect(`${BACK}?${String(formData.get('qs') ?? '')}`);
}
