import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/BuyBox';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { courseAccessible, getUserAccess } from '@/lib/data';
import { youTubeEmbedUrl } from '@/lib/youtube';
import { soonLabel, withStart, type Course, type Lesson } from '@/lib/types';
import { toggleComplete } from './actions';

type Props = { params: Promise<{ slug: string; lessonId: string }> };

export const metadata: Metadata = { title: 'Lecke' };

const UUID = /^[0-9a-f-]{36}$/i;

export default async function LessonPage({ params }: Props) {
  const { slug, lessonId } = await params;
  if (!UUID.test(lessonId)) notFound();
  const { supabase, user, profile } = await getCurrentUser();
  const { data: rawCourse } = await supabase.from('courses').select('*').eq('slug', slug).maybeSingle<Course>();
  const course = rawCourse ? withStart(rawCourse) : null;
  if (!course) notFound();

  const [{ data: lessons }, { data: video }, access] = await Promise.all([
    supabase.from('lessons').select('*').eq('course_id', course.id).lte('published_at', new Date().toISOString()).order('sort_order').returns<Lesson[]>(),
    // Az RLS csak akkor adja vissza a videó-azonosítót, ha van hozzáférés (vagy előzetes lecke).
    supabase.from('lesson_videos').select('youtube_id').eq('lesson_id', lessonId).maybeSingle(),
    getUserAccess(supabase, user?.id),
  ]);
  const list = lessons ?? [];
  const idx = list.findIndex((l) => l.id === lessonId);
  if (idx < 0) notFound();
  const lesson = list[idx];
  const hasAccess = !!user && courseAccessible(course, access, profile?.is_admin);
  const canWatch = hasAccess || (lesson.is_preview && !course.coming_soon);
  const isDone = access.completed.has(lesson.id);
  const prev = list[idx - 1];
  const next = list[idx + 1];
  const path = `/kurzusok/${course.slug}/${lesson.id}`;

  return (
    <div className="page">
      <SiteNav />
      <div className="layout-sidebar">
        <main className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          <div className="video">
            {canWatch && video?.youtube_id ? (
              <iframe
                src={youTubeEmbedUrl(video.youtube_id)}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <div className="video-locked">
                <div className="stack" style={{ '--gap': '14px', alignItems: 'center', maxWidth: 420 } as React.CSSProperties}>
                  <span style={{ fontSize: 40 }}>{canWatch ? '⏳' : '🔒'}</span>
                  <strong style={{ fontSize: 20 }}>{canWatch ? 'A videó hamarosan felkerül.' : course.coming_soon ? (course.starts_at ? `A kurzus indul: ${soonLabel(course).replace('Indul: ', '')}` : 'Ez a kurzus hamarosan indul.') : 'Ez a lecke a teljes kurzus része.'}</strong>
                  {!canWatch && !course.coming_soon && <span style={{ color: '#cfcad4' }}>Vásárold meg a kurzust, vagy fizess elő, és azonnal nézheted.</span>}
                </div>
              </div>
            )}
          </div>
          <section className="card stack" style={{ '--gap': '16px' } as React.CSSProperties}>
            <div className="row between">
              <Link href={`/kurzusok/${course.slug}`} className="tag">← {course.title}</Link>
              <span className="tag muted">{idx + 1}. lecke / {list.length}</span>
            </div>
            <h1 className="h2">{lesson.title}</h1>
            {lesson.description && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)', whiteSpace: 'pre-line' }}>{lesson.description}</p>}
            <div className="row between" style={{ marginTop: 8 }}>
              {user && canWatch ? (
                <form action={toggleComplete}>
                  <input type="hidden" name="lesson_id" value={lesson.id} />
                  <input type="hidden" name="done" value={isDone ? '1' : '0'} />
                  <input type="hidden" name="path" value={path} />
                  <button className={isDone ? 'btn light' : 'btn purple'} type="submit">{isDone ? '✓ Elvégezve' : 'Kész vagyok vele'}</button>
                </form>
              ) : (
                <span />
              )}
              <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
                {prev && <Link href={`/kurzusok/${course.slug}/${prev.id}`} className="btn light sm">← Előző</Link>}
                {next && <Link href={`/kurzusok/${course.slug}/${next.id}`} className="btn sm">Következő →</Link>}
              </div>
            </div>
          </section>
        </main>

        <aside className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          {!hasAccess && (
            <div className="card">
              <BuyBox course={course} loggedIn={!!user} hasAccess={false} enrolled={false} firstLessonHref={null} />
            </div>
          )}
          <div className="card" style={{ padding: 16 }}>
            <ol className="lesson-list">
              {list.map((l, i) => {
                const open = hasAccess || (l.is_preview && !course.coming_soon);
                const d = access.completed.has(l.id);
                return (
                  <li key={l.id}>
                    <Link href={`/kurzusok/${course.slug}/${l.id}`} className={`lesson-item${l.id === lesson.id ? ' active' : ''}${open ? '' : ' locked'}`}>
                      <span className={`lesson-num${d ? ' done' : ''}`}>{d ? '✓' : i + 1}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{l.title}</span>
                      <span className="muted mono" style={{ fontSize: 12 }}>{open ? (l.duration_min ? `${l.duration_min} p` : '') : '🔒'}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
