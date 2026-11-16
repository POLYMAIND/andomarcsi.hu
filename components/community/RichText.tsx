import Link from 'next/link';
import { richSegments } from '@/lib/community';

// Felhasználói szöveg: sortörések megtartva, **félkövér**, kattintható linkek (új lapon, nofollow) és @említések.
export function RichText({ text, style, className }: { text: string; style?: React.CSSProperties; className?: string }) {
  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', ...style }}>
      {richSegments(text).map((s, i) =>
        s.type === 'link' ? (
          <a key={i} href={s.href} target="_blank" rel="noopener noreferrer nofollow ugc" className="kz-link">{s.text}</a>
        ) : s.type === 'mention' ? (
          <Link key={i} href={s.href!} className="kz-mention">{s.text}</Link>
        ) : s.type === 'bold' ? (
          <strong key={i} style={{ color: 'var(--ink)' }}>{s.text}</strong>
        ) : (
          <span key={i}>{s.text}</span>
        ),
      )}
    </div>
  );
}
