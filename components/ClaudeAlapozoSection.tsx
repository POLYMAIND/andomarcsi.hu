import Link from 'next/link';
import { formatHuf, priceLabel } from '@/lib/format';
import { saleInfo, soonLabel, type Course } from '@/lib/types';
import type { ModuleLesson } from '@/components/CanvaKalauzSection';

// Kezdőlap, kiemelt hely: Claude alapozó vállalkozásoknak – a kurzus négy része, leckékkel.
// A cím, ár, állapot és a leckék az adatbázisból jönnek; a részek a leckék sorszáma (sort_order) szerint.
export const PARTS = [
  {
    name: 'Beállítás',
    from: 0,
    to: 5,
    color: 'oklch(0.80 0.10 295)',
    outcome: 'A Claude ismeri a cégedet: cégkártya, memória és adatbiztonság, connectorok (Meta, Gmail, Naptár, Drive, Canva), telepített skillek.',
  },
  {
    name: 'A marketing\u00ADcsapatod',
    from: 6,
    to: 9,
    color: 'var(--amber)',
    outcome: 'Szövegíró, posztoló, elemző és céltervező dolgozik helyetted – a te hangodon, a te számaidból.',
  },
  {
    name: 'Az irodai csapatod',
    from: 10,
    to: 13,
    color: 'var(--mint)',
    outcome: 'Pénzügyes, irodavezető, beszerző és recepciós: cash flow, számlák a könyvelőnek, beosztás, leltár, foglalások.',
  },
  {
    name: 'Működtetés',
    from: 14,
    to: 17,
    color: 'var(--rose)',
    outcome: 'Claude a böngészőben és a telefonon, önállóan dolgozik helyetted – és egy napi 15 perces rutin az első hónapra.',
  },
];

export const GETS = [
  { t: 'Rövid, gyakorlati videók', d: 'A leckék kb. 60%-a valódi képernyő és gyakorlat, egy minta-vállalkozás adataival.' },
  { t: '17 kész skill', d: 'Egy csomagban, telepítési leírással – a végére egy egész csapat dolgozik neked.' },
  { t: 'Munkalap minden leckéhez', d: 'Plusz PDF-útmutató és beállítási ellenőrzőlista, hogy semmi ne maradjon ki.' },
  { t: 'A saját tempódban', d: 'Akkor nézed, amikor ráérsz, és akárhányszor visszatekered.' },
  { t: 'AI segítő, ha elakadsz', d: 'A kurzusoldalon egy AI chat válaszol a kérdéseidre.' },
  { t: 'Számla automatikusan', d: 'A vásárlás után e-mailben megkapod a számlát.' },
];

const minutes = (ls: ModuleLesson[]) => ls.reduce((s, l) => s + (l.duration_min ?? 0), 0);

// Promóvideó (ugyanaz, mint a hirdetésben): ha a fájl a public/video mappában van, a fejléc bal oldalán jelenik meg.
export const PROMO_VIDEO = { src: '/video/claude-alapozo-promo.mp4', poster: '/video/claude-alapozo-promo-poster.jpg' };

export function ClaudeAlapozoSection({ course, lessons, promo = false }: { course: Course | null; lessons: ModuleLesson[]; promo?: boolean }) {
  if (!course) return null;
  const sorted = [...lessons].sort((a, b) => a.sort_order - b.sort_order);
  const totalMin = minutes(sorted);
  const cta = course.coming_soon ? 'Szólj, ha indul' : 'Megnézem a kurzust';

  return (
    <section id="claude-alapozo" className="card stack" style={{ '--gap': '36px' } as React.CSSProperties}>
      <div className={promo ? 'ca-head' : undefined}>
      {promo && (
        <video
          className="ca-promo"
          controls
          playsInline
          preload="metadata"
          poster={PROMO_VIDEO.poster}
          aria-label="Claude alapozó vállalkozásoknak – bemutató videó"
        >
          <source src={PROMO_VIDEO.src} type="video/mp4" />
        </video>
      )}
      <div className="stack" style={{ '--gap': '12px', maxWidth: 820, alignSelf: 'center' } as React.CSSProperties}>
        <div className="eyebrow">Claude alapozó · videókurzus vállalkozásoknak</div>
        <h2 className="h2">Egy egész marketing- és irodai csapat – Claude-dal.</h2>
        <p className="lead" style={{ margin: 0, maxWidth: 760 }}>
          {course.teaser ||
            `${sorted.length} videólecke a nulláról: a végére a Claude ismeri a cégedet, és kész skillek dolgoznak helyetted.`}
        </p>
        {sorted.length > 0 && (
          <span className="muted" style={{ fontSize: 15 }}>
            {sorted.length} videólecke{totalMin ? ` · kb. ${Math.round(totalMin / 10) * 10} perc` : ''} · 4 részben, saját tempóban
          </span>
        )}
        {promo && (
          <Link href={`/kurzusok/${course.slug}`} className="btn" style={{ alignSelf: 'flex-start', marginTop: 8 }}>{cta}</Link>
        )}
      </div>
      </div>

      <ClaudeAlapozoParts lessons={sorted} />

      <div className="km-bundle">
        <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
          <span className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
            <span className="mono" style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase' }}>Claude alapozó vállalkozásoknak</span>
            {course.coming_soon && <span className="pill new">{soonLabel(course)}</span>}
            {saleInfo(course) && (
              <span className="pill" style={{ background: 'var(--rose)', color: '#fff', fontWeight: 700 }}>
                {saleInfo(course)!.label} · −{saleInfo(course)!.pct}%{saleInfo(course)!.until ? ` · ${saleInfo(course)!.until}` : ''}
              </span>
            )}
          </span>
          <strong style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.15 }}>
            A teljes kurzus: {priceLabel(course)}
            {saleInfo(course) && <s style={{ fontSize: '.6em', color: '#a9a3af', marginLeft: 10, fontWeight: 500 }}>{formatHuf(saleInfo(course)!.listPrice)}</s>}
          </strong>
          {course.subtitle && <span style={{ fontSize: 15 }}>{course.subtitle}</span>}
        </div>
        <Link href={`/kurzusok/${course.slug}`} className="btn">{cta}</Link>
      </div>

      <ClaudeAlapozoGets />
    </section>
  );
}

// A kurzus 4 része kártyákon, lenyitható lecke-listával (kezdőlap és landing).
export function ClaudeAlapozoParts({ lessons }: { lessons: ModuleLesson[] }) {
  const sorted = [...lessons].sort((a, b) => a.sort_order - b.sort_order);
  return (
      <div className="km-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 230px), 1fr))' }}>
        {PARTS.map((p, i) => {
          const ls = sorted.filter((l) => l.sort_order >= p.from && l.sort_order <= p.to);
          return (
            <article key={p.name} className="km-card">
              <div className="km-head" style={{ background: p.color }}>
                <span className="mono" style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase' }}>{i + 1}. rész</span>
                <h3 className="h3" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{p.name}</h3>
              </div>
              <div className="km-body">
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                  <strong>A végére:</strong> {p.outcome}
                </p>
                {ls.length > 0 && (
                  <details className="km-lessons" style={{ marginTop: 'auto' }}>
                    <summary>
                      {ls.length} lecke{minutes(ls) ? ` · ${minutes(ls)} perc` : ''}
                    </summary>
                    <ol>
                      {ls.map((l) => (
                        <li key={l.sort_order}>
                          <span>{l.title}</span>
                          {l.duration_min ? <span className="muted mono">{l.duration_min}p</span> : null}
                        </li>
                      ))}
                    </ol>
                  </details>
                )}
              </div>
            </article>
          );
        })}
      </div>

  );
}

export function ClaudeAlapozoGets() {
  return (
    <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
      <h3 className="h3" style={{ margin: 0 }}>Mit kapsz?</h3>
      <ul className="km-gets">
        {GETS.map((g) => (
          <li key={g.t}>
            <strong>{g.t}</strong>
            <span>{g.d}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
