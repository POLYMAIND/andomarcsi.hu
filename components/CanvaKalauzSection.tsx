import Link from 'next/link';
import { formatHuf } from '@/lib/format';
import type { Course } from '@/lib/types';
import { soonLabel } from '@/lib/types';

export type ModuleLesson = { course_id: string; title: string; duration_min: number | null; sort_order: number };

const COLORS = ['var(--amber)', 'var(--mint)', 'oklch(0.80 0.10 295)', 'var(--rose)'];

const GETS = [
  { t: 'Rövid, követhető videók', d: 'Max. 10 perces leckék – egyszerre egy dolog, lépésről lépésre.' },
  { t: 'A saját tempódban', d: 'Akkor nézed, amikor ráérsz, és akárhányszor visszatekered.' },
  { t: 'Örökre a tiéd', d: 'Egyszeri díj, nincs előfizetés – a tudástárban korlátlan ideig eléred.' },
  { t: 'AI segítő, ha elakadsz', d: 'A kurzusoldalon egy AI chat válaszol a Canvás kérdéseidre.' },
  { t: 'A saját anyagodon gyakorolsz', d: 'Saját fotóid, saját színeid – a végére a te posztjaid lesznek kész.' },
  { t: 'Számla automatikusan', d: 'A vásárlás után e-mailben megkapod a számlát.' },
];

const minutes = (ls: ModuleLesson[]) => ls.reduce((s, l) => s + (l.duration_min ?? 0), 0);

// Kezdőlap: a Canva Kalauz modulok – mit tanulsz és mit kapsz. Az adatok (cím, ár, leckék) az adatbázisból jönnek.
export function CanvaKalauzSection({ modules, bundle, extra, lessons }: { modules: Course[]; bundle: Course | null; extra: Course | null; lessons: ModuleLesson[] }) {
  if (!modules.length) return null;
  const byCourse = (id: string) => lessons.filter((l) => l.course_id === id).sort((a, b) => a.sort_order - b.sort_order);
  const separate = modules.reduce((s, m) => s + (m.price_huf ?? 0), 0);
  const totalLessons = modules.reduce((s, m) => s + byCourse(m.id).length, 0);
  const totalMin = modules.reduce((s, m) => s + minutes(byCourse(m.id)), 0);

  return (
    <section id="canva-kalauz" className="card stack" style={{ '--gap': '36px' } as React.CSSProperties}>
      <div className="stack" style={{ '--gap': '12px', maxWidth: 760 } as React.CSSProperties}>
        <div className="eyebrow">Canva Kalauz · videókurzus</div>
        <h2 className="h2">Mit fogsz megtanulni a Canvában?</h2>
        <p className="lead" style={{ margin: 0 }}>
          {modules.length} modul, {totalLessons} rövid videólecke, kb. {Math.round(totalMin / 10) * 10} perc – a teljes alapoktól a beütemezett feedig és a
          lapozós karusszelig. Minden modul külön is megvehető, de csomagban olcsóbb.
        </p>
      </div>

      <div className="km-grid">
        {modules.map((m, i) => {
          const ls = byCourse(m.id);
          const [, name] = m.title.split(' – ');
          return (
            <article key={m.id} className="km-card">
              <div className="km-head" style={{ background: COLORS[i % COLORS.length] }}>
                <span className="mono" style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase' }}>{i + 1}. modul</span>
                <h3 className="h3" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{name ?? m.title}</h3>
              </div>
              <div className="km-body">
                {m.outcome && (
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>
                    <strong>A végére:</strong> {m.outcome}
                  </p>
                )}
                {ls.length > 0 && (
                  <details className="km-lessons">
                    <summary>{ls.length} lecke · {minutes(ls)} perc</summary>
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
                <div className="row between" style={{ marginTop: 'auto', alignItems: 'center' } as React.CSSProperties}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22 }}>{formatHuf(m.price_huf)}</span>
                  <Link href={`/kurzusok/${m.slug}`} className="btn sm">{m.coming_soon ? 'Szólj, ha indul' : 'Részletek'}</Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {bundle && (
        <div className="km-bundle">
          <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
            <span className="mono" style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase' }}>Csomagban</span>
            <strong style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px,2.6vw,30px)', lineHeight: 1.15 }}>
              Mindhárom modul egyben: {formatHuf(bundle.price_huf)}
            </strong>
            {separate > (bundle.price_huf ?? 0) && (
              <span style={{ fontSize: 15 }}>
                Külön megvéve {formatHuf(separate)} – a csomaggal {formatHuf(separate - (bundle.price_huf ?? 0))}-ot spórolsz.
              </span>
            )}
          </div>
          <Link href={`/kurzusok/${bundle.slug}`} className="btn">{bundle.coming_soon ? 'Szólj, ha indul' : 'Megnézem a csomagot'}</Link>
        </div>
      )}

      {extra && (
        <article className="km-extra">
          <div className="km-head" style={{ background: COLORS[3] }}>
            <span className="mono" style={{ fontSize: 13, letterSpacing: '.06em', textTransform: 'uppercase' }}>4. modul · külön vásárolható</span>
            <h3 className="h3" style={{ margin: 0, fontSize: 24, lineHeight: 1.15 }}>{extra.title.split(' – ')[1] ?? extra.title}</h3>
          </div>
          <div className="km-body">
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55 }}>{extra.teaser || extra.description}</p>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Ez a modul nincs benne a csomagban, külön vásárolható meg.</p>
            <div className="row between" style={{ alignItems: 'center' } as React.CSSProperties}>
              <span className="row" style={{ '--gap': '10px', alignItems: 'center' } as React.CSSProperties}>
                {extra.coming_soon && <span className="pill new">{soonLabel(extra)}</span>}
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22 }}>{formatHuf(extra.price_huf)}</span>
              </span>
              <Link href={`/kurzusok/${extra.slug}`} className="btn sm">{extra.coming_soon ? 'Szólj, ha indul' : 'Részletek'}</Link>
            </div>
          </div>
        </article>
      )}

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
    </section>
  );
}
