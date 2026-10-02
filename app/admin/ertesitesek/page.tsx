import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deleteSignup, markNotified } from './actions';

export const metadata: Metadata = { title: 'Értesítési lista' };

type Row = { id: string; course_id: string; email: string; name: string | null; created_at: string; notified_at: string | null; source: string };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function WaitlistPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: rows }, { data: courses }] = await Promise.all([
    supabase.from('course_waitlist').select('id, course_id, email, name, created_at, notified_at, source').order('created_at', { ascending: false }).returns<Row[]>(),
    supabase.from('courses').select('id, title').order('sort_order'),
  ]);
  const all = rows ?? [];
  const titleOf = new Map((courses ?? []).map((c) => [c.id, c.title as string]));
  const perCourse = new Map<string, { total: number; pending: number }>();
  for (const r of all) {
    const e = perCourse.get(r.course_id) ?? { total: 0, pending: 0 };
    e.total++;
    if (!r.notified_at) e.pending++;
    perCourse.set(r.course_id, e);
  }
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = all.filter((r) => (!sp.kurzus || r.course_id === sp.kurzus) && (!q || r.email.includes(q) || (r.name ?? '').toLowerCase().includes(q)));
  const uniqueEmails = new Set(all.map((r) => r.email)).size;
  const qs = new URLSearchParams(Object.entries({ kurzus: sp.kurzus, q: sp.q }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      {sp.ok && <div className="notice ok">Megjelölve értesítettként.</div>}

      <section className="card stack" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="eyebrow">Admin</div>
            <h1 className="h2">Értesítési lista</h1>
            <p className="muted" style={{ margin: 0 }}>Akik „Értesítést kérek” gombbal feliratkoztak egy hamarosan induló kurzusra.</p>
          </div>
          <a className="btn" href={`/admin/ertesitesek/export${sp.kurzus ? `?kurzus=${sp.kurzus}` : ''}`}>CSV letöltése</a>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Feliratkozás</span><span className="value">{all.length}</span></div>
          <div className="stat"><span className="label">Egyedi e-mail</span><span className="value">{uniqueEmails}</span></div>
          <div className="stat"><span className="label">Még nem értesítve</span><span className="value">{all.filter((r) => !r.notified_at).length}</span></div>
          <div className="stat"><span className="label">PolyOS webhook</span><span className="value" style={{ fontSize: 20 }}>{process.env.POLYOS_WEBHOOK_URL ? 'Bekötve' : 'Nincs beállítva'}</span></div>
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <h2 className="h3">Kurzusonként</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Kurzus</th><th>Feliratkozó</th><th>Még nem értesítve</th><th style={{ textAlign: 'right' }}></th></tr></thead>
            <tbody>
              {[...perCourse.entries()].sort((a, b) => b[1].total - a[1].total).map(([cid, n]) => (
                <tr key={cid}>
                  <td><Link href={`/admin/ertesitesek?kurzus=${cid}`}><strong>{titleOf.get(cid) ?? '—'}</strong></Link></td>
                  <td>{n.total}</td>
                  <td>{n.pending}</td>
                  <td>
                    <div className="row" style={{ '--gap': '6px', justifyContent: 'flex-end' } as React.CSSProperties}>
                      <a className="btn light sm" href={`/admin/ertesitesek/export?kurzus=${cid}`}>CSV</a>
                      {n.pending > 0 && (
                        <form action={markNotified}>
                          <input type="hidden" name="course_id" value={cid} />
                          <ConfirmButton className="btn light sm" message={`Mind a ${n.pending} feliratkozót értesítettnek jelölöd ennél a kurzusnál?`}>Értesítve jelölés</ConfirmButton>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {perCourse.size === 0 && <tr><td colSpan={4} className="muted">Még nincs feliratkozó.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <form className="row" method="get" style={{ '--gap': '8px' } as React.CSSProperties}>
          <select className="select" name="kurzus" defaultValue={sp.kurzus ?? ''} style={{ maxWidth: 320 }}>
            <option value="">Minden kurzus</option>
            {(courses ?? []).filter((c) => perCourse.has(c.id)).map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <input className="input" name="q" defaultValue={sp.q ?? ''} placeholder="Keresés e-mailre vagy névre" style={{ maxWidth: 280 }} />
          <button className="btn sm" type="submit">Szűrés</button>
          {(sp.kurzus || sp.q) && <Link href="/admin/ertesitesek" className="btn light sm">Törlés</Link>}
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Feliratkozott</th><th>E-mail</th><th>Név</th><th>Kurzus</th><th>Állapot</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.created_at)}</td>
                  <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                  <td>{r.name ?? '—'}</td>
                  <td>{titleOf.get(r.course_id) ?? '—'}</td>
                  <td>{r.notified_at ? <span className="pill ok">Értesítve · {formatDate(r.notified_at)}</span> : <span className="pill warn">Vár</span>}</td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={deleteSignup}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="qs" value={qs} />
                      <ConfirmButton className="btn light sm" message={`Törlöd ${r.email} feliratkozását? (pl. leiratkozási kérésre)`}>Törlés</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="muted">Nincs találat.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
