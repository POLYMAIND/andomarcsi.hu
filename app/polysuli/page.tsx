import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { PolySuliQuiz } from '@/components/PolySuliQuiz';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatHuf, priceLabel } from '@/lib/format';
import { ACADEMY, ACADEMY_LEVELS, ACADEMY_PRICES, isAcademyLevel, type AcademyLevel } from '@/lib/polyakademia';
import { faqPage, graph, ORGANIZATION, type Faq } from '@/lib/seo';
import { soonLabel, type Course } from '@/lib/types';

const DESCRIPTION =
  'PolySuli: magyar nyelvű Claude-tanfolyamok háromszintű oktatási piramisban – Claude a mindennapi munkában, saját munkafolyamatok és skillek, ügynökök. Ingyenes szintfelmérő teszttel.';

export const metadata: Metadata = {
  title: 'PolySuli – Claude-tanfolyamok három szinten',
  description: DESCRIPTION,
  alternates: { canonical: ACADEMY.path },
  openGraph: { title: 'PolySuli – Claude-tanfolyamok három szinten', description: DESCRIPTION, url: ACADEMY.path, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website' },
};

const LEVELS: AcademyLevel[] = [1, 2, 3];

// Mit kapsz az egyes szinteken – a piramis magyarázata.
const LEVEL_DETAILS: Record<AcademyLevel, { who: string; gets: string[] }> = {
  1: {
    who: 'Neked szól, ha még csak kérdezgetsz Claude-tól, és minden beszélgetésben elölről magyarázod, ki vagy és mit csinálsz.',
    gets: ['Claude-projekt a cégedről, hogy ismerjen', 'Kész, bevált skillek telepítve', 'Stílusleírás a saját hangodról – „AI-szag” nélkül', 'Az első saját skilled'],
  },
  2: {
    who: 'Neked szól, ha már rendszeresen használod, de túl sokszor kezded elölről ugyanazt a munkát.',
    gets: ['Vágási skill a Reelsekhez', 'Márkahang skill és tartalommátrix', 'Karusszel skill saját design systemre', 'Ügyfélkövetés, kampány, pénzügy Claude-dal'],
  },
  3: {
    who: 'Neked szól, ha már vannak skilljeid, és szeretnéd, hogy ne csak válaszoljanak, hanem dolgozzanak is helyetted.',
    gets: ['Az első automatizációd', 'Saját ügynökök, amik összekötik a skilljeidet', 'Az első appod vibe codinggal'],
  },
};

const FAQ: Faq[] = [
  { q: 'Mi az a PolySuli?', a: 'A PolySuli a Polymaind Claude-tudástára (Polyakadémia): magyar nyelvű, előre felvett tanfolyamok arról, hogyan dolgozz Claude-dal a saját vállalkozásodban. Amit az ügyfeleinknek építünk, azt tanítjuk meg.' },
  { q: 'Melyik szinten kezdjek?', a: 'Töltsd ki az ingyenes Claude-piramis tesztet – hat kérdés, két perc –, és megmutatja, melyik szint tanfolyamaival érdemes indulnod. Ha bizonytalan vagy, az 1. szint Alapkurzusa mindenkinek jó kezdés.' },
  { q: 'Mennyibe kerül?', a: `Egy nagy tanfolyam ${formatHuf(ACADEMY_PRICES.large)}, egy kis tanfolyam ${formatHuf(ACADEMY_PRICES.small)}, egy zsebkurzus ${formatHuf(ACADEMY_PRICES.pocket)}. Előfizetéssel ${formatHuf(SUBSCRIPTION.priceHuf)}/hó áron minden tanfolyamhoz hozzáférsz. Az árak bruttó árak, ÁFA nem jön rájuk.` },
  { q: 'Mi az a zsebkurzus?', a: `Minden tanfolyamhoz tartozik egy ${formatHuf(ACADEMY_PRICES.pocket)}-os zsebkurzus: a kész promptok és skillek, telepítési leírással. A tanfolyam kulcsszavát kommenteld bármelyik Instagram-posztunk alá, és DM-ben küldjük az ingyenes részt.` },
  { q: 'Kell hozzá fizetős Claude-előfizetés?', a: 'Az 1. szint nagy része az ingyenes Claude-dal is végigcsinálható. A projektekhez, skillekhez és a haladóbb szintekhez a fizetős Claude-csomag (Pro) ajánlott – a tanfolyamokban mindig szólunk, ha valamihez kell.' },
];

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
  const counts = { 1: byLevel(1).length, 2: byLevel(2).length, 3: byLevel(3).length } as Record<AcademyLevel, number>;

  return (
    <div className="page">
      <SiteNav />

      <section className="card dark stack ps-hero" style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="eyebrow" style={{ color: '#a9a6b0' }}>Polymaind · Polyakadémia · csak Claude</div>
        <h1 className="h1">
          Poly<span className="ps-mark">Suli.</span>
        </h1>
        <p className="lead">
          Amit az ügyfeleinknek építünk, azt megtanítjuk. Claude-tanfolyamok három szinten – a „még csak kérdezgetek tőle”-től a saját ügynökökig. Két perc alatt kiderül, hol
          tartasz, és honnan érdemes indulnod.
        </p>
        <div className="row">
          <a href="#teszt" className="btn ps-lime">Kitöltöm a tesztet</a>
          <a href="#piramis" className="btn light">Mutasd a piramist</a>
          <a href="#arak" className="btn light">Árak</a>
        </div>
      </section>

      <PolySuliQuiz counts={counts} />

      <section className="grid" style={{ '--min': '280px', '--gap': '16px' } as React.CSSProperties}>
        {LEVELS.map((level) => (
          <article key={level} className="card stack ps-explain" style={{ '--gap': '12px', padding: 28 } as React.CSSProperties}>
            <span className="ps-step mono">{level}. szint</span>
            <h3 className="h3">{ACADEMY_LEVELS[level].title}</h3>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)' }}>{LEVEL_DETAILS[level].who}</p>
            <ul className="ps-gets">
              {LEVEL_DETAILS[level].gets.map((g) => <li key={g}>{g}</li>)}
            </ul>
            <a href={`#szint-${level}`} className="btn outline sm" style={{ alignSelf: 'flex-start', marginTop: 'auto' }}>A szint tanfolyamai ↓</a>
          </article>
        ))}
      </section>

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
                <CourseRow key={c.id} course={c} lessons={lessonsOf(c.id)} open={i === 0 && lessonsOf(c.id).length > 0} hasAccess={!!user && courseAccessible(c, access, profile?.is_admin)} />
              ))}
            </div>
          </section>
        );
      })}

      <section id="arak" className="card stack ps-anchor" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Árak</div>
          <h2 className="h2">Annyit veszel, amennyi kell.</h2>
          <p className="lead">Bruttó árak – alanyi adómentes vagyok, így ÁFA nem jön rájuk. A tanfolyamokat örökre megtartod, az előfizetés bármikor lemondható.</p>
        </div>
        <div className="grid" style={{ '--min': '220px', '--gap': '14px' } as React.CSSProperties}>
          <PriceTile name="Zsebkurzus" price={formatHuf(ACADEMY_PRICES.pocket)} desc="Egy tanfolyam kész promptjai és skilljei, telepítési leírással. Instán kommenteld a kulcsszót, és DM-ben küldjük." />
          <PriceTile name="Kis tanfolyam" price={formatHuf(ACADEMY_PRICES.small)} desc="Egy fókuszált téma – például hírlevél, ajánlat vagy ügyfélkövetés – rövid videóleckékben." />
          <PriceTile name="Nagy tanfolyam" price={formatHuf(ACADEMY_PRICES.large)} desc="Egy teljes munkafolyamat az elejétől a végéig, skillekkel – például az Alapkurzus vagy a Reels-vágás." />
          <PriceTile
            featured
            name="Előfizetés"
            price={`${formatHuf(SUBSCRIPTION.priceHuf)}/hó`}
            desc="Minden PolySuli-tanfolyam és minden új anyag, amíg előfizetsz. Bármikor lemondhatod."
            cta={SUBSCRIPTION.enabled ? <Link href="/elofizetes" className="btn ps-lime sm">Előfizetek</Link> : <span className="pill new" style={{ alignSelf: 'flex-start' }}>Hamarosan indul</span>}
          />
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '24px' } as React.CSSProperties}>
        <h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>Gyakori kérdések</h2>
        <FaqList items={FAQ} />
      </section>
      <JsonLd data={graph(ORGANIZATION, faqPage(FAQ))} />
    </div>
  );
}

function PriceTile({ name, price, desc, featured, cta }: { name: string; price: string; desc: string; featured?: boolean; cta?: React.ReactNode }) {
  return (
    <div className={`ps-price${featured ? ' featured' : ''}`}>
      <span className="mono" style={{ fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase' }}>{name}</span>
      <strong className="ps-price-amount">{price}</strong>
      <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55 }}>{desc}</p>
      {cta}
    </div>
  );
}

type LessonRow = { id: string; title: string; description: string };

function CourseRow({ course: c, lessons, open, hasAccess }: { course: Course; lessons: LessonRow[]; open: boolean; hasAccess: boolean }) {
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
        {c.academy_keyword && (
          <div className="ps-pocket">
            <span><b>Zsebkurzus</b> · kész promptok és skillek</span>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              Kommenteld: <span className="ps-kw">{c.academy_keyword}</span>
              <span className="ps-pocket-price">{formatHuf(ACADEMY_PRICES.pocket)}</span>
            </span>
          </div>
        )}
        <Link href={`/kurzusok/${c.slug}`} className="btn sm" style={{ alignSelf: 'flex-start' }}>
          {c.coming_soon ? 'Részletek · szólj, ha indul' : hasAccess ? 'Megnyitom' : 'Részletek'}
        </Link>
      </div>
    </details>
  );
}
