import type { SupabaseClient } from '@supabase/supabase-js';
import { signImages, type CommunityPost, type CommunityProfile } from '@/lib/community';

// A feedhez és a bejegyzéshez tartozó kiegészítő adatok: szerzők profilja, aláírt kép-/avatarlinkek, a saját kedvelések.
export async function loadPostExtras(supabase: SupabaseClient, posts: CommunityPost[], userId: string, extraUserIds: string[] = [], extraPaths: string[] = []) {
  const userIds = Array.from(new Set([...posts.map((p) => p.user_id), ...extraUserIds]));
  const ids = posts.map((p) => p.id);
  const [{ data: profs }, { data: likes }] = await Promise.all([
    userIds.length ? supabase.from('community_profiles').select('*').in('user_id', userIds) : Promise.resolve({ data: [] as CommunityProfile[] }),
    ids.length ? supabase.from('community_likes').select('post_id').eq('user_id', userId).in('post_id', ids) : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);
  const profiles = new Map((profs ?? []).map((p) => [p.user_id as string, p as CommunityProfile]));
  const signed = await signImages(supabase, [
    ...posts.flatMap((p) => p.images.slice(0, 3)),
    ...[...profiles.values()].map((p) => p.avatar_path),
    ...extraPaths,
  ]);
  const avatarOf = (uid: string) => {
    const path = profiles.get(uid)?.avatar_path;
    return path ? signed.get(path) ?? null : null;
  };
  return { profiles, signed, liked: new Set((likes ?? []).map((l) => l.post_id as string)), avatarOf };
}

export type FeedSort = 'uj' | 'nepszeru';
export type FeedFilter = { sort: FeedSort; tag: string | null; course: string | null; open: boolean; page: number };

export function parseFeedFilter(sp: Record<string, string | undefined>): FeedFilter {
  const uuid = /^[0-9a-f-]{36}$/i;
  return {
    sort: sp.rend === 'nepszeru' ? 'nepszeru' : 'uj',
    tag: sp.tipus && ['success', 'first_try', 'feedback'].includes(sp.tipus) ? sp.tipus : null,
    course: sp.tema && uuid.test(sp.tema) ? sp.tema : null,
    open: sp.nyitott === '1',
    page: Math.max(1, parseInt(sp.oldal ?? '1', 10) || 1),
  };
}

export async function loadFeed(
  supabase: SupabaseClient,
  opts: { spaceId: string; courseId?: string | null; filter: FeedFilter; isQa: boolean; pageSize: number },
) {
  const { filter: f, pageSize } = opts;
  const from = (f.page - 1) * pageSize;
  let q = supabase.from('community_posts').select('*', { count: 'exact' }).eq('space_id', opts.spaceId).order('pinned', { ascending: false });
  q = f.sort === 'nepszeru' ? q.order('like_count', { ascending: false }).order('comment_count', { ascending: false }) : q;
  q = q.order('created_at', { ascending: false }).range(from, from + pageSize - 1);
  if (opts.courseId) q = q.eq('course_id', opts.courseId);
  else if (f.course) q = q.eq('course_id', f.course);
  if (f.tag) q = q.eq('tag', f.tag);
  // „Válaszra vár”: kérdésnél a megoldatlanok, máshol a visszajelzést kérők, akiknek még senki nem válaszolt
  if (f.open) q = opts.isQa ? q.eq('solved', false) : q.eq('tag', 'feedback').eq('comment_count', 0);
  const { data, count, error } = await q.returns<CommunityPost[]>();
  return { posts: data ?? [], count: count ?? 0, error };
}

// A tanuló tanfolyamai (a szerkesztő „Melyik tanfolyamhoz kapcsolódik?” listájához és a szűrőhöz)
export async function loadMyCourses(supabase: SupabaseClient, userId: string): Promise<{ id: string; title: string; slug: string }[]> {
  const { data } = await supabase.from('enrollments').select('courses(id, title, slug, bundle_course_ids, published)').eq('user_id', userId);
  type C = { id: string; title: string; slug: string; bundle_course_ids: string[] | null; published: boolean };
  return (data ?? [])
    .map((e) => e.courses as unknown as C | null)
    .filter((c): c is C => !!c && c.published && !c.bundle_course_ids?.length)
    .map((c) => ({ id: c.id, title: c.title.replace(/^(Zsebkurzus|Ingyenes): /, ''), slug: c.slug }))
    .sort((a, b) => a.title.localeCompare(b.title, 'hu'));
}

export async function courseTitleMap(supabase: SupabaseClient, ids: (string | null)[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(ids.filter((x): x is string => !!x)));
  if (!unique.length) return new Map();
  const { data } = await supabase.from('courses').select('id, title').in('id', unique);
  return new Map((data ?? []).map((c) => [c.id as string, (c.title as string).replace(/^(Zsebkurzus|Ingyenes): /, '')]));
}
