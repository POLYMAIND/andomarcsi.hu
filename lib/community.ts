import type { SupabaseClient } from '@supabase/supabase-js';

// PolySuli közösségi tér (/kozosseg): terek oldalsávval, Sikerfal, Bejelentések, Kérdezz!, tanfolyami terek,
// profilok, hozzászólás-szálak, @említés, értesítések. Adatbázis: 20261115000000_kozosseg.sql + 20261116050000_kozosseg_v2.sql
export type PostKind = 'question' | 'showcase' | 'post';
export type PostTag = 'success' | 'first_try' | 'feedback';
export type SpaceKind = 'feed' | 'qa' | 'announcement' | 'course' | 'link';
export type SpaceGroup = 'start' | 'courses' | 'bonus' | 'questions' | 'links';

export type Space = {
  id: string;
  slug: string;
  name: string;
  icon: string;
  grp: SpaceGroup;
  sort_order: number;
  kind: SpaceKind;
  admin_only_post: boolean;
  members_only: boolean;
  url: string | null;
  description: string;
  header_video: string | null;
  empty_text: string;
};

export type LinkPreview = { url: string; provider: string; title: string | null; description: string | null; image: string | null };

export type CommunityPost = {
  id: string;
  user_id: string;
  space_id: string;
  kind: PostKind;
  title: string;
  body: string;
  course_id: string | null;
  images: string[];
  tag: PostTag | null;
  platforms: string[];
  link_url: string | null;
  link_preview: LinkPreview | null;
  best_comment_id: string | null;
  solved: boolean;
  pinned: boolean;
  like_count: number;
  comment_count: number;
  author_name: string;
  author_is_admin: boolean;
  created_at: string;
  edited_at: string | null;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  images: string[];
  like_count: number;
  author_name: string;
  author_is_admin: boolean;
  created_at: string;
};

export type CommunityProfile = {
  user_id: string;
  display_name: string;
  avatar_path: string | null;
  bio: string;
  instagram: string;
  website: string;
  member_since: string;
};

export type NotificationType = 'like' | 'comment' | 'reply' | 'mention' | 'announcement' | 'best_answer' | 'comment_like';
export type CommunityNotification = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  type: NotificationType;
  post_id: string | null;
  comment_id: string | null;
  created_at: string;
  read_at: string | null;
};

export const COMMUNITY_BUCKET = 'community';
export const MAX_IMAGES = 4; // képek és videók együtt, bejegyzésenként
export const MAX_COMMENT_IMAGES = 2;
export const MAX_VIDEO_MB = 100;
export const TITLE_MAX = 80;
export const PAGE_SIZE = 20;
export const ZERO_UUID = '00000000-0000-0000-0000-000000000000';
export const COURSE_SPACE_SLUG = 'tanfolyam';

const VIDEO_EXT = /\.(mp4|mov|webm)$/i;
// A bejegyzés médiái (images oszlop): képek és videók vegyesen, a kiterjesztés dönti el, melyik.
export const isVideoPath = (path: string) => VIDEO_EXT.test(path);
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GROUP_LABEL: Record<SpaceGroup, string> = {
  start: 'Kezdd itt',
  courses: 'Tanfolyamaim',
  bonus: 'Bónuszok',
  questions: 'Kérdések',
  links: 'Linkek',
};
export const GROUP_ORDER: SpaceGroup[] = ['start', 'courses', 'bonus', 'questions', 'links'];

export const TAG_LABEL: Record<PostTag, string> = { success: 'Siker', first_try: 'Első próbálkozás', feedback: 'Visszajelzést kérek' };
export const TAG_ICON: Record<PostTag, string> = { success: '🏆', first_try: '🌱', feedback: '🙏' };

export const PLATFORMS = ['instagram', 'tiktok', 'youtube', 'facebook', 'linkedin'] as const;
export type Platform = (typeof PLATFORMS)[number];
export const PLATFORM_LABEL: Record<Platform, string> = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', facebook: 'Facebook', linkedin: 'LinkedIn' };
export const PLATFORM_COLOR: Record<Platform, string> = {
  instagram: '#e1306c',
  tiktok: '#141216',
  youtube: '#ff0000',
  facebook: '#1877f2',
  linkedin: '#0a66c2',
};

// Melyik platform linkje? (előnézethez és a platform-jelöléshez)
export function detectPlatform(url: string): Platform | null {
  let host = '';
  try {
    host = new URL(url).hostname.replace(/^(www|m)\./, '');
  } catch {
    return null;
  }
  if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
  if (/(^|\.)tiktok\.com$/.test(host)) return 'tiktok';
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return 'youtube';
  if (/(^|\.)(facebook\.com|fb\.watch)$/.test(host)) return 'facebook';
  if (/(^|\.)linkedin\.com$/.test(host)) return 'linkedin';
  return null;
}

export async function hasCommunityAccess(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.rpc('has_community_access');
  return data === true;
}

// A privát tárhelyen lévő képekhez rövid életű, aláírt linkek (a tárhely RLS-e csak tagoknak ad).
export async function signImages(supabase: SupabaseClient, paths: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
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

// Tömör szín a monogramos avatarhoz (a név alapján mindig ugyanaz)
const AVATAR_COLORS = ['#ffb020', '#7c4dff', '#2ec4a6', '#ff5c8a', '#4da3ff', '#c6f432', '#ff7a45'];
export const avatarColor = (seed: string) => AVATAR_COLORS[[...seed].reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

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

// „Tag 3 hete”, „Tag 2 hónapja” – ha a tanulónak nincs bemutatkozása
export function memberFor(iso: string, now = Date.now()): string {
  const d = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 864e5));
  if (d < 1) return 'Új tag';
  if (d < 7) return `Tag ${d} napja`;
  if (d < 30) return `Tag ${Math.floor(d / 7)} hete`;
  if (d < 365) return `Tag ${Math.floor(d / 30)} hónapja`;
  return `Tag ${Math.floor(d / 365)} éve`;
}

// ── Szöveg: linkek, **félkövér**, @említés ──────────────────────────────
// Az @említés a szövegben így tárolódik: @[Név](felhasználó-azonosító); a felületen „@Név” látszik.
export const MENTION_RE = /@\[([^\]\n]{1,60})\]\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)/gi;
export const mentionToken = (name: string, id: string) => `@[${name.replace(/[[\]\n]/g, '')}](${id})`;

export function mentionedIds(text: string): string[] {
  return Array.from(new Set([...text.matchAll(MENTION_RE)].map((m) => m[2].toLowerCase())));
}

// A tokeneket olvasható „@Név” alakra hozza (pl. e-mailhez, kivonathoz)
export const plainText = (text: string) => text.replace(MENTION_RE, '@$1').replace(/\*\*([^*\n]+)\*\*/g, '$1');

export type RichSegment = { type: 'text' | 'bold' | 'link' | 'mention'; text: string; href?: string };

// Szöveg darabolása megjelenítéshez: a linkek kattinthatók, a **szöveg** félkövér, az @említés a profilra visz.
// Minden más sima szöveg (React escape-eli), így HTML nem kerülhet be.
export function richSegments(text: string): RichSegment[] {
  const out: RichSegment[] = [];
  const re = new RegExp(`${MENTION_RE.source}|\\*\\*([^*\\n]{1,300})\\*\\*|https?:\\/\\/[^\\s<>"')\\]]+`, 'gi');
  let last = 0;
  for (const m of text.matchAll(re)) {
    let token = m[0];
    if (m[1] && m[2]) {
      if (m.index! > last) out.push({ type: 'text', text: text.slice(last, m.index) });
      out.push({ type: 'mention', text: `@${m[1]}`, href: `/kozosseg/tag/${m[2].toLowerCase()}` });
    } else if (m[3]) {
      if (m.index! > last) out.push({ type: 'text', text: text.slice(last, m.index) });
      out.push({ type: 'bold', text: m[3] });
    } else {
      token = token.replace(/[.,;:!?]+$/, '');
      if (m.index! > last) out.push({ type: 'text', text: text.slice(last, m.index) });
      out.push({ type: 'link', text: token, href: token });
    }
    last = m.index! + token.length;
  }
  if (last < text.length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

// Régi név, a meglévő hívóknak
export function splitLinks(text: string): { text: string; href?: string }[] {
  return richSegments(text).map((s) => (s.type === 'link' ? { text: s.text, href: s.href } : { text: s.text }));
}

// Feltöltött kép/videó útvonalának ellenőrzése: csak a saját mappából, véletlen fájlnévvel.
export const validImagePath = (path: string, userId: string) =>
  new RegExp(`^${userId}/[A-Za-z0-9_-]{8,64}\\.(jpe?g|png|webp|gif|mp4|mov|webm)$`).test(path);
export const validAvatarPath = (path: string, userId: string) => new RegExp(`^${userId}/avatar-[A-Za-z0-9_-]{8,64}\\.(jpe?g|png|webp)$`).test(path);

// Rövid URL-ek: /kozosseg/<tér>, /kozosseg/tanfolyam/<kurzus>, /kozosseg/poszt/<id>
export const spaceHref = (slug: string) => `/kozosseg/${slug}`;
export const courseSpaceHref = (courseSlug: string) => `/kozosseg/tanfolyam/${courseSlug}`;
export const postHref = (id: string) => `/kozosseg/poszt/${id}`;
export const memberHref = (userId: string) => `/kozosseg/tag/${userId}`;

export const NOTIFICATION_TEXT: Record<NotificationType, string> = {
  like: 'kedvelte a bejegyzésedet',
  comment: 'hozzászólt a bejegyzésedhez',
  reply: 'válaszolt a hozzászólásodra',
  mention: 'megemlített',
  announcement: 'új bejelentést tett',
  best_answer: 'a te válaszodat jelölte a legjobbnak',
  comment_like: 'kedvelte a hozzászólásodat',
};
