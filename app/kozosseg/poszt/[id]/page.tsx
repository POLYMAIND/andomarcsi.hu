import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  addComment,
  deleteComment,
  deletePost,
  markBestAnswer,
  movePost,
  reportContent,
  toggleCommentLike,
  togglePin,
  toggleSolved,
  updatePost,
} from '@/app/kozosseg/actions';
import { CommentForm } from '@/components/community/CommentForm';
import { LinkCard } from '@/components/community/LinkCard';
import { MentionTextarea } from '@/components/community/MentionTextarea';
import { AuthorLine, LikeButton } from '@/components/community/PostCard';
import { RichText } from '@/components/community/RichText';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SubmitButton } from '@/components/SubmitButton';
import { requireUser } from '@/lib/auth';
import {
  courseSpaceHref,
  isVideoPath,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  spaceHref,
  TAG_ICON,
  TAG_LABEL,
  TITLE_MAX,
  UUID_RE,
  type CommunityComment,
  type CommunityPost,
  type Platform,
  type PostTag,
  type Space,
} from '@/lib/community';
import { loadMyCourses, loadPostExtras } from '@/lib/community-data';

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

const NOTICE: Record<string, [string, string]> = {
  '1': ['ok', 'Kint van! Most dőlj hátra és várd a szíveket. ❤️'],
  elso: ['ok', 'Első poszt pipa. Innen már csak felfelé. 🚀'],
};

export default async function PostPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!UUID_RE.test(id)) notFound();
  const { supabase, user, profile } = await requireUser(`/kozosseg/poszt/${id}`);
  const { data: post } = await supabase.from('community_posts').select('*').eq('id', id).maybeSingle<CommunityPost>();
  if (!post) notFound();

  const [{ data: space }, { data: rawComments }, { data: course }, { data: allSpaces }] = await Promise.all([
    supabase.from('community_spaces').select('*').eq('id', post.space_id).maybeSingle<Space>(),
    supabase.from('community_comments').select('*').eq('post_id', id).order('created_at').returns<CommunityComment[]>(),
    post.course_id ? supabase.from('courses').select('id, title, slug').eq('id', post.course_id).maybeSingle() : Promise.resolve({ data: null }),
    profile?.is_admin ? supabase.from('community_spaces').select('slug, name, icon, kind').neq('kind', 'link').order('sort_order') : Promise.resolve({ data: [] }),
  ]);
  const comments = rawComments ?? [];
  const [extras, { data: myCommentLikes }, adminCourses] = await Promise.all([
    loadPostExtras(supabase, [post], user.id, comments.map((c) => c.user_id), [...post.images, ...comments.flatMap((c) => c.images)]),
    comments.length
      ? supabase.from('community_comment_likes').select('comment_id').eq('user_id', user.id).in('comment_id', comments.map((c) => c.id))
      : Promise.resolve({ data: [] as { comment_id: string }[] }),
    profile?.is_admin ? loadMyCourses(supabase, user.id) : Promise.resolve([]),
  ]);
  const likedComments = new Set((myCommentLikes ?? []).map((l) => l.comment_id));

  const isAdmin = !!profile?.is_admin;
  const isOwner = post.user_id === user.id;
  const isQa = post.kind === 'question';
  const canPickBest = isQa && (isOwner || isAdmin);
  const editing = sp.szerkeszt === '1' && (isOwner || isAdmin);
  const backHref = space?.kind === 'course' && course ? courseSpaceHref(course.slug) : spaceHref(space?.slug ?? 'sikerfal');
  const backLabel = space?.kind === 'course' && course ? course.title : space?.name ?? 'Közösség';
  const top = comments.filter((c) => !c.parent_id).sort((a, b) => Number(b.id === post.best_comment_id) - Number(a.id === post.best_comment_id));
  const repliesOf = (cid: string) => comments.filter((c) => c.parent_id === cid);
  const notice = sp.kint ? NOTICE[sp.kint] : null;

  const commentView = (c: CommunityComment, reply = false) => {
    const best = c.id === post.best_comment_id;
    const signedImgs = c.images.map((p) => extras.signed.get(p)).filter(Boolean) as string[];
    return (
      <div key={c.id} id={`c-${c.id}`} className={`kz-comment${best ? ' best' : ''}${reply ? ' reply' : ''}`}>
        <div className="row between" style={{ '--gap': '8px', alignItems: 'flex-start', flexWrap: 'nowrap' } as React.CSSProperties}>
          <AuthorLine userId={c.user_id} name={c.author_name} admin={c.author_is_admin} at={c.created_at} profile={extras.profiles.get(c.user_id)} avatar={extras.avatarOf(c.user_id)} size={32} />
          {best && <span className="kz-badge ok">✅ Legjobb válasz</span>}
        </div>
        {c.body !== '📷' && <RichText text={c.body} />}
        {signedImgs.length > 0 && (
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            {signedImgs.map((src) => (
              <a key={src} href={src} target="_blank" rel="noopener noreferrer"><img src={src} alt="" className="kz-thumb" style={{ width: 140, height: 140 }} /></a>
            ))}
          </div>
        )}
        <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <form action={toggleCommentLike}>
            <input type="hidden" name="post_id" value={post.id} />
            <input type="hidden" name="comment_id" value={c.id} />
            <button type="submit" className={`kz-react sm${likedComments.has(c.id) ? ' on' : ''}`} aria-pressed={likedComments.has(c.id)}>
              {likedComments.has(c.id) ? '❤️' : '🤍'} {c.like_count}
            </button>
          </form>
          {!reply && (
            <details className="kz-inline">
              <summary className="kz-react sm">↩ Válasz</summary>
              <div className="kz-inline-body">
                <CommentForm action={addComment} postId={post.id} parentId={c.id} userId={user.id} placeholder={`Válasz neki: ${c.author_name}`} label="Válaszolok" autoFocus />
              </div>
            </details>
          )}
          {canPickBest && !reply && (
            <form action={markBestAnswer}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="comment_id" value={best ? '' : c.id} />
              <button type="submit" className="kz-react sm">{best ? 'Visszavonom' : '✅ Ez a legjobb válasz'}</button>
            </form>
          )}
          {(c.user_id === user.id || isAdmin) && (
            <form action={deleteComment}>
              <input type="hidden" name="post_id" value={post.id} />
              <input type="hidden" name="comment_id" value={c.id} />
              <ConfirmButton className="kz-react sm" message="Biztosan törlöd ezt a hozzászólást?">Törlés</ConfirmButton>
            </form>
          )}
          {c.user_id !== user.id && (
            <details className="kz-inline">
              <summary className="kz-react sm" title="Bejelentés">⚑</summary>
              <form action={reportContent} className="kz-inline-body stack" style={{ '--gap': '8px' } as React.CSSProperties}>
                <input type="hidden" name="post_id" value={post.id} />
                <input type="hidden" name="comment_id" value={c.id} />
                <input className="input" name="reason" maxLength={500} placeholder="Mi a gond vele? (nem kötelező)" />
                <SubmitButton className="btn sm light">Bejelentem</SubmitButton>
              </form>
            </details>
          )}
        </div>
        {!reply && repliesOf(c.id).map((r) => commentView(r, true))}
      </div>
    );
  };

  return (
    <>
      <Link href={backHref} className="tag" style={{ padding: '0 4px' }}>← {space?.icon} {backLabel}</Link>
      {notice && <div className={`notice ${notice[0]}`}>{notice[1]}</div>}
      {sp.jelentve && <div className="notice ok">Köszönjük, szóltunk Marcsinak – megnézi.</div>}
      {sp.athelyezve && <div className="notice ok">Áthelyezve.</div>}
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}

      <article className={`card stack kz-post-full${post.pinned ? ' pinned' : ''}`} style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="row between" style={{ '--gap': '8px', alignItems: 'flex-start' } as React.CSSProperties}>
          <AuthorLine userId={post.user_id} name={post.author_name} admin={post.author_is_admin} at={post.created_at} profile={extras.profiles.get(post.user_id)} avatar={extras.avatarOf(post.user_id)} size={44} />
          <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
            {post.pinned && <span className="kz-badge pin">📌 Kitűzve</span>}
            {isQa && (post.solved ? <span className="kz-badge ok">✅ Megoldva</span> : <span className="kz-badge">Kérdés</span>)}
            {post.tag && <span className={`kz-badge tag-${post.tag}`}>{TAG_ICON[post.tag]} {TAG_LABEL[post.tag]}</span>}
          </div>
        </div>

        {editing ? (
          <form action={updatePost} className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <input type="hidden" name="post_id" value={post.id} />
            <label className="field">Cím<input className="input" name="title" required minLength={3} maxLength={TITLE_MAX} defaultValue={post.title} /></label>
            <label className="field">Szöveg<MentionTextarea name="body" defaultValue={post.body} rows={6} /></label>
            {post.tag !== null || post.kind === 'showcase' ? (
              <fieldset className="kz-chips" aria-label="Típus">
                {(Object.keys(TAG_LABEL) as PostTag[]).map((t) => (
                  <label key={t} className="kz-chip">
                    <input type="radio" name="tag" value={t} defaultChecked={post.tag === t} />
                    <span>{TAG_ICON[t]} {TAG_LABEL[t]}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <SubmitButton className="btn">Mentés</SubmitButton>
              <Link href={`/kozosseg/poszt/${post.id}`} className="btn light">Mégse</Link>
            </div>
          </form>
        ) : (
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            {course && <Link href={courseSpaceHref(course.slug)} className="tag muted" style={{ fontSize: 11 }}>#{course.title}</Link>}
            <h1 className="h2" style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', overflowWrap: 'anywhere' }}>{post.title}</h1>
            {post.body && <RichText text={post.body} style={{ fontSize: 16 }} />}
            {post.edited_at && <span className="muted" style={{ fontSize: 12 }}>szerkesztve</span>}
          </div>
        )}

        {post.images.length > 0 && (
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            {post.images.map((path) => {
              const src = extras.signed.get(path);
              if (!src) return null;
              return isVideoPath(path) ? (
                <video key={path} src={`${src}#t=0.1`} controls playsInline preload="metadata" className="kz-full-media" />
              ) : (
                <a key={path} href={src} target="_blank" rel="noopener noreferrer" title="Megnyitás teljes méretben">
                  <img src={src} alt="" className="kz-full-media" />
                </a>
              );
            })}
          </div>
        )}
        {post.link_url && <LinkCard url={post.link_url} preview={post.link_preview} />}
        {post.platforms.length > 0 && (
          <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
            {post.platforms.map((p) => (
              <span key={p} className="kz-platform" style={{ background: PLATFORM_COLOR[p as Platform] ?? 'var(--ink)' }}>{PLATFORM_LABEL[p as Platform] ?? p}</span>
            ))}
          </div>
        )}

        <div className="row between" style={{ '--gap': '8px' } as React.CSSProperties}>
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            <LikeButton postId={post.id} liked={extras.liked.has(post.id)} count={post.like_count} />
            <a href="#uj-hozzaszolas" className="kz-react">💬 {post.comment_count}</a>
            {isQa && (isOwner || isAdmin) && (
              <form action={toggleSolved}>
                <input type="hidden" name="post_id" value={post.id} />
                <button type="submit" className="kz-react">{post.solved ? '↺ Visszanyitom' : '✅ Megoldva'}</button>
              </form>
            )}
          </div>
          <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
            {(isOwner || isAdmin) && !editing && <Link href={`/kozosseg/poszt/${post.id}?szerkeszt=1`} className="kz-react">✏️ Szerkesztés</Link>}
            {isAdmin && (
              <form action={togglePin}>
                <input type="hidden" name="post_id" value={post.id} />
                <button type="submit" className="kz-react">{post.pinned ? 'Kitűzés le' : '📌 Kitűzés'}</button>
              </form>
            )}
            {(isOwner || isAdmin) && (
              <form action={deletePost}>
                <input type="hidden" name="post_id" value={post.id} />
                <ConfirmButton className="kz-react" message="Biztosan törlöd ezt a bejegyzést a hozzászólásokkal és képekkel együtt?">Törlés</ConfirmButton>
              </form>
            )}
            {!isOwner && (
              <details className="kz-inline">
                <summary className="kz-react" title="Bejelentés">⚑ Bejelentem</summary>
                <form action={reportContent} className="kz-inline-body stack" style={{ '--gap': '8px' } as React.CSSProperties}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <input className="input" name="reason" maxLength={500} placeholder="Mi a gond vele? (nem kötelező)" />
                  <SubmitButton className="btn sm light">Bejelentem</SubmitButton>
                </form>
              </details>
            )}
          </div>
        </div>

        {isAdmin && (
          <details className="kz-admin">
            <summary>Admin: áthelyezés másik térbe</summary>
            <form action={movePost} className="row" style={{ '--gap': '8px', marginTop: 10 } as React.CSSProperties}>
              <input type="hidden" name="post_id" value={post.id} />
              <select className="select" name="space" defaultValue={space?.slug} style={{ width: 'auto' }}>
                {(allSpaces ?? []).map((s) => (
                  <option key={s.slug} value={s.slug}>{s.icon} {s.name}</option>
                ))}
              </select>
              <select className="select" name="course_id" defaultValue={post.course_id ?? ''} style={{ width: 'auto' }}>
                <option value="">(tanfolyami térhez: tanfolyam)</option>
                {adminCourses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <SubmitButton className="btn sm">Áthelyezem</SubmitButton>
            </form>
          </details>
        )}
      </article>

      <section id="hozzaszolasok" className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <h2 className="h3">{post.comment_count} {isQa ? 'válasz' : 'hozzászólás'}</h2>
        {top.length === 0 && (
          <p className="muted" style={{ margin: 0 }}>{isQa ? 'Még senki nem válaszolt. Ha tudod a választ, ne fogd vissza magad!' : 'Írd meg elsőként, mi tetszik benne!'}</p>
        )}
        {top.map((c) => commentView(c))}
        <div id="uj-hozzaszolas" style={{ scrollMarginTop: 24 }}>
          <CommentForm action={addComment} postId={post.id} userId={user.id} placeholder={isQa ? 'Írd le lépésről lépésre, hogyan oldanád meg.' : 'Mi tetszik benne? Van egy jó tipped?'} />
        </div>
      </section>
    </>
  );
}
