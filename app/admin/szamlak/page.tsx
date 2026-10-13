import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { billingoConfigured } from '@/lib/billingo';
import { formatDate, formatHuf } from '@/lib/format';
import { retryInvoice } from './actions';

export const metadata: Metadata = { title: 'Számlák' };

type Row = {
  id: string; kind: string; email: string | null; amount_huf: number; description: string; status: 'pending' | 'issued' | 'failed';
  invoice_number: string | null; error: string | null; created_at: string; updated_at: string;
};
type Props = { searchParams: Promise<Record<string, string | undefined>> };

const STATUS = { issued: { cls: 'ok', text: 'Kiállítva' }, pending: { cls: 'warn', text: 'Folyamatban' }, failed: { cls: 'err', text: 'Hiba' } };

export default async function InvoicesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false }).limit(200).returns<Row[]>();
  const rows = data ?? [];
  const stuck = (r: Row) => r.status === 'pending' && Date.now() - new Date(r.updated_at).getTime() > 10 * 60 * 1000;

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}
      <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Admin</div>
          <h1 className="h2">Számlák</h1>
          <p className="muted" style={{ margin: 0 }}>
            Minden sikeres fizetés után a Billingo automatikusan kiállítja a számlát (alanyi adómentes, bankkártyás, fizetve) és e-mailben elküldi a vevőnek.
            A számlák a Billingóban is megvannak.
          </p>
          {!billingoConfigured() && (
            <div className="notice">A Billingo még nincs bekötve: a Vercelen állítsd be a <code>BILLINGO_API_KEY</code> változót (v3 API-kulcs), majd telepítsd újra.</div>
          )}
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Dátum</th><th>Vevő</th><th>Tétel</th><th>Összeg</th><th>Számlaszám</th><th>Állapot</th><th></th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{formatDate(r.created_at)}</td>
                  <td>{r.email ?? '—'}</td>
                  <td>{r.description}</td>
                  <td className="mono">{formatHuf(r.amount_huf)}</td>
                  <td className="mono">{r.invoice_number ?? '—'}</td>
                  <td>
                    <span className={`pill ${STATUS[r.status].cls}`}>{STATUS[r.status].text}</span>
                    {r.error && <><br /><span className="muted" style={{ fontSize: 12 }}>{r.error.slice(0, 200)}</span></>}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {(r.status === 'failed' || stuck(r)) && (
                      <form action={retryInvoice}>
                        <input type="hidden" name="id" value={r.id} />
                        <button className="btn light sm" type="submit">Újrapróbálás</button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="muted">Még nincs számla.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
