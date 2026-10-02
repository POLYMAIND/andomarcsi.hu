'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { budapestLocalToIso, slugify } from '@/lib/format';
import { parseYouTubeId } from '@/lib/youtube';
import { enrollBundleContents } from '@/lib/fulfillment';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const int = (f: FormData, k: string) => {
  const n = parseInt(str(f, k), 10);
  return Number.isFinite(n) ? n : null;
};

export async function saveCourse(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  const title = str(formData, 'title');
  if (!title) redirect(`/admin/kurzusok/${id || 'uj'}?hiba=${encodeURIComponent('A cím kötelező.')}`);
  const row = {
    title,
    slug: slugify(str(formData, 'slug') || title),
    subtitle: str(formData, 'subtitle'),
    description: str(formData, 'description'),
    tool: str(formData, 'tool') || 'Canva',
    level: str(formData, 'level') || 'Kezdő',
    price_huf: int(formData, 'price_huf') === null ? null : Math.max(0, int(formData, 'price_huf')!),
    sort_order: int(formData, 'sort_order') ?? 0,
    // Állapot: vázlat (rejtett) · hamarosan (látszik, de nem vásárolható) · elérhető
    published: str(formData, 'status') !== 'draft',
    coming_soon: str(formData, 'status') === 'soon',
    starts_at: budapestLocalToIso(str(formData, 'starts_at')),
    bundle_course_ids: formData.getAll('bundle_course_ids').map(String).filter((v) => v && v !== id),
    // a csak tagsággal elérhető kurzus mindig az előfizetés része
    included_in_subscription: formData.get('included_in_subscription') === 'on' || int(formData, 'price_huf') === null,
  };
  const res = id
    ? await supabase.from('courses').update(row).eq('id', id).select('id').single()
    : await supabase.from('courses').insert(row).select('id').single();
  if (res.error) {
    const msg = res.error.code === '23505' ? 'Ez az URL-név (slug) már foglalt.' : res.error.message;
    redirect(`/admin/kurzusok/${id || 'uj'}?hiba=${encodeURIComponent(msg)}`);
  }
  revalidatePath('/', 'layout');
  redirect(`/admin/kurzusok/${res.data.id}?ok=1`);
}

export async function deleteCourse(formData: FormData) {
  const { supabase } = await requireAdmin();
  await supabase.from('courses').delete().eq('id', str(formData, 'id'));
  revalidatePath('/', 'layout');
  redirect('/admin');
}

export async function saveLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(formData, 'course_id');
  const lessonId = str(formData, 'lesson_id');
  const back = `/admin/kurzusok/${courseId}`;
  const title = str(formData, 'title');
  const ytRaw = str(formData, 'youtube');
  const youtubeId = ytRaw ? parseYouTubeId(ytRaw) : null;
  if (!title) redirect(`${back}?hiba=${encodeURIComponent('A lecke címe kötelező.')}`);
  if (ytRaw && !youtubeId) redirect(`${back}?hiba=${encodeURIComponent('Ezt a YouTube linket nem sikerült felismerni.')}`);

  const publishedAt = budapestLocalToIso(str(formData, 'published_at')) ?? new Date().toISOString();
  const row = {
    course_id: courseId,
    title,
    description: str(formData, 'description'),
    duration_min: int(formData, 'duration_min'),
    sort_order: int(formData, 'sort_order') ?? 0,
    is_preview: formData.get('is_preview') === 'on',
    published_at: publishedAt,
  };
  const res = lessonId
    ? await supabase.from('lessons').update(row).eq('id', lessonId).select('id').single()
    : await supabase.from('lessons').insert(row).select('id').single();
  if (res.error) redirect(`${back}?hiba=${encodeURIComponent(res.error.message)}`);

  if (youtubeId) await supabase.from('lesson_videos').upsert({ lesson_id: res.data.id, youtube_id: youtubeId });
  else if (lessonId && formData.get('clear_video') === 'on') await supabase.from('lesson_videos').delete().eq('lesson_id', lessonId);

  revalidatePath('/', 'layout');
  redirect(`${back}?ok=1#leckek`);
}

export async function deleteLesson(formData: FormData) {
  const { supabase } = await requireAdmin();
  const courseId = str(formData, 'course_id');
  await supabase.from('lessons').delete().eq('id', str(formData, 'lesson_id'));
  revalidatePath('/', 'layout');
  redirect(`/admin/kurzusok/${courseId}#leckek`);
}

export async function grantAccess(formData: FormData) {
  const { supabase } = await requireAdmin();
  const email = str(formData, 'email').toLowerCase();
  const courseId = str(formData, 'course_id');
  const back = `/admin/kurzusok/${courseId}`;
  const { data: user } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (!user) redirect(`${back}?hiba=${encodeURIComponent('Nincs ilyen e-mail címmel regisztrált felhasználó.')}`);
  await supabase.from('enrollments').upsert({ user_id: user.id, course_id: courseId, source: 'manual', amount_huf: 0 }, { onConflict: 'user_id,course_id', ignoreDuplicates: true });
  await enrollBundleContents(user.id, courseId, 'manual');
  redirect(`${back}?ok=1`);
}
