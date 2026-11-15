import { initials, splitLinks, timeAgo } from '@/lib/community';
import { toggleLike } from './actions';

// Közös építőelemek a közösség hírfolyamához és a bejegyzés oldalához.

export function Avatar({ name, admin, size = 36 }: { name: string; admin?: boolean; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flex: 'none',
        display: 'grid',
        placeItems: 'center',
        background: admin ? 'var(--purple)' : 'var(--paper)',
        color: admin ? '#fff' : 'var(--ink)',
        fontWeight: 700,
        fontSize: size * 0.38,
      }}
    >
      {initials(name)}
    </span>
  );
}

export function AuthorLine({ name, admin, at, size }: { name: string; admin: boolean; at: string; size?: number }) {
  return (
    <div className="row" style={{ '--gap': '10px', flexWrap: 'nowrap' } as React.CSSProperties}>
      <Avatar name={name} admin={admin} size={size} />
      <div className="stack" style={{ '--gap': '1px', minWidth: 0 } as React.CSSProperties}>
        <span className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
          <strong style={{ fontSize: 14 }}>{name}</strong>
          {admin && <span className="pill new" style={{ padding: '2px 8px', fontSize: 10 }}>Oktató</span>}
        </span>
        <time dateTime={at} className="muted" style={{ fontSize: 12 }} suppressHydrationWarning>
          {timeAgo(at)}
        </time>
      </div>
    </div>
  );
}

// Felhasználói szöveg: sortörések megtartva, a linkek kattinthatók (új lapon, nofollow).
export function RichText({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', ...style }}>
      {splitLinks(text).map((part, i) =>
        part.href ? (
          <a key={i} href={part.href} target="_blank" rel="noopener noreferrer nofollow ugc" style={{ textDecoration: 'underline', color: 'var(--purple)' }}>
            {part.text}
          </a>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </div>
  );
}

export function LikeButton({ postId, liked, count }: { postId: string; liked: boolean; count: number }) {
  return (
    <form action={toggleLike}>
      <input type="hidden" name="post_id" value={postId} />
      <button
        type="submit"
        className="btn sm light"
        aria-pressed={liked}
        title={liked ? 'Visszavonom a kedvelést' : 'Tetszik'}
        style={liked ? { background: 'oklch(0.95 0.05 15)', borderColor: 'var(--rose)', color: 'var(--ink)' } : undefined}
      >
        {liked ? '♥' : '♡'} {count}
      </button>
    </form>
  );
}
