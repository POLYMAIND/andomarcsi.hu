export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  tool: string;
  level: string;
  price_huf: number | null; // null = csak tagsággal érhető el, külön nem vásárolható
  included_in_subscription: boolean;
  published: boolean;
  coming_soon: boolean;
  bundle_course_ids: string[]; // csomag: ezeket a kurzusokat is megnyitja vásárláskor
  starts_at: string | null; // indulás: ekkortól automatikusan élesedik (a videók is ekkor nyílnak meg)
  sort_order: number;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string;
  duration_min: number | null;
  sort_order: number;
  is_preview: boolean;
  published_at: string;
};

export type Subscription = {
  user_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

// A „Hamarosan” állapot az indulási dátumig tart, utána a kurzus magától élesedik.
export function withStart<T extends Pick<Course, 'coming_soon' | 'starts_at'>>(c: T): T {
  const started = !!c.starts_at && new Date(c.starts_at).getTime() <= Date.now();
  return started ? { ...c, coming_soon: false } : c;
}
export function withStartAll<T extends Pick<Course, 'coming_soon' | 'starts_at'>>(list: T[] | null | undefined): T[] {
  return (list ?? []).map(withStart);
}
export function soonLabel(c: Pick<Course, 'starts_at'>): string {
  if (!c.starts_at) return 'Hamarosan';
  const d = new Date(c.starts_at).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' });
  return `Indul: ${d}`;
}

export type CourseStatus = 'draft' | 'soon' | 'live';
export const courseStatus = (c: Pick<Course, 'published' | 'coming_soon'>): CourseStatus =>
  !c.published ? 'draft' : c.coming_soon ? 'soon' : 'live';
export const STATUS_LABEL: Record<CourseStatus, string> = { draft: 'Vázlat', soon: 'Hamarosan', live: 'Elérhető' };

export const isSubscriptionActive = (s: Subscription | null | undefined) =>
  !!s && ['active', 'trialing'].includes(s.status) && (!s.current_period_end || new Date(s.current_period_end) > new Date());
