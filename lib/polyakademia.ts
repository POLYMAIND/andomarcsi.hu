// PolySuli – a Polymaind Claude-tudástára (Polyakadémia): háromszintű oktatási piramis + szintfelmérő kvíz.
// A kurzusok az adatbázisból jönnek (courses.academy_level), itt csak a szöveges váz és az árlista él.

export const ACADEMY = {
  name: 'PolySuli',
  badge: 'POLYSULI',
  path: '/polysuli',
  entryKeyword: 'CLAUDE',
};

// Árlista (bruttó; alanyi adómentes, ÁFA nem jön rá). A kurzusok tényleges ára az adatbázisban van.
export const ACADEMY_PRICES = {
  pocket: 990, // zsebkurzus: kész promptok és skillek telepítési leírással
  small: 5990, // kis tanfolyam
  large: 19990, // nagy tanfolyam
  // a havi előfizetés ára: SUBSCRIPTION.priceHuf (lib/config.ts, alapból 10 990 Ft/hó)
};

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
