'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import {
  COMMUNITY_BUCKET,
  hasCommunityAccess,
  MAX_COMMENT_IMAGES,
  MAX_IMAGES,
  PLATFORMS,
  plainText,
  postHref,
  TAG_LABEL,
  TITLE_MAX,
  UUID_RE,
  validAvatarPath,
  validImagePath,
  type PostTag,
  type Space,
} from '@/lib/community';
import { SITE_URL } from '@/lib/config';
import { notificationEmail, sendBulkEmail, sendEmail } from '@/lib/email';
import { fetchLinkPreview } from '@/lib/link-preview';
import { createAdminClient } from '@/lib/supabase/server';

const str = (f: FormData, k: string) => String(f.get(k) ?? '').trim();
const fail = (path: string, msg: string): never => redirect(`${path}${path.includes('?') ? '&' : '?'}hiba=${encodeURIComponent(msg)}`);
const uuid = (s: string) => UUID_RE.test(s);
const excerpt = (s: string, n = 280) => (s.length > n ? `${s.slice(0, n).trimEnd()}…` : s);
const SETTINGS_URL = `${SITE_URL}/kozosseg/profil#ertesitesek`;

async function requireMember(next: string) {
  const ctx = await requireUser(next);
  if (!(await hasCommunityAccess(ctx.supabase))) redirect('/kozosseg');
  return ctx;
}

function parseJsonList(raw: string): string[] {
  try {
    const v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

// Új kérdésről azonnal szólunk az adminoknak (a válaszadás miatt); minden más a napi összefoglalóban megy.
async function emailAdmins(exceptUserId: string, subject: string, mail: { heading: string; lines: string[]; cta: string; url: string }) {
  const admin = createAdminClient();
  const { data } = await admin.from('profiles').select('email, community_emails').eq('is_admin', true).neq('id', exceptUserId);
  const { text, html } = notificationEmail({ ...mail, settingsUrl: SETTINGS_URL });
  for (const a of data ?? []) if (a.email && a.community_emails !== false) await sendEmail({ to: a.email, subject, text, html });
}

// Bejelentésnél azonnali levél minden tagnak, aki kéri (az értesítést a trigger már létrehozta).
async function emailAnnouncement(postId: string, title: string, body: string) {
  const admin = createAdminClient();
  const { data: notes } = await admin.from('community_notifications').select('id, user_id').eq('post_id', postId).eq('type', 'announcement');
  if (!notes?.length) return;
  const { data: people } = await admin.from('profiles').select('id, email, community_emails').in('id', notes.map((n) => n.user_id));
  const to = (people ?? []).filter((p) => p.email && p.community_emails !== false).map((p) => p.email as string);
  const { text, html } = notificationEmail({
    heading: `📣 ${title}`,
    lines: [excerpt(plainText(body), 600)].filter(Boolean),
    cta: 'Megnézem',
    url: `${SITE_URL}${postHref(postId)}`,
    settingsUrl: SETTINGS_URL,
  });
  await sendBulkEmail(to, { subject: `Bejelentés: ${title}`, text, html });
  await admin.from('community_notifications').update({ emailed_at: new Date().toISOString() }).in('id', notes.map((n) => n.id));
}

async function loadSpace(supabase: Awaited<ReturnType<typeof requireMember>>['supabase'], slug: string) {
  const { data } = await supabase.from('community_spaces').select('*').eq('slug', slug).maybeSingle<Space>();
  return data;
}

// ── Bejegyzés ──────────────────────────────────────────────────────────
export async function createPost(formData: FormData) {
  const spaceSlug = str(formData, 'space');
  const courseId = str(formData, 'course_id');
  const back = str(formData, 'back').startsWith('/kozosseg') ? str(formData, 'back') : '/kozosseg';
  const { supabase, user, profile } = await requireMember(back);
  const space = await loadSpace(supabase, spaceSlug);
  if (!space || space.kind === 'link') fail(back, 'Ismeretlen tér.');
  if (space!.admin_only_post && !profile?.is_admin) fail(back, 'Ebbe a térbe csak Marcsi posztol – kommentelni viszont tudsz.');

  const title = str(formData, 'title');
  const body = str(formData, 'body');
  const images = parseJsonList(str(formData, 'images'));
  const linkRaw = str(formData, 'link_url');
  const tagRaw = str(formData, 'tag') as PostTag;
  const tag = space!.kind === 'qa' || space!.kind === 'announcement' ? null : tagRaw in TAG_LABEL ? tagRaw : null;
  const platforms = formData.getAll('platforms').map(String).filter((p) => (PLATFORMS as readonly string[]).includes(p));

  const backNew = `${back}${back.includes('?') ? '&' : '?'}uj=1`;
  if (title.length < 3) fail(backNew, 'Adj egy rövid címet (legalább 3 karakter).');
  if (title.length > TITLE_MAX) fail(backNew, `A cím legfeljebb ${TITLE_MAX} karakter lehet.`);
  if (body.length > 5000) fail(backNew, 'A szöveg legfeljebb 5000 karakter lehet.');
  if (images.length > MAX_IMAGES || images.some((p) => !validImagePath(p, user.id))) fail(backNew, 'A képek/videók feltöltése nem sikerült, próbáld újra.');
  if (linkRaw && !/^https?:\/\/\S+$/i.test(linkRaw)) fail(backNew, 'A link http:// vagy https:// címmel kezdődjön.');
  if (space!.kind === 'qa' && !body) fail(backNew, 'Írd le pár mondatban, miben akadtál el.');
  if (!body && !images.length && !linkRaw) fail(backNew, 'Írj pár sort, vagy tegyél be képet, videót vagy linket.');

  let course_id: string | null = null;
  if (courseId && uuid(courseId)) {
    const { data: ok } = await supabase.rpc('has_course_access', { cid: courseId });
    if (ok === true) course_id = courseId;
  }
  if (space!.kind === 'course' && !course_id) fail(backNew, 'Ehhez a tanfolyamhoz nem férsz hozzá.');

  const link_preview = linkRaw ? await fetchLinkPreview(linkRaw) : null;
  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({
      user_id: user.id,
      space_id: space!.id,
      kind: space!.kind === 'qa' ? 'question' : space!.kind === 'feed' && space!.slug === 'sikerfal' ? 'showcase' : 'post',
      title,
      body,
      course_id,
      images,
      tag,
      platforms,
      link_url: link_preview?.url ?? (linkRaw || null),
      link_preview,
    })
    .select('id, author_name')
    .single();
  if (error || !post) fail(backNew, error?.message?.includes('csak Marcsi') ? 'Ebbe a térbe csak Marcsi posztol.' : 'Nem sikerült elmenteni, próbáld újra.');

  if (space!.kind === 'qa') {
    await emailAdmins(user.id, `Új kérdés a közösségben: ${title}`, {
      heading: `${post!.author_name} kérdezett`,
      lines: [title, excerpt(plainText(body))],
      cta: 'Válaszolok',
      url: `${SITE_URL}${postHref(post!.id)}`,
    });
  }
  if (space!.kind === 'announcement') await emailAnnouncement(post!.id, title, body);

  // Első poszt? (a visszajelzéshez)
  const { count } = await supabase.from('community_posts').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
  revalidatePath('/kozosseg', 'layout');
  redirect(`${postHref(post!.id)}?kint=${count === 1 ? 'elso' : '1'}`);
}

export async function updatePost(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase } = await requireMember(path);
  const title = str(formData, 'title');
  const body = str(formData, 'body');
  const tagRaw = str(formData, 'tag') as PostTag;
  if (title.length < 3 || title.length > TITLE_MAX) fail(`${path}?szerkeszt=1`, `A cím 3–${TITLE_MAX} karakter legyen.`);
  if (body.length > 5000) fail(`${path}?szerkeszt=1`, 'A szöveg legfeljebb 5000 karakter lehet.');
  const { data, error } = await supabase
    .from('community_posts')
    .update({ title, body, ...(formData.has('tag') ? { tag: tagRaw in TAG_LABEL ? tagRaw : null } : {}) })
    .eq('id', postId)
    .select('id');
  if (error || !data?.length) fail(path, 'Ezt a bejegyzést nem szerkesztheted.');
  revalidatePath('/kozosseg', 'layout');
  redirect(path);
}

export async function deletePost(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const { supabase } = await requireMember(postHref(postId));
  const { data: post } = await supabase.from('community_posts').select('images, space_id').eq('id', postId).maybeSingle();
  const { data: deleted, error } = await supabase.from('community_posts').delete().eq('id', postId).select('id');
  if (error || !deleted?.length) fail(postHref(postId), 'Ezt a bejegyzést nem törölheted.');
  if (post?.images?.length) await createAdminClient().storage.from(COMMUNITY_BUCKET).remove(post.images);
  const { data: space } = await supabase.from('community_spaces').select('slug').eq('id', post?.space_id ?? '').maybeSingle();
  revalidatePath('/kozosseg', 'layout');
  redirect(`/kozosseg/${space?.slug ?? 'sikerfal'}?torolve=1`);
}

// ── Hozzászólás ────────────────────────────────────────────────────────
export async function addComment(formData: FormData) {
  const postId = str(formData, 'post_id');
  const parentId = str(formData, 'parent_id');
  const body = str(formData, 'body');
  const images = parseJsonList(str(formData, 'images'));
  if (!uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase, user } = await requireMember(path);
  if (!body && !images.length) fail(path, 'Írj valamit a hozzászólásba.');
  if (body.length > 3000) fail(path, 'A hozzászólás legfeljebb 3000 karakter lehet.');
  if (images.length > MAX_COMMENT_IMAGES || images.some((p) => !validImagePath(p, user.id))) fail(path, 'A kép feltöltése nem sikerült, próbáld újra.');
  const { data: comment, error } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, user_id: user.id, body: body || '📷', images, parent_id: parentId && uuid(parentId) ? parentId : null })
    .select('id')
    .single();
  if (error || !comment) fail(path, 'Nem sikerült elmenteni, próbáld újra.');
  revalidatePath(path);
  redirect(`${path}#c-${comment!.id}`);
}

export async function deleteComment(formData: FormData) {
  const commentId = str(formData, 'comment_id');
  const postId = str(formData, 'post_id');
  if (!uuid(commentId) || !uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase } = await requireMember(path);
  const { data: c } = await supabase.from('community_comments').select('images').eq('id', commentId).maybeSingle();
  const { data: deleted, error } = await supabase.from('community_comments').delete().eq('id', commentId).select('id');
  if (error || !deleted?.length) fail(path, 'Ezt a hozzászólást nem törölheted.');
  if (c?.images?.length) await createAdminClient().storage.from(COMMUNITY_BUCKET).remove(c.images);
  revalidatePath(path);
  redirect(path);
}

// ── Kedvelés ───────────────────────────────────────────────────────────
export async function toggleLike(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) return;
  const { supabase, user } = await requireMember(postHref(postId));
  const { data: existing } = await supabase.from('community_likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
  if (existing) await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user.id);
  else await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
  revalidatePath('/kozosseg', 'layout');
}

export async function toggleCommentLike(formData: FormData) {
  const commentId = str(formData, 'comment_id');
  const postId = str(formData, 'post_id');
  if (!uuid(commentId) || !uuid(postId)) return;
  const { supabase, user } = await requireMember(postHref(postId));
  const { data: existing } = await supabase.from('community_comment_likes').select('comment_id').eq('comment_id', commentId).eq('user_id', user.id).maybeSingle();
  if (existing) await supabase.from('community_comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
  else await supabase.from('community_comment_likes').insert({ comment_id: commentId, user_id: user.id });
  revalidatePath(postHref(postId));
}

// ── Kérdés: megoldva, legjobb válasz ───────────────────────────────────
export async function markBestAnswer(formData: FormData) {
  const postId = str(formData, 'post_id');
  const commentId = str(formData, 'comment_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase } = await requireMember(path);
  const { error } = await supabase
    .from('community_posts')
    .update(commentId && uuid(commentId) ? { best_comment_id: commentId, solved: true } : { best_comment_id: null })
    .eq('id', postId);
  if (error) fail(path, 'Nem sikerült menteni.');
  revalidatePath('/kozosseg', 'layout');
  redirect(path);
}

export async function toggleSolved(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase } = await requireMember(path);
  const { data: post } = await supabase.from('community_posts').select('solved').eq('id', postId).maybeSingle();
  if (post) await supabase.from('community_posts').update({ solved: !post.solved, ...(post.solved ? { best_comment_id: null } : {}) }).eq('id', postId);
  revalidatePath('/kozosseg', 'layout');
  redirect(path);
}

// ── Admin: kitűzés, áthelyezés ─────────────────────────────────────────
export async function togglePin(formData: FormData) {
  const postId = str(formData, 'post_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const { supabase, profile } = await requireMember(postHref(postId));
  if (!profile?.is_admin) redirect(postHref(postId));
  const { data: post } = await supabase.from('community_posts').select('pinned').eq('id', postId).maybeSingle();
  if (post) await supabase.from('community_posts').update({ pinned: !post.pinned }).eq('id', postId);
  revalidatePath('/kozosseg', 'layout');
  redirect(postHref(postId));
}

export async function movePost(formData: FormData) {
  const postId = str(formData, 'post_id');
  const target = str(formData, 'space');
  const courseId = str(formData, 'course_id');
  if (!uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase, profile } = await requireMember(path);
  if (!profile?.is_admin) redirect(path);
  const space = await loadSpace(supabase, target);
  if (!space || space.kind === 'link') fail(path, 'Ismeretlen tér.');
  if (space!.kind === 'course' && !uuid(courseId)) fail(path, 'A tanfolyami térhez válaszd ki a tanfolyamot.');
  const { error } = await supabase
    .from('community_posts')
    .update({ space_id: space!.id, ...(space!.kind === 'course' ? { course_id: courseId } : {}) })
    .eq('id', postId);
  if (error) fail(path, 'Nem sikerült áthelyezni.');
  revalidatePath('/kozosseg', 'layout');
  redirect(`${path}?athelyezve=1`);
}

// ── Bejelentés (report) ────────────────────────────────────────────────
export async function reportContent(formData: FormData) {
  const postId = str(formData, 'post_id');
  const commentId = str(formData, 'comment_id');
  const reason = str(formData, 'reason').slice(0, 500);
  if (!uuid(postId)) redirect('/kozosseg');
  const path = postHref(postId);
  const { supabase, user } = await requireMember(path);
  const { error } = await supabase
    .from('community_reports')
    .insert({ post_id: commentId && uuid(commentId) ? null : postId, comment_id: commentId && uuid(commentId) ? commentId : null, reporter_id: user.id, reason });
  if (error) fail(path, 'Nem sikerült elküldeni, próbáld újra.');
  await emailAdmins(user.id, 'Bejelentés érkezett a közösségben', {
    heading: 'Egy tag bejelentett egy tartalmat',
    lines: [reason || '(indoklás nélkül)'],
    cta: 'Moderálás',
    url: `${SITE_URL}/admin/kozosseg`,
  });
  redirect(`${path}?jelentve=1`);
}

// ── Profil és értesítések ──────────────────────────────────────────────
export async function saveProfile(formData: FormData) {
  const { supabase, user } = await requireMember('/kozosseg/profil');
  const display_name = str(formData, 'display_name').slice(0, 60);
  const bio = str(formData, 'bio').slice(0, 80);
  let instagram = str(formData, 'instagram').slice(0, 100);
  let website = str(formData, 'website').slice(0, 200);
  const avatar = str(formData, 'avatar_path');
  if (!display_name) fail('/kozosseg/profil', 'Add meg a neved.');
  if (instagram && !/^https?:\/\//.test(instagram)) instagram = `https://www.instagram.com/${instagram.replace(/^@/, '')}`;
  if (website && !/^https?:\/\//.test(website)) website = `https://${website}`;
  if (avatar && !validAvatarPath(avatar, user.id)) fail('/kozosseg/profil', 'A profilkép feltöltése nem sikerült.');
  await supabase.rpc('community_ensure_profile', { uid: user.id });
  const { data: old } = await supabase.from('community_profiles').select('avatar_path').eq('user_id', user.id).maybeSingle();
  const { error } = await supabase
    .from('community_profiles')
    .update({ display_name, bio, instagram, website, ...(avatar ? { avatar_path: avatar } : {}), updated_at: new Date().toISOString() })
    .eq('user_id', user.id);
  if (error) fail('/kozosseg/profil', 'Nem sikerült menteni.');
  if (avatar && old?.avatar_path && old.avatar_path !== avatar) await createAdminClient().storage.from(COMMUNITY_BUCKET).remove([old.avatar_path]);
  // a régi bejegyzéseken is az új név látszódjon
  await createAdminClient().from('community_posts').update({ author_name: display_name }).eq('user_id', user.id);
  await createAdminClient().from('community_comments').update({ author_name: display_name }).eq('user_id', user.id);
  revalidatePath('/kozosseg', 'layout');
  redirect('/kozosseg/profil?mentve=1');
}

export async function setCommunityEmails(formData: FormData) {
  const { user } = await requireMember('/kozosseg/profil');
  const on = str(formData, 'on') === '1';
  await createAdminClient().from('profiles').update({ community_emails: on }).eq('id', user.id);
  revalidatePath('/kozosseg', 'layout');
  redirect(`/kozosseg/profil?ertesites=${on ? 'be' : 'ki'}#ertesitesek`);
}

export async function markAllNotificationsRead() {
  const { supabase, user } = await requireMember('/kozosseg/ertesitesek');
  await supabase.from('community_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);
  revalidatePath('/', 'layout');
  redirect('/kozosseg/ertesitesek');
}

