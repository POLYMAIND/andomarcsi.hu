import { createAdminClient } from '@/lib/supabase/server';

// Videó-előnézet (borítókép) olyan leckékhez is, amikhez a látogató még nem fér hozzá.
// A YouTube-azonosítót NEM adjuk ki (azzal a videó YouTube-on megnézhető lenne): a képet a saját
// /api/video-thumb/<lessonId> végpontunk tölti le és adja tovább.
export const videoThumbUrl = (lessonId: string) => `/api/video-thumb/${lessonId}`;

// Mely leckékhez tartozik videó (csak igen/nem – az azonosító a szerveren marad).
export async function lessonsWithVideo(lessonIds: string[]): Promise<Set<string>> {
  if (!lessonIds.length || !process.env.SUPABASE_SERVICE_ROLE_KEY) return new Set();
  const { data } = await createAdminClient().from('lesson_videos').select('lesson_id').in('lesson_id', lessonIds);
  return new Set((data ?? []).map((v) => v.lesson_id as string));
}
