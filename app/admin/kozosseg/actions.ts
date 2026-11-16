'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { COMMUNITY_BUCKET } from '@/lib/community';
import { createAdminClient } from '@/lib/supabase/server';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const uuid = (s: string) => /^[0-9a-f-]{36}$/i.test(s);
const BACK = '/admin/kozosseg';
const done = (q: string) => {
  revalidatePath(BACK);
  revalidatePath('/kozosseg', 'layout');
  redirect(`${BACK}?${q}`);
};

export async function resolveReport(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  if (uuid(id)) await supabase.from('community_reports').update({ status: 'resolved' }).eq('id', id);
  done('kesz=lezarva');
}

// A bejelentett tartalom törlése (és a bejelentés lezárása)
export async function removeReported(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  const postId = str(formData, 'post_id');
  const commentId = str(formData, 'comment_id');
  const admin = createAdminClient();
  if (uuid(commentId)) {
    const { data } = await supabase.from('community_comments').select('images').eq('id', commentId).maybeSingle();
    await supabase.from('community_comments').delete().eq('id', commentId);
    if (data?.images?.length) await admin.storage.from(COMMUNITY_BUCKET).remove(data.images);
  } else if (uuid(postId)) {
    const { data } = await supabase.from('community_posts').select('images').eq('id', postId).maybeSingle();
    await supabase.from('community_posts').delete().eq('id', postId);
    if (data?.images?.length) await admin.storage.from(COMMUNITY_BUCKET).remove(data.images);
  }
  if (uuid(id)) await supabase.from('community_reports').update({ status: 'resolved' }).eq('id', id);
  done('kesz=torolve');
}

export async function banUser(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  let userId = str(formData, 'user_id');
  const email = str(formData, 'email').toLowerCase();
  if (!uuid(userId) && email) {
    const { data } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
    userId = data?.id ?? '';
  }
  if (!uuid(userId)) redirect(`${BACK}?hiba=${encodeURIComponent('Nincs ilyen felhasználó.')}#tiltas`);
  if (userId === user.id) redirect(`${BACK}?hiba=${encodeURIComponent('Magadat nem tilthatod ki.')}#tiltas`);
  await supabase.from('community_bans').upsert({ user_id: userId, reason: str(formData, 'reason').slice(0, 300) });
  done('kesz=kitiltva#tiltas');
}

export async function unbanUser(formData: FormData) {
  const { supabase } = await requireAdmin();
  const userId = str(formData, 'user_id');
  if (uuid(userId)) await supabase.from('community_bans').delete().eq('user_id', userId);
  done('kesz=feloldva#tiltas');
}

export async function saveLinkSpace(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, 'id');
  const url = str(formData, 'url');
  if (url && !/^https:\/\/\S+$/.test(url)) redirect(`${BACK}?hiba=${encodeURIComponent('A link https://-sel kezdődjön.')}#linkek`);
  if (uuid(id)) await supabase.from('community_spaces').update({ url: url || null }).eq('id', id).eq('kind', 'link');
  done('kesz=link#linkek');
}

// Moderátor (admin) hozzáadása / elvétele – pl. Fanni. Az admin mindent lát és kezel a közösségben és az adminban.
export async function setModerator(formData: FormData) {
  const { supabase, user } = await requireAdmin();
  const email = str(formData, 'email').toLowerCase();
  const on = str(formData, 'on') === '1';
  const { data } = await supabase.from('profiles').select('id').ilike('email', email).maybeSingle();
  if (!data) redirect(`${BACK}?hiba=${encodeURIComponent('Nincs ilyen felhasználó – előbb lépjen be egyszer.')}#moderatorok`);
  if (data!.id === user.id && !on) redirect(`${BACK}?hiba=${encodeURIComponent('Saját magadtól nem veheted el.')}#moderatorok`);
  await createAdminClient().from('profiles').update({ is_admin: on }).eq('id', data!.id);
  done('kesz=moderator#moderatorok');
}
