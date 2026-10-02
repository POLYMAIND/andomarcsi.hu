import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deleteSubscriber } from './actions';

export const metadata: Metadata = { title: 'Hírlevél-feliratkozók' };

type Row = { id: string; email: string; name: string | null; created_at: string; source: string };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function NewsletterAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('newsletter_subscribers').select('id, email, name, created_at, source').order('created_at', { ascending: false }).returns<Row[]>();
  const all = data ?? [];
  const q = (sp.q ?? '').trim().toLowerCase();
  const list = all.filter((r) => !q || r.email.includes(q) || (r.name ?? '').toLowerCase().includes(q));
  const monthAgo = Date.now() - 30 * 24 * 3600 * 1000;
  const lastMonth = all.filter((r) => new Date(r.created_at).getTime() > monthAgo).length;
  const qs = sp.q ? new URLSearchParams({ q: sp.q }).toString() : '';

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>

      <section className="card stack" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="eyebrow">Admin</div>
            <h1 className="h2">Hírlevél</h1>
            <p className="muted" style={{ margin: 0 }}>Akik a láblécben vagy az „Ingyenes tippek” gombbal feliratkoztak a hírlevélre.</p>
          </div>
          <a className="btn" href="/admin/hirlevel/export">CSV letöltése</a>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Feliratkozó</span><span className="value">{all.length}</span></div>
          <div className="stat"><span className="label">Elmúlt 30 nap</span><span className="value">{lastMonth}</span></div>
          <div className="stat"><span className="label">PolyOS webhook</span><span className="value" style={{ fontSize: 20 }}>{process.env.POLYOS_WEBHOOK_URL ? 'Bekötve' : 'Nincs beállítva'}</span></div>
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <form className="row" method="get" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input className="input" name="q" defaultValue={sp.q ?? ''} placeholder="Keresés e-mailre vagy névre" style={{ maxWidth: 280 }} />
          <button className="btn sm" type="submit">Szűrés</button>
          {sp.q && <Link href="/admin/hirlevel" className="btn light sm">Törlés</Link>}
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Feliratkozott</th><th>E-mail</th><th>Név</th><th>Forrás</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.created_at)}</td>
                  <td><a href={`mailto:${r.email}`}>{r.email}</a></td>
                  <td>{r.name ?? '—'}</td>
                  <td>{r.source}</td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={deleteSubscriber}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="qs" value={qs} />
                      <ConfirmButton className="btn light sm" message={`Törlöd ${r.email} feliratkozását? (pl. leiratkozási kérésre)`}>Törlés</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="muted">{all.length ? 'Nincs találat.' : 'Még nincs feliratkozó.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
