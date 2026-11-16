import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCard } from '@/components/CourseCard';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatDate, formatHuf } from '@/lib/format';
import { ACADEMY, byPackageOrder } from '@/lib/polyakademia';
import { soonLabel, type Course } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Tudástár – Canva, Claude és AI videókurzusok',
  description: 'Az összes kurzus egy helyen: Canva Kalauz, Claude- és AI-kurzusok, ingyenes anyagok és zsebcsomagok. Előre felvett videók, saját tempóban, magyarul.',
  alternates: { canonical: '/kurzusok' },
  openGraph: { title: 'Tudástár – Canva, Claude és AI videókurzusok', url: '/kurzusok', images: ['/opengraph-image.png'] },
};

export default async function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase, user, profile } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const titleOf = new Map(catalog.courses.map((c) => [c.id, c]));
  const canUse = (c: Course) => !!user && courseAccessible(c, access, profile?.is_admin);
  // Elöl, ami most is elérhető: a kurzusok, az ingyenes anyagok és a zsebcsomagok; utána, ami még készül.
  // (A zsebcsomagok a szülő tanfolyamuk után, csomagsorrendben.)
  const parentOrder = new Map(catalog.courses.map((c, i) => [c.id, i]));
  const livePockets = catalog.pockets
    .filter((p) => !p.coming_soon && p.pocket_for && parentOrder.has(p.pocket_for))
    .sort((a, b) => parentOrder.get(a.pocket_for!)! - parentOrder.get(b.pocket_for!)! || byPackageOrder(a, b));
  const available = [...catalog.courses.filter((c) => !c.coming_soon), ...livePockets];
  const upcoming = catalog.courses.filter((c) => c.coming_soon);
  // „Legújabb anyagok”: csak elérhető kurzus leckéi (a zárolt, még nem induló kurzusoké nem).
  const latest = catalog.latest.filter((l) => titleOf.get(l.course_id) && !titleOf.get(l.course_id)!.coming_soon);

  return (
    <div className="page">
      <SiteNav />
      {sp.hiba === 'nyilatkozat' && <div className="notice err">A vásárláshoz el kell fogadnod az ÁSZF-et és a nyilatkozatot.</div>}
      <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="eyebrow">Videós tudástár</div>
        <h1 className="h1">Tanulj a saját tempódban.</h1>
        <p className="lead">
          {catalog.totalLessons} videólecke {catalog.courses.length} témában – Canva, Claude, AI-eszközök, hirdetés és PolyOS, kezdőknek.
          {SUBSCRIPTION.enabled && ` Hetente ${SUBSCRIPTION.weeklyNew} új anyag.`}
        </p>
        {SUBSCRIPTION.enabled && !access.subscribed && (
          <div className="row">
            <Link href="/elofizetes" className="btn purple">Mindenhez hozzáférek – {formatHuf(SUBSCRIPTION.priceHuf)}/hó</Link>
            <span className="muted" style={{ fontSize: 14 }}>vagy vásárolj egyesével kurzust</span>
          </div>
        )}
        {access.subscribed && <div className="notice ok">Aktív előfizetésed van – minden tartalomhoz hozzáférsz. 🎉</div>}
      </section>

      <section className="card dark ps-hero row between" style={{ '--gap': '16px', padding: 'clamp(22px, 3vw, 36px)' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '8px', maxWidth: 640 } as React.CSSProperties}>
          <span className="ps-badge" style={{ alignSelf: 'flex-start' }}>{ACADEMY.badge}</span>
          <h2 className="h3" style={{ fontSize: 26 }}>PolySuli – kész skillek vállalkozóknak</h2>
          <p style={{ margin: 0, color: '#cfcad4', fontSize: 16, lineHeight: 1.5 }}>Kész Claude-skillek, amik a te márkádban, a te hangodon dolgoznak – 990 Ft-os zsebcsomagtól a mentorprogramig.</p>
        </div>
        <Link href={ACADEMY.path} className="btn ps-lime">Irány a PolySuli →</Link>
      </section>

      {latest.length > 0 && (
        <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
          <div className="row between">
            <h2 className="h3" style={{ fontSize: 26 }}>Legújabb anyagok</h2>
            {SUBSCRIPTION.enabled && <span className="pill new">Heti {SUBSCRIPTION.weeklyNew} új</span>}
          </div>
          <ul className="lesson-list">
            {latest.map((l) => {
              const c = titleOf.get(l.course_id);
              if (!c) return null;
              return (
                <li key={l.id}>
                  <Link href={`/kurzusok/${c.slug}/${l.id}`} className="lesson-item">
                    <span className="lesson-num">{c.coming_soon ? '🔒' : '▶'}</span>
                    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                      <strong>{l.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{c.title}</span>
                    </span>
                    {c.coming_soon
                      ? <span className="pill new">{soonLabel(c)}</span>
                      : <span className="muted mono" style={{ fontSize: 12 }}>{formatDate(l.published_at)}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {available.length > 0 && (
        <section id="elerheto" className="stack" style={{ '--gap': '16px', scrollMarginTop: 24 } as React.CSSProperties}>
          <div className="row between" style={{ padding: '0 8px', alignItems: 'flex-end' } as React.CSSProperties}>
            <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
              <div className="eyebrow">Most elérhető · {available.length}</div>
              <h2 className="h2" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>Ezekkel már ma kezdhetsz.</h2>
            </div>
            {livePockets.length > 0 && <Link href={`${ACADEMY.path}/zsebcsomagok`} className="btn light sm">Minden zsebcsomag →</Link>}
          </div>
          <div className="grid" style={{ '--min': '300px' } as React.CSSProperties}>
            {available.map((c) => {
              const s = catalog.stats(c.id);
              return <CourseCard key={c.id} course={c} lessonCount={s.count} newCount={s.fresh} hasAccess={canUse(c)} />;
            })}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section id="hamarosan" className="stack" style={{ '--gap': '16px', scrollMarginTop: 24 } as React.CSSProperties}>
          <div className="stack" style={{ '--gap': '6px', padding: '0 8px' } as React.CSSProperties}>
            <div className="eyebrow">Hamarosan · {upcoming.length}</div>
            <h2 className="h2" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>Készülnek.</h2>
            <p className="muted" style={{ margin: 0 }}>Nyisd meg bármelyiket, és kérj értesítést – szólok, amint indul.</p>
          </div>
          <div className="grid" style={{ '--min': '300px' } as React.CSSProperties}>
            {upcoming.map((c) => {
              const s = catalog.stats(c.id);
              return <CourseCard key={c.id} course={c} lessonCount={s.count} newCount={s.fresh} hasAccess={canUse(c)} />;
            })}
          </div>
        </section>
      )}
    </div>
  );
}
