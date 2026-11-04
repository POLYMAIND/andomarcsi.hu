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
import { ACADEMY, ACADEMY_PRICES, MENTOR_TOPICS, SKILL_MODULE_SLUG, byPackageOrder, isAcademyLevel, packageKind, type AcademyLevel } from '@/lib/polyakademia';
import { faqPage, graph, ORGANIZATION, type Faq } from '@/lib/seo';
import { soonLabel, type Course } from '@/lib/types';

const TITLE = 'Polyakadémia – kész AI-skillek vállalkozóknak';
const DESCRIPTION =
  'Online skill-anyagok vállalkozóknak, akik nem akarnak promptmérnökök lenni: kész Claude-skillek, amik a te márkádban, a te hangodon dolgoznak. 990 Ft-os zsebcsomagtól a mentorprogramig.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: ACADEMY.path },
  openGraph: { title: TITLE, description: DESCRIPTION, url: ACADEMY.path, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website' },
};

const LEVELS: AcademyLevel[] = [1, 2, 3];

const FOR_YOU = [
  'vállalkozó vagy, és a heti posztolás valahol a fogorvos és az adóbevallás között van a kedvenc programjaid listáján',
  'már kipróbáltad a ChatGPT-t vagy a Claude-ot, de a végeredmény úgy hangzott, mint egy kedves, de nagyon unott banki ügyintéző',
  'nem érdekel, miért működik a mesterséges intelligencia, csak az, hogy neked működjön',
  'szeretnéd, ha a karusszeleid, Reelsed és posztjaid úgy néznének ki, mintha lenne egy designer csapatod (és nem, a Canva-sablon nem csapat)',
];
const NOT_FOR_YOU = [
  'egy online gurut keresel, aki a Bali-i medence mellől mondja, hogy „csak higgy magadban” – én Pomázról mondom, hogy „csak telepítsd fel a skillt”',
  'azt várod, hogy az AI kitalálja helyetted, mit árulsz és kinek',
  '40 órányi elméleti videót szeretnél a promptírás művészetéről. Nálam a jó skill csinálja a promptot, te meg a dolgod.',
];

const FAQ: Faq[] = [
  { q: 'Mi az a Polyakadémia?', a: 'Andor Marcsi online oktatási anyagai vállalkozóknak: kész AI-skillek és a felépítésükhöz szükséges videós anyagok, a tartalomgyártástól az automatizációig.' },
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
  ['#lepcsohaz', 'Lépcsőház'],
  ['#ingyenes', 'Ingyenes'],
  ['#zsebcsomagok', 'Zsebcsomagok'],
  ['#skill-anyagok', 'Skill-anyagok'],
  ['#skill-modul', 'Skill modul'],
  ['#tagsag', 'Tagság'],
  ['#mentor', 'Mentorprogram'],
  ['#piramis', 'Hol tartasz?'],
  ['#gyik', 'GYIK'],
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

export default async function PolyakademiaPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const byId = new Map(catalog.courses.map((c) => [c.id, c]));
  const academy = catalog.courses.filter((c) => isAcademyLevel(c.academy_level));
  const materials = academy.filter((c) => c.skill_material).sort((a, b) => a.skill_material! - b.skill_material!);
  const skillModule = catalog.courses.find((c) => c.slug === SKILL_MODULE_SLUG) ?? null;
  const moduleItems = (skillModule?.bundle_course_ids ?? []).map((id) => byId.get(id)).filter((c): c is Course => !!c);
  const packages = catalog.pockets.filter((p) => p.pocket_for && byId.has(p.pocket_for)).sort(byPackageOrder);
  const freebies = packages.filter((p) => p.price_huf === 0);
  const pockets = packages.filter((p) => p.price_huf !== 0);
  const canUse = (c: Course) => !!user && courseAccessible(c, access, profile?.is_admin);
  const pyramid = Object.fromEntries(
    LEVELS.map((l) => [l, academy.filter((c) => c.academy_level === l).map((c) => ({ slug: c.slug, title: shortTitle(c.title), mark: markOf(c) }))]),
  ) as Record<AcademyLevel, PyramidCourse[]>;
  const separately = materials.reduce((s, c) => s + (c.price_huf ?? 0), 0);
  const mentorMsg = sp.mentor ? MENTOR_MSG[sp.mentor] : null;

  const ladder = [
    { step: '0.', name: 'Ingyenes kóstoló', what: 'Kész promptok, mini skillek, letölthető csalik', price: '0 Ft', href: '#ingyenes' },
    { step: '1.', name: 'Zsebcsomag', what: '1 kész skill vagy prompt-pack, útmutatóval', price: formatHuf(ACADEMY_PRICES.pocket), href: '#zsebcsomagok', hot: true },
    { step: '2.', name: 'Skill-anyag', what: '1 téma, 1 online anyag, a végén működő saját skill', price: `${formatHuf(ACADEMY_PRICES.material)} / anyag`, href: '#skill-anyagok' },
    { step: '3.', name: 'Skill modul egyben', what: 'Mind a 6 skill-anyag + bónuszok, ajánlott sorrendben', price: formatHuf(skillModule?.price_huf ?? ACADEMY_PRICES.module), href: '#skill-modul' },
    { step: '3+.', name: 'Havidíjas tagság', what: 'Minden anyag + heti 1 online Q&A + zárt közösség', price: `${formatHuf(SUBSCRIPTION.priceHuf)} / hó`, href: '#tagsag' },
    { step: '4.', name: 'Mentorprogram', what: '10 személyes alkalom, automatizáció és AI-ügynökök', price: formatHuf(ACADEMY_PRICES.mentor), href: '#mentor', dark: true },
  ];

  return (
    <div className="page">
      <SiteNav />

      <section className="card dark stack ps-hero" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="eyebrow" style={{ color: '#a9a6b0' }}>Polyakadémia · online skill-anyagok vállalkozóknak</div>
        <h1 className="h1" style={{ maxWidth: 980 }}>
          Az AI nem fog helyetted dolgozni. De nagyon jó <span className="ps-mark">gyakornok</span> lesz belőle.
        </h1>
        <p className="lead" style={{ maxWidth: 720 }}>
          Polyakadémia – online skill-anyagok vállalkozóknak, akik nem akarnak promptmérnökök lenni, csak végre gyorsabban kész lenni a heti tartalommal. Azt tanítom meg, amit az
          ügyfeleimnek is építek: kész skilleket, amik a te márkádban, a te hangodon dolgoznak.
        </p>
        <div className="row" style={{ '--gap': '16px' } as React.CSSProperties}>
          <a href="#zsebcsomagok" className="btn ps-lime">Kezdem 990 forintból</a>
          <a href="#ingyenes" style={{ color: '#f3f5ef', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}>Inkább előbb ingyen kipróbálnám →</a>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: '#a9a6b0', maxWidth: 560 }}>
          Online, saját tempóban. Nincs élő óra, amiről elkéshetsz, és nincs csoportkép, amin rosszul nézel ki.
        </p>
      </section>

      <ScrollFadeNav items={TOC} />

      <section id="kinek" className="card stack ps-anchor" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Kinek szól</div>
          <h2 className="h2">Kinek szól (és kinek nagyon nem)</h2>
        </div>
        <div className="grid" style={{ '--min': '300px', '--gap': '14px' } as React.CSSProperties}>
          <div className="ps-yes">
            <h3 className="h3">Neked szól, ha:</h3>
            <ul>{FOR_YOU.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="ps-no">
            <h3 className="h3">Nem neked szól, ha:</h3>
            <ul>{NOT_FOR_YOU.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
        <p className="ps-principle">
          <b>Miért hallgass rám?</b> Ügynökséget vezetek (Polymaind), éttermeknek, bároknak, webshopoknak gyártunk AI-val tartalmat, kampányt és automatizációt. Amit itt tanítok, azt nem
          egy tankönyvből vettem, hanem hétfőn reggel élesben használom ügyfélmunkán.
        </p>
      </section>

      <section id="lepcsohaz" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Értéklétra</div>
          <h2 className="h2">Hogyan épül fel a Polyakadémia?</h2>
          <p className="lead">
            Mint egy jó lépcsőház: bármelyik emeleten beszállhatsz, és senki nem kötelez, hogy felmenj a tetőteraszig. Minden lépcsőfok önmagában is hasznos, de úgy építettem fel, hogy a
            következő ráépüljön.
          </p>
        </div>
        <div className="ps-stairs">
          {ladder.map((r, i) => (
            <a key={r.step} href={r.href} className={`ps-stair${r.hot ? ' lime' : ''}${r.dark ? ' dark' : ''}`} style={{ '--i': i } as React.CSSProperties}>
              <span className="ps-stair-step">{r.step}</span>
              <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                <b>{r.name}</b>
                <span className="ps-stair-what">{r.what}</span>
              </span>
              <span className="ps-stair-price">{r.price}</span>
              <span className="ps-stair-go" aria-hidden="true">→</span>
            </a>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 760 }}>
          Minden anyag online, a tudástárban érhető el: belépés után korlátlan ideig a tiéd, és ha elakadsz, a beépített AI-chat segít – akkor is, ha hajnali kettőkor jut eszedbe, hogy most
          kéne megcsinálni a karusszelt.
        </p>
      </section>

      <section id="ingyenes" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <StepHead step="0." title="Ingyenes kóstoló" price="0 Ft">
          A posztjaim végén mindig ott van valami, amit azonnal használhatsz: egy prompt, egy mini skill, egy letölthető PDF. Kommenteld a kulcsszót, és megy a DM-be – vagy itt kattints rá,
          lépj be, és töltsd le. Olyan, mint a pékségben a kóstoló, csak nem lesz morzsás a billentyűzet.
        </StepHead>
        <div className="grid" style={{ '--min': '250px', '--gap': '12px' } as React.CSSProperties}>
          <a href="#teszt" className="ps-pack">
            <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}><span className="ps-tag first">Ingyenes</span><span className="ps-kw">{ACADEMY.entryKeyword}</span></span>
            <b>Claude-piramis teszt</b>
            <span className="muted" style={{ fontSize: 14 }}>Hat kérdés, két perc: megmutatja, hol tartasz, és honnan érdemes indulnod.</span>
            <span className="ps-more" style={{ marginTop: 'auto' }}>Kitöltöm →</span>
          </a>
          {freebies.map((p) => <PackCard key={p.id} pack={p} parent={byId.get(p.pocket_for!)} owned={canUse(p)} />)}
        </div>
      </section>

      <section id="zsebcsomagok" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <StepHead step="1." title="Zsebcsomagok" price={formatHuf(ACADEMY_PRICES.pocket)}>
          Kevesebb, mint egy kávé és egy kifli a belvárosban, és tovább tart a hatása. Egy zsebcsomag egy kész skill vagy prompt-pack, egyoldalas használati útmutatóval.
        </StepHead>
        <div className="grid" style={{ '--min': '250px', '--gap': '12px' } as React.CSSProperties}>
          {pockets.map((p) => <PackCard key={p.id} pack={p} parent={byId.get(p.pocket_for!)} owned={canUse(p)} />)}
        </div>
        <p className="ps-note">A {formatHuf(ACADEMY_PRICES.pocket)}-ot levonjuk, ha utána megveszed a hozzá tartozó skill-anyagot – a fizetésnél automatikusan.</p>
      </section>

      <section id="skill-anyagok" className="card stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <StepHead step="2." title="Skill-anyagok" price={`${formatHuf(ACADEMY_PRICES.material)} / anyag`}>
          Itt már nem csak kapod a skillt, hanem a saját anyagodon megépíted. Minden anyag külön megvehető: online videó saját tempóban, letölthető skill és munkalap, a végén pedig egy
          működő, a te márkádra szabott eszköz.
        </StepHead>
        <div className="grid" style={{ '--min': '280px', '--gap': '12px' } as React.CSSProperties}>
          {materials.map((c) => (
            <Link key={c.id} href={`/kurzusok/${c.slug}`} className="ps-pack ps-material">
              <span className="ps-material-num">{c.skill_material}</span>
              <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                <span className="ps-badge">{ACADEMY.badge}</span>
                {c.coming_soon && <span className="ps-tag soon">{soonLabel(c)}</span>}
              </span>
              <b>{c.title}</b>
              <span style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>{c.teaser || c.subtitle}</span>
              <span className="row between" style={{ marginTop: 'auto' }}>
                <span className="ps-pocket-price">{canUse(c) ? 'A tiéd' : priceLabel(c)}</span>
                <span className="ps-more">{canUse(c) ? 'Megnyitom →' : c.coming_soon ? 'Szólj, ha indul →' : 'Megveszem →'}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section id="skill-modul" className="card stack ps-anchor ps-module" style={{ '--gap': '20px' } as React.CSSProperties}>
        <StepHead step="3." title="Skill modul egyben" price={formatHuf(skillModule?.price_huf ?? ACADEMY_PRICES.module)}>
          Mind a hat skill-anyag egy csomagban, ajánlott sorrendben, plusz bónuszok, amik csak itt érhetők el. Külön {formatHuf(separately || ACADEMY_PRICES.material * 6)} lenne – matekból
          nem tanítok, de ezt még én is ki tudtam számolni.
        </StepHead>
        <h3 className="h3">Az ajánlott sorrend</h3>
        <ol className="ps-order">
          {moduleItems.map((c) => (
            <li key={c.id}>
              <Link href={`/kurzusok/${c.slug}`}>
                {c.title.startsWith('Bónusz') ? <><span className="ps-tag first">Bónusz</span> {c.title.replace(/^Bónusz: /, '')}</> : c.title}
              </Link>
              {c.subtitle && <span>{c.subtitle}</span>}
            </li>
          ))}
        </ol>
        {skillModule && (
          <Link href={`/kurzusok/${skillModule.slug}`} className="btn" style={{ alignSelf: 'flex-start' }}>
            {canUse(skillModule) ? 'Megnyitom' : skillModule.coming_soon ? `${soonLabel(skillModule)} – szólj, ha indul` : `Megveszem – ${priceLabel(skillModule)}`} →
          </Link>
        )}
      </section>

      <section id="tagsag" className="card stack ps-anchor" style={{ '--gap': '18px' } as React.CSSProperties}>
        <StepHead step="3+." title="Havidíjas tagság" price={`${formatHuf(SUBSCRIPTION.priceHuf)} / hó`}>
          A skill megvan, de jön egy kérdés kedd este? Erre van a tagság.
        </StepHead>
        <ul className="ps-rules">
          <li><b>Minden anyag</b> a tudástárban, amíg tag vagy – a zsebcsomagok és a skill-anyagok is.</li>
          <li><b>Heti 1 online Q&amp;A</b>, ahol bármit kérdezhetsz, ami a skillekkel kapcsolatos.</li>
          <li><b>Zárt közösség</b>, ahol a többiek is megosztják, mi működik nekik.</li>
          <li><b>Bármikor lemondható</b>, nincs hűségidő.</li>
        </ul>
        <Link href="/elofizetes" className="btn" style={{ alignSelf: 'flex-start' }}>
          {access.subscribed ? 'Tag vagy – a tagságod' : SUBSCRIPTION.enabled ? `Belépek a tagságba – ${formatHuf(SUBSCRIPTION.priceHuf)}/hó` : 'A tagság hamarosan indul'} →
        </Link>
      </section>

      <section id="mentor" className="card dark stack ps-anchor" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '8px', maxWidth: 720 } as React.CSSProperties}>
            <span className="ps-step mono">4. lépcsőfok</span>
            <h2 className="h2">Mentorprogram</h2>
            <p className="lead">
              A tartalmon túl: a vállalkozásod ismétlődő folyamatainak automatizálása. 10 személyes alkalom, mindegyiken egy téma. Fontos: nem mi építjük meg helyetted, hanem megtanítjuk,
              hogy te építsd meg. Így nem leszel ránk utalva, ha valami változik.
            </p>
          </div>
          <span className="ps-rung-price" style={{ color: 'var(--lime)' }}>{formatHuf(ACADEMY_PRICES.mentor)}</span>
        </div>
        <ol className="ps-topics">
          {MENTOR_TOPICS.map(([t, d]) => (
            <li key={t}><span><b>{t}</b>{d && ` – ${d}`}</span></li>
          ))}
        </ol>
        <form action="/api/mentor" method="post" className="ps-mentor-form">
          <strong style={{ fontSize: 20, fontFamily: 'var(--display)' }}>Jelentkezem a mentorprogramra</strong>
          <span style={{ fontSize: 14, color: '#cfcad4' }}>Írd meg pár mondatban, mivel foglalkozol – visszahívlak, és megbeszéljük, neked való-e. A jelentkezés nem kötelez semmire.</span>
          <input type="hidden" name={FORM_TS_FIELD} value={String(Date.now())} />
          <div className="grid" style={{ '--min': '200px', '--gap': '10px' } as React.CSSProperties}>
            <input className="input" name="name" required placeholder="Neved" autoComplete="name" defaultValue={profile?.full_name ?? ''} />
            <input className="input" name="email" type="email" required placeholder="E-mail címed" autoComplete="email" defaultValue={user?.email ?? ''} />
            <input className="input" name="phone" type="tel" placeholder="Telefonszám (nem kötelező)" autoComplete="tel" />
          </div>
          <textarea className="textarea" name="business" placeholder="Mivel foglalkozol, és mit automatizálnál először?" style={{ minHeight: 90 }} />
          <label className="check" style={{ alignItems: 'flex-start', fontSize: 13, color: '#cfcad4' }}>
            <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
            <span>Hozzájárulok, hogy a megadott elérhetőségeimen felvegyék velem a kapcsolatot a mentorprogrammal kapcsolatban. <Link href="/adatvedelem" target="_blank" style={{ textDecoration: 'underline', color: '#fff' }}>Adatkezelési tájékoztató</Link></span>
          </label>
          {mentorMsg && <div className={`notice ${mentorMsg[0]}`}>{mentorMsg[1]}</div>}
          <button className="btn ps-lime" type="submit" style={{ alignSelf: 'flex-start' }}>Jelentkezem</button>
        </form>
      </section>

      <AcademyQuiz pyramid={pyramid} />

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="eyebrow">És ha inkább megcsináltatnád?</div>
        <h2 className="h3" style={{ fontSize: 26 }}>Teljesen érthető.</h2>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink-2)', maxWidth: 720 }}>
          Erre van az ügynökségem, a Polymaind: céges képzés, automatizációs audit, kész tartalom és hirdetés. Ott nem tanítunk, hanem csináljuk.
        </p>
        <a href={`mailto:${COMPANY.email}?subject=${encodeURIComponent('Polymaind – megcsináltatnám')}`} className="btn outline" style={{ alignSelf: 'flex-start' }}>Írok a Polymaindnak →</a>
      </section>

      <section id="gyik" className="card stack ps-anchor" style={{ '--gap': '24px' } as React.CSSProperties}>
        <h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>Gyakori kérdések</h2>
        <FaqList items={FAQ} />
      </section>

      <section className="card dark stack ps-hero" style={{ '--gap': '18px' } as React.CSSProperties}>
        <h2 className="h2">A legdrágább AI az, amit kifizetsz, de nem használsz.</h2>
        <p className="lead" style={{ maxWidth: 700 }}>
          Nem kell holnaptól mindent automatizálnod. Kezdd egy zsebcsomaggal, építs meg egy skillt, és nézd meg, mennyi időd marad a héten. Ha bejön, a lépcső ott van. Ha nem, 990 forintért
          tanultál valamit magadról. Ez is valami.
        </p>
        <div className="row" style={{ '--gap': '16px' } as React.CSSProperties}>
          <a href="#zsebcsomagok" className="btn ps-lime">Mutasd a zsebcsomagokat</a>
          <a href="#ingyenes" style={{ color: '#f3f5ef', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 4 }}>Ingyenes kóstolót kérek →</a>
        </div>
      </section>
      <JsonLd data={graph(ORGANIZATION, faqPage(FAQ))} />
    </div>
  );
}

function StepHead({ step, title, price, children }: { step: string; title: string; price: string; children: React.ReactNode }) {
  return (
    <div className="row between" style={{ alignItems: 'flex-end', '--gap': '16px' } as React.CSSProperties}>
      <div className="stack" style={{ '--gap': '8px', maxWidth: 760 } as React.CSSProperties}>
        <span className="ps-step mono">{step} lépcsőfok</span>
        <h2 className="h2">{title}</h2>
        <p className="lead" style={{ maxWidth: 720 }}>{children}</p>
      </div>
      <span className="ps-rung-price">{price}</span>
    </div>
  );
}

// Ingyenes anyag / zsebcsomag kártya – az egész kártya kattintható, a csomag oldalára visz (letöltés / vásárlás).
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
      <span style={{ fontSize: 14.5, lineHeight: 1.5, color: 'var(--ink-2)' }}>{p.subtitle}</span>
      {parent && <span className="muted" style={{ fontSize: 13 }}>Ehhez: {parent.title}</span>}
      <span className="row between" style={{ marginTop: 'auto' }}>
        <span className="ps-pocket-price">{owned ? 'A tiéd' : priceLabel(p)}</span>
        <span className="ps-more">{owned ? 'Letöltés →' : p.coming_soon ? 'Szólj, ha kész →' : free ? 'Letöltöm →' : 'Megveszem →'}</span>
      </span>
    </Link>
  );
}
