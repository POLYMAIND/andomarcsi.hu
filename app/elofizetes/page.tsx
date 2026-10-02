import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { getCatalog, getUserAccess } from '@/lib/data';
import { formatHuf } from '@/lib/format';
import { soonLabel } from '@/lib/types';

export const metadata: Metadata = { title: 'Előfizetés' };

export default async function SubscriptionPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const paidCourses = catalog.courses.filter((c) => (c.price_huf ?? 0) > 0);

  return (
    <div className="page">
      <SiteNav />
      {sp.megszakitva && <div className="notice">A fizetés megszakadt – semmit nem terheltünk.</div>}
      <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="eyebrow">Tudástár előfizetés</div>
        <h1 className="h1">Minden videó, egy havidíjért.</h1>
        <p className="lead">
          Jelenleg {catalog.totalLessons} videólecke, és hetente {SUBSCRIPTION.weeklyNew} új anyag érkezik. Bármikor lemondhatod, a hónap végéig minden
          elérhető marad.
        </p>
      </section>

      {!SUBSCRIPTION.enabled ? (
        <section className="card"><p className="lead">Az előfizetés hamarosan indul. Addig a kurzusokat egyesével tudod megvásárolni.</p></section>
      ) : (
        <section className="grid" style={{ '--min': '320px', '--gap': '20px' } as React.CSSProperties}>
          <div className="plan featured">
            <span className="pill new" style={{ alignSelf: 'flex-start' }}>Ajánlott</span>
            <h2 className="h3">Havi előfizetés</h2>
            <div>
              <span className="amount">{formatHuf(SUBSCRIPTION.priceHuf)}</span>
              <span className="muted"> / hó</span>
            </div>
            <ul>
              <li>Hozzáférés az összes videóleckéhez</li>
              <li>Hetente {SUBSCRIPTION.weeklyNew} új anyag</li>
              <li>Haladáskövetés a saját dashboardodon</li>
              <li>Bármikor lemondható, nincs hűségidő</li>
            </ul>
            {access.subscribed ? (
              <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
                <div className="notice ok">Már előfizető vagy – köszönöm! 💜</div>
                <Link href="/dashboard" className="btn block">Irány a tanulás</Link>
              </div>
            ) : (
              <form action="/api/checkout" method="post">
                <input type="hidden" name="plan" value="subscription" />
                <button className="btn purple block" type="submit">{user ? 'Előfizetek bankkártyával' : 'Belépek és előfizetek'}</button>
              </form>
            )}
            <span className="muted" style={{ fontSize: 12 }}>Biztonságos, ismétlődő fizetés a Stripe-on keresztül. Számlát e-mailben kapsz.</span>
          </div>

          <div className="plan">
            <h2 className="h3">Egyedi kurzusok</h2>
            <p className="muted" style={{ margin: 0 }}>Ha csak egy témára van szükséged: egyszeri díj, örökös hozzáférés.</p>
            <ul>
              {paidCourses.map((c) => (
                <li key={c.id}>
                  <Link href={`/kurzusok/${c.slug}`}>{c.title}</Link> – <span className="mono">{formatHuf(c.price_huf)}{c.coming_soon ? ` (${soonLabel(c).toLowerCase()})` : ''}</span>
                </li>
              ))}
              <li>Ingyenes kurzusok mindenkinek</li>
            </ul>
            <Link href="/kurzusok" className="btn light block">Kurzusok böngészése</Link>
          </div>
        </section>
      )}
      <SiteFooter />
    </div>
  );
}
