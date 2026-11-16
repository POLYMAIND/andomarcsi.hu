import type { SupabaseClient } from '@supabase/supabase-js';
import { FOUNDATION_SLUG } from '@/lib/polyakademia';
import { withStartAll, type Course } from '@/lib/types';

export const FOUNDATION_EXTRAS_INTRO =
  'Kis, kész csomagok egy-egy témára: skill vagy prompt-pack útmutatóval. Ha az alapozóban valamelyik csapattag megtetszett, ezekkel tovább viheted.';

// „Amire még szükséged lehet” (kurzusoldal és leckeoldal): az adminban kiválasztott kapcsolódó anyagok,
// a kiválasztás sorrendjében; ha nincs kiválasztás, a Claude alapozónál minden elérhető zsebcsomag és ingyenes anyag.
// A „Hamarosan” és a vázlat állapotúak nem jelennek meg; exclude: ami az oldalon máshol már szerepel.
export async function loadRelatedExtras(supabase: SupabaseClient, course: Course, exclude: string[] = []): Promise<Course[]> {
  const relatedIds = course.related_course_ids ?? [];
  const { data } = relatedIds.length
    ? await supabase.from('courses').select('*').eq('published', true).in('id', relatedIds).returns<Course[]>()
    : course.slug === FOUNDATION_SLUG
      ? await supabase.from('courses').select('*').eq('published', true).not('pocket_for', 'is', null).order('sort_order').returns<Course[]>()
      : { data: [] as Course[] };
  return withStartAll(data)
    .filter((p) => !p.coming_soon && p.id !== course.id && (relatedIds.length > 0 || !exclude.includes(p.id)))
    .sort((a, b) =>
      relatedIds.length
        ? relatedIds.indexOf(a.id) - relatedIds.indexOf(b.id)
        : Number((a.price_huf ?? 0) === 0) - Number((b.price_huf ?? 0) === 0) || a.sort_order - b.sort_order,
    );
}
