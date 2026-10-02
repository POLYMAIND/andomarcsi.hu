import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin, type Profile } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { formatDate, formatHuf } from '@/lib/format';
import { isSubscriptionActive } from '@/lib/types';
import { manageSubscription } from './actions';

export const metadata: Metadata = { title: 'Előfizetők' };

type Sub = {
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'Aktív', cls: 'pill ok' },
  trialing: { label: 'Próbaidő', cls: 'pill ok' },
  past_due: { label: 'Fizetés elmaradt', cls: 'pill warn' },
  unpaid: { label: 'Nem fizetett', cls: 'pill warn' },
  incomplete: { label: 'Befejezetlen', cls: 'pill warn' },
  incomplete_expired: { label: 'Lejárt (befejezetlen)', cls: 'pill' },
  canceled: { label: 'Lemondva', cls: 'pill' },
  paused: { label: 'Szüneteltetve', cls: 'pill warn' },
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function SubscribersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: profiles }, { data: subs }, { data: enrollments }] = await Promise.all([
    supabase.from('profiles').select('*').order('created_at', { ascending: false }).returns<(Profile & { created_at: string })[]>(),
    supabase.from('subscriptions').select('*').returns<Sub[]>(),
    supabase.from('enrollments').select('user_id'),
  ]);

  const subByUser = new Map((subs ?? []).map((s) => [s.user_id, s]));
  const enrollCount = new Map<string, number>();
  for (const e of enrollments ?? []) enrollCount.set(e.user_id, (enrollCount.get(e.user_id) ?? 0) + 1);

  const filter = sp.szuro ?? 'elofizetok';
  const rows = (profiles ?? [])
    .map((p) => ({ p, s: subByUser.get(p.id) ?? null }))
    .filter(({ s }) => (filter === 'mind' ? true : filter === 'aktiv' ? isSubscriptionActive(s) : !!s))
    .sort((a, b) => Number(isSubscriptionActive(b.s)) - Number(isSubscriptionActive(a.s)));

  const active = (subs ?? []).filter((s) => isSubscriptionActive(s));
  const cancelling = active.filter((s) => s.cancel_at_period_end).length;
  const stripeBase = (process.env.STRIPE_SECRET_KEY ?? '').startsWith('sk_test')
    ? 'https://dashboard.stripe.com/test'
    : 'https://dashboard.stripe.com';

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}
      {sp.ok && <div className="notice ok">{sp.ok}</div>}

      <section className="card stack" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Admin</div>
          <h1 className="h2">Előfizetők</h1>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Aktív előfizető</span><span className="value">{active.length}</span></div>
          <div className="stat"><span className="label">Havi bevétel</span><span className="value">{formatHuf(active.length * SUBSCRIPTION.priceHuf)}</span></div>
          <div className="stat"><span className="label">Lemondás alatt</span><span className="value">{cancelling}</span><span className="muted" style={{ fontSize: 13 }}>időszak végén megszűnik</span></div>
          <div className="stat"><span className="label">Összes felhasználó</span><span className="value">{profiles?.length ?? 0}</span></div>
        </div>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          {[['elofizetok', 'Előfizetők (volt is)'], ['aktiv', 'Csak aktív'], ['mind', 'Minden felhasználó']].map(([k, label]) => (
            <Link key={k} href={`/admin/elofizetok?szuro=${k}`} className={filter === k ? 'btn sm' : 'btn light sm'}>{label}</Link>
          ))}
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        {rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Nincs találat.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Felhasználó</th><th>Előfizetés</th><th>Időszak vége</th><th>Kurzusok</th><th style={{ textAlign: 'right' }}>Kezelés</th></tr>
              </thead>
              <tbody>
                {rows.map(({ p, s }) => {
                  const st = s ? STATUS[s.status] ?? { label: s.status, cls: 'pill' } : null;
                  const live = isSubscriptionActive(s);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                          <strong>{p.full_name || '—'}</strong>
                          <span className="muted" style={{ fontSize: 13 }}>{p.email}</span>
                          {p.is_admin && <span className="pill" style={{ alignSelf: 'flex-start', fontSize: 11 }}>admin</span>}
                        </div>
                      </td>
                      <td>
                        {s ? (
                          <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
                            <span className={st!.cls} style={{ alignSelf: 'flex-start' }}>{st!.label}</span>
                            {live && s.cancel_at_period_end && <span className="pill warn" style={{ alignSelf: 'flex-start', fontSize: 11 }}>Lemondva – időszak végén megszűnik</span>}
                          </div>
                        ) : (
                          <span className="muted">Nincs</span>
                        )}
                      </td>
                      <td>{s?.current_period_end ? formatDate(s.current_period_end) : '—'}</td>
                      <td>{enrollCount.get(p.id) ?? 0}</td>
                      <td>
                        <div className="row" style={{ '--gap': '6px', justifyContent: 'flex-end' } as React.CSSProperties}>
                          {s && live && !s.cancel_at_period_end && (
                            <form action={manageSubscription}>
                              <input type="hidden" name="user_id" value={p.id} />
                              <input type="hidden" name="action" value="cancel_end" />
                              <ConfirmButton className="btn light sm" message={`Lemondod ${p.email} előfizetését a fizetett időszak végén?`}>Lemondás időszak végén</ConfirmButton>
                            </form>
                          )}
                          {s && live && s.cancel_at_period_end && (
                            <form action={manageSubscription}>
                              <input type="hidden" name="user_id" value={p.id} />
                              <input type="hidden" name="action" value="resume" />
                              <button className="btn light sm" type="submit">Lemondás visszavonása</button>
                            </form>
                          )}
                          {s && s.status !== 'canceled' && (
                            <form action={manageSubscription}>
                              <input type="hidden" name="user_id" value={p.id} />
                              <input type="hidden" name="action" value="cancel_now" />
                              <ConfirmButton className="btn light sm" message={`Azonnal megszünteted ${p.email} előfizetését? A hozzáférése rögtön megszűnik, visszatérítés nem történik automatikusan.`}>
                                Azonnali lemondás
                              </ConfirmButton>
                            </form>
                          )}
                          {s?.stripe_customer_id && (
                            <a className="btn light sm" href={`${stripeBase}/customers/${s.stripe_customer_id}`} target="_blank" rel="noreferrer">Stripe ↗</a>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Visszatérítést és számlákat a Stripe felületén tudsz kezelni („Stripe ↗” gomb). A lemondás a Stripe-ban is azonnal érvényesül.
        </p>
      </section>
    </div>
  );
}
