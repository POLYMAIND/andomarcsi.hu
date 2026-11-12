import { CopyButton } from '@/components/CopyButton';
import type { Block, Inline } from '@/lib/guide';

// Az online tananyag megjelenítése. Csak React-elemek, nyers HTML soha (a szöveg mindig escape-elve kerül ki).
function Text({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((p, i) =>
        p.t === 'b' ? <b key={i}>{p.v}</b>
        : p.t === 'code' ? <code key={i}>{p.v}</code>
        : p.t === 'link' ? <a key={i} href={p.href} target="_blank" rel="noopener noreferrer">{p.v}</a>
        : <span key={i}>{p.v}</span>,
      )}
    </>
  );
}

export function GuideView({ blocks }: { blocks: Block[] }) {
  return (
    <div className="guide">
      {blocks.map((b, i) => {
        switch (b.k) {
          case 'h': {
            const H = (`h${b.level + 1}`) as 'h2' | 'h3' | 'h4';
            return <H key={i} id={b.id} className={`guide-h${b.level}`}><Text parts={b.text} /></H>;
          }
          case 'p':
            return <p key={i}><Text parts={b.text} /></p>;
          case 'ul':
            return <ul key={i}>{b.items.map((it, j) => <li key={j}><Text parts={it} /></li>)}</ul>;
          case 'ol':
            return <ol key={i}>{b.items.map((it, j) => <li key={j}><Text parts={it} /></li>)}</ol>;
          case 'tip':
            return (
              <aside key={i} className="guide-tip">
                <span className="mono">{b.label}</span>
                {b.text.map((t, j) => <p key={j}><Text parts={t} /></p>)}
              </aside>
            );
          case 'prompt':
            return (
              <figure key={i} className="guide-prompt">
                <figcaption>
                  <span className="mono">Prompt · {b.title}</span>
                  <CopyButton text={b.body} />
                </figcaption>
                <pre>{b.body}</pre>
              </figure>
            );
          case 'code':
            return (
              <figure key={i} className="guide-prompt code">
                <figcaption>
                  <span className="mono">Sablon</span>
                  <CopyButton text={b.body} />
                </figcaption>
                <pre>{b.body}</pre>
              </figure>
            );
          case 'table':
            return (
              <div key={i} className="guide-table">
                <table>
                  <thead><tr>{b.head.map((c, j) => <th key={j}><Text parts={c} /></th>)}</tr></thead>
                  <tbody>{b.rows.map((r, j) => <tr key={j}>{r.map((c, k) => <td key={k}><Text parts={c} /></td>)}</tr>)}</tbody>
                </table>
              </div>
            );
          case 'hr':
            return <hr key={i} />;
        }
      })}
    </div>
  );
}
