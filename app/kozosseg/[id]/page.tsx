import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { SubmitButton } from '@/components/SubmitButton';
import { requireUser } from '@/lib/auth';
import { hasCommunityAccess, isVideoPath, KIND_LABEL, signImages, type CommunityComment, type CommunityPost } from '@/lib/community';
import { addComment, deleteComment, deletePost, markBestAnswer, togglePin } from '../actions';
import { AuthorLine, LikeButton, RichText } from '../parts';

export const metadata: Metadata = { title: 'Közösség', robots: { index: false, follow: false } };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function CommunityPostPage({ params, searchParams }: Props) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase, user, profile } = await requireUser(`/kozosseg/${id}`);
  if (!(await hasCommunityAccess(supabase))) redirect('/kozosseg');

  const [{ data: post }, { data: rawComments }, { count: likeCount }, { data: myLike }] = await Promise.all([
    supabase.from('community_posts').select('*').eq('id', id).maybeSingle<CommunityPost>(),
    supabase.from('community_comments').select('*').eq('post_id', id).order('created_at').returns<CommunityComment[]>(),
    supabase.from('community_likes').select('post_id', { count: 'exact', head: true }).eq('post_id', id),
    supabase.from('community_likes').select('post_id').eq('post_id', id).eq('user_id', user.id).maybeSingle(),
  ]);
  if (!post) notFound();

  const [{ data: course }, signed] = await Promise.all([
    post.course_id ? supabase.from('courses').select('id, title').eq('id', post.course_id).maybeSingle() : Promise.resolve({ data: null }),
    signImages(supabase, post.images),
  ]);
  const isAdmin = !!profile?.is_admin;
  const isOwner = post.user_id === user.id;
  const canPickBest = post.kind === 'question' && (isOwner || isAdmin);
  // A legjobb válasz kerül előre, a többi időrendben.
  const comments = [...(rawComments ?? [])].sort((a, b) => Number(b.id === post.best_comment_id) - Number(a.id === post.best_comment_id));

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/kozosseg" className="tag">← Közösség</Link>
      </div>
      {sp.hiba && <div className="notice err">{sp.hiba}</div>}

      <div style={{ maxWidth: 820, width: '100%', margin: '0 auto' }} className="stack">
        <article className="card stack" style={{ '--gap': '20px', outline: post.pinned ? '2px solid var(--purple)' : undefined } as React.CSSProperties}>
          <div className="row between" style={{ '--gap': '8px', alignItems: 'flex-start' } as React.CSSProperties}>
            <AuthorLine name={post.author_name} admin={post.author_is_admin} at={post.created_at} size={44} />
            <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
              {post.pinned && <span className="pill new">Kiemelt</span>}
              <span className={`pill${post.kind === 'showcase' ? ' ok' : ''}`}>{KIND_LABEL[post.kind]}</span>
            </div>
          </div>
          <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
            <h1 className="h2" style={{ fontSize: 'clamp(26px, 3.4vw, 40px)', overflowWrap: 'anywhere' }}>{post.title}</h1>
            {course && (
              <Link href={`/kozosseg?tema=${course.id}`} className="tag muted" style={{ fontSize: 11 }}>#{course.title}</Link>
            )}
          </div>
          {post.body && <RichText text={post.body} style={{ fontSize: 16 }} />}
          {post.images.length > 0 && (
            <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
              {post.images.map((path) => {
                const src = signed.get(path);
                if (!src) return null;
                if (isVideoPath(path)) {
                  return (
                    <video
                      key={path}
                      src={`${src}#t=0.1`}
                      controls
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', maxHeight: 720, borderRadius: 18, background: 'var(--ink)', display: 'block' }}
                    />
                  );
                }
                return (
                  <a key={path} href={src} target="_blank" rel="noopener noreferrer" title="Megnyitás teljes méretben">
                    <img src={src} alt="" style={{ width: '100%', maxHeight: 720, objectFit: 'contain', borderRadius: 18, background: 'var(--paper)', display: 'block' }} />
                  </a>
                );
              })}
            </div>
          )}
          <div className="row between" style={{ '--gap': '8px' } as React.CSSProperties}>
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <LikeButton postId={post.id} liked={!!myLike} count={likeCount ?? 0} />
              <a href="#uj-hozzaszolas" className="btn sm light">💬 {post.kind === 'question' ? 'Válaszolok' : 'Hozzászólok'}</a>
            </div>
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              {isAdmin && (
                <form action={togglePin}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button type="submit" className="btn sm light">{post.pinned ? 'Kiemelés levétele' : '📌 Kiemelés'}</button>
                </form>
              )}
              {(isOwner || isAdmin) && (
                <form action={deletePost}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <ConfirmButton className="btn sm light" message="Biztosan törlöd ezt a bejegyzést a hozzászólásokkal és képekkel együtt?">
                    Törlés
                  </ConfirmButton>
                </form>
              )}
            </div>
          </div>
        </article>

        <section id="hozzaszolasok" className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
          <h2 className="h3">
            {comments.length} {post.kind === 'question' ? 'válasz' : 'hozzászólás'}
          </h2>
          {comments.length === 0 && (
            <p className="muted" style={{ margin: 0 }}>
              {post.kind === 'question' ? 'Még senki nem válaszolt. Ha tudod a választ, ne fogd vissza magad!' : 'Írd meg elsőként, mi tetszik benne!'}
            </p>
          )}
          {comments.map((c) => {
            const best = c.id === post.best_comment_id;
            return (
              <div
                key={c.id}
                id={`c-${c.id}`}
                className="stack"
                style={{ '--gap': '10px', padding: '16px 18px', borderRadius: 18, background: best ? 'oklch(0.95 0.05 165)' : 'var(--paper)', scrollMarginTop: 24 } as React.CSSProperties}
              >
                <div className="row between" style={{ '--gap': '8px', alignItems: 'flex-start' } as React.CSSProperties}>
                  <AuthorLine name={c.author_name} admin={c.author_is_admin} at={c.created_at} size={32} />
                  {best && <span className="pill ok">✓ Legjobb válasz</span>}
                </div>
                <RichText text={c.body} />
                {(canPickBest || c.user_id === user.id || isAdmin) && (
                  <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
                    {canPickBest && (
                      <form action={markBestAnswer}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="comment_id" value={best ? '' : c.id} />
                        <button type="submit" className="btn sm light" style={{ padding: '6px 12px', fontSize: 12 }}>
                          {best ? 'Visszavonom' : '✓ Ez segített'}
                        </button>
                      </form>
                    )}
                    {(c.user_id === user.id || isAdmin) && (
                      <form action={deleteComment}>
                        <input type="hidden" name="post_id" value={post.id} />
                        <input type="hidden" name="comment_id" value={c.id} />
                        <ConfirmButton className="btn sm light" message="Biztosan törlöd ezt a hozzászólást?">
                          <span style={{ fontSize: 12 }}>Törlés</span>
                        </ConfirmButton>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <form id="uj-hozzaszolas" action={addComment} className="stack" style={{ '--gap': '10px', scrollMarginTop: 24 } as React.CSSProperties}>
            <input type="hidden" name="post_id" value={post.id} />
            <label className="field">
              {post.kind === 'question' ? 'Válaszod' : 'Hozzászólásod'}
              <textarea
                className="input textarea"
                name="body"
                required
                maxLength={3000}
                rows={4}
                placeholder={post.kind === 'question' ? 'Írd le lépésről lépésre, hogyan oldanád meg.' : 'Mi tetszik benne? Van egy jó tipped?'}
              />
            </label>
            <div className="row" style={{ justifyContent: 'flex-end' }}>
              <SubmitButton className="btn" pending="Küldés…">Elküldöm</SubmitButton>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
