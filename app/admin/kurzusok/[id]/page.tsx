import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate, formatHuf, isoToBudapestLocal, TOOL_COLORS } from '@/lib/format';
import type { Course, Lesson } from '@/lib/types';
import { youTubeThumb } from '@/lib/youtube';
import { deleteCourse, deleteLesson, grantAccess, saveCourse, saveLesson } from '../../actions';

export const metadata: Metadata = { title: 'Kurzus szerkesztése' };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

const LEVELS = ['Kezdő', 'Haladó kezdő', 'Haladó'];

// Következő javasolt megjelenés: a heti 2 anyaghoz kedd és péntek 9:00-t ajánlunk az utolsó ütemezett után.
function suggestNextSlot(lessons: Lesson[]): string {
  const last = lessons.reduce((m, l) => Math.max(m, new Date(l.published_at).getTime()), Date.now());
  const d = new Date(last);
  for (let i = 1; i <= 7; i++) {
    const c = new Date(d.getTime() + i * 864e5);
    if (c.getUTCDay() === 2 || c.getUTCDay() === 5) return `${c.toISOString().slice(0, 10)}T09:00`;
  }
  return isoToBudapestLocal(new Date().toISOString());
}

export default async function EditCoursePage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const { supabase } = await requireAdmin();
  const isNew = id === 'uj';

  let course: Course | null = null;
  let lessons: Lesson[] = [];
  let videos = new Map<string, string>();
  if (!isNew) {
    const { data } = await supabase.from('courses').select('*').eq('id', id).maybeSingle<Course>();
    if (!data) notFound();
    course = data;
    const [{ data: ls }, { data: vs }] = await Promise.all([
      supabase.from('lessons').select('*').eq('course_id', id).order('sort_order').order('published_at').returns<Lesson[]>(),
      supabase.from('lesson_videos').select('lesson_id, youtube_id, lessons!inner(course_id)').eq('lessons.course_id', id),
    ]);
    lessons = ls ?? [];
    videos = new Map((vs ?? []).map((v) => [v.lesson_id as string, v.youtube_id as string]));
  }
  const now = Date.now();
  const nextOrder = lessons.reduce((m, l) => Math.max(m, l.sort_order), 0) + 1;

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
        {course && <Link href={`/kurzusok/${course.slug}`} className="tag">Megtekintés az oldalon ↗</Link>}
      </div>
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}
      {sp.ok && <div className="notice ok">Elmentve.</div>}

      <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
        <h1 className="h2">{isNew ? 'Új kurzus' : course!.title}</h1>
        <form action={saveCourse} className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
          <input type="hidden" name="id" value={course?.id ?? ''} />
          <div className="grid" style={{ '--min': '240px', '--gap': '14px' } as React.CSSProperties}>
            <label className="field">Cím<input className="input" name="title" required defaultValue={course?.title} /></label>
            <label className="field">Alcím<input className="input" name="subtitle" defaultValue={course?.subtitle} /></label>
            <label className="field">URL-név (üresen hagyva a címből)<input className="input" name="slug" defaultValue={course?.slug} /></label>
            <label className="field">
              Eszköz / téma
              <input className="input" name="tool" list="tools" defaultValue={course?.tool ?? 'Canva'} />
              <datalist id="tools">{Object.keys(TOOL_COLORS).map((t) => <option key={t} value={t} />)}</datalist>
            </label>
            <label className="field">
              Szint
              <select className="select" name="level" defaultValue={course?.level ?? 'Kezdő'}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select>
            </label>
            <label className="field">Ár (Ft, 0 = ingyenes)<input className="input" name="price_huf" type="number" min={0} step={10} defaultValue={course?.price_huf ?? 0} /></label>
            <label className="field">Sorrend<input className="input" name="sort_order" type="number" defaultValue={course?.sort_order ?? 0} /></label>
          </div>
          <label className="field">Leírás<textarea className="textarea" name="description" defaultValue={course?.description} /></label>
          <div className="row" style={{ '--gap': '24px' } as React.CSSProperties}>
            <label className="check"><input type="checkbox" name="published" defaultChecked={course?.published ?? false} /> Publikus</label>
            <label className="check"><input type="checkbox" name="included_in_subscription" defaultChecked={course?.included_in_subscription ?? true} /> Benne van az előfizetésben</label>
          </div>
          <div className="row between">
            <button className="btn" type="submit">{isNew ? 'Kurzus létrehozása' : 'Mentés'}</button>
          </div>
        </form>
      </section>

      {course && (
        <>
          <section id="leckek" className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
            <div className="row between">
              <h2 className="h3" style={{ fontSize: 26 }}>Leckék ({lessons.length})</h2>
              <span className="muted" style={{ fontSize: 14 }}>Bármilyen YouTube link beilleszthető (érdemes „nem listázott” videót használni).</span>
            </div>

            {lessons.map((l) => {
              const yt = videos.get(l.id);
              const scheduled = new Date(l.published_at).getTime() > now;
              return (
                <details key={l.id} style={{ background: 'var(--paper)', borderRadius: 18, padding: '14px 18px' }}>
                  <summary style={{ cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    {yt ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={youTubeThumb(yt)} alt="" width={80} height={45} style={{ borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <span className="pill warn">Nincs videó</span>
                    )}
                    <strong style={{ flex: 1, minWidth: 200 }}>{l.sort_order}. {l.title}</strong>
                    {l.is_preview && <span className="pill">Előzetes</span>}
                    <span className={scheduled ? 'pill new' : 'pill ok'}>{scheduled ? `Ütemezve: ${formatDate(l.published_at)}` : `Élő · ${formatDate(l.published_at)}`}</span>
                  </summary>
                  <LessonForm courseId={course.id} lesson={l} youtubeId={yt} />
                  <form action={deleteLesson} style={{ marginTop: 10 }}>
                    <input type="hidden" name="course_id" value={course.id} />
                    <input type="hidden" name="lesson_id" value={l.id} />
                    <button className="btn light sm" type="submit">Lecke törlése</button>
                  </form>
                </details>
              );
            })}

            <div style={{ border: '2px dashed var(--line)', borderRadius: 18, padding: 18 }}>
              <h3 className="h3" style={{ fontSize: 18, marginBottom: 12 }}>+ Új lecke</h3>
              <LessonForm courseId={course.id} defaultOrder={nextOrder} defaultDate={suggestNextSlot(lessons)} />
            </div>
          </section>

          <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
            <h2 className="h3">Kézi hozzáférés</h2>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Pl. workshop-résztvevőknek vagy átutalással fizetőknek. A felhasználónak előbb be kell lépnie egyszer.</p>
            <form action={grantAccess} className="row">
              <input type="hidden" name="course_id" value={course.id} />
              <input className="input" name="email" type="email" required placeholder="email@pelda.hu" style={{ maxWidth: 320 }} />
              <button className="btn sm" type="submit">Hozzáférés adása</button>
            </form>
          </section>

          <section className="card row between">
            <span className="muted">Ár: {formatHuf(course.price_huf)} · Törlés esetén a leckék és beiratkozások is törlődnek.</span>
            <form action={deleteCourse}>
              <input type="hidden" name="id" value={course.id} />
              <button className="btn light sm" type="submit" style={{ color: 'oklch(0.5 0.2 25)' }}>Kurzus törlése</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}

function LessonForm({ courseId, lesson, youtubeId, defaultOrder, defaultDate }: { courseId: string; lesson?: Lesson; youtubeId?: string; defaultOrder?: number; defaultDate?: string }) {
  return (
    <form action={saveLesson} className="stack" style={{ '--gap': '12px', marginTop: lesson ? 14 : 0 } as React.CSSProperties}>
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="lesson_id" value={lesson?.id ?? ''} />
      <div className="grid" style={{ '--min': '220px', '--gap': '12px' } as React.CSSProperties}>
        <label className="field">Cím<input className="input" name="title" required defaultValue={lesson?.title} /></label>
        <label className="field">
          YouTube link
          <input className="input" name="youtube" placeholder="https://youtu.be/..." defaultValue={youtubeId ? `https://youtu.be/${youtubeId}` : ''} />
        </label>
        <label className="field">Megjelenés (budapesti idő)<input className="input" name="published_at" type="datetime-local" defaultValue={lesson ? isoToBudapestLocal(lesson.published_at) : defaultDate} /></label>
        <label className="field">Hossz (perc)<input className="input" name="duration_min" type="number" min={0} defaultValue={lesson?.duration_min ?? ''} /></label>
        <label className="field">Sorrend<input className="input" name="sort_order" type="number" defaultValue={lesson?.sort_order ?? defaultOrder ?? 1} /></label>
      </div>
      <label className="field">Leírás<textarea className="textarea" name="description" defaultValue={lesson?.description} style={{ minHeight: 70 }} /></label>
      <div className="row" style={{ '--gap': '20px' } as React.CSSProperties}>
        <label className="check"><input type="checkbox" name="is_preview" defaultChecked={lesson?.is_preview ?? false} /> Ingyenes előzetes</label>
        {youtubeId && <label className="check"><input type="checkbox" name="clear_video" /> Videó eltávolítása (ha a link mező üres)</label>}
        <button className="btn sm" type="submit">{lesson ? 'Lecke mentése' : 'Lecke hozzáadása'}</button>
      </div>
    </form>
  );
}
