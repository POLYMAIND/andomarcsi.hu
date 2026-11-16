import type { Metadata } from 'next';
import Link from 'next/link';
import { CommunityComposer } from '@/components/CommunityComposer';
import { SiteNav } from '@/components/SiteNav';
import { requireUser } from '@/lib/auth';
import { hasCommunityAccess, isVideoPath, KIND_LABEL, KIND_SLUG, kindFromSlug, PAGE_SIZE, signImages, type CommunityPost } from '@/lib/community';
import { SUBSCRIPTION } from '@/lib/config';
import { ACADEMY } from '@/lib/polyakademia';
import { createPost, setCommunityEmails } from './actions';
import { AuthorLine, LikeButton } from './parts';

export const metadata: Metadata = { title: 'Közösség', robots: { index: false, follow: false } };

type Props = { searchParams: Promise<Record<string, string | undefined>> };
type FeedPost = CommunityPost & { community_comments: { count: number }[]; community_likes: { count: number }[] };

const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CommunityPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireUser('/kozosseg');
  const access = await hasCommunityAccess(supabase);
  if (!access) return <NoAccess />;

  const kind = kindFromSlug(sp.tipus);
  const topic = sp.tema && uuidRe.test(sp.tema) ? sp.tema : '';
  // Keresés: a PostgREST szűrőben különleges karaktereket kiszűrjük.
  const search = (sp.q ?? '').replace(/[,()%*\\.:]/g, ' ').trim().slice(0, 80);
  const page = Math.max(1, parseInt(sp.oldal ?? '1', 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from('community_posts')
    .select('id, user_id, kind, title, body, course_id, images, best_comment_id, pinned, author_name, author_is_admin, created_at, community_comments(count), community_likes(count)', { count: 'exact' })
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (kind) query = query.eq('kind', kind);
  if (topic) query = query.eq('course_id', topic);
  if (search) query = query.or(`title.ilike.%${search}%,body.ilike.%${search}%`);

  const [{ data: rawPosts, count }, { data: rawCourses }, { data: allTopics }] = await Promise.all([
    query.returns<FeedPost[]>(),
    supabase.from('courses').select('id, title, sort_order, bundle_course_ids').eq('published', true).is('pocket_for', null).order('sort_order'),
    supabase.from('community_posts').select('course_id'),
  ]);
  const posts = rawPosts ?? [];
  const courses = (rawCourses ?? []).filter((c) => !(c.bundle_course_ids as string[] | null)?.length).map((c) => ({ id: c.id as string, title: c.title as string }));
  const courseTitle = new Map(courses.map((c) => [c.id, c.title]));
  const topicCounts = new Map<string, number>();
  for (const t of allTopics ?? []) if (t.course_id) topicCounts.set(t.course_id, (topicCounts.get(t.course_id) ?? 0) + 1);
  const topics = courses.filter((c) => topicCounts.has(c.id)).sort((a, b) => topicCounts.get(b.id)! - topicCounts.get(a.id)!);

  const ids = posts.map((p) => p.id);
  const [{ data: myLikes }, signed] = await Promise.all([
    ids.length ? supabase.from('community_likes').select('post_id').eq('user_id', user.id).in('post_id', ids) : Promise.resolve({ data: [] as { post_id: string }[] }),
    signImages(supabase, posts.flatMap((p) => p.images.slice(0, 3))),
  ]);
  const liked = new Set((myLikes ?? []).map((l) => l.post_id));
  const total = count ?? posts.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = !!(kind || topic || search);

  const href = (over: Record<string, string | null>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string | null> = { tipus: kind ? KIND_SLUG[kind] : null, tema: topic || null, q: search || null, ...over };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/kozosseg?${s}` : '/kozosseg';
  };
  const emailsOn = profile?.community_emails !== false;

  return (
    <div className="page">
      <SiteNav />
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}
      {sp.torolve && <div className="notice ok">Töröltük a bejegyzést.</div>}

      <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Közösség</div>
          <h1 className="h2">Kérdezz bátran, és mutasd meg, mit csináltál.</h1>
          <p className="lead" style={{ maxWidth: 720 }}>Itt a tanulótársaid és én is válaszolunk. Nincs buta kérdés, és minden elkészült munka számít – az első Canva-posztod is.</p>
        </div>
        <details open={sp.uj === '1' || (total === 0 && !filtered)} className="stack" style={{ background: 'var(--paper)', borderRadius: 20, padding: '16px 20px' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>+ Új bejegyzés</summary>
          <div style={{ marginTop: 16 }}>
            <CommunityComposer action={createPost} userId={user.id} courses={courses} defaultKind={kind ?? 'question'} defaultCourse={topic} />
          </div>
        </details>
      </section>

      <div className="layout-sidebar">
        <section className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
          <div className="row between" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties} role="group" aria-label="Bejegyzések típusa">
              {([null, 'question', 'showcase'] as const).map((k) => {
                const active = kind === k;
                return (
                  <Link
                    key={k ?? 'all'}
                    href={href({ tipus: k ? KIND_SLUG[k] : null })}
                    aria-current={active ? 'page' : undefined}
                    className="btn sm"
                    style={{ background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', borderColor: 'var(--ink)' }}
                  >
                    {k === null ? 'Minden' : k === 'question' ? 'Kérdések' : 'Munkák'}
                  </Link>
                );
              })}
            </div>
            <form method="get" action="/kozosseg" className="row" style={{ '--gap': '6px', flex: '1 1 220px', justifyContent: 'flex-end' } as React.CSSProperties}>
              {kind && <input type="hidden" name="tipus" value={KIND_SLUG[kind]} />}
              {topic && <input type="hidden" name="tema" value={topic} />}
              <input type="search" name="q" className="input" defaultValue={search} placeholder="Keresés…" aria-label="Keresés a közösségben" style={{ width: 'auto', flex: '1 1 160px', maxWidth: 260, padding: '9px 14px' }} />
            </form>
          </div>

          {(topic || search) && (
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              {topic && <span className="pill">Téma: {courseTitle.get(topic) ?? 'ismeretlen'}</span>}
              {search && <span className="pill">Keresés: „{search}”</span>}
              <Link href={href({ tema: null, q: null })} className="muted" style={{ fontSize: 13, textDecoration: 'underline' }}>Szűrés törlése</Link>
            </div>
          )}

          {posts.length === 0 && (
            <div className="card stack" style={{ padding: 32, '--gap': '10px' } as React.CSSProperties}>
              <strong style={{ fontSize: 18 }}>{filtered ? 'Nincs a szűrésnek megfelelő bejegyzés.' : 'Még csend van itt.'}</strong>
              <span className="muted">{filtered ? 'Próbálj másik témát vagy keresőszót.' : 'Légy te az első: tegyél fel egy kérdést, vagy mutasd meg, min dolgozol!'}</span>
            </div>
          )}

          {posts.map((p) => {
            const comments = p.community_comments[0]?.count ?? 0;
            const likes = p.community_likes[0]?.count ?? 0;
            const thumbs = p.images.slice(0, 3).flatMap((path) => { const src = signed.get(path); return src ? [{ src, video: isVideoPath(path) }] : []; });
            return (
              <article key={p.id} className="card stack" style={{ padding: 'clamp(20px, 3vw, 28px)', '--gap': '14px', outline: p.pinned ? '2px solid var(--purple)' : undefined } as React.CSSProperties}>
                <div className="row between" style={{ '--gap': '8px', alignItems: 'flex-start' } as React.CSSProperties}>
                  <AuthorLine name={p.author_name} admin={p.author_is_admin} at={p.created_at} />
                  <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                    {p.pinned && <span className="pill new">Kiemelt</span>}
                    <span className={`pill${p.kind === 'showcase' ? ' ok' : ''}`}>{KIND_LABEL[p.kind]}</span>
                  </div>
                </div>
                <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
                  <h2 className="h3" style={{ margin: 0 }}>
                    <Link href={`/kozosseg/${p.id}`}>{p.title}</Link>
                  </h2>
                  {p.course_id && courseTitle.has(p.course_id) && (
                    <Link href={href({ tema: p.course_id })} className="tag muted" style={{ fontSize: 11 }}>#{courseTitle.get(p.course_id)}</Link>
                  )}
                </div>
                {p.body && (
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', whiteSpace: 'pre-line' }}>{p.body}</p>
                )}
                {thumbs.length > 0 && (
                  <Link href={`/kozosseg/${p.id}`} style={{ display: 'grid', gridTemplateColumns: p.kind === 'showcase' && thumbs.length === 1 ? '1fr' : `repeat(${Math.max(thumbs.length, 2)}, 1fr)`, gap: 8 }}>
                    {thumbs.map((t, i) => {
                      const style = { width: '100%', aspectRatio: p.kind === 'showcase' && thumbs.length === 1 ? '16 / 10' : '1', objectFit: 'cover', borderRadius: 14, display: 'block', background: 'var(--paper)' } as const;
                      return t.video ? (
                        <span key={i} style={{ position: 'relative', display: 'block' }}>
                          {/* #t=0.1: így a mobil Safari is az első képkockát mutatja borítónak */}
                          <video src={`${t.src}#t=0.1`} muted playsInline preload="metadata" style={{ ...style, background: 'var(--ink)' }} />
                          <span aria-hidden="true" className="lesson-hero-play" style={{ width: 52, height: 52, fontSize: 18 }}>▶</span>
                        </span>
                      ) : (
                        <img key={i} src={t.src} alt="" loading="lazy" style={style} />
                      );
                    })}
                  </Link>
                )}
                <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
                  <LikeButton postId={p.id} liked={liked.has(p.id)} count={likes} />
                  <Link href={`/kozosseg/${p.id}#hozzaszolasok`} className="btn sm light">💬 {comments} {p.kind === 'question' ? 'válasz' : 'hozzászólás'}</Link>
                  {p.kind === 'question' && p.best_comment_id && <span className="pill ok">✓ Megválaszolva</span>}
                  {p.kind === 'question' && !p.best_comment_id && comments === 0 && <span className="pill warn">Válaszra vár</span>}
                </div>
              </article>
            );
          })}

          {pages > 1 && (
            <nav className="row between" aria-label="Lapozás">
              {page > 1 ? <Link href={href({ oldal: String(page - 1) })} className="btn sm light">← Újabbak</Link> : <span />}
              <span className="muted mono" style={{ fontSize: 13 }}>{page} / {pages}</span>
              {page < pages ? <Link href={href({ oldal: String(page + 1) })} className="btn sm light">Régebbiek →</Link> : <span />}
            </nav>
          )}
        </section>

        <aside className="stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          <section className="card stack" style={{ padding: 28, '--gap': '12px' } as React.CSSProperties}>
            <h2 className="h3">Témák</h2>
            <nav className="stack" style={{ '--gap': '4px' } as React.CSSProperties} aria-label="Témák">
              <Link href={href({ tema: null })} className="row between" style={{ padding: '8px 10px', borderRadius: 12, background: !topic ? 'var(--paper)' : undefined, fontWeight: !topic ? 700 : 400 }}>
                <span>Minden téma</span>
                <span className="mono muted" style={{ fontSize: 12 }}>{allTopics?.length ?? 0}</span>
              </Link>
              {topics.map((c) => (
                <Link key={c.id} href={href({ tema: c.id })} className="row between" style={{ padding: '8px 10px', borderRadius: 12, background: topic === c.id ? 'var(--paper)' : undefined, fontWeight: topic === c.id ? 700 : 400, flexWrap: 'nowrap' }}>
                  <span style={{ fontSize: 14 }}>{c.title}</span>
                  <span className="mono muted" style={{ fontSize: 12 }}>{topicCounts.get(c.id)}</span>
                </Link>
              ))}
              {topics.length === 0 && <span className="muted" style={{ fontSize: 13 }}>Ha egy bejegyzésnél kurzust választasz, itt megjelenik a témája.</span>}
            </nav>
          </section>

          <section id="ertesitesek" className="card stack" style={{ padding: 28, '--gap': '12px' } as React.CSSProperties}>
            <h2 className="h3">E-mail értesítés</h2>
            {sp.ertesites && <div className="notice ok" style={{ fontSize: 14 }}>{sp.ertesites === 'be' ? 'Bekapcsoltad az értesítéseket.' : 'Kikapcsoltad az értesítéseket.'}</div>}
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>
              {emailsOn ? 'Szólunk e-mailben, ha valaki válaszol a kérdésedre vagy hozzászól a munkádhoz.' : 'Most nem kapsz e-mailt a közösségből.'}
            </p>
            <form action={setCommunityEmails}>
              <input type="hidden" name="on" value={emailsOn ? '0' : '1'} />
              <button type="submit" className="btn sm light">{emailsOn ? 'Kikapcsolom' : 'Bekapcsolom'}</button>
            </form>
          </section>

          <section className="card stack" style={{ padding: 28, '--gap': '10px' } as React.CSSProperties}>
            <h2 className="h3">Pár egyszerű szabály</h2>
            <ul className="muted" style={{ margin: 0, paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
              <li>Kedvesen – mindenki valahol kezdte.</li>
              <li>Kérdésnél írd le, mit próbáltál; egy képernyőkép sokat segít.</li>
              <li>Ha megkaptad a választ, jelöld meg a legjobbat.</li>
              <li>Ne ossz meg jelszót, személyes adatot vagy más munkáját a saját neveden.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

// Aki még nem tag és nem vett kurzust: rövid bemutató, hová léphet tovább.
function NoAccess() {
  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '18px', maxWidth: 760, margin: '0 auto', width: '100%' } as React.CSSProperties}>
        <div className="eyebrow">Közösség</div>
        <h1 className="h2">Ez a tanulók zárt közössége.</h1>
        <p className="lead">
          Itt lehet kérdezni, megmutatni az elkészült munkákat, és egymástól tanulni. A közösségbe a PolySuli tagjai és a fizetős kurzusok tanulói lépnek be.
        </p>
        <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
          <Link href={ACADEMY.path} className="btn">{ACADEMY.menu} kurzusok</Link>
          <Link href="/#kurzusok" className="btn light">Kurzusok</Link>
          {SUBSCRIPTION.enabled && <Link href="/elofizetes" className="btn light">Tagság</Link>}
        </div>
      </section>
    </div>
  );
}
