'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { COMMUNITY_BUCKET, hasCommunityAccess, MAX_IMAGES, validImagePath, type PostKind } from '@/lib/community';
import { SITE_URL } from '@/lib/config';
import { notificationEmail, sendEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/server';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const fail = (path: string, msg: string): never => redirect(`${path}${path.includes('?') ? '&' : '?'}hiba=${encodeURIComponent(msg)}`);
const uuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

async function requireMember(next: string) {
  const ctx = await requireUser(next);
  if (!(await hasCommunityAccess(ctx.supabase))) redirect('/kozosseg');
  return ctx;
}

// Értesítő levél egy felhasználónak, ha kérte (profiles.community_emails).
async function notifyUser(userId: string, subject: string, mail: { heading: string; lines: string[]; cta: string; url: string }) {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('email, community_emails').eq('id', userId).maybeSingle();
  if (!data?.email || data.community_emails === false) return;
  const { text, html } = notificationEmail({ ...mail, settingsUrl: `${SITE_URL}/kozosseg#ertesitesek` });
  await sendEmail({ to: data.email, subject, text, html });
}

async function notifyAdmins(exceptUserId: string, subject: string, mail: { heading: string; lines: string[]; cta: string; url: string }) {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('id').eq('is_admin', true).neq('id', exceptUserId);
  await Promise.all((data ?? []).map((a) => notifyUser(a.id, subject, mail)));
}

const excerpt = (s: string, n = 280) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);

export async function createPost(formData: FormData) {
  const { supabase, user } = await requireMember('/kozosseg');
  const kind = (str(formData, 'kind') === 'showcase' ? 'showcase' : 'question') as PostKind;
  const title = str(formData, 'title');
  const body = str(formData, 'body');
  const courseId = str(formData, 'course_id');
  let images: string[] = [];
  try {
    const parsed = JSON.parse(str(formData, 'images') || '[]');
    images = Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    images = [];
  }

  const back = '/kozosseg?uj=1';
  if (title.length < 3) fail(back, 'Adj egy rövid címet (legalább 3 karakter).');
  if (title.length > 140) fail(back, 'A cím legfeljebb 140 karakter lehet.');
  if (body.length > 5000) fail(back, 'A szöveg legfeljebb 5000 karakter lehet.');
  if (images.length > MAX_IMAGES || images.some((p) => !validImagePath(p, user.id))) fail(back, 'A képek/videók feltöltése nem sikerült, próbáld újra.');
  if (kind === 'showcase' && images.length === 0 && !body) fail(back, 'A munkádhoz tölts fel legalább egy képet vagy videót, vagy írj pár sort róla.');
  if (kind === 'question' && !body) fail(back, 'Írd le pár mondatban, miben akadtál el.');

  let course_id: string | null = null;
  if (courseId && uuid(courseId)) {
    const { data } = await supabase.from('courses').select('id').eq('id', courseId).eq('published', true).maybeSingle();
    course_id = data?.id ?? null;
  }

  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({ user_id: user.id, kind, title, body, course_id, images })
    .select('id, author_name')
    .single();
  if (error || !post) fail(back, 'Nem sikerült elmenteni, próbáld újra.');

  if (kind === 'question') {
    await notifyAdmins(user.id, `Új kérdés a közösségben: ${title}`, {
      heading: `${post!.author_name} kérdezett`,
      lines: [title, excerpt(body)],
      cta: 'Válaszolok',
      url: `${SITE_URL}/kozosseg/${post!.id}`,
    });
  }
  revalidatePath('/kozosseg');
  redirect(`/kozosseg/${post!.id}`);
}

export async function addComment(formData: FormData) {
  const postId = str(formData, 'post_id');
  const body = str(formData, 'body');
  if (!uuid(postId)) redirect('/kozosseg');
  const path = `/kozosseg/${postId}`;
  const { supabase, user } = await requireMember(path);
  if (!body) fail(path, 'Írj valamit a hozzászólásba.');
  if (body.length > 3000) fail(path, 'A hozzászólás legfeljebb 3000 karakter lehet.');

  const { data: post } = await supabase.from('community_posts').select('id, user_id, kind, title').eq('id', postId).maybeSingle();
  if (!post) redirect('/kozosseg');
  const { data: comment, error } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, user_id: user.id, body })
    .select('id, author_name')
    .single();
  if (error || !comment) fail(path, 'Nem sikerült elmenteni, próbáld újra.');

  if (post!.user_id !== user.id) {
    await notifyUser(post!.user_id, post!.kind === 'question' ? `Válasz érkezett a kérdésedre: ${post!.title}` : `Hozzászóltak a munkádhoz: ${post!.title}`, {
      heading: `${comment!.author_name} ${post!.kind === 'question' ? 'válaszolt a kérdésedre' : 'hozzászólt a munkádhoz'}`,
      lines: [`„${post!.title}”`, excerpt(body)],
      cta: 'Megnézem',
      url: `${SITE_URL}${path}#c-${comment!.id}`,
    });
  }
  revalidatePath(path);
  revalidatePath('/kozosseg');
  redirect(`${path}#c-${comment!.id}`);
}

export async function toggleLike(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) return;
  const { supabase, user } = await requireMember(`/kozosseg/${postId}`);
  const { data: existing } = await supabase.from('community_likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
  if (existing) await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user.id);
  else await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
  revalidatePath('/kozosseg');
  revalidatePath(`/kozosseg/${postId}`);
}

// Kérdésnél a kérdező (vagy admin) kiemelheti a legjobb választ; üres comment_id → visszavonás.
export async function markBestAnswer(formData: FormData) {
  const postId = str(formData, 'post_id');
  const commentId = str(formData, 'comment_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const path = `/kozosseg/${postId}`;
  const { supabase } = await requireMember(path);
  const { error } = await supabase
    .from('community_posts')
    .update({ best_comment_id: commentId && uuid(commentId) ? commentId : null })
    .eq('id', postId)
    .eq('kind', 'question');
  if (error) fail(path, 'Nem sikerült menteni.');
  revalidatePath(path);
  revalidatePath('/kozosseg');
  redirect(path);
}

export async function togglePin(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const { supabase, profile } = await requireMember(`/kozosseg/${postId}`);
  if (!profile?.is_admin) redirect(`/kozosseg/${postId}`);
  const { data: post } = await supabase.from('community_posts').select('pinned').eq('id', postId).maybeSingle();
  if (post) await supabase.from('community_posts').update({ pinned: !post.pinned }).eq('id', postId);
  revalidatePath('/kozosseg');
  revalidatePath(`/kozosseg/${postId}`);
}

export async function deletePost(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const { supabase } = await requireMember(`/kozosseg/${postId}`);
  const { data: post } = await supabase.from('community_posts').select('images').eq('id', postId).maybeSingle();
  const { data: deleted, error } = await supabase.from('community_posts').delete().eq('id', postId).select('id');
  if (error || !deleted?.length) fail(`/kozosseg/${postId}`, 'Ezt a bejegyzést nem törölheted.');
  // A képeket csak sikeres törlés után vesszük ki a tárhelyről.
  if (post?.images?.length) await createAdminClient().storage.from(COMMUNITY_BUCKET).remove(post.images);
  revalidatePath('/kozosseg');
  redirect('/kozosseg?torolve=1');
}

export async function deleteComment(formData: FormData) {
  const commentId = str(formData, 'comment_id');
  const postId = str(formData, 'post_id');
  if (!uuid(commentId) || !uuid(postId)) redirect('/kozosseg');
  const path = `/kozosseg/${postId}`;
  const { supabase } = await requireMember(path);
  const { data: deleted, error } = await supabase.from('community_comments').delete().eq('id', commentId).select('id');
  if (error || !deleted?.length) fail(path, 'Ezt a hozzászólást nem törölheted.');
  revalidatePath(path);
  revalidatePath('/kozosseg');
  redirect(path);
}

export async function setCommunityEmails(formData: FormData) {
  const { user } = await requireMember('/kozosseg');
  const on = str(formData, 'on') === '1';
  await createAdminClient().from('profiles').update({ community_emails: on }).eq('id', user.id);
  revalidatePath('/kozosseg');
  redirect(`/kozosseg?ertesites=${on ? 'be' : 'ki'}#ertesitesek`);
}

