import Link from 'next/link';
import { createPost } from '@/app/kozosseg/actions';
import { Composer } from '@/components/community/Composer';
import { PostCard } from '@/components/community/PostCard';
import { SelectNav } from '@/components/community/SelectNav';
import { PAGE_SIZE, TAG_ICON, TAG_LABEL, type CommunityPost, type PostTag, type Space } from '@/lib/community';
import type { FeedFilter } from '@/lib/community-data';
import type { loadPostExtras } from '@/lib/community-data';

type Course = { id: string; title: string; slug: string };

// Egy tér (vagy tanfolyami tér) nézete: fejléc (videóval), szerkesztő, szűrők, bejegyzések, lapozás.
export function SpaceFeed({
  space,
  title,
  icon,
  description,
  headerAction,
  course,
  basePath,
  filter,
  posts,
  count,
  extras,
  courseTitles,
  courses,
  userId,
  isAdmin,
  sp,
}: {
  space: Space;
  title: string;
  icon: string;
  description: string;
  headerAction?: React.ReactNode;
  course?: Course | null;
  basePath: string;
  filter: FeedFilter;
  posts: CommunityPost[];
  count: number;
  extras: Awaited<ReturnType<typeof loadPostExtras>>;
  courseTitles: Map<string, string>;
  courses: Course[];
  userId: string;
  isAdmin: boolean;
  sp: Record<string, string | undefined>;
}) {
  const isQa = space.kind === 'qa';
  const canPost = !space.admin_only_post || isAdmin;
  const withTag = space.kind === 'feed' || space.kind === 'course';
  const filtered = !!(filter.tag || filter.course || filter.open);
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const href = (over: Record<string, string | null>) => {
    const cur: Record<string, string | null> = {
      rend: filter.sort === 'nepszeru' ? 'nepszeru' : null,
      tipus: filter.tag,
      tema: course ? null : filter.course,
      nyitott: filter.open ? '1' : null,
      ...over,
    };
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const chip = (active: boolean) => `kz-filter${active ? ' on' : ''}`;

  return (
    <>
      <section className="card kz-head">
        <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
          <h1 className="h2 kz-title"><span aria-hidden="true">{icon}</span> {title}</h1>
          {description && <p className="lead" style={{ maxWidth: 720 }}>{description}</p>}
          {headerAction}
        </div>
        {space.header_video && (
          <video className="kz-head-video" controls playsInline preload="metadata" poster={space.header_video.replace(/\.mp4$/, '-poster.jpg')}>
            <source src={space.header_video} type="video/mp4" />
          </video>
        )}
      </section>

      {sp.hiba && <div className="notice err">{sp.hiba}</div>}
      {sp.torolve && <div className="notice ok">Töröltük a bejegyzést.</div>}

      {canPost && (
        <details className="card kz-compose" open={sp.uj === '1' || (count === 0 && !filtered)}>
          <summary>
            <span className="kz-compose-fake">{isQa ? '🙋 Kérdezz valamit…' : space.kind === 'announcement' ? '📣 Új bejelentés…' : '✍️ Írj egy posztot…'}</span>
          </summary>
          <div style={{ marginTop: 14 }}>
            <Composer action={createPost} userId={userId} space={{ slug: space.slug, kind: space.kind, name: space.name }} courses={courses} fixedCourse={course ?? null} back={basePath} />
          </div>
        </details>
      )}
      {!canPost && <p className="muted kz-note">Ide Marcsi posztol – kommentelni viszont tudsz. 💬</p>}

      <div className="kz-filters">
        <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <Link href={href({ rend: null, oldal: null })} className={chip(filter.sort === 'uj')}>Legújabb</Link>
          <Link href={href({ rend: 'nepszeru', oldal: null })} className={chip(filter.sort === 'nepszeru')}>Legnépszerűbb</Link>
          <span className="kz-filter-sep" aria-hidden="true" />
          {withTag &&
            (Object.keys(TAG_LABEL) as PostTag[]).map((t) => (
              <Link key={t} href={href({ tipus: filter.tag === t ? null : t, oldal: null })} className={chip(filter.tag === t)}>
                {TAG_ICON[t]} {TAG_LABEL[t]}
              </Link>
            ))}
          {(isQa || withTag) && (
            <Link href={href({ nyitott: filter.open ? null : '1', oldal: null })} className={chip(filter.open)}>
              {isQa ? '⏳ Megoldatlan' : '🙏 Visszajelzést kér, még nincs válasz'}
            </Link>
          )}
        </div>
        {!course && courses.length > 0 && (
          <SelectNav
            label="Szűrés tanfolyamra"
            value={filter.course ?? ''}
            options={[{ value: '', label: 'Minden tanfolyam', href: href({ tema: null, oldal: null }) }, ...courses.map((c) => ({ value: c.id, label: c.title, href: href({ tema: c.id, oldal: null }) }))]}
          />
        )}
      </div>

      {posts.length === 0 && (
        <div className="card kz-empty">
          <strong>{filtered ? 'Nincs a szűrésnek megfelelő bejegyzés.' : space.empty_text || 'Még csend van itt.'}</strong>
          {filtered && <Link href={basePath} className="kz-more">Szűrés törlése</Link>}
        </div>
      )}

      {posts.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          profile={extras.profiles.get(p.user_id)}
          avatar={extras.avatarOf(p.user_id)}
          signed={extras.signed}
          liked={extras.liked.has(p.id)}
          courseTitle={!course && p.course_id ? courseTitles.get(p.course_id) ?? null : null}
        />
      ))}

      {pages > 1 && (
        <nav className="row between" aria-label="Lapozás">
          {filter.page > 1 ? <Link href={href({ oldal: String(filter.page - 1) })} className="btn sm light">← Újabbak</Link> : <span />}
          <span className="muted mono" style={{ fontSize: 13 }}>{filter.page} / {pages}</span>
          {filter.page < pages ? <Link href={href({ oldal: String(filter.page + 1) })} className="btn sm light">Régebbiek →</Link> : <span />}
        </nav>
      )}
    </>
  );
}
