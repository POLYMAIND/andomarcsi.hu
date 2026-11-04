import type { SupabaseClient } from '@supabase/supabase-js';

// „A 990 Ft-ot levonjuk, ha utána megveszed a hozzá tartozó skill-anyagot.”
// A felhasználó által fizetősen megvett zsebcsomagok (pocket_for = a kurzus) árát levonjuk a kurzus árából.
// Felhasználói klienssel hívjuk: az RLS miatt csak a saját beiratkozásait látja.
export async function pocketCredit(supabase: SupabaseClient, userId: string | null | undefined, courseId: string): Promise<number> {
  if (!userId) return 0;
  const { data } = await supabase
    .from('enrollments')
    .select('amount_huf, courses!inner(pocket_for)')
    .eq('user_id', userId)
    .eq('courses.pocket_for', courseId)
    .gt('amount_huf', 0);
  return (data ?? []).reduce((max, e) => Math.max(max, Number(e.amount_huf) || 0), 0);
}

// A jóváírással csökkentett ár (a Stripe-nak legalább 1 Ft kell; ha nem marad semmi, nem vonunk le).
export const priceAfterCredit = (price: number, credit: number) => (credit > 0 && credit < price ? price - credit : price);
