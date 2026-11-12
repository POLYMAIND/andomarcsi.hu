// PolySuli – Andor Marcsi / Polymaind Claude-tudástára az andormarcsi.hu-n (a kurzusokon POLYSULI jelvény):
// lépcsőház (ingyenes kóstoló → zsebcsomag → skill-anyag → Skill modul → tagság → mentorprogram), oktatási piramis + szintfelmérő kvíz.
// A kurzusok az adatbázisból jönnek (courses.academy_level), itt csak a szöveges váz és az árlista él.

export const ACADEMY = {
  name: 'PolySuli',
  menu: 'PolySuli', // a menüben és a láblécben ez a felirat
  badge: 'POLYSULI',
  path: '/polysuli',
};

// Árlista (bruttó; alanyi adómentes, ÁFA nem jön rá). A kurzusok tényleges ára az adatbázisban van.
export const ACADEMY_PRICES = {
  pocket: 990, // zsebcsomag: 1 kész skill vagy prompt-pack, útmutatóval (levonjuk, ha utána a hozzá tartozó anyagot is megveszi)
  material: 9990, // skill-anyag: 1 téma, 1 online anyag, a végén működő saját skill
  module: 39900, // Skill modul egyben: mind a 6 skill-anyag + bónuszok
  mentor: 249000, // mentorprogram: 10 személyes alkalom (jelentkezéssel)
  // a havidíjas tagság ára: SUBSCRIPTION.priceHuf (lib/config.ts, alapból 19 900 Ft/hó)
};

export const SKILL_MODULE_SLUG = 'skill-modul';

// Témák a PolySuli-oldal mátrixában: egy téma = egy sor (balról jobbra: ingyenes → zsebcsomag → skill-anyag).
// A sort a szülő tanfolyam slugja azonosítja (a csomagok pocket_for-ja erre mutat, a skill-anyag maga a szülő).
// Ami itt nincs felsorolva, de van hozzá csomag vagy skill-anyag, az a lista végére kerül a tanfolyam címével.
export const ACADEMY_TOPICS: { slug: string; name: string; hint?: string }[] = [
  { slug: 'claude-alapozo', name: 'Skill-írás', hint: 'a Claude Alapozóhoz' },
  { slug: 'markahang-skill', name: 'Márkahang', hint: 'erre épül minden más' },
  { slug: 'design-system-alapozo', name: 'Design system', hint: 'a Karusszel előfeltétele' },
  { slug: 'karusszel-skill-workshop', name: 'Karusszel' },
  { slug: 'reels-vagas-claude-dal', name: 'Reels és vágás' },
  { slug: 'fotobump-skill', name: 'Fotóból videó' },
  { slug: 'urlap-ai-elominosites', name: 'Ügyfélszerzés' },
  { slug: 'claude-celok-heti-terv', name: 'Heti terv' },
];

export const MENTOR_TOPICS = [
  ['Folyamattérkép', 'mi automatizálható, és mennyi időt hoz vissza'],
  ['Összekötések', 'e-mail, naptár, Drive, Meta, CRM az AI mellé'],
  ['Ütemezett feladatok', 'riport, emlékeztetők, napló magától'],
  ['Ajánlatkérés és pipeline', 'az űrlaptól a CRM-ig'],
  ['Hírlevél-automatizáció', ''],
  ['AI-ügynök ügyfélszolgálatra', 'foglalás, GYIK, árajánlat-előkészítés'],
  ['Hirdetések AI-val', 'kreatív, riport, optimalizálási rutin'],
  ['Saját mini app vagy kalkulátor', ''],
  ['Mérés és karbantartás', ''],
  ['Záróprojekt', 'egy élesben futó automatizáció'],
] as const;

export type AcademyLevel = 1 | 2 | 3;

export const ACADEMY_LEVELS: Record<AcademyLevel, { short: string; name: string; title: string; desc: string; result: string }> = {
  1: {
    short: 'Claude a mindennapi munkában',
    name: '1. szint · Alapszint',
    title: 'Claude a mindennapi munkában',
    desc: 'Projekt a cégedről, kész skillek, a saját hangod',
    result: 'Már használtad, de még csak kérdezgetsz tőle. Kezdd az Alapkurzussal: egy hét múlva Claude ismeri a céged, a te hangodon ír, és megvan az első skilled.',
  },
  2: {
    short: 'Saját munkafolyamatok és skillek',
    name: '2. szint · Következő szint',
    title: 'Saját munkafolyamatok és skillek',
    desc: 'Nem kezded elölről: Claude a te folyamataid szerint dolgozik',
    result: 'Rendszeresen használod, de túl sokszor kezded elölről. Itt az ismétlődő munkáidat skillekbe teszed: vágás, tartalom, karusszel, ügyfélkövetés.',
  },
  3: {
    short: 'Ügynökök',
    name: '3. szint · Ügynökök',
    title: 'Ügynökök, automatizáció, saját app',
    desc: 'Ügynököket építesz, automatizálsz, saját appot csinálsz',
    result: 'Vannak már skilljeid, a következő lépés, hogy összekösd őket. Itt ügynököket építesz, és az első saját appodat csinálod vibe codinggal.',
  },
};

export const ACADEMY_QUIZ: { q: string; a: [string, string, string] }[] = [
  { q: 'Mire használod most a Claude-ot?', a: ['Még semmire, vagy néha kérdezek tőle', 'Rendszeresen íratok vele szövegeket', 'Vannak skilljeim, amik helyettem dolgoznak'] },
  { q: 'Mi történik, amikor új beszélgetést nyitsz?', a: ['Mindent elmagyarázok elölről', 'Van projektem a cégemről, ismer engem', 'Skillek és összekötött eszközök várnak'] },
  { q: 'Mit jelent neked a „skill”?', a: ['Fogalmam sincs', 'Tudom, mi az, de még nem írtam', 'Több saját skillem van, és használom őket'] },
  { q: 'Hogyan készül nálad egy Reels vagy egy poszt?', a: ['Kézzel, mindent én csinálok', 'Claude írja a szöveget, a többit én', 'Claude ír és vág, én csak jóváhagyok'] },
  { q: 'Van automatizáció a cégedben?', a: ['Nincs, mindent kézzel csinálunk', 'Van ötletem, mit kéne automatizálni', 'Fut már legalább egy'] },
  { q: 'Mit szeretnél elérni a következő hónapban?', a: ['Végre rendesen használni a Claude-ot', 'Kevesebb ismétlődő munkát', 'Saját ügynököt vagy appot'] },
];

// Válaszok (0 = A, 1 = B, 2 = C) → piramisszint. Átlag < 1,7 → 1. szint; < 2,4 → 2. szint; különben 3.
export function academyLevelFrom(picks: number[]): AcademyLevel {
  if (picks.length === 0) return 1;
  const avg = picks.reduce((s, v) => s + v + 1, 0) / picks.length;
  return avg < 1.7 ? 1 : avg < 2.4 ? 2 : 3;
}

export const isAcademyLevel = (n: unknown): n is AcademyLevel => n === 1 || n === 2 || n === 3;

// Letölthető csomag egy tanfolyam alatt (courses.pocket_for): 0 Ft = ingyenes anyag, egyébként zsebkurzus.
export const packageKind = (c: { price_huf: number | null }) => (c.price_huf === 0 ? 'Ingyenes anyag' : 'Zsebkurzus');
// Sorrend a listákban: előbb az ingyenes anyagok, aztán a zsebkurzusok.
export const byPackageOrder = <T extends { price_huf: number | null; sort_order: number }>(a: T, b: T) =>
  (a.price_huf === 0 ? 0 : 1) - (b.price_huf === 0 ? 0 : 1) || a.sort_order - b.sort_order;
