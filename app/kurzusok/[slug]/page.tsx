import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/BuyBox';
import { ChatWidget } from '@/components/ChatWidget';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { courseAccessible, getUserAccess } from '@/lib/data';
import { formatHuf, toolColor } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import { withStart, withStartAll, type Course, type Lesson } from '@/lib/types';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('title, subtitle').eq('slug', slug).maybeSingle();
  return data ? { title: data.title, description: data.subtitle } : {};
}

export default async function CoursePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { supabase, user, profile } = await getCurrentUser();
  const { data: rawCourse } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle<Course>();
  const course = rawCourse ? withStart(rawCourse) : null;
  if (!course) notFound();

  const isBundle = (course.bundle_course_ids ?? []).length > 0;
  const [{ data: lessons }, access, { data: bundleItems }, { data: bundlesWithThis }] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).lte('published_at', new Date().toISOString()).order('sort_order').returns<Lesson[]>(),
    getUserAccess(supabase, user?.id),
    // csomag esetén: a benne lévő kurzusok
    isBundle
      ? supabase.from('courses').select('*').in('id', course.bundle_course_ids).order('sort_order').returns<Course[]>()
      : Promise.resolve({ data: [] as Course[] }),
    // modul esetén: azok a csomagok, amikben benne van (csomagajánlathoz)
    supabase.from('courses').select('*').contains('bundle_course_ids', [course.id]).eq('published', true).returns<Course[]>(),
  ]);
  const modules = withStartAll(bundleItems);
  const { data: waitRow } = user
    ? await supabase.from('course_waitlist').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle()
    : { data: null };
  const bundle = withStartAll(bundlesWithThis)[0] ?? null;
  const list = lessons ?? [];
  const hasAccess = !!user && courseAccessible(course, access, profile?.is_admin);
  const done = list.filter((l) => access.completed.has(l.id)).length;
  const next = list.find((l) => !access.completed.has(l.id)) ?? list[0];
  const totalMin = list.reduce((s, l) => s + (l.duration_min ?? 0), 0);

  return (
    <div className="page">
      <SiteNav />
      {sp.megszakitva && <div className="notice">A fizetés megszakadt – semmit nem terheltünk. Bármikor újrapróbálhatod.</div>}
      {sp.ertesites === 'ok' && <div className="notice ok">Köszönöm! Feliratkoztál – e-mailben szólok, amint elérhető a kurzus.</div>}
      {sp.ertesites === 'email' && <div className="notice err">Kérlek, adj meg egy érvényes e-mail címet.</div>}
      {sp.ertesites === 'hozzajarulas' && <div className="notice err">A feliratkozáshoz pipáld be a hozzájárulást.</div>}
      {sp.ertesites === 'hiba' && <div className="notice err">Nem sikerült a feliratkozás, próbáld újra.</div>}
      <section className="card" style={{ background: toolColor(course.tool) }}>
        <div className="stack" style={{ '--gap': '16px', maxWidth: 780 } as React.CSSProperties}>
          <div className="row">
            <Link href="/kurzusok" className="tag">← Tudástár</Link>
            <span className="tag">· {course.tool} · {course.level}</span>
          </div>
          <h1 className="h1">{course.title}</h1>
          {course.subtitle && <p className="lead" style={{ color: 'var(--ink)' }}>{course.subtitle}</p>}
          <div className="row">
            <span className="pill">{list.length} lecke</span>
            {totalMin > 0 && <span className="pill">{totalMin} perc videó</span>}
            {hasAccess && list.length > 0 && <span className="pill">{done}/{list.length} kész</span>}
          </div>
        </div>
      </section>

      <div className="layout-sidebar">
        <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          {course.description && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)', whiteSpace: 'pre-line' }}>{course.description}</p>}
          {isBundle && (
            <>
              <h2 className="h3">A csomag tartalma</h2>
              <ul className="lesson-list">
                {modules.map((m, i) => (
                  <li key={m.id}>
                    <Link href={`/kurzusok/${m.slug}`} className="lesson-item">
                      <span className={`lesson-num${access.enrolled.has(m.id) ? ' done' : ''}`}>{access.enrolled.has(m.id) ? '✓' : i + 1}</span>
                      <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                        <strong>{m.title}</strong>
                        {m.subtitle && <span className="muted" style={{ fontSize: 13 }}>{m.subtitle}</span>}
                      </span>
                      <span className="muted mono" style={{ fontSize: 12 }}>{formatHuf(m.price_huf)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {modules.some((m) => m.price_huf) && (
                <p className="muted" style={{ margin: 0, fontSize: 14 }}>
                  Külön megvéve {formatHuf(modules.reduce((s, m) => s + (m.price_huf ?? 0), 0))} – a csomaggal {formatHuf(Math.max(0, modules.reduce((s, m) => s + (m.price_huf ?? 0), 0) - (course.price_huf ?? 0)))}-ot spórolsz.
                </p>
              )}
            </>
          )}
          {!isBundle && <h2 className="h3">Tananyag</h2>}
          {!isBundle && list.length === 0 && <p className="muted">A leckék hamarosan érkeznek.</p>}
          <ol className="lesson-list">
            {list.map((l, i) => {
              const open = hasAccess || (l.is_preview && !course.coming_soon);
              const isDone = access.completed.has(l.id);
              return (
                <li key={l.id}>
                  <Link href={`/kurzusok/${course.slug}/${l.id}`} className={`lesson-item${open ? '' : ' locked'}`}>
                    <span className={`lesson-num${isDone ? ' done' : ''}`}>{isDone ? '✓' : i + 1}</span>
                    <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                      <strong>{l.title}</strong>
                      {l.is_preview && !hasAccess && !course.coming_soon && <span className="muted" style={{ fontSize: 13 }}>Ingyenes előzetes</span>}
                    </span>
                    <span className="muted mono" style={{ fontSize: 12 }}>{open ? (l.duration_min ? `${l.duration_min} p` : '') : '🔒'}</span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>
        <aside className="card" style={{ position: 'sticky', top: 24 }}>
          <BuyBox
            course={course}
            loggedIn={!!user}
            hasAccess={hasAccess}
            enrolled={access.enrolled.has(course.id)}
            firstLessonHref={next ? `/kurzusok/${course.slug}/${next.id}` : isBundle && modules[0] ? `/kurzusok/${modules[0].slug}` : null}
            bundle={bundle && !access.enrolled.has(bundle.id) ? bundle : null}
            userEmail={user?.email ?? null}
            waitlisted={!!waitRow || sp.ertesites === 'ok'}
          />
        </aside>
      </div>
      <ChatWidget courseSlug={course.slug} loggedIn={!!user} />
      <SiteFooter />
    </div>
  );
}
