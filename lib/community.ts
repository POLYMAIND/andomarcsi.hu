import type { SupabaseClient } from '@supabase/supabase-js';

// Közösség (/kozosseg): kérdések és „Munkáim” bejegyzések, hozzászólások, kedvelések.
export type PostKind = 'question' | 'showcase';

export type CommunityPost = {
  id: string;
  user_id: string;
  kind: PostKind;
  title: string;
  body: string;
  course_id: string | null;
  images: string[];
  best_comment_id: string | null;
  pinned: boolean;
  author_name: string;
  author_is_admin: boolean;
  created_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  author_name: string;
  author_is_admin: boolean;
  created_at: string;
};

export const COMMUNITY_BUCKET = 'community';
export const MAX_IMAGES = 4; // képek és videók együtt, bejegyzésenként
export const MAX_VIDEO_MB = 50;
const VIDEO_EXT = /\.(mp4|mov|webm)$/i;
// A bejegyzés médiái (images oszlop): képek és videók vegyesen, a kiterjesztés dönti el, melyik.
export const isVideoPath = (path: string) => VIDEO_EXT.test(path);
export const PAGE_SIZE = 20;

export const KIND_LABEL: Record<PostKind, string> = { question: 'Kérdés', showcase: 'Munkám' };
// URL-ben magyarul: ?tipus=kerdes | munka
export const KIND_SLUG: Record<PostKind, string> = { question: 'kerdes', showcase: 'munka' };
export const kindFromSlug = (s: string | undefined): PostKind | null => (s === 'kerdes' ? 'question' : s === 'munka' ? 'showcase' : null);

export async function hasCommunityAccess(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.rpc('has_community_access');
  return data === true;
}

// A privát tárhelyen lévő képekhez rövid életű, aláírt linkek (a tárhely RLS-e csak tagoknak ad).
export async function signImages(supabase: SupabaseClient, paths: string[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths));
  if (!unique.length) return new Map();
  const { data } = await supabase.storage.from(COMMUNITY_BUCKET).createSignedUrls(unique, 60 * 60);
  const out = new Map<string, string>();
  for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
  return out;
}

// Monogram az avatarhoz
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

// „5 perce”, „3 órája”, „2 napja”, egy hét után dátum
export function timeAgo(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'épp most';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} perce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} órája`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} napja`;
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' });
}

// Szöveg darabolása: a http(s) linkek kattinthatók, minden más sima szöveg (React escape-eli).
export function splitLinks(text: string): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = [];
  const re = /https?:\/\/[^\s<>"')\]]+/g;
  let last = 0;
  for (const m of text.matchAll(re)) {
    const url = m[0].replace(/[.,;:!?]+$/, '');
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: url, href: url });
    last = m.index! + url.length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}

// Feltöltött kép útvonalának ellenőrzése: csak a saját mappából, véletlen fájlnévvel.
export const validImagePath = (path: string, userId: string) => new RegExp(`^${userId}/[A-Za-z0-9_-]{8,64}\\.(jpe?g|png|webp|gif|mp4|mov|webm)$`).test(path);
