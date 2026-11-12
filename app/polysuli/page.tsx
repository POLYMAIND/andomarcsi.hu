import type { Metadata } from 'next';
import Link from 'next/link';
import { AcademyQuiz, type PyramidCourse } from '@/components/AcademyQuiz';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { ScrollFadeNav } from '@/components/ScrollFadeNav';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { COMPANY } from '@/lib/company';
import { SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatHuf, priceLabel } from '@/lib/format';
import { FORM_TS_FIELD } from '@/lib/honeypot';
import { ACADEMY, ACADEMY_PRICES, ACADEMY_TOPICS, MENTOR_TOPICS, SKILL_MODULE_SLUG, byPackageOrder, isAcademyLevel, type AcademyLevel } from '@/lib/polyakademia';
import { faqPage, graph, ORGANIZATION, type Faq } from '@/lib/seo';
import { soonLabel, type Course } from '@/lib/types';

const TITLE = 'PolySuli – kész AI-skillek vállalkozóknak';
const DESCRIPTION =
  'Online skill-anyagok vállalkozóknak, akik nem akarnak promptmérnökök lenni: kész Claude-skillek, amik a te márkádban, a te hangodon dolgoznak. 990 Ft-os zsebcsomagtól a mentorprogramig.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: ACADEMY.path },
  openGraph: { title: TITLE, description: DESCRIPTION, url: ACADEMY.path, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website' },
};

const LEVELS: AcademyLevel[] = [1, 2, 3];
const gap = (g: string) => ({ '--gap': g }) as React.CSSProperties;

const FOR_YOU = [
  'A heti posztolás a fogorvos és az adóbevallás között van a kedvenc programjaid listáján.',
  'Kipróbáltad már a Claude-ot, de úgy hangzott, mint egy kedves, de nagyon unott banki ügyintéző.',
  'Nem az érdekel, miért működik az AI – csak az, hogy neked működjön.',
];
const NOT_FOR_YOU = [
  'Online gurut keresel, aki Baliról mondja, hogy „csak higgy magadban”. Én Pomázról mondom: „csak telepítsd a skillt”.',
  'Azt várod, hogy az AI kitalálja helyetted, mit árulsz és kinek.',
  '40 órányi elméleti videót szeretnél a promptírásról.',
];

const FAQ: Faq[] = [
  { q: 'Mi az a PolySuli?', a: 'Online skill-anyagok vállalkozóknak: ingyenes kóstolók, 990 Ft-os zsebcsomagok és teljes skill-anyagok, amikből a saját márkádra szabott Claude-skillt építesz.' },
  { q: 'Mi az a skill?', a: 'Egy előre megírt utasításcsomag az AI-nak (például a Claude-nak), ami egy konkrét feladatot mindig ugyanabban a minőségben, a te stílusodban végez el. Olyan, mint egy recept: nem kell minden alkalommal újra kitalálni a rántottát.' },
  { q: 'Kell hozzá programozói tudás?', a: 'Nem. Ha tudsz e-mailt írni és fájlt letölteni, menni fog. Ha nem, az AI-chat a tudástárban segít.' },
  { q: 'Meg kell tanulnom promptot írni?', a: 'Nem. Ezért kapsz kész skillt: a jó skill elvégzi helyetted a promptírás nehezét.' },
  { q: 'Milyen AI-eszköz kell hozzá?', a: 'A skillek elsősorban a Claude-ra készülnek. A pontos beállítást az első anyagban lépésről lépésre megmutatom.' },
  { q: 'Élő óra lesz?', a: 'Nem, minden anyag online, saját tempóban. Élőben csak a havidíjas tagság heti Q&A-ja és a mentorprogram személyes alkalmai mennek.' },
  { q: 'Meddig érem el az anyagokat?', a: 'A megvásárolt anyagokhoz a tudástárban belépés után korlátlan ideig hozzáférsz.' },
  { q: 'Mit csináljak, ha elakadok?', a: 'Kérdezd meg a tudástár AI-chatjét. Ha ez sem elég, a tagságban heti Q&A és zárt közösség vár.' },
  { q: 'Megvehetem csak az egyik anyagot?', a: `Igen, minden skill-anyag külön is megvehető ${formatHuf(ACADEMY_PRICES.material)}-ért. Ha legalább négyet szeretnél, a Skill modul egyben (${formatHuf(ACADEMY_PRICES.module)}) jobban megéri.` },
  { q: 'Mi a különbség a mentorprogram és a Polymaind szolgáltatása között?', a: 'A mentorprogramban megtanulod megépíteni a saját automatizációidat. A Polymaindnál megépítjük helyetted.' },
];

const TOC = [
  ['#kinek', 'Kinek szól'],
  ['#hogyan', 'Így működik'],
  ['#teszt', 'Hol tartasz?'],
  ['#anyagok', 'Anyagok témánként'],
  ['#csomagok', 'Csomagok'],
  ['#mentor', 'Mentorprogram'],
  ['#gyik', 'GYIK'],
] as const;

const DEPTHS = [
  { n: '01', price: '0 Ft', name: 'Kóstolsz', tone: 'mint', text: 'Ingyenes prompt, mini skill vagy PDF. Belépés után letöltöd, vagy kommenteld a kulcsszót, és megy DM-ben.' },
  { n: '02', price: formatHuf(ACADEMY_PRICES.pocket), name: 'Kipróbálod', tone: 'amber', text: 'Zsebcsomag: egy kész skill vagy prompt-pack, egyoldalas útmutatóval. Kevesebb, mint egy kávé és egy kifli.' },
  { n: '03', price: formatHuf(ACADEMY_PRICES.material), name: 'Megépíted', tone: 'purple', text: 'Skill-anyag: online videó, munkalap, letölthető skill – a végén egy működő, a te márkádra szabott eszköz.' },
] as const;

const MENTOR_MSG: Record<string, [string, string]> = {
  ok: ['ok', 'Köszönöm a jelentkezést! Hamarosan keresni foglak, és egyeztetünk.'],
  nev: ['err', 'Kérlek, add meg a neved.'],
  email: ['err', 'Kérlek, adj meg egy érvényes e-mail címet.'],
  hozzajarulas: ['err', 'A jelentkezéshez pipáld be a hozzájárulást.'],
  hiba: ['err', 'Nem sikerült elküldeni, próbáld újra.'],
};

const shortTitle = (t: string) => t.replace(/ Claude-dal$/, '').replace(/^(Zsebkurzus|Ingyenes): /, '');
const markOf = (c: Course): PyramidCourse['mark'] =>
  c.academy_tag === 'Itt kezdj' ? 'first' : c.skill_material ? 'new' : null;

type TopicRow = { key: string; name: string; hint?: string; free: Course[]; pocket: Course[]; material: Course | null };

// Egy téma = egy sor: a szülő tanfolyamhoz tartozó ingyenes anyagok, zsebcsomagok, és ha a szülő skill-anyag, maga a szülő.
function topicRows(courses: Course[], packages: Course[]): TopicRow[] {
  const byId = new Map(courses.map((c) => [c.id, c]));
  const parents = new Map<string, Course>();
  for (const p of packages) {
    const parent = byId.get(p.pocket_for!);
    if (parent) parents.set(parent.id, parent);
  }
  for (const c of courses) if (c.skill_material) parents.set(c.id, c);
  const order = (c: Course) => {
    const i = ACADEMY_TOPICS.findIndex((t) => t.slug === c.slug);
    return i === -1 ? ACADEMY_TOPICS.length : i;
  };
  return [...parents.values()]
    .sort((a, b) => order(a) - order(b) || a.sort_order - b.sort_order)
    .map((parent) => {
      const topic = ACADEMY_TOPICS.find((t) => t.slug === parent.slug);
      const mine = packages.filter((p) => p.pocket_for === parent.id).sort(byPackageOrder);
      return {
        key: parent.id,
        name: topic?.name ?? shortTitle(parent.title),
        hint: topic?.hint,
        free: mine.filter((p) => p.price_huf === 0),
        pocket: mine.filter((p) => p.price_huf !== 0),
        material: parent.skill_material ? parent : null,
      };
    });
}

export default async function PolySuliPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const byId = new Map(catalog.courses.map((c) => [c.id, c]));
  const academy = catalog.courses.filter((c) => isAcademyLevel(c.academy_level));
  const materials = academy.filter((c) => c.skill_material);
  const skillModule = catalog.courses.find((c) => c.slug === SKILL_MODULE_SLUG) ?? null;
  const moduleItems = (skillModule?.bundle_course_ids ?? []).map((id) => byId.get(id)).filter((c): c is Course => !!c);
  const bonuses = moduleItems.filter((c) => c.title.startsWith('Bónusz'));
  const packages = catalog.pockets.filter((p) => p.pocket_for && byId.has(p.pocket_for));
  const rows = topicRows(catalog.courses, packages);
  const canUse = (c: Course) => !!user && courseAccessible(c, access, profile?.is_admin);
  const pyramid = Object.fromEntries(
    LEVELS.map((l) => [l, academy.filter((c) => c.academy_level === l).map((c) => ({ slug: c.slug, title: shortTitle(c.title), mark: markOf(c) }))]),
  ) as Record<AcademyLevel, PyramidCourse[]>;
  const modulePrice = skillModule?.price_huf ?? ACADEMY_PRICES.module;
  const separately = materials.reduce((s, c) => s + (c.price_huf ?? 0), 0) || ACADEMY_PRICES.material * 6;
  const mentorMsg = sp.mentor ? MENTOR_MSG[sp.mentor] : null;

  return (
    <div className="page ps">
      <SiteNav />

      {/* ── Hős: ígéret + az első három lépés ── */}
      <section className="card dark ps-hero">
        <div className="ps-hero-grid">
          <div className="stack" style={gap('24px')}>
            <div className="ps-eyebrow lime">{ACADEMY.name} · online skill-anyagok vállalkozóknak</div>
            <h1 className="h1">
              Az AI nem fog helyetted dolgozni. De nagyon jó <span className="ps-mark">gyakornok</span> lesz belőle.
            </h1>
            <p className="lead">
              Kész Claude-skillek, amik a te márkádban, a te hangodon dolgoznak. Nem kell promptmérnöknek lenned – csak végre gyorsabban kész lenni a heti tartalommal.
            </p>
            <div className="row" style={gap('12px')}>
              <a href="#teszt" className="btn ps-lime">Kitöltöm a 2 perces tesztet</a>
              <a href="#anyagok" className="btn ps-ghost">Mutasd az anyagokat →</a>
            </div>
            <p className="ps-small">Online, saját tempóban. Nincs élő óra, amiről elkéshetsz.</p>
          </div>
          <div className="ps-start">
            <span className="ps-hand ps-start-note" aria-hidden="true">innen indulj ↓</span>
            <div className="ps-start-card">
              <div className="ps-start-head">
                <span className="mono">polysuli / első lépések</span>
                <span className="ps-pill lime">● 3 lépés</span>
              </div>
              {[
                ['01', 'Claude-piramis teszt', '6 kérdés · megmutatja, hol kezdj', '0 Ft', '#teszt'],
                ['02', 'Ingyenes kóstoló', 'prompt, mini skill, letölthető PDF', '0 Ft', '#anyagok'],
                ['03', 'Első kész skilled', 'zsebcsomag, útmutatóval', formatHuf(ACADEMY_PRICES.pocket), '#anyagok'],
              ].map(([n, t, d, p, href]) => (
                <a key={n} href={href} className="ps-start-row">
                  <span className="ps-pill num">{n}</span>
                  <span className="stack" style={gap('2px')}>
                    <b>{t}</b>
                    <span>{d}</span>
                  </span>
                  <span className="ps-start-price">{p}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ScrollFadeNav items={TOC} />

      {/* ── Kinek szól ── */}
      <section id="kinek" className="ps-section ps-anchor">
        <SectionHead eyebrow="Kinek szól" title="Neked szól – és kinek nagyon nem." />
        <div className="ps-three">
          <div className="ps-box">
            <span className="ps-pill lime">Neked szól, ha</span>
            {FOR_YOU.map((t) => <p key={t}>{t}</p>)}
          </div>
          <div className="ps-box">
            <span className="ps-pill rose">Nem neked szól, ha</span>
            {NOT_FOR_YOU.map((t) => <p key={t}>{t}</p>)}
          </div>
          <div className="ps-box green">
            <span className="ps-pill lime">Miért hallgass rám?</span>
            <p className="ps-big">Ügynökséget vezetek (Polymaind). Éttermeknek, bároknak, webshopoknak gyártunk AI-val tartalmat, kampányt és automatizációt.</p>
            <p className="ps-soft">Amit itt tanítok, azt hétfő reggel élesben használom ügyfélmunkán.</p>
          </div>
        </div>
      </section>

      {/* ── Így működik: három mélység ── */}
      <section id="hogyan" className="ps-section ps-anchor">
        <SectionHead eyebrow="Így működik" title="Minden témát háromféle mélységben kapsz.">
          Nem kell előre eldöntened, mennyit akarsz. Kóstolj bele ingyen, próbáld ki {formatHuf(ACADEMY_PRICES.pocket)}-ért, és ha bejön, építsd meg a sajátodat.
        </SectionHead>
        <div className="ps-three">
          {DEPTHS.map((d) => (
            <div key={d.n} className={`ps-box ps-depth ${d.tone}`}>
              <div className="row between">
                <span className="ps-depth-num">{d.n}</span>
                <span className="ps-pill tone">{d.price}</span>
              </div>
              <h3 className="h3">{d.name}</h3>
              <p>{d.text}</p>
            </div>
          ))}
        </div>
        <p className="ps-good">
          <span className="mono">Jó tudni</span>A zsebcsomag {formatHuf(ACADEMY_PRICES.pocket)}-ját levonjuk, ha utána megveszed a hozzá tartozó skill-anyagot – a fizetésnél automatikusan.
        </p>
      </section>

      {/* ── Hol tartasz? Teszt + piramis ── */}
      <AcademyQuiz pyramid={pyramid} />

      {/* ── Anyagok témánként: mátrix ── */}
      <section id="anyagok" className="ps-section ps-anchor">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <SectionHead eyebrow="Anyagok témánként" title="Egy téma = egy sor." />
          <span className="ps-hand purple" aria-hidden="true">balról jobbra egyre mélyebb ↘</span>
        </div>
        <div className="ps-mx" role="table" aria-label="Anyagok témánként és mélység szerint">
          <div className="ps-mx-row ps-mx-head" role="row">
            <span role="columnheader">Téma</span>
            <span role="columnheader" className="mint">01 · Ingyenes</span>
            <span role="columnheader" className="amber">02 · Zsebcsomag · {formatHuf(ACADEMY_PRICES.pocket)}</span>
            <span role="columnheader" className="lime">03 · Skill-anyag · {formatHuf(ACADEMY_PRICES.material)}</span>
          </div>
          <div className="ps-mx-row first" role="row">
            <span role="rowheader" className="ps-mx-topic"><b>Hol tartasz?</b></span>
            <span role="cell" data-col="Ingyenes">
              <a href="#teszt" className="ps-mx-item">
                <b>Claude-piramis teszt</b>
                <span>6 kérdés, 2 perc</span>
                <span className="ps-more">Kitöltöm →</span>
              </a>
            </span>
            <span role="cell" data-col="Zsebcsomag" className="ps-mx-empty">—</span>
            <span role="cell" data-col="Skill-anyag" className="ps-mx-empty">—</span>
          </div>
          {rows.map((r) => (
            <div key={r.key} className="ps-mx-row" role="row">
              <span role="rowheader" className="ps-mx-topic">
                <b>{r.name}</b>
                {r.hint && <span>{r.hint}</span>}
              </span>
              <MxCell col="Ingyenes" items={r.free} canUse={canUse} />
              <MxCell col="Zsebcsomag" items={r.pocket} canUse={canUse} />
              <MxCell col="Skill-anyag" items={r.material ? [r.material] : []} canUse={canUse} />
            </div>
          ))}
        </div>
        <div className="row between ps-small-dark">
          <span>A „Hamarosan” anyagoknál a gomb: <b>Szólj, ha kész →</b> (e-mail értesítő).</span>
          <Link href="/kurzusok" className="ps-underline">Minden anyag a tudástárban →</Link>
        </div>
      </section>

      {/* ── Csomagok ── */}
      <section id="csomagok" className="ps-section ps-anchor">
        <SectionHead eyebrow="Ha mindet akarod" title="Egyben olcsóbb. Három módon." />
        <div className="ps-three">
          <div className="ps-box ps-pack-card">
            <div className="row between">
              <span className="mono ps-label">Skill modul</span>
              {skillModule?.coming_soon && <span className="ps-pill grey">{soonLabel(skillModule)}</span>}
            </div>
            <h3 className="h3 ps-pack-title">Mind a 6 skill-anyag egyben</h3>
            <div className="ps-price">
              {formatHuf(modulePrice)} {separately > modulePrice && <s>{formatHuf(separately)}</s>}
            </div>
            <p>Ajánlott sorrendben, plusz {bonuses.length ? `${bonuses.length} bónusz, ami` : 'bónuszok, amik'} csak itt érhető el:</p>
            {bonuses.length > 0 && (
              <ul className="ps-bonus">
                {bonuses.map((c) => <li key={c.id}><span className="ps-pill lime">Bónusz</span>{c.title.replace(/^Bónusz: /, '')}</li>)}
              </ul>
            )}
            {skillModule && (
              <Link href={`/kurzusok/${skillModule.slug}`} className="btn outline block ps-push">
                {canUse(skillModule) ? 'Megnyitom' : skillModule.coming_soon ? 'Szólj, ha indul' : `Megveszem – ${priceLabel(skillModule)}`} →
              </Link>
            )}
          </div>

          <div className="ps-box ps-pack-card member">
            <span className="ps-hand purple ps-pack-note" aria-hidden="true">ha kérdeznél is ↓</span>
            <div className="row between">
              <span className="mono ps-label">Havidíjas tagság</span>
              {!SUBSCRIPTION.enabled && <span className="ps-pill grey">Hamarosan</span>}
            </div>
            <h3 className="h3 ps-pack-title">Minden anyag + heti Q&amp;A</h3>
            <div className="ps-price">{formatHuf(SUBSCRIPTION.priceHuf)} <small>/ hó</small></div>
            <ul className="ps-arrows">
              <li>Minden zsebcsomag és skill-anyag, amíg tag vagy</li>
              <li>Heti 1 online Q&amp;A, bármit kérdezhetsz</li>
              <li>Zárt közösség</li>
              <li>Bármikor lemondható, nincs hűségidő</li>
            </ul>
            <Link href="/elofizetes" className="btn purple block ps-push">
              {access.subscribed ? 'Tag vagy – a tagságod' : SUBSCRIPTION.enabled ? 'Belépek a tagságba' : 'Szólj, ha indul'} →
            </Link>
          </div>

          <div className="ps-box ps-pack-card dark">
            <div className="row between">
              <span className="mono ps-label">Mentorprogram</span>
              <span className="ps-pill lime">Jelentkezhetsz</span>
            </div>
            <h3 className="h3 ps-pack-title">10 személyes alkalom</h3>
            <div className="ps-price">{formatHuf(ACADEMY_PRICES.mentor)}</div>
            <p>A tartalmon túl: a vállalkozásod ismétlődő folyamatainak automatizálása. Nem mi építjük meg helyetted – megtanítjuk, hogy te építsd meg.</p>
            <a href="#mentor" className="btn ps-lime block ps-push">Mi van benne? →</a>
          </div>
        </div>
      </section>

      {/* ── Mentorprogram részletek + jelentkezés ── */}
      <section id="mentor" className="ps-mentor ps-anchor">
        <div className="stack" style={gap('22px')}>
          <div className="ps-eyebrow lime">Mentorprogram · 10 alkalom · {formatHuf(ACADEMY_PRICES.mentor)}</div>
          <h2 className="h2">Alkalmanként egy téma, a végén egy élesben futó automatizáció.</h2>
          <ol className="ps-topics">
            {MENTOR_TOPICS.map(([t, d], i) => (
              <li key={t}>
                <span className="mono">{String(i + 1).padStart(2, '0')}</span>
                <span><b>{t}</b>{d && <small> – {d}</small>}</span>
              </li>
            ))}
          </ol>
        </div>
        <form action="/api/mentor" method="post" className="ps-mentor-form">
          <strong>Jelentkezem</strong>
          <span className="muted" style={{ fontSize: 14 }}>Írd meg pár mondatban, mivel foglalkozol – visszahívlak, és megbeszéljük, neked való-e. Nem kötelez semmire.</span>
          <input type="hidden" name={FORM_TS_FIELD} value={String(Date.now())} />
          <label className="ps-field">Neved<input className="input" name="name" required autoComplete="name" defaultValue={profile?.full_name ?? ''} /></label>
          <label className="ps-field">E-mail címed<input className="input" name="email" type="email" required autoComplete="email" defaultValue={user?.email ?? ''} /></label>
          <label className="ps-field"><span>Telefonszám <span className="muted">(nem kötelező)</span></span><input className="input" name="phone" type="tel" autoComplete="tel" /></label>
          <label className="ps-field">Mivel foglalkozol, és mit automatizálnál először?<textarea className="textarea" name="business" style={{ minHeight: 90 }} /></label>
          <label className="check" style={{ alignItems: 'flex-start', fontSize: 13 }}>
            <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
            <span>Hozzájárulok, hogy a megadott elérhetőségeimen felvegyék velem a kapcsolatot a mentorprogrammal kapcsolatban. <Link href="/adatvedelem" target="_blank" className="ps-underline">Adatkezelési tájékoztató</Link></span>
          </label>
          {mentorMsg && <div className={`notice ${mentorMsg[0]}`}>{mentorMsg[1]}</div>}
          <button className="btn ps-green block" type="submit">Jelentkezem →</button>
        </form>
      </section>

      {/* ── Ha inkább megcsináltatnád ── */}
      <section className="ps-agency">
        <div>
          <span className="mono ps-label">És ha inkább megcsináltatnád?</span>
          <p><b>Teljesen érthető.</b> Erre van az ügynökségem, a Polymaind: céges képzés, automatizációs audit, kész tartalom és hirdetés. Ott nem tanítunk, hanem csináljuk.</p>
        </div>
        <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Polymaind – megcsináltatnám')}`} className="btn">Írok a Polymaindnak →</a>
      </section>

      {/* ── GYIK ── */}
      <section id="gyik" className="ps-section ps-anchor ps-faq">
        <SectionHead eyebrow="GYIK" title="Gyakori kérdések" />
        <FaqList items={FAQ} />
      </section>

      {/* ── Záró ── */}
      <section className="ps-final">
        <h2 className="h2">A legdrágább AI az, amit kifizetsz, de nem használsz.</h2>
        <p className="lead">
          Kezdd egy zsebcsomaggal, építs meg egy skillt, és nézd meg, mennyi időd marad a héten. Ha nem jön be, {formatHuf(ACADEMY_PRICES.pocket).replace(' Ft', ' forintért')} tanultál valamit magadról.
        </p>
        <div className="row" style={gap('12px')}>
          <a href="#anyagok" className="btn ps-green">Mutasd a zsebcsomagokat</a>
          <a href="#teszt" className="btn outline">Előbb a teszt →</a>
        </div>
      </section>
      <JsonLd data={graph(ORGANIZATION, faqPage(FAQ))} />
    </div>
  );
}

function SectionHead({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="stack ps-head" style={gap('12px')}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="h2">{title}</h2>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}

// Egy mátrix-cella: a témához tartozó anyag(ok) adott mélységben – vagy egy gondolatjel, ha ott nincs semmi.
function MxCell({ col, items, canUse }: { col: string; items: Course[]; canUse: (c: Course) => boolean }) {
  if (!items.length) return <span role="cell" data-col={col} className="ps-mx-empty">—</span>;
  return (
    <span role="cell" data-col={col} className="ps-mx-cell">
      {items.map((c) => {
        const owned = canUse(c);
        const free = c.price_huf === 0;
        const cta = owned ? (c.pocket_for ? 'Letöltés →' : 'Megnyitom →') : free ? 'Letöltöm →' : 'Megveszem →';
        return (
          <Link key={c.id} href={`/kurzusok/${c.slug}`} className="ps-mx-item">
            <b>{shortTitle(c.title)}</b>
            {c.subtitle && <span>{c.subtitle}</span>}
            {c.coming_soon ? <span className="ps-pill grey">{soonLabel(c)}</span> : <span className={`ps-pill ${owned ? 'grey' : 'lime'} ps-cta`}>{owned ? `A tiéd · ${cta}` : cta}</span>}
          </Link>
        );
      })}
    </span>
  );
}
