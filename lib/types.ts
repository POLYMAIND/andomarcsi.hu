export type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  teaser: string; // rövid, emberi hangú leírás (kártyák, kurzusoldal teteje)
  outcome: string; // „Mit tudsz majd a végére?”
  workload_min: number | null; // videóanyag hossza percben (schema.org)
  tool: string;
  level: string;
  price_note: string; // egyedi árcímke, pl. „PolyOS-tagsággal ingyenes” (felülírja a megjelenített árat)
  price_huf: number | null; // null = csak tagsággal érhető el, külön nem vásárolható
  included_in_subscription: boolean;
  published: boolean;
  coming_soon: boolean;
  bundle_course_ids: string[]; // csomag: ezeket a kurzusokat is megnyitja vásárláskor
  starts_at: string | null; // indulás: ekkortól automatikusan élesedik (a videók is ekkor nyílnak meg)
  sort_order: number;
  created_at: string;
  academy_level: number | null; // PolySuli piramisszint (1–3); null = nem PolySuli-kurzus → POLYSULI jelvény
  academy_tag: string; // rövid címke a PolySuli-oldalon (pl. „Itt kezdj”, „CRM”)
  academy_keyword: string; // Instagram-kulcsszó a 990 Ft-os zsebcsomaghoz
  skill_material: number | null; // 1–6: a hat skill-anyag sorszáma a PolySuli-oldalon
  pocket_for: string | null; // zsebkurzus: ennek a tanfolyamnak a kész promptjai/skilljei (letölthető csomag, nincs videó)
  // Időszakos akció: sale_starts_at (üres = azonnal) és sale_ends_at (üres = visszavonásig) között a sale_price_huf érvényes.
  sale_price_huf: number | null;
  sale_starts_at: string | null;
  sale_ends_at: string | null;
  sale_label: string; // pl. „Bevezető ár” (üres = „Akció”)
  was_price_huf?: number | null; // számolt (NEM adatbázis-oszlop): aktív akciónál az eredeti, áthúzott ár – lásd withStart
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

type SaleFields = Partial<Pick<Course, 'price_huf' | 'sale_price_huf' | 'sale_starts_at' | 'sale_ends_at' | 'was_price_huf'>>;

// Aktív-e most az időszakos akció? Csak valódi kedvezmény számít (az akciós ár kisebb, mint a rendes).
export function saleActive(c: SaleFields, now = Date.now()): boolean {
  if (c.sale_price_huf == null || c.price_huf == null || c.sale_price_huf <= 0 || c.sale_price_huf >= c.price_huf) return false;
  if (c.sale_starts_at && new Date(c.sale_starts_at).getTime() > now) return false;
  if (c.sale_ends_at && new Date(c.sale_ends_at).getTime() <= now) return false;
  return true;
}

// Betöltéskor egyszer alkalmazzuk (megjelenítés ÉS fizetés ugyanezt látja):
// – a „Hamarosan” állapot az indulási dátumig tart, utána a kurzus magától élesedik;
// – aktív akciónál a price_huf az akciós ár, a was_price_huf az eredeti (áthúzott) ár.
export function withStart<T extends Pick<Course, 'coming_soon' | 'starts_at'> & SaleFields>(c: T, now = Date.now()): T {
  let out = c;
  if (c.starts_at && new Date(c.starts_at).getTime() <= now) out = { ...out, coming_soon: false };
  // Csak egyszer: alkalmazás után az ár = akciós ár, így a saleActive már hamis (nincs „valódi” kedvezmény), nem csökken tovább.
  if (saleActive(c, now)) out = { ...out, was_price_huf: c.price_huf, price_huf: c.sale_price_huf };
  return out;
}
export function withStartAll<T extends Pick<Course, 'coming_soon' | 'starts_at'> & SaleFields>(list: T[] | null | undefined): T[] {
  return (list ?? []).map((c) => withStart(c));
}

// Akció a megjelenítéshez: kedvezmény %-ban és a lejárat („dec. 31-ig”). Csak withStart után van was_price_huf.
export function saleInfo(c: Pick<Course, 'price_huf'> & Partial<Pick<Course, 'was_price_huf' | 'sale_ends_at' | 'sale_label'>>) {
  if (c.was_price_huf == null || c.price_huf == null) return null;
  const pct = Math.round((1 - c.price_huf / c.was_price_huf) * 100);
  const until = c.sale_ends_at
    ? `${new Date(new Date(c.sale_ends_at).getTime() - 1).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' }).replace(/\.$/, '')}-ig`
    : '';
  return { listPrice: c.was_price_huf, pct, until, label: c.sale_label?.trim() || 'Akció' };
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

/** A lecke sorszáma a listában: ha a kurzus 0. leckével indul, a sort_order a szám (így egyezik a videóval). */
export function lessonNo(list: Pick<Lesson, 'sort_order'>[], lesson: Pick<Lesson, 'sort_order'>, i: number): number {
  return list[0]?.sort_order === 0 ? lesson.sort_order : i + 1;
}
