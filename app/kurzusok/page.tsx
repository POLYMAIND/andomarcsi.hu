import type { Metadata } from 'next';
import Link from 'next/link';
import { CourseCard } from '@/components/CourseCard';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatDate, formatHuf } from '@/lib/format';

export const metadata: Metadata = { title: 'Tudástár' };

export default async function CoursesPage() {
  const { supabase, user, profile } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const titleOf = new Map(catalog.courses.map((c) => [c.id, c]));

  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="eyebrow">Videós tudástár</div>
        <h1 className="h1">Tanulj a saját tempódban.</h1>
        <p className="lead">
          {catalog.totalLessons} videólecke {catalog.courses.length} témában – Canva, Claude, Polyos és hirdetéskezelés, kezdőknek.
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

      {catalog.latest.length > 0 && (
        <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
          <div className="row between">
            <h2 className="h3" style={{ fontSize: 26 }}>Legújabb anyagok</h2>
            <span className="pill new">Heti {SUBSCRIPTION.weeklyNew} új</span>
          </div>
          <ul className="lesson-list">
            {catalog.latest.map((l) => {
              const c = titleOf.get(l.course_id);
              if (!c) return null;
              return (
                <li key={l.id}>
                  <Link href={`/kurzusok/${c.slug}/${l.id}`} className="lesson-item">
                    <span className="lesson-num">▶</span>
                    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                      <strong>{l.title}</strong>
                      <span className="muted" style={{ fontSize: 13 }}>{c.title}</span>
                    </span>
                    <span className="muted mono" style={{ fontSize: 12 }}>{formatDate(l.published_at)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="grid" style={{ '--min': '300px' } as React.CSSProperties}>
        {catalog.courses.map((c) => {
          const s = catalog.stats(c.id);
          return <CourseCard key={c.id} course={c} lessonCount={s.count} newCount={s.fresh} hasAccess={!!user && courseAccessible(c, access, profile?.is_admin)} />;
        })}
      </section>
      <SiteFooter />
    </div>
  );
}
