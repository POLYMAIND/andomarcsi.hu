// GEO / SEO: GYIK, schema.org JSON-LD és a kurzusoldalak tényalapú GYIK-je.
// A látható GYIK és a FAQPage schema ugyanebből az adatból készül, így szóról szóra egyeznek.
import { SITE_URL } from '@/lib/config';
import { COMPANY } from '@/lib/company';
import { formatHuf } from '@/lib/format';
import type { Course } from '@/lib/types';

export type Faq = { q: string; a: string };

// Kezdőlap – minden válasz első mondata önmagában is idézhető.
export const HOME_FAQ: Faq[] = [
  { q: 'Kell hozzá bármilyen előismeret?', a: 'Nem, a kurzusok teljesen kezdőknek készültek. Ha be tudsz kapcsolni egy laptopot és megtalálod rajta a böngészőt, a többit megmutatom.' },
  { q: 'Hol lehet Canvát tanulni kezdőként, magyarul?', a: 'Az andormarcsi.hu-n a Canva Kalauz három, egyenként 60 perces magyar nyelvű videómodulban tanítja a Canvát a teljes alapoktól. Az első modul végére kész Instagram-posztod lesz.' },
  { q: 'Mennyibe kerülnek a kurzusok?', a: 'Egy Canva Kalauz-modul 9 990 Ft, a hármas csomag 24 990 Ft, a Claude Alapozó 24 900 Ft. A haladóbb anyagok tagsággal érhetők el. Alanyi adómentes vagyok, így ÁFA nem jön rá.' },
  { q: 'Élő óra vagy felvett videó?', a: 'Előre felvett videók, amiket a saját tempódban nézel, bármikor és akárhányszor. Senki nem lát, ha negyedszer tekered vissza ugyanazt a részt.' },
  { q: 'Mi az a Claude, és miben más, mint a ChatGPT?', a: 'A Claude az Anthropic mesterséges intelligencia asszisztense, ami szövegírásban, e-mailekben és ajánlatokban segít. A Claude Alapozóban megtanulod úgy beállítani, hogy a saját vállalkozásod hangján írjon – nem pedig úgy, mint egy hivatali levél.' },
  { q: 'Tényleg tudok AI-jal hirdetési képet csinálni grafikus nélkül?', a: 'Igen, referenciaképből és jó utasításokkal kis vállalkozásként is készíthetsz hirdetési kreatívot. Az AI képgenerálás kurzusban megmutatom a teljes folyamatot, a feliratok javításával együtt.' },
  { q: 'Mennyi idő alatt végzek egy kurzussal?', a: 'Egy Canva-modul nagyjából 60 perc videó plusz egy rövid házi feladat. A Claude Alapozó 2–3 óra – egy hétvége alatt kényelmesen megvan, kávészünetekkel.' },
  { q: 'Nem vagyok már túl öreg ehhez?', a: 'Nem. A célcsoportom pont azok, akik most ismerkednek a digitális eszközökkel, korhatár nélkül. Én is negyven felett tanultam meg mindent, amit tanítok.' },
];

const PERSON_ID = `${SITE_URL}/#marcsi`;
const ORG_ID = `${SITE_URL}/#org`;

// „A” / „Az” névelő magyarul (magánhangzóval kezdődő szó előtt „Az”).
export const article = (word: string) => (/^[aáeéiíoóöőuúüű]/i.test(word.trim()) ? 'Az' : 'A');

const isBeginner = (c: Pick<Course, 'level'>) => /kezdő/i.test(c.level) && !/haladó/i.test(c.level);

// Kurzusoldal H1: kurzusnév + „kezdőknek”, ha kezdő szintű és a címben még nincs benne.
export function courseHeading(c: Pick<Course, 'title' | 'level'>): string {
  return isBeginner(c) && !/kezdő/i.test(c.title) ? `${c.title} kezdőknek` : c.title;
}

const workloadText = (min: number) => (min < 90 ? `${min} perc` : `${String(Math.round((min / 60) * 2) / 2).replace('.', ',')} óra`);
const isoDuration = (min: number) => `PT${Math.floor(min / 60) ? `${Math.floor(min / 60)}H` : ''}${min % 60 ? `${min % 60}M` : ''}`;

// Kurzusoldal GYIK – csak az adatbázisban lévő tényekből (ár, szint, hossz, állapot).
export function courseFaq(c: Course): Faq[] {
  const name = `${article(c.title)} ${c.title}`;
  const faq: Faq[] = [];
  faq.push({
    q: 'Kell hozzá előismeret?',
    a: isBeginner(c)
      ? `Nem, ${name.charAt(0).toLowerCase() + name.slice(1)} teljesen kezdőknek készült. Lépésről lépésre, szakzsargon nélkül mutatok meg mindent.`
      : `${name} haladóbb anyag, ezért jó, ha az alapokkal már megismerkedtél. A lépéseket itt is egyenként mutatom meg.`,
  });
  faq.push({
    q: 'Mennyibe kerül?',
    a: c.price_huf === null
      ? `${name} a tagság része, külön nem vásárolható meg.`
      : c.price_huf === 0
        ? `${name} ingyenes.`
        : `${name} ára ${formatHuf(c.price_huf)}, egyszeri díj, és utána korlátlan ideig hozzáférsz. Alanyi adómentes vagyok, így ÁFA nem jön rá.`,
  });
  if (c.workload_min) {
    faq.push({ q: 'Mennyi idő alatt végzek vele?', a: `${name} nagyjából ${workloadText(c.workload_min)} videó, amit a saját tempódban nézel – akár több részletben is.` });
  }
  const start = c.starts_at ? new Date(c.starts_at).toLocaleDateString('hu-HU', { month: 'long', day: 'numeric', timeZone: 'Europe/Budapest' }) : null;
  faq.push({
    q: 'Élő óra vagy felvett videó?',
    a: `Előre felvett videók, amiket bármikor és akárhányszor visszanézhetsz.${c.coming_soon ? ` A kurzus hamarosan indul${start ? ` (tervezett indulás: ${start})` : ''} – kérj értesítést, és szólok, amint elérhető.` : ''}`,
  });
  return faq;
}

export function faqPage(faq: Faq[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function courseSchema(c: Course) {
  const url = `${SITE_URL}/kurzusok/${c.slug}`;
  const offers =
    c.price_huf === null
      ? undefined
      : {
          '@type': 'Offer',
          price: String(c.price_huf),
          priceCurrency: 'HUF',
          category: c.price_huf === 0 ? 'Free' : 'Paid',
          url,
          // „Hamarosan”: nem árusítjuk előre (nincs előrendelés), csak az indulás dátumát jelezzük.
          ...(c.coming_soon ? (c.starts_at ? { availabilityStarts: c.starts_at } : {}) : { availability: 'https://schema.org/InStock' }),
        };
  return {
    '@type': 'Course',
    '@id': `${url}#course`,
    name: c.title,
    description: c.teaser || c.subtitle || c.description,
    url,
    inLanguage: 'hu',
    educationalLevel: c.level,
    about: c.tool,
    provider: { '@id': ORG_ID },
    ...(offers ? { offers } : {}),
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'online',
      ...(c.workload_min ? { courseWorkload: isoDuration(c.workload_min) } : {}),
      ...(c.starts_at ? { startDate: c.starts_at } : {}),
    },
  };
}

export const PERSON = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Andor Marcsi',
  alternateName: 'Tőke-Andor Mária',
  jobTitle: 'Vállalkozó, digitáliseszköz-oktató',
  image: `${SITE_URL}/marcsi.png`,
  url: `${SITE_URL}/`,
  knowsAbout: ['Canva', 'Claude', 'AI képgenerálás', 'Social media hirdetés', 'PolyOS'],
};

export const ORGANIZATION = {
  '@type': 'EducationalOrganization',
  '@id': ORG_ID,
  name: 'andormarcsi.hu',
  legalName: COMPANY.name,
  url: `${SITE_URL}/`,
  founder: { '@id': PERSON_ID },
  email: COMPANY.email,
  inLanguage: 'hu',
};

export const graph = (...nodes: object[]) => ({ '@context': 'https://schema.org', '@graph': nodes });
