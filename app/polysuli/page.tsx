import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { PolySuliQuiz, type PyramidCourse } from '@/components/PolySuliQuiz';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { COMPANY } from '@/lib/company';
import { SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatHuf, priceLabel } from '@/lib/format';
import { ACADEMY, ACADEMY_LEVELS, ACADEMY_PRICES, byPackageOrder, isAcademyLevel, packageKind, type AcademyLevel } from '@/lib/polyakademia';
import { faqPage, graph, ORGANIZATION, type Faq } from '@/lib/seo';
import { soonLabel, type Course } from '@/lib/types';

const DESCRIPTION =
  'PolySuli: magyar nyelvű Claude-tanfolyamok kkv-vezetőknek és egyéni vállalkozóknak. Háromszintű oktatási piramis, ingyenes anyagok, 990 Ft-os zsebkurzusok, tanfolyamok és előfizetés – ingyenes szintfelmérő teszttel.';

export const metadata: Metadata = {
  title: 'PolySuli – Claude-tanfolyamok három szinten',
  description: DESCRIPTION,
  alternates: { canonical: ACADEMY.path },
  openGraph: { title: 'PolySuli – Claude-tanfolyamok három szinten', description: DESCRIPTION, url: ACADEMY.path, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website' },
};

const LEVELS: AcademyLevel[] = [1, 2, 3];

// Kinek szól – szintenként: ki ő, és mit kap először.
const WHO: Record<AcademyLevel, { who: string; first: string; gets: string[] }> = {
  1: {
    who: 'Használtad már, de csak kérdezgetsz tőle',
    first: 'Claude a mindennapi munkában: projekt, kész skillek, saját hang',
    gets: ['Claude-projekt a cégedről, hogy ismerjen', 'Kész, bevált skillek telepítve', 'Stílusleírás a saját hangodról', 'Az első saját skilled'],
  },
  2: {
    who: 'Rendszeresen használod, de mindig elölről kezded',
    first: 'Saját munkafolyamatok és skillek, munkaterületenként',
    gets: ['Vágási skill a Reelsekhez', 'Márkahang skill és tartalommátrix', 'Karusszel skill saját design systemre', 'Ügyfélkövetés, kampány, pénzügy Claude-dal'],
  },
  3: {
    who: 'Vannak már skilljeid, és automatizálnál',
    first: 'Ügynököket építesz és rendezel, saját appot csinálsz',
    gets: ['Az első automatizációd', 'Saját ügynökök, amik összekötik a skilljeidet', 'Az első appod vibe codinggal'],
  },
};

const FAQ: Faq[] = [
  { q: 'Mi az a PolySuli?', a: 'A PolySuli a Polymaind Claude-tudástára (Polyakadémia): magyar nyelvű tanfolyamok arról, hogyan dolgozz Claude-dal a saját vállalkozásodban. Amit az ügyfeleinknek építünk, azt tanítjuk meg: a saját, élesben bevált promptjainkat és skilljeinket, kicsomagolva.' },
  { q: 'Kinek szól?', a: 'Kkv-vezetőknek és egyéni vállalkozóknak, akik érzik a káoszt, és most ismerkednek az eszközökkel. Nem fejlesztőknek és nem AI-szakértőknek.' },
  { q: 'Melyik szinten kezdjek?', a: 'Töltsd ki az ingyenes Claude-piramis tesztet – hat kérdés, két perc –, és megmutatja, melyik szint tanfolyamaival érdemes indulnod. Ha bizonytalan vagy, az 1. szint Alapkurzusa mindenkinek jó kezdés.' },
  { q: 'Mennyibe kerül?', a: `Az ingyenes anyagok ingyenesek (belépés után letölthetők). Egy zsebkurzus ${formatHuf(ACADEMY_PRICES.pocket)}, egy kis tanfolyam ${formatHuf(ACADEMY_PRICES.small)}, egy nagy tanfolyam ${formatHuf(ACADEMY_PRICES.large)}. Előfizetéssel ${formatHuf(SUBSCRIPTION.priceHuf)}/hó áron minden tanfolyamhoz és zsebkurzushoz hozzáférsz. Bruttó árak, ÁFA nem jön rájuk.` },
  { q: 'Mi az a zsebkurzus?', a: `A zsebkurzus egy feladat kész promptjai és skilljei egy letölthető csomagban, telepítési leírással és előtte–utána példákkal, ${formatHuf(ACADEMY_PRICES.pocket)}-ért. Itt az oldalon bankkártyával megveszed, és azonnal letöltöd.` },
  { q: 'Hogyan kapom meg az ingyenes anyagot?', a: 'Kattints az anyagra, lépj be (az ingyenes regisztráció is ennyi), és azonnal letöltheted. Instagramon is kérheted: kommenteld a kulcsszavát bármelyik posztunk alá, és DM-ben küldjük.' },
  { q: 'Kell hozzá fizetős Claude-előfizetés?', a: 'Az 1. szint nagy része az ingyenes Claude-dal is végigcsinálható. A projektekhez, skillekhez és a haladóbb szintekhez a fizetős Claude-csomag (Pro) ajánlott – a tanfolyamokban mindig szólunk, ha valamihez kell.' },
];

const TOC = [
  ['#kinek', 'Kinek szól'],
  ['#piramis', 'Piramis'],
  ['#teszt', 'Teszt'],
  ['#ertekletra', 'Értéklétra'],
  ['#tanfolyamok', 'Tanfolyamok'],
  ['#ingyenes', 'Ingyenes anyagok'],
  ['#zsebkurzusok', 'Zsebkurzusok'],
  ['#gyik', 'GYIK'],
] as const;

const shortTitle = (t: string) => t.replace(/ Claude-dal$/, '').replace(/^(Zsebkurzus|Ingyenes): /, '');
const markOf = (c: Course): PyramidCourse['mark'] =>
  c.academy_tag === 'Itt kezdj' || c.academy_tag === '1. modul' ? 'first' : c.academy_tag === 'Új' || c.academy_tag === 'Élő workshop' ? 'new' : null;

export default async function PolySuliPage() {
  const { supabase, user, profile } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const courses = catalog.courses.filter((c) => isAcademyLevel(c.academy_level));
  const { data: lessons } = courses.length
    ? await supabase
        .from('lessons')
        .select('id, course_id, title, description, sort_order')
        .in('course_id', courses.map((c) => c.id))
        .lte('published_at', new Date().toISOString())
        .order('sort_order')
    : { data: [] };
  const lessonsOf = (id: string) => (lessons ?? []).filter((l) => l.course_id === id);
  const byLevel = (level: AcademyLevel) => courses.filter((c) => c.academy_level === level);
  const courseById = new Map(courses.map((c) => [c.id, c]));
  const packages = catalog.pockets.filter((p) => p.pocket_for && courseById.has(p.pocket_for)).sort(byPackageOrder);
  const packagesOf = (id: string) => packages.filter((p) => p.pocket_for === id);
  const freebies = packages.filter((p) => p.price_huf === 0);
  const pockets = packages.filter((p) => p.price_huf !== 0);
  const canUse = (c: Course) => !!user && courseAccessible(c, access, profile?.is_admin);
  const pyramid = Object.fromEntries(
    LEVELS.map((l) => [l, byLevel(l).map((c) => ({ slug: c.slug, title: shortTitle(c.title), mark: markOf(c) }))]),
  ) as Record<AcademyLevel, PyramidCourse[]>;
  const workshop = courses.find((c) => c.academy_tag === 'Élő workshop');

  return (
    <div className="page">
      <SiteNav />

      <section className="card dark stack ps-hero" style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="eyebrow" style={{ color: '#a9a6b0' }}>Polymaind · Polyakadémia · csak Claude</div>
        <h1 className="h1">
          Poly<span className="ps-mark">Suli.</span>
        </h1>
        <p className="lead">
          Itt csak Claude-ot tanítunk. Amit az ügyfeleinknek építünk, azt megtanítjuk: a saját, élesben bevált promptjainkat és skilljeinket, kicsomagolva. Két perc alatt kiderül, hol
          tartasz, és honnan érdemes indulnod.
        </p>
        <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
          <a href="#piramis" className="ps-chip-dark"><b>3</b> szint a Claude-piramisban</a>
          <a href="#tanfolyamok" className="ps-chip-dark"><b>{courses.length}</b> tanfolyam</a>
          <a href="#ingyenes" className="ps-chip-dark"><b>0 Ft</b> ingyenes anyagok</a>
          <a href="#zsebkurzusok" className="ps-chip-dark"><b>{formatHuf(ACADEMY_PRICES.pocket)}</b> zsebkurzus</a>
          <a href="#ertekletra" className="ps-chip-dark"><b>4</b> fokú értéklétra</a>
        </div>
        <div className="row">
          <a href="#teszt" className="btn ps-lime">Kitöltöm a tesztet</a>
          <a href="#ingyenes" className="btn light">Ingyenes anyagok</a>
        </div>
      </section>

      <nav className="ps-toc" aria-label="Fejezetek">
        {TOC.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
      </nav>

      <section id="kinek" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Kinek szól</div>
          <h2 className="h2">Ha érzed a káoszt, és most ismerkedsz az eszközökkel.</h2>
          <p className="lead">
            Kkv-vezetőknek és egyéni vállalkozóknak – nem fejlesztőknek és nem AI-szakértőknek. Az érzés, amit adunk: „ezt én is meg tudom csinálni”. Hogy melyik szinten kezdesz, azt az
            ingyenes <a href="#teszt" style={{ textDecoration: 'underline' }}>Claude-piramis teszt</a> mondja meg.
          </p>
        </div>
        <div className="grid" style={{ '--min': '260px', '--gap': '12px' } as React.CSSProperties}>
          {LEVELS.map((level) => (
            <a key={level} href={`#szint-${level}`} className="ps-who">
              <span className="ps-step mono">{ACADEMY_LEVELS[level].name}</span>
              <b>{WHO[level].who}</b>
              <span className="muted" style={{ fontSize: 14 }}>Mit kapsz először: {WHO[level].first}</span>
              <ul className="ps-gets">{WHO[level].gets.map((g) => <li key={g}>{g}</li>)}</ul>
              <span className="ps-more">A szint tanfolyamai ↓</span>
            </a>
          ))}
        </div>
        <p className="ps-principle">
          Nem guru-tartalom, nem száraz e-learning. <b>Rend, irány, a következő lépés. Rakd zsebre.</b>
        </p>
      </section>

      <PolySuliQuiz pyramid={pyramid} />

      <section id="ertekletra" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Értéklétra · árak</div>
          <h2 className="h2">Négy fok, ugyanazon a témán felfelé.</h2>
          <p className="lead">Ingyen kipróbálod, olcsón zsebre rakod, aztán ha kell, végigcsinálod a teljes tanfolyamot. Bruttó árak – ÁFA nem jön rájuk.</p>
        </div>
        <div className="ps-ladder">
          <a href="#ingyenes" className="ps-rung">
            <span className="ps-rung-step">1. fok</span>
            <b>Ingyenes anyag</b>
            <span className="ps-rung-price">0 Ft</span>
            <span>Útmutató, 3–5 prompt vagy rövid videó. Belépés után azonnal letöltöd – vagy Instán kéred kulcsszóval.</span>
            <span className="ps-more">{freebies.length} ingyenes anyag →</span>
          </a>
          <a href="#zsebkurzusok" className="ps-rung lime">
            <span className="ps-rung-step">2. fok · bevezető</span>
            <b>Zsebkurzus</b>
            <span className="ps-rung-price">{formatHuf(ACADEMY_PRICES.pocket)}</span>
            <span>Egy feladat teljes promptcsomagja és 1–2 kész skill, telepítési leírással. Egyszeri, azonnal letölthető.</span>
            <span className="ps-more">{pockets.length} zsebkurzus →</span>
          </a>
          <a href="#tanfolyamok" className="ps-rung">
            <span className="ps-rung-step">3. fok</span>
            <b>Tanfolyam</b>
            <span className="ps-rung-price">{formatHuf(ACADEMY_PRICES.small)} – {formatHuf(ACADEMY_PRICES.large)}</span>
            <span>3–7 rövid videólecke, mindegyik végén kész eredménnyel. Kis tanfolyam {formatHuf(ACADEMY_PRICES.small)}, nagy {formatHuf(ACADEMY_PRICES.large)}. Örök hozzáférés, AI-segítő, ha elakadsz.</span>
            <span className="ps-more">{courses.length} tanfolyam →</span>
          </a>
          <Link href="/elofizetes" className="ps-rung dark">
            <span className="ps-rung-step">4. fok</span>
            <b>Előfizetés</b>
            <span className="ps-rung-price">{formatHuf(SUBSCRIPTION.priceHuf)}/hó</span>
            <span>Minden tanfolyam és zsebkurzus, és ahogy jönnek, az új modulok is. Bármikor lemondhatod.</span>
            <span className="ps-more">{SUBSCRIPTION.enabled ? 'Előfizetek →' : 'Hamarosan indul →'}</span>
          </Link>
        </div>
        <div className="grid" style={{ '--min': '240px', '--gap': '10px' } as React.CSSProperties}>
          {workshop && (
            <Link href={`/kurzusok/${workshop.slug}`} className="ps-exit">
              <b>Fölötte: élő workshop</b> → kis csoportban, a saját anyagoddal mész haza ({workshop.title})
            </Link>
          )}
          <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('PolyOS – inkább használnám')}`} className="ps-exit">
            <b>Inkább használnád, mint megtanulnád?</b> → a modul mini appja és a PolyOS
          </a>
          <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Nagyobb fejlesztés – saját app')}`} className="ps-exit">
            <b>Nagyobb fejlesztés kell?</b> → ügynökség, saját app
          </a>
        </div>
      </section>

      <div id="tanfolyamok" className="stack ps-anchor" style={{ '--gap': '28px' } as React.CSSProperties}>
        {LEVELS.map((level) => {
          const list = byLevel(level);
          const ready = list.filter((c) => lessonsOf(c.id).length > 0).length;
          return (
            <section key={level} id={`szint-${level}`} className="card stack ps-anchor" style={{ '--gap': '18px' } as React.CSSProperties}>
              <div className="row between" style={{ alignItems: 'flex-end' }}>
                <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
                  <div className="eyebrow">{level}. szint tanfolyamai</div>
                  <h2 className="h2" style={{ fontSize: 'clamp(26px, 3.4vw, 40px)' }}>{ACADEMY_LEVELS[level].title}</h2>
                </div>
                <span className="muted" style={{ fontSize: 14 }}>{list.length} tanfolyam · {ready} kész tematikával</span>
              </div>
              {list.length === 0 && <p className="muted">A tanfolyamok hamarosan érkeznek.</p>}
              <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
                {list.map((c, i) => (
                  <CourseRow
                    key={c.id}
                    course={c}
                    packages={packagesOf(c.id).map((p) => ({ course: p, owned: canUse(p) }))}
                    lessons={lessonsOf(c.id)}
                    open={i === 0 && lessonsOf(c.id).length > 0}
                    hasAccess={canUse(c)}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section id="ingyenes" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">1. fok · Ingyenes anyagok</div>
          <h2 className="h2">Kattints, lépj be, töltsd le.</h2>
          <p className="lead">Minden munkaterülethez van egy ingyenes kezdőanyag. Belépés (ingyenes regisztráció) után azonnal letöltheted – vagy Instán kéred a kulcsszóval.</p>
        </div>
        <div className="grid" style={{ '--min': '260px', '--gap': '12px' } as React.CSSProperties}>
          <a href="#teszt" className="ps-pack">
            <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}><span className="ps-tag first">Belépő</span><span className="ps-kw">{ACADEMY.entryKeyword}</span></span>
            <b>Claude-piramis teszt</b>
            <span className="muted" style={{ fontSize: 14 }}>Hat kérdés, két perc: megmutatja, melyik szinten kezdesz.</span>
            <span className="ps-more">Kitöltöm itt →</span>
          </a>
          {freebies.map((p) => (
            <PackCard key={p.id} pack={p} parent={courseById.get(p.pocket_for!)} owned={canUse(p)} />
          ))}
        </div>
      </section>

      <section id="zsebkurzusok" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">2. fok · Zsebkurzusok</div>
          <h2 className="h2">{formatHuf(ACADEMY_PRICES.pocket)}, azonnal használható.</h2>
          <p className="lead">Abból készülnek, ami nálunk élesben már bevált. Bankkártyával megveszed, és azonnal letöltöd.</p>
        </div>
        <div className="grid" style={{ '--min': '260px', '--gap': '12px' } as React.CSSProperties}>
          {pockets.map((p) => (
            <PackCard key={p.id} pack={p} parent={courseById.get(p.pocket_for!)} owned={canUse(p)} />
          ))}
        </div>
        <h3 className="h3">Minden zsebkurzus ugyanarra a mintára</h3>
        <ul className="ps-rules">
          <li><b>Egy feladat, egy eredmény.</b> A cím megmondja, mit csinál meg helyetted.</li>
          <li><b>5–15 prompt vagy 1–2 skill</b>, mind kipróbálva éles ügyfélmunkán.</li>
          <li><b>Előtte–utána példa</b> minden prompt mellett.</li>
          <li><b>Mobilra optimalizálva</b> – rakd zsebre.</li>
          <li><b>Az utolsó oldal</b> a teljes tanfolyamra visz, ha mélyebbre mennél.</li>
        </ul>
      </section>

      <section id="gyik" className="card stack ps-anchor" style={{ '--gap': '24px' } as React.CSSProperties}>
        <h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>Gyakori kérdések</h2>
        <FaqList items={FAQ} />
      </section>
      <JsonLd data={graph(ORGANIZATION, faqPage(FAQ))} />
    </div>
  );
}

// Ingyenes anyag / zsebkurzus kártya – az egész kártya kattintható, a csomag oldalára visz (letöltés / vásárlás).
function PackCard({ pack: p, parent, owned }: { pack: Course; parent?: Course; owned: boolean }) {
  const free = p.price_huf === 0;
  return (
    <Link href={`/kurzusok/${p.slug}`} className="ps-pack">
      <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
        <span className={`ps-tag${free ? ' first' : ''}`}>{packageKind(p)}</span>
        {p.academy_keyword && <span className="ps-kw">{p.academy_keyword}</span>}
        {p.coming_soon && <span className="ps-tag soon">{soonLabel(p)}</span>}
      </span>
      <b>{shortTitle(p.title)}</b>
      <span className="muted" style={{ fontSize: 14 }}>{p.subtitle}</span>
      {parent && <span style={{ fontSize: 13 }}>Ehhez: {parent.title}</span>}
      <span className="row between" style={{ marginTop: 'auto' }}>
        <span className="ps-pocket-price">{owned ? 'A tiéd' : priceLabel(p)}</span>
        <span className="ps-more">{owned ? 'Letöltés →' : p.coming_soon ? 'Szólj, ha kész →' : free ? 'Letöltöm →' : 'Megveszem →'}</span>
      </span>
    </Link>
  );
}

type LessonRow = { id: string; title: string; description: string };

function CourseRow({ course: c, packages, lessons, open, hasAccess }: { course: Course; packages: { course: Course; owned: boolean }[]; lessons: LessonRow[]; open: boolean; hasAccess: boolean }) {
  return (
    <details className="ps-course" open={open}>
      <summary>
        <span className="ps-cname">{c.title}</span>
        <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <span className="ps-badge">{ACADEMY.badge}</span>
          {c.academy_tag && <span className={`ps-tag${c.academy_tag === 'Itt kezdj' ? ' first' : c.academy_tag === 'Új' ? ' new' : ''}`}>{c.academy_tag}</span>}
          {c.coming_soon && <span className="ps-tag soon">{soonLabel(c)}</span>}
          <span className="ps-tag">{hasAccess ? 'Hozzáférsz' : priceLabel(c)}</span>
        </span>
        <span className="ps-chev" aria-hidden="true">›</span>
      </summary>
      <div className="stack" style={{ '--gap': '12px', padding: '0 18px 16px' } as React.CSSProperties}>
        {c.teaser && <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)' }}>{c.teaser}</p>}
        {lessons.length > 0 ? (
          <ol className="ps-lessons">
            {lessons.map((l) => (
              <li key={l.id}>
                <b>{l.title}</b>
                {l.description && <span>{l.description}</span>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted" style={{ margin: 0, fontSize: 14 }}>A tematika készül.{c.academy_tag ? ` Ez a tanfolyam a(z) ${c.academy_tag} témához tartozik.` : ''}</p>
        )}
        {packages.map(({ course: p, owned }) => (
          <Link key={p.id} href={`/kurzusok/${p.slug}`} className="ps-pocket ps-pocket-link">
            <span>
              <b>{packageKind(p)}</b> · {shortTitle(p.title)}
              {p.academy_keyword && <> · <span className="ps-kw">{p.academy_keyword}</span></>}
            </span>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <span className="ps-pocket-price">{owned ? 'A tiéd' : priceLabel(p)}</span>
              <span className="btn sm">{owned ? 'Letöltés' : p.coming_soon ? soonLabel(p) : p.price_huf === 0 ? 'Letöltöm' : 'Megveszem'} →</span>
            </span>
          </Link>
        ))}
        <Link href={`/kurzusok/${c.slug}`} className="btn sm" style={{ alignSelf: 'flex-start' }}>
          {c.coming_soon ? 'Részletek · szólj, ha indul' : hasAccess ? 'Megnyitom' : 'Részletek'}
        </Link>
      </div>
    </details>
  );
}
