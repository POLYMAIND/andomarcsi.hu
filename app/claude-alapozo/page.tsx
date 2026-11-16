import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/BuyBox';
import type { ModuleLesson } from '@/components/CanvaKalauzSection';
import { ClaudeAlapozoGets, ClaudeAlapozoParts, PROMO_VIDEO } from '@/components/ClaudeAlapozoSection';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { TrackLead } from '@/components/TrackLead';
import { getCurrentUser } from '@/lib/auth';
import { courseAccessible, getUserAccess } from '@/lib/data';
import { formatHuf, priceLabel } from '@/lib/format';
import { FOUNDATION_SLUG } from '@/lib/polyakademia';
import { courseFaq, courseSchema, faqPage, graph, ORGANIZATION, type Faq } from '@/lib/seo';
import { saleInfo, soonLabel, withStart, type Course } from '@/lib/types';

// Hirdetési landing oldal: Claude alapozó vállalkozásoknak. Rövid link: /claude-alapozo
// Egy cél: értesítéskérés (amíg „Hamarosan”), utána vásárlás. Kevés kilépési pont, a menü helyett egy gomb.
const PATH = '/claude-alapozo';
const TITLE = 'Claude alapozó vállalkozásoknak – egy egész csapat a zsebedben';
const DESCRIPTION =
  'Videókurzus vállalkozásoknak a nulláról: a végére a Claude ismeri a cégedet, és 17 kész skill dolgozik helyetted – szövegíró, posztoló, elemző, pénzügyes, irodavezető, recepciós.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website', images: ['/opengraph-image.png'] },
};

const gap = (g: string) => ({ '--gap': g }) as React.CSSProperties;

const PAINS = [
  'Minden új beszélgetésben újra elmagyarázod, ki vagy, mit árulsz és kinek.',
  'Amit ír, az udvarias, de nem úgy hangzik, mint te. Inkább, mint egy unott banki ügyintéző.',
  'Hallottál a projektről, a skillről, a connectorról – de nem tudod, melyik mire jó, és hol kezdd.',
];

const TEAM = [
  ['Szövegíró', 'Poszt, hírlevél, ajánlat – a te hangodon, nem sablonból.'],
  ['Posztoló', 'Megtervezi és előkészíti a heti tartalmat, hogy ne vasárnap este találd ki.'],
  ['Elemző', 'Ránéz a kampányaid számaira, és megmondja, mi működik.'],
  ['Céltervező', 'Havi célból heti terv, napi egy fókusszal.'],
  ['Pénzügyes', 'Cash flow, food cost, „hogy állok pénzügyileg?”.'],
  ['Irodavezető', 'Számlák a könyvelőnek, jelenléti ív, beosztás.'],
  ['Beszerző', 'Beszállítók, leltár, rendelési lista, allergéntáblázat.'],
  ['Recepciós', 'Válasz a foglalásokra és az értékelésekre, a te stílusodban.'],
] as const;

const EXTRA_FAQ: Faq[] = [
  {
    q: 'Kell hozzá Claude-előfizetés?',
    a: 'Igen. Az első leckében megmutatom, melyik csomag mire elég; a 14. és a 16. leckéhez (Claude a böngészőben, Claude magától dolgozik) legalább Pro kell.',
  },
  {
    q: 'Milyen vállalkozásnak szól?',
    a: 'Kis- és egyéni vállalkozásoknak, akik maguk viszik a marketinget és az irodai munkát. A példák egy étterem (minta-adatokkal) életéből jönnek, de ugyanígy működik szalonnál, webshopnál, szolgáltatónál.',
  },
];

export default async function ClaudeAlapozoLanding({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await getCurrentUser();
  const { data: raw } = await supabase.from('courses').select('*').eq('slug', FOUNDATION_SLUG).eq('published', true).maybeSingle<Course>();
  if (!raw) notFound();
  const course = withStart(raw);

  const [{ data: lessons }, access, { data: waitRow }] = await Promise.all([
    supabase.from('lessons').select('course_id, title, duration_min, sort_order').eq('course_id', course.id).lte('published_at', new Date().toISOString()).order('sort_order'),
    getUserAccess(supabase, user?.id),
    user ? supabase.from('course_waitlist').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const ls = (lessons ?? []) as ModuleLesson[];
  const totalMin = ls.reduce((s, l) => s + (l.duration_min ?? 0), 0);
  const hasAccess = !!user && courseAccessible(course, access, profile?.is_admin);
  const signedUp = sp.ertesites === 'ok';
  // A feliratkozás forrása a hirdetés UTM-jéből (az adminban, az értesítési listán látszik).
  const source = `landing:${(sp.utm_source ?? 'direkt').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 30) || 'direkt'}`;
  const faq = [...EXTRA_FAQ, ...courseFaq(course)];
  const cta = hasAccess ? 'Megnyitom a kurzust' : course.coming_soon ? 'Kérem az értesítést' : `Megveszem – ${priceLabel(course)}`;

  const buyBox = (
    <BuyBox
      course={course}
      loggedIn={!!user}
      hasAccess={hasAccess}
      enrolled={access.enrolled.has(course.id)}
      firstLessonHref={`/kurzusok/${course.slug}`}
      userEmail={user?.email ?? null}
      waitlisted={!!waitRow || signedUp}
      waitlistError={
        sp.ertesites === 'email' ? 'Kérlek, adj meg egy érvényes e-mail címet.'
        : sp.ertesites === 'hozzajarulas' ? 'A feliratkozáshoz pipáld be a hozzájárulást.'
        : sp.ertesites === 'hiba' ? 'Nem sikerült a feliratkozás, próbáld újra.'
        : null
      }
      returnTo={PATH}
      source={source}
    />
  );

  return (
    <div className="page">
      {signedUp && <TrackLead name={course.title} />}

      <nav className="nav">
        <Link href="/" className="logo">andormarcsi<span>.</span></Link>
        <a href="#ertesites" className="btn sm">{cta} ↓</a>
      </nav>

      {/* ── Hős: horog, ígéret, feliratkozás + a hirdetés videója ── */}
      <section className="card lp-hero">
        <div className="stack" style={gap('20px')}>
          <div className="row" style={gap('8px')}>
            <span className="eyebrow">Videókurzus vállalkozásoknak</span>
            {course.coming_soon && <span className="pill new">{soonLabel(course)}</span>}
          </div>
          <h1 className="h1" style={{ fontSize: 'clamp(40px, 5.6vw, 76px)' }}>
            Rosszul használod a <span style={{ color: 'var(--purple)' }}>Claude-ot.</span>
          </h1>
          <p className="lead" style={{ maxWidth: 600 }}>
            Pedig egy egész marketing- és irodai csapat lehetne a zsebedben: szövegíró, posztoló, elemző, pénzügyes, irodavezető, recepciós. Megmutatom, hogyan
            állítod be – a nulláról, a saját cégedre.
          </p>
          <ul className="lp-checks">
            <li>{ls.length || 18} rövid videólecke{totalMin ? `, kb. ${Math.round(totalMin / 10) * 10} perc` : ''} – saját tempóban</li>
            <li>17 kész skill, munkalap minden leckéhez</li>
            <li>Nem kell hozzá programozás, se előismeret</li>
          </ul>
          {/* „Hamarosan” állapotban a BuyBox űrlapja maga a #ertesites; élesedés után ez a doboz kapja meg */}
          <div className="lp-buy" id={course.coming_soon && !hasAccess ? undefined : 'ertesites'}>{buyBox}</div>
        </div>
        <div className="lp-video">
          <video controls playsInline preload="metadata" poster={PROMO_VIDEO.poster} aria-label="Claude alapozó – bemutató videó">
            <source src={PROMO_VIDEO.src} type="video/mp4" />
          </video>
        </div>
      </section>

      {/* ── Ismerős? ── */}
      <section className="card stack" style={gap('24px')}>
        <div className="eyebrow">Ismerős?</div>
        <h2 className="h2">Nem veled van a baj.</h2>
        <div className="ps-three">
          {PAINS.map((p, i) => (
            <div key={i} className="lp-pain">
              <span className="mono">0{i + 1}</span>
              <p>{p}</p>
            </div>
          ))}
        </div>
        <p className="lead" style={{ maxWidth: 760 }}>
          Csak senki nem mutatta meg, hogyan kell beállítani. A Claude akkor lesz jó munkatárs, ha ismeri a cégedet, emlékszik rád, és kész skillek mondják meg neki,
          hogyan dolgozzon. Ezt építjük fel együtt.
        </p>
      </section>

      {/* ── A csapatod ── */}
      <section className="card dark stack" style={gap('28px')}>
        <div className="stack" style={gap('10px')}>
          <div className="eyebrow" style={{ color: 'var(--amber)' }}>A végére ők dolgoznak neked</div>
          <h2 className="h2">Nyolc munkatárs. Egy előfizetés.</h2>
          {course.subtitle && <p className="lead" style={{ color: '#cfcad4' }}>{course.subtitle}.</p>}
        </div>
        <div className="lp-team">
          {TEAM.map(([role, what]) => (
            <div key={role} className="lp-member">
              <b>{role}</b>
              <span>{what}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── A kurzus ── */}
      <section className="card stack" style={gap('32px')}>
        <div className="stack" style={gap('10px')}>
          <div className="eyebrow">A kurzus</div>
          <h2 className="h2">{ls.length || 18} lecke, 4 részben.</h2>
          <p className="lead">A leckék kb. 60%-a valódi képernyő és gyakorlat, egy minta-vállalkozás adataival – te közben a sajátodon csinálod végig.</p>
        </div>
        <ClaudeAlapozoParts lessons={ls} />
        <ClaudeAlapozoGets />
      </section>

      {/* ── Mi kell hozzá? ── */}
      <section className="card amber stack" style={gap('14px')}>
        <div className="eyebrow" style={{ color: 'var(--ink)' }}>Mielőtt feliratkozol</div>
        <h2 className="h2">Egy dolgot mondok előre.</h2>
        <p className="lead" style={{ color: 'var(--ink)', maxWidth: 760 }}>
          Kell hozzá Claude-előfizetés. Az első leckében megmutatom, melyik csomag mire elég; a böngészős és az önállóan dolgozó Claude-hoz (14. és 16. lecke)
          legalább Pro kell. Nem akarom, hogy ott állj, hogy nincs meg a gomb.
        </p>
      </section>

      {/* ── Rólam ── */}
      <section className="card lp-about">
        <span className="lp-photo">
          <img src="/marcsi.png" alt="Andor Marcsi" />
        </span>
        <div className="stack" style={gap('12px')}>
          <div className="eyebrow">Ki tanít?</div>
          <h2 className="h2" style={{ fontSize: 'clamp(28px, 3.4vw, 42px)' }}>Andor Marcsi vagyok.</h2>
          <p className="lead" style={{ maxWidth: 680 }}>
            Ügynökséget vezetek (Polymaind): éttermeknek, bároknak, webshopoknak gyártunk AI-val tartalmat, kampányt és automatizációt. Amit itt tanítok, azt hétfő
            reggel élesben használom ügyfélmunkán. Emberi nyelven, szakzsargon nélkül – nincs hülye kérdés.
          </p>
        </div>
      </section>

      {/* ── GYIK ── */}
      <section className="card stack" style={gap('24px')}>
        <h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>Gyakori kérdések</h2>
        <FaqList items={faq} />
      </section>

      {/* ── Záró CTA ── */}
      <section className="card dark lp-final">
        <div className="stack" style={gap('10px')}>
          <div className="eyebrow" style={{ color: 'var(--amber)' }}>Claude alapozó vállalkozásoknak</div>
          <h2 className="h2">Legyen egy csapatod. Holnaptól.</h2>
          <p style={{ margin: 0, color: '#cfcad4', fontSize: 17 }}>
            A teljes kurzus: <b style={{ color: '#fff' }}>{priceLabel(course)}</b>
            {saleInfo(course) && (
              <>
                {' '}<s>{formatHuf(saleInfo(course)!.listPrice)}</s> · <b style={{ color: '#fff' }}>{saleInfo(course)!.label} −{saleInfo(course)!.pct}%{saleInfo(course)!.until ? `, ${saleInfo(course)!.until}` : ''}</b>
              </>
            )}
            {course.coming_soon ? ' · Kérj értesítést, és szólok, amint indul – most nem kell fizetned.' : ' · Egyszeri díj, korlátlan hozzáférés.'}
          </p>
        </div>
        <a href="#ertesites" className="btn amber">{cta} ↑</a>
      </section>

      <JsonLd data={graph(ORGANIZATION, courseSchema(course), faqPage(faq))} />
    </div>
  );
}
