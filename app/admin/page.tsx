import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { formatDate, formatHuf, toolColor } from '@/lib/format';
import { courseStatus, type Course, type Lesson } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin' };

const DAY = 864e5;

// Hétfőtől számolt hét kezdete (egyszerűsítve, UTC alapon).
function weekStart(offsetWeeks = 0) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + offsetWeeks * 7);
  return d;
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const [{ data: courses }, { data: lessons }, { data: videos }, { data: enrollments }, { data: subs }, { count: userCount }] = await Promise.all([
    supabase.from('courses').select('*').order('sort_order').returns<Course[]>(),
    supabase.from('lessons').select('id, course_id, title, published_at').order('published_at', { ascending: false }).returns<Lesson[]>(),
    supabase.from('lesson_videos').select('lesson_id'),
    supabase.from('enrollments').select('created_at, amount_huf, source, course_id, profiles(email)').order('created_at', { ascending: false }),
    supabase.from('subscriptions').select('status, current_period_end, cancel_at_period_end'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const now = Date.now();
  const paid = (enrollments ?? []).filter((e) => e.source === 'stripe');
  const revenue = paid.reduce((s, e) => s + e.amount_huf, 0);
  const revenue30 = paid.filter((e) => now - new Date(e.created_at).getTime() < 30 * DAY).reduce((s, e) => s + e.amount_huf, 0);
  const activeSubs = (subs ?? []).filter((s) => ['active', 'trialing'].includes(s.status)).length;
  const withVideo = new Set((videos ?? []).map((v) => v.lesson_id));
  const allLessons = lessons ?? [];
  const live = allLessons.filter((l) => new Date(l.published_at).getTime() <= now);
  const scheduled = allLessons.filter((l) => new Date(l.published_at).getTime() > now).reverse();
  const missingVideo = allLessons.filter((l) => !withVideo.has(l.id)).length;
  const courseById = new Map((courses ?? []).map((c) => [c.id, c]));

  // Heti ritmus: hány anyag jelent/jelenik meg az elmúlt 4 és a következő 2 héten.
  const weeks = [-3, -2, -1, 0, 1, 2].map((o) => {
    const from = weekStart(o).getTime();
    const to = from + 7 * DAY;
    const n = allLessons.filter((l) => {
      const t = new Date(l.published_at).getTime();
      return t >= from && t < to;
    }).length;
    return { label: o === 0 ? 'E hét' : o < 0 ? `${-o} hete` : `+${o} hét`, n, current: o === 0, future: o > 0 };
  });
  const maxN = Math.max(SUBSCRIPTION.weeklyNew, ...weeks.map((w) => w.n));

  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '24px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="eyebrow">Admin</div>
            <h1 className="h2">Áttekintés</h1>
          </div>
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            <Link href="/admin/elofizetok" className="btn light">Előfizetők</Link>
            <Link href="/admin/kurzusok/uj" className="btn">+ Új kurzus</Link>
          </div>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Havi előfizetői bevétel</span><span className="value">{formatHuf(activeSubs * SUBSCRIPTION.priceHuf)}</span><Link href="/admin/elofizetok" className="muted" style={{ fontSize: 13, textDecoration: 'underline' }}>{activeSubs} aktív előfizető →</Link></div>
          <div className="stat"><span className="label">Kurzuseladás · 30 nap</span><span className="value">{formatHuf(revenue30)}</span><span className="muted" style={{ fontSize: 13 }}>Összesen: {formatHuf(revenue)}</span></div>
          <div className="stat"><span className="label">Felhasználók</span><span className="value">{userCount ?? 0}</span></div>
          <div className="stat"><span className="label">Élő leckék</span><span className="value">{live.length}</span><span className="muted" style={{ fontSize: 13 }}>{scheduled.length} ütemezve · {missingVideo} videó nélkül</span></div>
        </div>
      </section>

      <div className="layout-sidebar">
        <section className="card stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <h2 className="h3">Kurzusok</h2>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Kurzus</th><th>Leckék</th><th>Ár</th><th>Állapot</th></tr></thead>
              <tbody>
                {(courses ?? []).map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link href={`/admin/kurzusok/${c.id}`} className="row" style={{ '--gap': '10px', flexWrap: 'nowrap' } as React.CSSProperties}>
                        <span style={{ width: 12, height: 12, borderRadius: 4, background: toolColor(c.tool), flex: 'none' }} />
                        <strong>{c.title}</strong>
                      </Link>
                    </td>
                    <td>{allLessons.filter((l) => l.course_id === c.id).length}</td>
                    <td className="mono">{formatHuf(c.price_huf)}</td>
                    <td>{{ live: <span className="pill ok">Elérhető</span>, soon: <span className="pill new">Hamarosan</span>, draft: <span className="pill warn">Vázlat</span> }[courseStatus(c)]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
            <h2 className="h3">Heti ritmus</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Cél: heti {SUBSCRIPTION.weeklyNew} új anyag.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, alignItems: 'end', height: 120 }} role="img" aria-label="Megjelent és ütemezett leckék hetente">
              {weeks.map((w) => (
                <div key={w.label} className="stack" style={{ '--gap': '6px', alignItems: 'center', height: '100%', justifyContent: 'flex-end' } as React.CSSProperties}>
                  <span className="mono" style={{ fontSize: 12 }}>{w.n}</span>
                  <div
                    title={`${w.label}: ${w.n}`}
                    style={{
                      width: '100%',
                      height: `${Math.max(4, (w.n / maxN) * 70)}px`,
                      borderRadius: 6,
                      background: w.future ? 'transparent' : w.n >= SUBSCRIPTION.weeklyNew ? 'var(--purple)' : 'var(--amber)',
                      border: w.future ? '2px dashed var(--purple)' : 'none',
                    }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
              {weeks.map((w) => (
                <span key={w.label} className="mono muted" style={{ fontSize: 10, textAlign: 'center', fontWeight: w.current ? 500 : 400 }}>{w.label}</span>
              ))}
            </div>
          </section>

          <section className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
            <h2 className="h3">Ütemezett anyagok</h2>
            {scheduled.length === 0 && <p className="muted" style={{ margin: 0 }}>Nincs előre ütemezett lecke.</p>}
            <ul className="lesson-list">
              {scheduled.slice(0, 8).map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/kurzusok/${l.course_id}#leckek`} className="lesson-item" style={{ gridTemplateColumns: '1fr auto' }}>
                    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                      <strong style={{ fontSize: 14 }}>{l.title}</strong>
                      <span className="muted" style={{ fontSize: 12 }}>{courseById.get(l.course_id)?.title}</span>
                    </span>
                    <span className="mono" style={{ fontSize: 12 }}>{formatDate(l.published_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      <section className="card stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        <h2 className="h3">Legutóbbi beiratkozások</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Dátum</th><th>Felhasználó</th><th>Kurzus</th><th>Forrás</th><th style={{ textAlign: 'right' }}>Összeg</th></tr></thead>
            <tbody>
              {(enrollments ?? []).slice(0, 20).map((e, i) => (
                <tr key={i}>
                  <td>{formatDate(e.created_at)}</td>
                  <td>{(e.profiles as unknown as { email: string } | null)?.email ?? '—'}</td>
                  <td>{courseById.get(e.course_id)?.title ?? '—'}</td>
                  <td>{{ stripe: 'Stripe', free: 'Ingyenes', manual: 'Kézi' }[e.source as string] ?? e.source}</td>
                  <td style={{ textAlign: 'right' }} className="mono">{formatHuf(e.amount_huf)}</td>
                </tr>
              ))}
              {(enrollments ?? []).length === 0 && <tr><td colSpan={5} className="muted">Még nincs beiratkozás.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
