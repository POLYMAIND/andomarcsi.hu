import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/BuyBox';
import { SiteFooter, SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { courseAccessible, getUserAccess } from '@/lib/data';
import { toolColor } from '@/lib/format';
import { createClient } from '@/lib/supabase/server';
import type { Course, Lesson } from '@/lib/types';

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
  const { data: course } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle<Course>();
  if (!course) notFound();

  const [{ data: lessons }, access] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).lte('published_at', new Date().toISOString()).order('sort_order').returns<Lesson[]>(),
    getUserAccess(supabase, user?.id),
  ]);
  const list = lessons ?? [];
  const hasAccess = !!user && courseAccessible(course, access, profile?.is_admin);
  const done = list.filter((l) => access.completed.has(l.id)).length;
  const next = list.find((l) => !access.completed.has(l.id)) ?? list[0];
  const totalMin = list.reduce((s, l) => s + (l.duration_min ?? 0), 0);

  return (
    <div className="page">
      <SiteNav />
      {sp.megszakitva && <div className="notice">A fizetés megszakadt – semmit nem terheltünk. Bármikor újrapróbálhatod.</div>}
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
          <h2 className="h3">Tananyag</h2>
          {list.length === 0 && <p className="muted">A leckék hamarosan érkeznek.</p>}
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
            firstLessonHref={next ? `/kurzusok/${course.slug}/${next.id}` : null}
          />
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
