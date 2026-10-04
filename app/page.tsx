import type { Metadata } from 'next';
import Link from 'next/link';
import { FaqList } from '@/components/FaqList';
import { JsonLd } from '@/components/JsonLd';
import { SiteNav } from '@/components/SiteNav';
import { WorkshopList } from '@/components/WorkshopList';
import { SUBSCRIPTION } from '@/lib/config';
import { getCatalog } from '@/lib/data';
import { formatHuf, toolColor } from '@/lib/format';
import { courseSchema, faqPage, graph, HOME_FAQ, ORGANIZATION, PERSON } from '@/lib/seo';
import { soonLabel } from '@/lib/types';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: { absolute: 'Canva és AI kezdőknek – online videókurzus | Andor Marcsi' },
  description: 'Canva, Claude és AI-eszközök lépésről lépésre, emberi nyelven. Előre felvett videókurzusok kezdőknek és kisvállalkozóknak, Andor Marcsitól.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Digitális eszközök félelem nélkül – és némi humorral',
    description: 'Canva, Claude és AI-eszközök lépésről lépésre, emberi nyelven. Előre felvett videókurzusok kezdőknek és kisvállalkozóknak.',
    url: '/',
    siteName: 'andormarcsi.hu',
    locale: 'hu_HU',
    type: 'website',
    images: ['/marcsi.png'],
  },
};

// Csak olyan eszköz lebegjen a hero-ban, amihez van anyag.
const FLOATING = [
  { name: 'Canva', style: { left: '4%', top: '8%', '--r': '-6deg', animationDelay: '0s' } },
  { name: 'Claude', style: { right: '2%', top: '14%', '--r': '5deg', animationDelay: '-1.2s' } },
  { name: 'PolyOS', style: { left: '-2%', top: '40%', '--r': '4deg', animationDelay: '-2.4s' } },
];

const FOR_YOU = [
  'vállalkozó vagy, és eddig az unokaöcséd csinálta a posztjaidat (és már ő sem ér rá),',
  'hallottad, hogy „ezt ma már AI-jal csinálják”, de fogalmad sincs, melyikkel és hogyan,',
  'megnyitottad a Canvát, megijedtél, bezártad – és ez rendben van,',
  'inkább ma tanulnál meg valamit rendesen, mint hogy holnap is fizess érte valakinek,',
  '40 felett is szeretnél magabiztos lenni a gép előtt (nem, nem késő).',
];
const NOT_FOR_YOU = [
  'grafikus vagy, és a kerning szó hallatán felcsillan a szemed,',
  'egy héten belül 10 millió követőt szeretnél – én azt sem tudom, hogy kell.',
];

async function loadCatalog() {
  try {
    return await getCatalog(await createClient());
  } catch {
    return null; // pl. helyi fejlesztésnél Supabase nélkül
  }
}

export default async function Home() {
  const catalog = await loadCatalog();
  const featured = catalog?.courses.slice(0, 4) ?? [];
  // Közelgő indulások: a „Hamarosan” kurzusok indulási dátum szerint
  const launches = (catalog?.courses ?? [])
    .filter((c) => c.coming_soon && c.starts_at)
    .sort((a, b) => a.starts_at!.localeCompare(b.starts_at!));
  const nextLaunch = launches[0];
  const dayOf = (iso: string) => new Date(iso).toLocaleDateString('hu-HU', { day: '2-digit', timeZone: 'Europe/Budapest' }).replace('.', '');
  const monthOf = (iso: string) => new Date(iso).toLocaleDateString('hu-HU', { month: 'long', timeZone: 'Europe/Budapest' });
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' });

  return (
    <div className="page">
      {/* HERO */}
      <section style={{ position: 'relative', background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 60px -30px rgba(20,18,22,.25)' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', background: 'var(--amber)', clipPath: 'polygon(0 62%,100% 0,100% 100%,0 100%)' }} />
        <SiteNav bare />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 24, padding: '24px clamp(20px,5vw,72px) 0', alignItems: 'center' }}>
          <div className="stack" style={{ '--gap': '28px', paddingBottom: 40 } as React.CSSProperties}>
            <div className="mono" style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              Online videókurzusok kezdőknek · pizsamában is nézhető
            </div>
            <h1 className="h1" style={{ fontSize: 'clamp(44px,5.4vw,74px)', lineHeight: 0.98 }}>
              Digitális eszközök kezdőknek, <span style={{ color: 'var(--purple)' }}>félelem nélkül.</span>
            </h1>
            <p className="lead" style={{ maxWidth: 500 }}>
              A Canva nem harap, a Claude nem fogja átvenni a munkádat, és a „mentés másként” sem a te hibád volt. Lépésről lépésre, emberi nyelven –
              szakzsargon helyett olyan mondatokkal, amiket a nagymamád is értene.
            </p>
            {/* „Mi ez” ténymondat – ezt idézik a keresők és az AI-asszisztensek */}
            <p style={{ margin: 0, maxWidth: 500, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3)' }}>
              Az andormarcsi.hu Andor Marcsi online videókurzus-oldala, ahol kezdők és kisvállalkozók előre felvett, rövid videókból tanulják meg a Canva,
              a Claude és más AI-eszközök használatát, magyarul, saját tempóban.
            </p>
            <div className="row">
              <a href="#kurzusok" className="btn">Mutasd a kurzusokat</a>
              <a href="#hirlevel" className="btn light">Ingyenes tippet kérek</a>
            </div>
            <div className="hero-stats" style={{ marginTop: 12 }}>
              <div className="hero-stat"><b>3</b>eszköz</div>
              <div className="hero-stat"><b>1</b>türelmes tanár</div>
              <div className="hero-stat"><b>0</b>hülye kérdés</div>
            </div>
          </div>

          <div style={{ position: 'relative', minHeight: 520, display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'absolute', width: 'min(520px,110%)', height: 200, right: '-8%', bottom: 30, background: 'var(--purple)', borderRadius: 100, transform: 'rotate(-16deg)' }} />
            <div style={{ position: 'relative', width: 'min(320px,72%)', aspectRatio: '1', borderRadius: '50%', padding: 8, background: 'linear-gradient(135deg,var(--rose),var(--purple))', marginTop: -20 }}>
              <svg viewBox="0 0 440 440" style={{ position: 'absolute', inset: '-18%', width: '136%', height: '136%', overflow: 'visible', pointerEvents: 'none' }} aria-hidden>
                <defs>
                  <path id="ring" d="M220,220 m-178,0 a178,178 0 1,1 356,0 a178,178 0 1,1 -356,0" />
                </defs>
                <text textLength={1115} lengthAdjust="spacing" style={{ fontFamily: 'var(--mono)', fontSize: 14, fill: 'var(--ink-2)', textTransform: 'uppercase', stroke: '#fff', strokeWidth: 4, paintOrder: 'stroke', strokeLinejoin: 'round' }}>
                  <textPath href="#ring">kezdőknek · lépésről lépésre · nincs „ezt mindenki tudja” · canva · claude · polyos · gyakorlatban ·</textPath>
                </text>
              </svg>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/marcsi.png" alt="Andor Marcsi" style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block', border: '6px solid #fff', transform: 'scale(1.08)' }} />
            </div>
            {FLOATING.map((f) => (
              <div
                key={f.name}
                style={{ position: 'absolute', zIndex: 3, display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 999, padding: '8px 16px 8px 8px', boxShadow: '0 18px 36px -16px rgba(20,18,22,.4)', animation: 'float 5s ease-in-out infinite', ...f.style } as React.CSSProperties}
              >
                <span style={{ width: 40, height: 40, borderRadius: '50%', background: toolColor(f.name), display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 700 }}>{f.name[0]}</span>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{f.name}</span>
              </div>
            ))}
            {nextLaunch && (
              <div style={{ position: 'absolute', right: 0, bottom: 56, background: '#fff', borderRadius: 20, padding: '18px 22px', boxShadow: '0 20px 40px -18px rgba(20,18,22,.35)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Következő indulás</div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 24, letterSpacing: '-.02em' }}>{shortDate(nextLaunch.starts_at!)}</div>
                <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{nextLaunch.title}</div>
              </div>
            )}
            <div style={{ position: 'absolute', left: 0, bottom: 120, background: '#fff', borderRadius: 999, padding: '10px 18px 10px 10px', boxShadow: '0 20px 40px -18px rgba(20,18,22,.35)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--amber)', display: 'grid', placeItems: 'center' }}>✓</span>
              Előre felvett videók
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24, padding: '28px clamp(20px,5vw,72px) 36px', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(22px,2.6vw,32px)', letterSpacing: '-.02em', color: '#fff' }}>
          <span>Canva</span>
          <span>Claude</span>
          <span>PolyOS</span>
        </div>
      </section>

      {/* KINEK SZÓL */}
      <section id="kinek" className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: '28px 56px' }}>
        <div className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <div className="eyebrow">Kinek szól?</div>
          <h2 className="h2">Kinek szól ez az egész?</h2>
          <p className="lead">Neked, ha a „csak kattints rá” mondattól kiver a víz, mert nem tudod, mire.</p>
        </div>
        <div className="stack" style={{ '--gap': '28px' } as React.CSSProperties}>
          <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
            <h3 className="h3">Neked szól, ha…</h3>
            <ul className="fit-list">{FOR_YOU.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
            <h3 className="h3">Nem neked szól, ha…</h3>
            <ul className="fit-list no">{NOT_FOR_YOU.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* KURZUSOK */}
      <section id="kurzusok" className="card stack" style={{ '--gap': '36px' } as React.CSSProperties}>
        <WorkshopList courses={(catalog?.courses ?? []).map(({ id, slug, title, subtitle, description, teaser, tool, level, price_huf, coming_soon, starts_at, bundle_course_ids }) => ({ id, slug, title, subtitle, description, teaser, tool, level, price_huf, coming_soon, starts_at, bundle_course_ids }))} />
      </section>

      {/* TUDÁSTÁR */}
      <section id="anyagok" className="card dark" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 48, alignItems: 'center' }}>
        <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          <div className="eyebrow">Videós tudástár</div>
          <h2 className="h2">Hogyan működik a videós tudástár?</h2>
          <p className="lead">
            Előre felvett, rövid videók, útmutatók és sablonok. Akkor nézed, amikor a gyerek végre alszik, és annyiszor tekered vissza, ahányszor csak
            akarod – nem fogok sóhajtani. Belépni e-mailben kapott linkkel tudsz, jelszót nem kell megjegyezned (szívesen).
            {SUBSCRIPTION.enabled && ` Hetente ${SUBSCRIPTION.weeklyNew} új anyag érkezik.`}
          </p>
          <div className="row">
            <Link href="/kurzusok" className="btn amber">Belesek a tudástárba</Link>
            {SUBSCRIPTION.enabled && (
              <Link href="/elofizetes" className="btn light">Előfizetés · {formatHuf(SUBSCRIPTION.priceHuf)}/hó</Link>
            )}
          </div>
        </div>
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          {featured.length === 0 && <p className="lead">Hamarosan érkeznek az első anyagok.</p>}
          {featured.map((c) => (
            <Link key={c.id} href={`/kurzusok/${c.slug}`} style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: 18, alignItems: 'center', padding: '18px 22px', borderRadius: 20, background: '#221f26', color: '#fff' }}>
              <span style={{ width: 56, height: 56, borderRadius: 16, background: toolColor(c.tool), display: 'grid', placeItems: 'center', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>VID</span>
              <span className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
                <span style={{ fontWeight: 700, fontSize: 17 }}>{c.title}</span>
                <span style={{ fontSize: 14, color: '#a9a3af' }}>
                  {catalog!.stats(c.id).count} lecke{c.subtitle ? ` · ${c.subtitle}` : ''}
                </span>
              </span>
              <span className="mono" style={{ fontSize: 13, color: 'var(--amber)' }}>{formatHuf(c.price_huf)}{c.coming_soon ? ` · ${soonLabel(c).toLowerCase()}` : ''}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* RÓLAM */}
      <section id="rolam" className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,320px),1fr))', gap: 48, alignItems: 'center' }}>
        <div style={{ position: 'relative', display: 'grid', placeItems: 'center', minHeight: 360 }}>
          <div style={{ position: 'absolute', width: '78%', aspectRatio: '1', borderRadius: '50%', background: 'var(--amber)', transform: 'translate(-14%,10%)' }} />
          <div style={{ position: 'relative', width: 'min(300px,80%)', aspectRatio: '1', borderRadius: '50%', padding: 7, background: 'linear-gradient(135deg,var(--rose),var(--purple))' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/marcsi.png" alt="Andor Marcsi" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', display: 'block', border: '6px solid #fff', transform: 'scale(1.08)' }} />
          </div>
        </div>
        <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          <div className="eyebrow">Rólam</div>
          <h2 className="h2">Ki az az Andor Marcsi?</h2>
          <p className="h3" style={{ margin: 0 }}>Szia, Marcsi vagyok. Lefordítom a technológiát emberire.</p>
          <p className="lead" style={{ fontSize: 17, lineHeight: 1.65 }}>
            Nem programozónak születtem, hanem kényszervállalkozónak. 2017-ben kezdtem, mert nem volt más út – azóta marketingügynökséget viszek, és
            építek egy saját üzleti szoftvert, a PolyOS-t. Negyven felett, kisgyerekes anyaként tanultam meg mindent, amit most tanítok, úgyhogy pontosan
            tudom, milyen az, amikor egy gomb 20 percig néz vissza rád.
          </p>
          <p className="lead" style={{ fontSize: 17, lineHeight: 1.65 }}>
            A kurzusaimban nincs szakzsargon, nincs rohanás és nincs „ezt mindenki tudja”. Csak gyakorlati példák, amiket másnap már használni tudsz a saját
            vállalkozásodban.
          </p>
          <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
            <span className="pill" style={{ padding: '8px 16px', fontSize: 14 }}>Türelmes magyarázat</span>
            <span className="pill" style={{ padding: '8px 16px', fontSize: 14 }}>Saját projekten dolgozol</span>
            <span className="pill" style={{ padding: '8px 16px', fontSize: 14 }}>Nevetni szabad</span>
          </div>
        </div>
      </section>

      {/* INDULÁSOK */}
      {launches.length > 0 && (
        <section id="idopontok" className="card amber stack" style={{ '--gap': '32px' } as React.CSSProperties}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <h2 className="h2">Közelgő indulások</h2>
            <p className="lead" style={{ color: 'var(--ink)' }}>Előre felvett online kurzusok – kérj értesítést, és szólok, amint elérhetők.</p>
          </div>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            {launches.map((c) => (
              <div key={c.id} className="date-row">
                <div className="stack" style={{ '--gap': '0' } as React.CSSProperties}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 30, lineHeight: 1, letterSpacing: '-.02em' }}>{dayOf(c.starts_at!)}</span>
                  <span className="tag muted">{monthOf(c.starts_at!)}</span>
                </div>
                <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
                  <span style={{ fontWeight: 700, fontSize: 18 }}>{c.title}</span>
                  <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>Online videókurzus · {formatHuf(c.price_huf)}</span>
                </div>
                <Link href={`/kurzusok/${c.slug}`} className="btn sm">Szólj, ha indul</Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GYIK */}
      <section id="gyik" className="card stack" style={{ '--gap': '28px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <div className="eyebrow">GYIK</div>
          <h2 className="h2">Gyakori kérdések</h2>
        </div>
        <FaqList items={HOME_FAQ} />
      </section>

      <JsonLd data={graph(PERSON, ORGANIZATION, ...(catalog?.courses ?? []).map(courseSchema), faqPage(HOME_FAQ))} />
    </div>
  );
}
