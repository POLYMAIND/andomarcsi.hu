import Link from 'next/link';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import { WorkshopList } from '@/components/WorkshopList';
import { SUBSCRIPTION } from '@/lib/config';
import { getCatalog } from '@/lib/data';
import { formatHuf, toolColor } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';

const DATES = [
  { day: '15', month: 'Október', title: 'Claude alapok: beszélgess az AI-jal', meta: '18:00–20:00 · Online, Zoom' },
  { day: '22', month: 'Október', title: 'Canva az első lépésektől', meta: '17:30–19:00 · Online, Zoom' },
  { day: '05', month: 'November', title: 'Polyos bevezető', meta: '10:00–12:00 · Budapest, élő' },
  { day: '12', month: 'November', title: 'Hirdetéskezelés AI eszközökkel', meta: '17:00–20:00 · Online, Zoom' },
];

const FLOATING = [
  { name: 'Canva', style: { left: '4%', top: '8%', '--r': '-6deg', animationDelay: '0s' } },
  { name: 'Claude', style: { right: '2%', top: '14%', '--r': '5deg', animationDelay: '-1.2s' } },
  { name: 'Suno', style: { left: '-2%', top: '44%', '--r': '4deg', animationDelay: '-2.4s' } },
  { name: 'Higgsfield', style: { right: '-2%', top: '48%', '--r': '-4deg', animationDelay: '-3.6s' } },
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

  return (
    <div className="page">
      {/* HERO */}
      <section style={{ position: 'relative', background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 60px -30px rgba(20,18,22,.25)' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', background: 'var(--amber)', clipPath: 'polygon(0 62%,100% 0,100% 100%,0 100%)' }} />
        <SiteNav bare />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,420px),1fr))', gap: 24, padding: '24px clamp(20px,5vw,72px) 0', alignItems: 'center' }}>
          <div className="stack" style={{ '--gap': '28px', paddingBottom: 40 } as React.CSSProperties}>
            <div className="mono" style={{ fontSize: 13, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>
              Workshopok kezdőknek · online és élőben
            </div>
            <h1 className="h1" style={{ fontSize: 'clamp(48px,7vw,92px)', lineHeight: 0.95 }}>
              Tanuld meg a digitális eszközöket <span style={{ color: 'var(--purple)' }}>félelem nélkül.</span>
            </h1>
            <p className="lead" style={{ maxWidth: 460 }}>
              Canva, Claude és Polyos – lépésről lépésre, emberi nyelven. Nem kell hozzá előismeret, csak kíváncsiság.
            </p>
            <div className="row">
              <Link href="/kurzusok" className="btn">Videós tudástár</Link>
              <a href="#workshopok" className="btn light">Workshopok</a>
            </div>
            <div className="row" style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--ink)', color: '#fff', borderRadius: 22, padding: '14px 22px 14px 14px' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fff', color: 'var(--ink)', display: 'grid', placeItems: 'center', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 18 }}>3</div>
                <div style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.2 }}>
                  eszköz,
                  <br />
                  egy barátságos tanár
                </div>
              </div>
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
                  <textPath href="#ring">kezdőknek · lépésről lépésre · canva · claude · polyos · gyakorlatban ·</textPath>
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
            <div style={{ position: 'absolute', right: 0, bottom: 56, background: '#fff', borderRadius: 20, padding: '18px 22px', boxShadow: '0 20px 40px -18px rgba(20,18,22,.35)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 170 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Következő workshop</div>
              <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 24, letterSpacing: '-.02em' }}>Okt. {DATES[0].day}.</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>Claude alapok</div>
            </div>
            <div style={{ position: 'absolute', left: 0, bottom: 120, background: '#fff', borderRadius: 999, padding: '10px 18px 10px 10px', boxShadow: '0 20px 40px -18px rgba(20,18,22,.35)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 14 }}>
              <span style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--amber)', display: 'grid', placeItems: 'center' }}>✓</span>
              Nincs buta kérdés
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 24, padding: '28px clamp(20px,5vw,72px) 36px', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 'clamp(22px,2.6vw,32px)', letterSpacing: '-.02em', color: '#fff' }}>
          <span>Canva</span>
          <span>Claude</span>
          <span>Polyos</span>
        </div>
      </section>

      {/* WORKSHOPOK */}
      <section id="workshopok" className="card stack" style={{ '--gap': '36px' } as React.CSSProperties}>
        <WorkshopList />
      </section>

      {/* TUDÁSTÁR */}
      <section id="anyagok" className="card dark" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,380px),1fr))', gap: 48, alignItems: 'center' }}>
        <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          <div className="eyebrow">Videós tudástár</div>
          <h2 className="h2">Tanulj a saját tempódban.</h2>
          <p className="lead">
            Rövid, követhető YouTube-videók, útmutatók és sablonok – hogy a workshop után is legyen mibe kapaszkodni.
            {SUBSCRIPTION.enabled && ` Hetente ${SUBSCRIPTION.weeklyNew} új anyag érkezik.`}
          </p>
          <div className="row">
            <Link href="/kurzusok" className="btn amber">Összes anyag</Link>
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
              <span className="mono" style={{ fontSize: 13, color: 'var(--amber)' }}>{c.coming_soon ? 'Hamarosan' : formatHuf(c.price_huf)}</span>
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
          <div className="eyebrow">Szia, Marcsi vagyok</div>
          <h2 className="h2">Lefordítom a technológiát hétköznapi nyelvre.</h2>
          <p className="lead" style={{ fontSize: 17, lineHeight: 1.65 }}>
            Abban segítek, hogy azok is magabiztosan használják a modern digitális eszközöket, akik eddig tartottak tőlük. A workshopjaimon nincs
            szakzsargon, nincs rohanás – csak gyakorlati példák, amiket másnap már használni tudsz.
          </p>
          <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
            <span className="pill" style={{ padding: '8px 16px', fontSize: 14 }}>Türelmes magyarázat</span>
            <span className="pill" style={{ padding: '8px 16px', fontSize: 14 }}>Kis csoportok</span>
            <span className="pill" style={{ padding: '8px 16px', fontSize: 14 }}>Saját projekten dolgozol</span>
          </div>
        </div>
      </section>

      {/* IDŐPONTOK */}
      <section id="idopontok" className="card amber stack" style={{ '--gap': '32px' } as React.CSSProperties}>
        <h2 className="h2">Közelgő időpontok</h2>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          {DATES.map((d) => (
            <div key={d.title} className="date-row">
              <div className="stack" style={{ '--gap': '0' } as React.CSSProperties}>
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 30, lineHeight: 1, letterSpacing: '-.02em' }}>{d.day}</span>
                <span className="tag muted">{d.month}</span>
              </div>
              <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{d.title}</span>
                <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{d.meta}</span>
              </div>
              <a href={`mailto:hello@andormarcsi.hu?subject=${encodeURIComponent('Jelentkezés: ' + d.title)}`} className="btn sm">Jelentkezem</a>
            </div>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
