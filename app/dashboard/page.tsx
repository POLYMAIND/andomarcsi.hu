import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCard } from '@/components/CourseCard';
import { SiteNav } from '@/components/SiteNav';
import { requireUser } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatDate, formatHuf } from '@/lib/format';
import type { Lesson } from '@/lib/types';

export const metadata: Metadata = { title: 'Saját tanulás' };

export default async function DashboardPage() {
  const { supabase, user, profile } = await requireUser('/dashboard');
  const [catalog, access, { data: lessons }, { data: purchases }] = await Promise.all([
    getCatalog(supabase),
    getUserAccess(supabase, user.id),
    supabase.from('lessons').select('id, course_id, title, sort_order, published_at, duration_min').lte('published_at', new Date().toISOString()).order('sort_order').returns<Lesson[]>(),
    supabase.from('enrollments').select('created_at, amount_huf, source, courses(title, slug)').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);

  const byCourse = new Map<string, Lesson[]>();
  for (const l of lessons ?? []) byCourse.set(l.course_id, [...(byCourse.get(l.course_id) ?? []), l]);

  // "Saját" kurzusok: amibe beiratkozott/megvette, vagy amibe már belekezdett (előfizetőként / ingyenesként).
  const mine = catalog.courses
    // hozzáférhető kurzusok + az előrendelt („Hamarosan”) kurzusok
    .filter((c) => courseAccessible(c, access, profile?.is_admin) || access.enrolled.has(c.id))
    .map((c) => {
      const ls = byCourse.get(c.id) ?? [];
      const done = ls.filter((l) => access.completed.has(l.id)).length;
      return { course: c, lessons: ls, done, progress: ls.length ? done / ls.length : 0, started: done > 0 || access.enrolled.has(c.id) };
    });
  const active = mine.filter((m) => m.started);
  const continueWith = active.filter((m) => m.done < m.lessons.length).sort((a, b) => b.progress - a.progress)[0];
  const nextLesson = continueWith?.lessons.find((l) => !access.completed.has(l.id));
  const totalDone = access.completed.size;
  const minutesDone = (lessons ?? []).filter((l) => access.completed.has(l.id)).reduce((s, l) => s + (l.duration_min ?? 0), 0);
  const weekAgo = Date.now() - 7 * 864e5;
  const fresh = (lessons ?? [])
    .filter((l) => new Date(l.published_at).getTime() > weekAgo)
    .sort((a, b) => b.published_at.localeCompare(a.published_at));
  const courseById = new Map(catalog.courses.map((c) => [c.id, c]));
  const sub = access.subscription;
  const firstName = (profile?.full_name || user.email || '').split(/[\s@]/)[0];

  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '24px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="eyebrow">Saját tanulás</div>
            <h1 className="h2">Szia{firstName ? `, ${firstName}` : ''}! 👋</h1>
          </div>
          <form action="/auth/signout" method="post">
            <button className="btn light sm" type="submit">Kijelentkezés</button>
          </form>
        </div>
        <div className="grid" style={{ '--min': '180px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Elvégzett leckék</span><span className="value">{totalDone}</span></div>
          <div className="stat"><span className="label">Tanult percek</span><span className="value">{minutesDone}</span></div>
          <div className="stat"><span className="label">Aktív kurzusok</span><span className="value">{active.length}</span></div>
          <div className="stat">
            <span className="label">Előfizetés</span>
            <span className="value" style={{ fontSize: 22 }}>{access.subscribed ? 'Aktív' : 'Nincs'}</span>
            {access.subscribed && sub?.current_period_end && (
              <span className="muted" style={{ fontSize: 13 }}>
                {sub.cancel_at_period_end ? 'Lejár' : 'Megújul'}: {formatDate(sub.current_period_end)}
              </span>
            )}
          </div>
        </div>
        {continueWith && nextLesson && (
          <Link href={`/kurzusok/${continueWith.course.slug}/${nextLesson.id}`} className="row between" style={{ background: 'var(--ink)', color: '#fff', borderRadius: 20, padding: '18px 22px' }}>
            <span className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
              <span className="tag" style={{ color: 'var(--amber)' }}>Folytasd ott, ahol abbahagytad</span>
              <strong style={{ fontSize: 18 }}>{nextLesson.title}</strong>
              <span style={{ color: '#bdb7c3', fontSize: 14 }}>{continueWith.course.title} · {Math.round(continueWith.progress * 100)}%</span>
            </span>
            <span className="btn amber sm">Lejátszás ▶</span>
          </Link>
        )}
      </section>

      {fresh.length > 0 && (
        <section className="card stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <div className="row between">
            <h2 className="h3" style={{ fontSize: 26 }}>Ezen a héten érkezett</h2>
            <span className="pill new">{fresh.length} új</span>
          </div>
          <ul className="lesson-list">
            {fresh.map((l) => {
              const c = courseById.get(l.course_id);
              if (!c) return null;
              const open = courseAccessible(c, access, profile?.is_admin);
              return (
                <li key={l.id}>
                  <Link href={`/kurzusok/${c.slug}/${l.id}`} className={`lesson-item${open ? '' : ' locked'}`}>
                    <span className={`lesson-num${access.completed.has(l.id) ? ' done' : ''}`}>{access.completed.has(l.id) ? '✓' : '▶'}</span>
                    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                      <strong>{l.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{c.title}</span>
                    </span>
                    <span className="muted mono" style={{ fontSize: 12 }}>{open ? formatDate(l.published_at) : '🔒'}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        <h2 className="h3" style={{ fontSize: 26, padding: '0 8px' }}>Kurzusaim</h2>
        {mine.length === 0 ? (
          <div className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
            <p className="lead">Még nincs kurzusod. Kezdd egy ingyenessel, vagy nézz körül a tudástárban!</p>
            <Link href="/kurzusok" className="btn" style={{ alignSelf: 'flex-start' }}>Tudástár</Link>
          </div>
        ) : (
          <div className="grid" style={{ '--min': '280px' } as React.CSSProperties}>
            {[...mine].sort((a, b) => Number(b.started) - Number(a.started) || b.progress - a.progress).map((m) => (
              <CourseCard key={m.course.id} course={m.course} lessonCount={m.lessons.length} newCount={catalog.stats(m.course.id).fresh} progress={m.progress} hasAccess={courseAccessible(m.course, access, profile?.is_admin)} owned={access.enrolled.has(m.course.id)} />
            ))}
          </div>
        )}
      </section>

      {!access.subscribed && SUBSCRIPTION.enabled && (
        <section className="card dark row between">
          <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
            <div className="eyebrow">Tudástár előfizetés</div>
            <strong style={{ fontSize: 20 }}>Minden videó + heti {SUBSCRIPTION.weeklyNew} új anyag – {formatHuf(SUBSCRIPTION.priceHuf)}/hó</strong>
          </div>
          <Link href="/elofizetes" className="btn amber">Részletek</Link>
        </section>
      )}

      <section className="card stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        <div className="row between">
          <h2 className="h3">Fizetések és számlák</h2>
          {profile?.stripe_customer_id && (
            <form action="/api/billing-portal" method="post">
              <button className="btn light sm" type="submit">{access.subscribed ? 'Előfizetés kezelése / lemondás' : 'Számláim'}</button>
            </form>
          )}
        </div>
        {(purchases ?? []).filter((p) => p.source === 'stripe').length === 0 && !sub ? (
          <p className="muted" style={{ margin: 0 }}>Még nem volt fizetésed.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Dátum</th><th>Tétel</th><th style={{ textAlign: 'right' }}>Összeg</th></tr></thead>
              <tbody>
                {sub && (
                  <tr><td>—</td><td>Havi előfizetés ({sub.status})</td><td style={{ textAlign: 'right' }}>{formatHuf(SUBSCRIPTION.priceHuf)}/hó</td></tr>
                )}
                {(purchases ?? []).filter((p) => p.source === 'stripe').map((p, i) => {
                  const c = p.courses as unknown as { title: string; slug: string } | null;
                  return (
                    <tr key={i}>
                      <td>{formatDate(p.created_at)}</td>
                      <td>{c ? <Link href={`/kurzusok/${c.slug}`}>{c.title}</Link> : '—'}</td>
                      <td style={{ textAlign: 'right' }} className="mono">{formatHuf(p.amount_huf)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
