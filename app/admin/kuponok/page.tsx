import type { Metadata } from 'next';
import Link from 'next/link';
import type Stripe from 'stripe';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { formatDate, formatHuf } from '@/lib/format';
import { stripe } from '@/lib/stripe';
import { createCoupon, toggleCode } from './actions';

export const metadata: Metadata = { title: 'Kuponkódok' };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

function discountLabel(c: Stripe.Coupon | null) {
  if (!c) return '—';
  if (c.percent_off) return `${c.percent_off}%`;
  if (c.amount_off) return `${formatHuf(c.amount_off / 100)}`;
  return '—';
}

export default async function CouponsPage({ searchParams }: Props) {
  const sp = await searchParams;
  await requireAdmin();
  let codes: Stripe.PromotionCode[] = [];
  let loadError: string | null = null;
  try {
    codes = (await stripe().promotionCodes.list({ limit: 100, expand: ['data.promotion.coupon'] })).data;
  } catch (e) {
    loadError = (e as Error).message;
  }
  const now = Date.now() / 1000;
  const status = (p: Stripe.PromotionCode) => {
    const c = typeof p.promotion.coupon === 'object' ? p.promotion.coupon : null;
    if (!p.active) return { cls: '', text: 'Kikapcsolva' };
    if (p.expires_at && p.expires_at < now) return { cls: '', text: 'Lejárt' };
    if (p.max_redemptions && p.times_redeemed >= p.max_redemptions) return { cls: '', text: 'Elfogyott' };
    if (c && !c.valid) return { cls: '', text: 'Érvénytelen' };
    return { cls: 'ok', text: 'Aktív' };
  };

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      {sp.ok && <div className="notice ok">Kész: a <strong>{sp.ok}</strong> kód már beváltható a fizetési oldalon.</div>}
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}

      <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Admin</div>
          <h1 className="h2">Kuponkódok</h1>
          <p className="muted" style={{ margin: 0 }}>
            A vásárló a fizetési oldalon („Add promotion code”) írja be a kódot. A kód minden kurzusra érvényes. A kódok a Stripe-ban jönnek létre, ott is látod őket.
          </p>
        </div>
        <form action={createCoupon} className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
          <div className="grid" style={{ '--min': '200px', '--gap': '14px' } as React.CSSProperties}>
            <label className="field">Kód<input className="input" name="code" required placeholder="pl. CANVA20" pattern="[A-Za-z0-9_\-]{3,40}" style={{ textTransform: 'uppercase' }} /></label>
            <label className="field">
              Kedvezmény típusa
              <select className="select" name="type" defaultValue="percent">
                <option value="percent">Százalék (%)</option>
                <option value="amount">Fix összeg (Ft)</option>
              </select>
            </label>
            <label className="field">Mérték<input className="input" name="value" type="number" min={1} step="any" required placeholder="pl. 20 vagy 3000" /></label>
            <label className="field">Lejárat (nem kötelező)<input className="input" name="expires" type="date" /></label>
            <label className="field">Max. felhasználás (nem kötelező)<input className="input" name="max_redemptions" type="number" min={1} placeholder="korlátlan" /></label>
            {SUBSCRIPTION.enabled && (
              <label className="field">
                Előfizetésnél
                <select className="select" name="duration" defaultValue="once">
                  <option value="once">Csak az első hónapra</option>
                  <option value="forever">Minden hónapra</option>
                </select>
              </label>
            )}
          </div>
          <label className="check"><input type="checkbox" name="first_time" /> Csak első vásárlásnál használható</label>
          <div><button className="btn" type="submit">Kód létrehozása</button></div>
        </form>
      </section>

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <h2 className="h3">Kódok</h2>
        {loadError && <div className="notice err">Nem sikerült betölteni a Stripe-ból: {loadError}</div>}
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Kód</th><th>Kedvezmény</th><th>Beváltva</th><th>Lejárat</th><th>Állapot</th><th></th></tr></thead>
            <tbody>
              {codes.map((p) => {
                const c = typeof p.promotion.coupon === 'object' ? p.promotion.coupon : null;
                const st = status(p);
                return (
                  <tr key={p.id}>
                    <td><strong className="mono">{p.code}</strong>{p.restrictions.first_time_transaction && <><br /><span className="muted" style={{ fontSize: 12 }}>csak első vásárlás</span></>}</td>
                    <td>{discountLabel(c)}{c?.duration === 'forever' ? ' · minden hónap' : ''}</td>
                    <td>{p.times_redeemed}{p.max_redemptions ? ` / ${p.max_redemptions}` : ''}</td>
                    <td>{p.expires_at ? formatDate(new Date(p.expires_at * 1000).toISOString()) : '—'}</td>
                    <td><span className={`pill ${st.cls}`}>{st.text}</span></td>
                    <td style={{ textAlign: 'right' }}>
                      <form action={toggleCode}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="active" value={p.active ? 'false' : 'true'} />
                        {p.active
                          ? <ConfirmButton className="btn light sm" message={`Kikapcsolod a ${p.code} kódot? Utána nem lehet beváltani.`}>Kikapcsolás</ConfirmButton>
                          : <button className="btn light sm" type="submit">Bekapcsolás</button>}
                      </form>
                    </td>
                  </tr>
                );
              })}
              {!loadError && codes.length === 0 && <tr><td colSpan={6} className="muted">Még nincs kuponkód.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
