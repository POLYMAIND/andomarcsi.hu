import type { SupabaseClient } from '@supabase/supabase-js';
import type { Course, Lesson, Subscription } from '@/lib/types';
import { isSubscriptionActive } from '@/lib/types';

const WEEK = 7 * 24 * 3600 * 1000;

export async function getCatalog(supabase: SupabaseClient) {
  const [{ data: courses }, { data: lessons }] = await Promise.all([
    supabase.from('courses').select('*').eq('published', true).order('sort_order').returns<Course[]>(),
    supabase.from('lessons').select('id, course_id, title, published_at, sort_order').lte('published_at', new Date().toISOString()).returns<Lesson[]>(),
  ]);
  const weekAgo = Date.now() - WEEK;
  const byCourse = new Map<string, { count: number; fresh: number }>();
  for (const l of lessons ?? []) {
    const e = byCourse.get(l.course_id) ?? { count: 0, fresh: 0 };
    e.count++;
    if (new Date(l.published_at).getTime() > weekAgo) e.fresh++;
    byCourse.set(l.course_id, e);
  }
  const latest = [...(lessons ?? [])].sort((a, b) => b.published_at.localeCompare(a.published_at)).slice(0, 6);
  return {
    courses: courses ?? [],
    stats: (id: string) => byCourse.get(id) ?? { count: 0, fresh: 0 },
    latest,
    totalLessons: lessons?.length ?? 0,
  };
}

// Mihez fér hozzá a felhasználó? (megjelenítéshez – a tényleges védelmet az RLS adja)
export async function getUserAccess(supabase: SupabaseClient, userId: string | null | undefined) {
  if (!userId) return { enrolled: new Set<string>(), subscription: null as Subscription | null, subscribed: false, completed: new Set<string>() };
  const [{ data: enrollments }, { data: subscription }, { data: progress }] = await Promise.all([
    supabase.from('enrollments').select('course_id').eq('user_id', userId),
    supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle<Subscription>(),
    supabase.from('lesson_progress').select('lesson_id').eq('user_id', userId),
  ]);
  return {
    enrolled: new Set((enrollments ?? []).map((e) => e.course_id as string)),
    subscription,
    subscribed: isSubscriptionActive(subscription),
    completed: new Set((progress ?? []).map((p) => p.lesson_id as string)),
  };
}

export function courseAccessible(
  course: Course,
  access: { enrolled: Set<string>; subscribed: boolean },
  isAdmin = false,
) {
  return isAdmin || course.price_huf === 0 || access.enrolled.has(course.id) || (access.subscribed && course.included_in_subscription);
}
