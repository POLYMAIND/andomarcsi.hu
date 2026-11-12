import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BuyBox } from '@/components/BuyBox';
import { ChatWidget } from '@/components/ChatWidget';
import { FaqList } from '@/components/FaqList';
import { GuideView } from '@/components/GuideView';
import { JsonLd } from '@/components/JsonLd';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { courseAccessible, getUserAccess } from '@/lib/data';
import { formatHuf, priceLabel, toolColor } from '@/lib/format';
import { guideOutline, parseGuide } from '@/lib/guide';
import { courseFaq, courseHeading, courseSchema, faqPage, graph, ORGANIZATION } from '@/lib/seo';
import { createClient } from '@/lib/supabase/server';
import { ACADEMY, byPackageOrder, packageKind } from '@/lib/polyakademia';
import { withStart, withStartAll, type Course, type Lesson } from '@/lib/types';
import { youTubeThumb } from '@/lib/youtube';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('courses').select('title, subtitle, teaser, level, pocket_for').eq('slug', slug).maybeSingle();
  if (!data) return {};
  const description = (data.teaser || data.subtitle || '').slice(0, 160);
  return {
    title: courseHeading(data),
    description,
    alternates: { canonical: `/kurzusok/${slug}` },
    openGraph: { title: courseHeading(data), description, url: `/kurzusok/${slug}`, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website', images: ['/opengraph-image.png'] },
  };
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
  // a csomag tartalma a bundle_course_ids sorrendjében (ajánlott sorrend)
  const modules = withStartAll(bundleItems).sort((a, b) => course.bundle_course_ids.indexOf(a.id) - course.bundle_course_ids.indexOf(b.id));
  // Letölthető csomag (ingyenes anyag / zsebkurzus): a szülő tanfolyam és a letöltési link (az RLS csak jogosultnak adja ki).
  // Tanfolyamnál: a hozzá tartozó ingyenes anyagok és zsebkurzusok.
  const isPocket = !!course.pocket_for;
  const [{ data: rawParent }, { data: rawPackages }, { data: download }, { data: guide }] = await Promise.all([
    isPocket ? supabase.from('courses').select('*').eq('id', course.pocket_for!).eq('published', true).maybeSingle<Course>() : Promise.resolve({ data: null }),
    isPocket ? Promise.resolve({ data: [] as Course[] }) : supabase.from('courses').select('*').eq('pocket_for', course.id).eq('published', true).returns<Course[]>(),
    isPocket ? supabase.from('course_downloads').select('url, label').eq('course_id', course.id).maybeSingle() : Promise.resolve({ data: null }),
    // Online tananyag (ingyenes anyag / zsebcsomag): az RLS csak belépett, jogosult felhasználónak adja ki.
    isPocket && user ? supabase.from('course_guides').select('body_md').eq('course_id', course.id).maybeSingle<{ body_md: string }>() : Promise.resolve({ data: null }),
  ]);
  const guideBlocks = guide?.body_md ? parseGuide(guide.body_md) : null;
  const outline = guideBlocks ? guideOutline(guideBlocks) : [];
  const related = rawParent ? withStart(rawParent) : null;
  const packages = withStartAll(rawPackages).sort(byPackageOrder);
  const isFree = course.price_huf === 0;
  const { data: waitRow } = user
    ? await supabase.from('course_waitlist').select('id').eq('course_id', course.id).eq('user_id', user.id).maybeSingle()
    : { data: null };
  const bundle = withStartAll(bundlesWithThis)[0] ?? null;
  const list = lessons ?? [];
  const hasAccess = !!user && courseAccessible(course, access, profile?.is_admin);
  // Ingyenes anyag megnyitása = felvétel a Saját tanulásba (így az adminban is látszik, ki mit olvasott).
  if (user && isFree && isPocket && guideBlocks && !access.enrolled.has(course.id)) {
    await supabase.from('enrollments').insert({ user_id: user.id, course_id: course.id, source: 'free', amount_huf: 0 });
    access.enrolled.add(course.id);
  }
  const loginHref = `/belepes?next=${encodeURIComponent(`/kurzusok/${course.slug}`)}`;
  const done = list.filter((l) => access.completed.has(l.id)).length;
  const next = list.find((l) => !access.completed.has(l.id)) ?? list[0];
  // Videó-előnézet: az RLS csak a jogosultnak (vagy az ingyenes előzetesnél) adja ki a YouTube-azonosítót.
  const { data: videoRows } = list.length
    ? await supabase.from('lesson_videos').select('lesson_id, youtube_id').in('lesson_id', list.map((l) => l.id))
    : { data: [] as { lesson_id: string; youtube_id: string }[] };
  const thumbs = new Map((videoRows ?? []).map((v) => [v.lesson_id as string, youTubeThumb(v.youtube_id as string)]));
  const featured = list.length ? (hasAccess ? next : list.find((l) => l.is_preview && !course.coming_soon) ?? list[0]) : null;
  const totalMin = list.reduce((s, l) => s + (l.duration_min ?? 0), 0);
  const faq = courseFaq(course);

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
            {course.academy_level
              ? <Link href={`${ACADEMY.path}#szint-${course.academy_level}`} className="tag">← {ACADEMY.name}</Link>
              : <Link href="/kurzusok" className="tag">← Tudástár</Link>}
            <span className="tag">· {course.tool} · {course.level}{course.academy_level ? ` · ${course.academy_level}. szint` : ''}</span>
            {course.academy_level && <span className="ps-badge">{ACADEMY.badge}</span>}
          </div>
          <h1 className="h1">{courseHeading(course)}</h1>
          {course.subtitle && <p className="lead" style={{ color: 'var(--ink)' }}>{course.subtitle}</p>}
          {course.teaser && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, color: 'var(--ink)' }}>{course.teaser}</p>}
          <div className="row">
            <span className="pill">{isPocket ? (isFree ? 'Ingyenes online anyag' : 'Letölthető csomag') : isBundle ? `${modules.length} modul` : `${list.length} lecke`}</span>
            {totalMin > 0 && <span className="pill">{totalMin} perc videó</span>}
            {hasAccess && list.length > 0 && <span className="pill">{done}/{list.length} kész</span>}
          </div>
        </div>
      </section>

      <div className="layout-sidebar">
        <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          {!isBundle && (list.length > 0 || !isPocket) && (
            <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
              <h2 className="h3">Tananyag</h2>
              {list.length === 0 && <p className="muted" style={{ margin: 0 }}>A leckék hamarosan érkeznek.</p>}
              {featured && (() => {
                const open = hasAccess || (featured.is_preview && !course.coming_soon);
                const idx = list.indexOf(featured);
                const thumb = thumbs.get(featured.id);
                const started = done > 0 && !access.completed.has(featured.id);
                return (
                  <Link href={`/kurzusok/${course.slug}/${featured.id}`} className={`lesson-hero${open ? '' : ' locked'}`}>
                    <span className="lesson-hero-media">
                      {thumb
                        ? <img src={thumb} alt="" loading="eager" />
                        : <span className="lesson-hero-ph" style={{ background: toolColor(course.tool) }} />}
                      <span className="lesson-hero-play" aria-hidden>{open ? '▶' : '🔒'}</span>
                      {open && featured.duration_min ? <span className="lesson-hero-dur mono">{featured.duration_min} perc</span> : null}
                    </span>
                    <span className="lesson-hero-body">
                      <span className="muted mono" style={{ fontSize: 12 }}>
                        {idx + 1}. lecke{!hasAccess && featured.is_preview && !course.coming_soon ? ' · ingyenes előzetes' : ''}
                      </span>
                      <strong>{featured.title}</strong>
                      {featured.description && <span className="muted lesson-hero-desc">{featured.description}</span>}
                      <span className="btn sm" style={{ alignSelf: 'flex-start' }}>
                        {!open ? 'Zárolt lecke' : started ? 'Folytatom →' : access.completed.has(featured.id) ? 'Újranézem →' : 'Megnézem →'}
                      </span>
                    </span>
                  </Link>
                );
              })()}
              {list.length > 1 && (
                <ol className="lesson-list">
                  {list.map((l, i) => {
                    if (l.id === featured?.id) return null;
                    const open = hasAccess || (l.is_preview && !course.coming_soon);
                    const isDone = access.completed.has(l.id);
                    const thumb = thumbs.get(l.id);
                    return (
                      <li key={l.id}>
                        <Link href={`/kurzusok/${course.slug}/${l.id}`} className={`lesson-item${thumb ? ' has-thumb' : ''}${open ? '' : ' locked'}`}>
                          {thumb
                            ? <span className="lesson-thumb"><img src={thumb} alt="" loading="lazy" /><span className={`lesson-num${isDone ? ' done' : ''}`}>{isDone ? '✓' : i + 1}</span></span>
                            : <span className={`lesson-num${isDone ? ' done' : ''}`}>{isDone ? '✓' : i + 1}</span>}
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
              )}
            </div>
          )}
          {course.outcome && (
            <>
              <h2 className="h3">Mit tudsz majd a végére?</h2>
              <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)' }}>{course.outcome}</p>
            </>
          )}
          {course.description && course.outcome && <h2 className="h3">Miről szól?</h2>}
          {course.description && !guideBlocks && <p style={{ margin: 0, fontSize: 17, lineHeight: 1.65, color: 'var(--ink-2)', whiteSpace: 'pre-line' }}>{course.description}</p>}
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
                      <span className="muted mono" style={{ fontSize: 12 }}>{priceLabel(m)}</span>
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
          {guideBlocks && (
            <div id="anyag" className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
              {outline.length > 2 && (
                <nav className="guide-toc guide-toc-inline" aria-label="Tartalom">
                  <span className="mono">Tartalom</span>
                  <ol>{outline.map((o) => <li key={o.id}><a href={`#${o.id}`}>{o.text}</a></li>)}</ol>
                </nav>
              )}
              <GuideView blocks={guideBlocks} />
            </div>
          )}
          {isPocket && !guideBlocks && !hasAccess && isFree && (
            <div id="letoltes" className="guide-locked">
              <span className="mono">Ingyenes · csak regisztráció kell</span>
              <b>Az anyag itt, az oldalon olvasható – lépj be, vagy regisztrálj ingyen egy e-mail címmel.</b>
              <span className="muted">Jelszó nem kell: e-mailben kapsz egy belépő linket, és utána bármikor visszajöhetsz ide.</span>
              <Link href={loginHref} className="btn ps-lime" style={{ alignSelf: 'flex-start' }}>Regisztrálok és olvasom →</Link>
            </div>
          )}
          {isPocket && !guideBlocks && !(isFree && !hasAccess) && (
            <div id="letoltes" className="ps-pocket" style={{ padding: '18px 20px' }}>
              {hasAccess && download ? (
                <>
                  <span><b>{guideBlocks ? 'A nyomtatható lapok.' : isFree ? 'Itt az ingyenes anyagod.' : 'A csomag a tiéd.'}</b> Bármikor újra letöltheted innen.</span>
                  <a href={download.url} target="_blank" rel="noopener noreferrer" className="btn ps-lime sm">{download.label || 'Letöltöm a csomagot'} ↓</a>
                </>
              ) : hasAccess ? (
                <span><b>Hozzáférsz.</b> Az anyag hamarosan felkerül ide – e-mailben is szólok.</span>
              ) : isFree ? (
                <span><b>Ingyenes anyag</b> · lépj be (az ingyenes regisztráció is ennyi), és azonnal letöltheted</span>
              ) : (
                <span><b>Letölthető csomag</b> · kész promptok és skillek, telepítési leírással</span>
              )}
            </div>
          )}
          {isPocket && related && (
            <Link href={`/kurzusok/${related.slug}`} className="lesson-item">
              <span className="lesson-num">▶</span>
              <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                <strong>A teljes tanfolyam videókkal: {related.title}</strong>
                <span className="muted" style={{ fontSize: 13 }}>A teljes folyamat lépésről lépésre, videóleckékben</span>
              </span>
              <span className="muted mono" style={{ fontSize: 12 }}>{priceLabel(related)}</span>
            </Link>
          )}
          {packages.length > 0 && (
            <>
              <h2 className="h3">Ingyenes anyag és zsebkurzus</h2>
              {packages.map((p) => (
                <Link key={p.id} href={`/kurzusok/${p.slug}`} className="ps-pocket ps-pocket-link">
                  <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
                    <b>{p.title.replace(/^(Zsebkurzus|Ingyenes): /, '')}</b>
                    <span className="muted" style={{ fontSize: 14 }}>{packageKind(p)} · {p.subtitle}</span>
                  </span>
                  <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
                    <span className="ps-pocket-price">{priceLabel(p)}</span>
                    <span className="btn sm">{p.coming_soon ? 'Részletek' : p.price_huf === 0 ? 'Olvasom' : 'Megveszem'} →</span>
                  </span>
                </Link>
              ))}
            </>
          )}
        </section>
        <aside className="side-stack">
          <div className="card">
          <BuyBox
            course={course}
            loggedIn={!!user}
            hasAccess={hasAccess}
            enrolled={access.enrolled.has(course.id)}
            firstLessonHref={isPocket ? (guideBlocks ? null : download ? '#letoltes' : null) : next ? `/kurzusok/${course.slug}/${next.id}` : isBundle && modules[0] ? `/kurzusok/${modules[0].slug}` : null}
            bundle={bundle && !access.enrolled.has(bundle.id) ? bundle : null}
            userEmail={user?.email ?? null}
            waitlisted={!!waitRow || sp.ertesites === 'ok'}
            waitlistError={
              sp.ertesites === 'email' ? 'Kérlek, adj meg egy érvényes e-mail címet.'
              : sp.ertesites === 'hozzajarulas' ? 'A feliratkozáshoz pipáld be a hozzájárulást.'
              : sp.ertesites === 'hiba' ? 'Nem sikerült a feliratkozás, próbáld újra.'
              : null
            }
          />
          {guideBlocks && download && (
            <a href={download.url} target="_blank" rel="noopener noreferrer" className="btn ps-lime block" style={{ marginTop: 12 }}>Letöltöm PDF-ben ↓</a>
          )}
          </div>
          {outline.length > 0 && (
            <nav className="card guide-toc guide-toc-side" aria-label="Tartalom">
              <span className="mono">Tartalom</span>
              <ol>{outline.map((o) => <li key={o.id}><a href={`#${o.id}`}>{o.text}</a></li>)}</ol>
            </nav>
          )}
        </aside>
      </div>
      <section className="card stack" style={{ '--gap': '24px' } as React.CSSProperties}>
        <h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>Gyakori kérdések</h2>
        <FaqList items={faq} />
      </section>
      <JsonLd data={graph(ORGANIZATION, courseSchema(course), faqPage(faq))} />
      <ChatWidget courseSlug={course.slug} loggedIn={!!user} />
    </div>
  );
}
