import Link from 'next/link';
import { toggleLike } from '@/app/kozosseg/actions';
import { Avatar } from '@/components/community/Avatar';
import { LinkCard } from '@/components/community/LinkCard';
import { RichText } from '@/components/community/RichText';
import {
  isVideoPath,
  memberFor,
  memberHref,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  plainText,
  postHref,
  TAG_ICON,
  TAG_LABEL,
  timeAgo,
  type CommunityPost,
  type CommunityProfile,
  type Platform,
} from '@/lib/community';

export function AuthorLine({
  userId,
  name,
  admin,
  at,
  profile,
  avatar,
  size = 40,
}: {
  userId: string;
  name: string;
  admin: boolean;
  at: string;
  profile?: CommunityProfile;
  avatar?: string | null;
  size?: number;
}) {
  const shown = profile?.display_name || name;
  return (
    <div className="row" style={{ '--gap': '10px', flexWrap: 'nowrap', minWidth: 0 } as React.CSSProperties}>
      <Link href={memberHref(userId)} aria-label={shown}><Avatar name={shown} src={avatar} size={size} /></Link>
      <div className="stack" style={{ '--gap': '1px', minWidth: 0 } as React.CSSProperties}>
        <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <Link href={memberHref(userId)} style={{ fontWeight: 700, fontSize: 14.5 }}>{shown}</Link>
          {admin && <span className="kz-badge mentor">Mentor</span>}
          <time dateTime={at} className="muted" style={{ fontSize: 12.5 }}>· {timeAgo(at)}</time>
        </span>
        <span className="muted" style={{ fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile?.bio || (profile ? memberFor(profile.member_since) : admin ? 'Andor Marcsi csapata' : 'Tag')}
        </span>
      </div>
    </div>
  );
}

export function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  return (
    <form action={toggleLike}>
      <input type="hidden" name="post_id" value={postId} />
      <button type="submit" className={`kz-react${liked ? ' on' : ''}`} aria-pressed={liked} title={liked ? 'Visszavonom' : 'Tetszik'}>
        <span aria-hidden="true">{liked ? '❤️' : '🤍'}</span> {count}
      </button>
    </form>
  );
}

export function MediaGrid({ paths, signed, single = false, href }: { paths: string[]; signed: Map<string, string>; single?: boolean; href?: string }) {
  const items = paths.flatMap((p) => (signed.get(p) ? [{ src: signed.get(p)!, video: isVideoPath(p) }] : []));
  if (!items.length) return null;
  const big = single || items.length === 1;
  const grid = (
    <div className="kz-media" style={{ gridTemplateColumns: big ? '1fr' : `repeat(${Math.min(items.length, 3)}, 1fr)` }}>
      {items.slice(0, big ? 1 : 3).map((m, i) => (
        <span key={i} className="kz-media-item" style={{ aspectRatio: big ? '16 / 10' : '1' }}>
          {m.video ? (
            <>
              {/* #t=0.1: így a mobil Safari is az első képkockát mutatja borítónak */}
              <video src={`${m.src}#t=0.1`} muted playsInline preload="metadata" />
              <span className="lesson-hero-play" aria-hidden="true" style={{ width: 52, height: 52, fontSize: 18 }}>▶</span>
            </>
          ) : (
            <img src={m.src} alt="" loading="lazy" />
          )}
        </span>
      ))}
    </div>
  );
  return href ? <Link href={href}>{grid}</Link> : grid;
}

// Bejegyzés-kártya a feedben
export function PostCard({
  post,
  profile,
  avatar,
  signed,
  liked,
  courseTitle,
  spaceLabel,
}: {
  post: CommunityPost;
  profile?: CommunityProfile;
  avatar?: string | null;
  signed: Map<string, string>;
  liked: boolean;
  courseTitle?: string | null;
  spaceLabel?: string | null;
}) {
  const body = plainText(post.body);
  const long = body.length > 220 || body.split('\n').length > 3;
  const isQ = post.kind === 'question';
  return (
    <article className={`card kz-post${post.pinned ? ' pinned' : ''}`}>
      <div className="row between" style={{ '--gap': '8px', alignItems: 'flex-start', flexWrap: 'nowrap' } as React.CSSProperties}>
        <AuthorLine userId={post.user_id} name={post.author_name} admin={post.author_is_admin} at={post.created_at} profile={profile} avatar={avatar} />
        <div className="row" style={{ '--gap': '6px', justifyContent: 'flex-end' } as React.CSSProperties}>
          {post.pinned && <span className="kz-badge pin">📌 Kitűzve</span>}
          {isQ && (post.solved ? <span className="kz-badge ok">✅ Megoldva</span> : <span className="kz-badge">Kérdés</span>)}
          {post.tag && <span className={`kz-badge tag-${post.tag}`}>{TAG_ICON[post.tag]} {TAG_LABEL[post.tag]}</span>}
        </div>
      </div>
      <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
        {(spaceLabel || courseTitle) && <span className="tag muted" style={{ fontSize: 11 }}>{[spaceLabel, courseTitle && `#${courseTitle}`].filter(Boolean).join(' · ')}</span>}
        <h2 className="h3" style={{ margin: 0, fontSize: 21 }}>
          <Link href={postHref(post.id)}>{post.title}</Link>
        </h2>
        {post.body && <RichText text={post.body} className="kz-clamp" />}
        {long && <Link href={postHref(post.id)} className="kz-more">Tovább…</Link>}
      </div>
      <MediaGrid paths={post.images} signed={signed} single={post.kind === 'showcase' && post.images.length === 1} href={postHref(post.id)} />
      {post.link_url && <LinkCard url={post.link_url} preview={post.link_preview} compact />}
      {post.platforms.length > 0 && (
        <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          {post.platforms.map((p) => (
            <span key={p} className="kz-platform" style={{ background: PLATFORM_COLOR[p as Platform] ?? 'var(--ink)' }}>{PLATFORM_LABEL[p as Platform] ?? p}</span>
          ))}
        </div>
      )}
      <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
        <LikeButton postId={post.id} liked={liked} count={post.like_count} />
        <Link href={`${postHref(post.id)}#hozzaszolasok`} className="kz-react">💬 {post.comment_count}</Link>
        {isQ && !post.solved && post.comment_count === 0 && <span className="kz-badge warn">Válaszra vár</span>}
        {post.tag === 'feedback' && post.comment_count === 0 && <span className="kz-badge warn">Visszajelzésre vár</span>}
      </div>
    </article>
  );
}
