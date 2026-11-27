import type { SupabaseClient } from '@supabase/supabase-js';
import { mergeContacts, type Touch } from '@/lib/contacts';

const PAGE = 1000; // a Supabase alapból legfeljebb 1000 sort ad vissza egy kérésre

// Minden oldalt beolvas (lapozva), hogy nagy listánál se vesszen el senki.
async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: unknown; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) {
      console.error('[kapcsolatok]', error);
      break;
    }
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  return out;
}

type Rel<T> = T | T[] | null;
const one = <T,>(r: Rel<T>): T | null => (Array.isArray(r) ? r[0] ?? null : r);

// Az összes forrás „érintései” – admin (RLS: is_admin) klienssel.
export async function loadTouches(supabase: SupabaseClient): Promise<Touch[]> {
  const [profiles, newsletter, waitlist, free, downloads, external] = await Promise.all([
    fetchAll<{ email: string | null; full_name: string | null; created_at: string }>((a, b) =>
      supabase.from('profiles').select('email, full_name, created_at').order('created_at').range(a, b)),
    fetchAll<{ email: string; name: string | null; created_at: string }>((a, b) =>
      supabase.from('newsletter_subscribers').select('email, name, created_at').order('created_at').range(a, b)),
    fetchAll<{ email: string; name: string | null; created_at: string; courses: Rel<{ title: string }> }>((a, b) =>
      supabase.from('course_waitlist').select('email, name, created_at, courses(title)').order('created_at').range(a, b)),
    fetchAll<{ created_at: string; profiles: Rel<{ email: string | null; full_name: string | null }>; courses: Rel<{ title: string }> }>((a, b) =>
      supabase.from('enrollments').select('created_at, profiles(email, full_name), courses(title)').eq('source', 'free').order('created_at').range(a, b)),
    fetchAll<{ email: string; name: string | null; created_at: string; free_resources: Rel<{ title: string }> }>((a, b) =>
      supabase.from('resource_downloads').select('email, name, created_at, free_resources(title)').order('created_at').range(a, b)),
    fetchAll<{ email: string; name: string | null; created_at: string; source: string }>((a, b) =>
      supabase.from('external_contacts').select('email, name, created_at, source').order('created_at').range(a, b)),
  ]);

  const touches: Touch[] = [];
  for (const p of profiles) if (p.email) touches.push({ email: p.email, name: p.full_name, kind: 'registered', detail: null, at: p.created_at });
  for (const n of newsletter) touches.push({ email: n.email, name: n.name, kind: 'newsletter', detail: null, at: n.created_at });
  for (const w of waitlist) touches.push({ email: w.email, name: w.name, kind: 'waitlist', detail: one(w.courses)?.title ?? null, at: w.created_at });
  for (const e of free) {
    const p = one(e.profiles);
    if (p?.email) touches.push({ email: p.email, name: p.full_name, kind: 'free_course', detail: one(e.courses)?.title ?? null, at: e.created_at });
  }
  for (const d of downloads) touches.push({ email: d.email, name: d.name, kind: 'download', detail: one(d.free_resources)?.title ?? null, at: d.created_at });
  for (const x of external) touches.push({ email: x.email, name: x.name, kind: 'external', detail: x.source, at: x.created_at });
  return touches;
}

export async function loadContacts(supabase: SupabaseClient) {
  return mergeContacts(await loadTouches(supabase));
}
