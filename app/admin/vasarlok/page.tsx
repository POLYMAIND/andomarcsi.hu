import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate, formatHuf, formatMoney } from '@/lib/format';
import { revokeAccess } from './actions';
import { loadPurchases, SOURCE_LABEL } from './data';

export const metadata: Metadata = { title: 'Vásárlók' };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function BuyersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const all = await loadPurchases(supabase);
  const q = (sp.q ?? '').trim().toLowerCase();
  const showBundled = sp.csomag === '1';
  const list = all.filter((p) =>
    (!sp.forras || p.source === sp.forras) &&
    (!sp.kurzus || p.slug === sp.kurzus) &&
    (showBundled || !p.fromBundle) &&
    (!q || p.email.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)),
  );
  const paid = all.filter((p) => p.source === 'stripe' && p.amount_huf > 0);
  const revenue = paid.reduce((s, p) => s + p.amount_huf, 0);
  const buyers = new Set(paid.map((p) => p.user_id)).size;
  const people = new Set(all.map((p) => p.user_id)).size;
  const courseOptions = Array.from(new Map(all.map((p) => [p.slug, p.course])).entries());
  const qs = new URLSearchParams(Object.entries({ q: sp.q, forras: sp.forras, kurzus: sp.kurzus, csomag: sp.csomag }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      {sp.megvonva && <div className="notice ok">A hozzáférést megvontuk. Ha pénzt is vissza kell adni, azt a Stripe-ban tudod (Payments → Refund).</div>}

      <section className="card stack" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="eyebrow">Admin</div>
            <h1 className="h2">Vásárlók</h1>
            <p className="muted" style={{ margin: 0 }}>Mindenki, aki kurzust vett, kézzel kapott hozzáférést, vagy ingyenes kurzusra iratkozott fel.</p>
          </div>
          <a className="btn" href={`/admin/vasarlok/export${qs ? `?${qs}` : ''}`}>CSV letöltése</a>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Bevétel (kurzusok)</span><span className="value">{formatMoney(revenue)}</span></div>
          <div className="stat"><span className="label">Fizetős vásárlás</span><span className="value">{paid.length}</span></div>
          <div className="stat"><span className="label">Fizető vevő</span><span className="value">{buyers}</span></div>
          <div className="stat"><span className="label">Összes tanuló</span><span className="value">{people}</span></div>
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <form className="row" method="get" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input className="input" name="q" defaultValue={sp.q ?? ''} placeholder="Keresés e-mailre vagy névre" style={{ maxWidth: 260 }} />
          <select className="select" name="kurzus" defaultValue={sp.kurzus ?? ''} style={{ maxWidth: 300 }}>
            <option value="">Minden kurzus</option>
            {courseOptions.map(([slug, title]) => <option key={slug} value={slug}>{title}</option>)}
          </select>
          <select className="select" name="forras" defaultValue={sp.forras ?? ''} style={{ maxWidth: 180 }}>
            <option value="">Minden forrás</option>
            <option value="stripe">Bankkártya</option>
            <option value="manual">Kézi</option>
            <option value="free">Ingyenes</option>
          </select>
          <label className="check" style={{ fontSize: 14 }}><input type="checkbox" name="csomag" value="1" defaultChecked={showBundled} /> csomagból kapott modulok is</label>
          <button className="btn sm" type="submit">Szűrés</button>
          {qs && <Link href="/admin/vasarlok" className="btn light sm">Törlés</Link>}
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Dátum</th><th>Vevő</th><th>Kurzus</th><th>Forrás</th><th>Összeg</th><th>Számla</th><th></th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{formatDate(p.created_at)}</td>
                  <td>
                    <a href={`mailto:${p.email}`}>{p.email}</a>
                    {p.name && <><br /><span className="muted" style={{ fontSize: 13 }}>{p.name}</span></>}
                  </td>
                  <td>
                    <Link href={`/kurzusok/${p.slug}`}>{p.course}</Link>
                    {p.fromBundle && <><br /><span className="muted" style={{ fontSize: 12 }}>a csomag része ({p.fromBundle})</span></>}
                  </td>
                  <td>{SOURCE_LABEL[p.source]}</td>
                  <td className="mono">{p.amount_huf ? formatHuf(p.amount_huf) : '—'}</td>
                  <td className="mono">{p.invoice ?? (p.source === 'stripe' && p.amount_huf > 0 ? <Link href="/admin/szamlak" className="muted">nincs →</Link> : '—')}</td>
                  <td style={{ textAlign: 'right' }}>
                    {!p.fromBundle && (
                      <form action={revokeAccess}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="qs" value={qs} />
                        <ConfirmButton className="btn light sm" message={`Megvonod ${p.email} hozzáférését ehhez: ${p.course}? (A pénzt ez nem téríti vissza – azt a Stripe-ban kell.)`}>Megvonás</ConfirmButton>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={7} className="muted">{all.length ? 'Nincs találat.' : 'Még nincs vásárlás.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
