import Link from 'next/link';
import { SUBSCRIPTION } from '@/lib/config';
import { formatHuf, priceLabel } from '@/lib/format';
import { packageKind } from '@/lib/polyakademia';
import type { Course } from '@/lib/types';

// A Claude alapozó oldalán: „Amire még szükséged lehet” – a zsebcsomagok és a kisebb (ingyenes) anyagok,
// a végén a tagság: ne fizess mindenért külön.
export function AlapozoExtras({ items, owned, subscribed }: { items: Course[]; owned: string[]; subscribed: boolean }) {
  if (!items.length) return null;
  const paid = items.filter((c) => (c.price_huf ?? 0) > 0);
  const separately = paid.reduce((s, c) => s + (c.price_huf ?? 0), 0);
  return (
    <div id="ajanlott" className="stack" style={{ '--gap': '12px', scrollMarginTop: 24 } as React.CSSProperties}>
      <h2 className="h3">Amire még szükséged lehet</h2>
      <p className="muted" style={{ margin: 0 }}>
        Kis, kész csomagok egy-egy témára: skill vagy prompt-pack útmutatóval. Ha az alapozóban valamelyik csapattag megtetszett, ezekkel tovább viheted.
      </p>
      {items.map((p) => {
        const mine = owned.includes(p.id);
        return (
          <Link key={p.id} href={`/kurzusok/${p.slug}`} className="ps-pocket ps-pocket-link">
            <span className="stack" style={{ '--gap': '2px' } as React.CSSProperties}>
              <b>{p.title.replace(/^(Zsebkurzus|Ingyenes): /, '')}</b>
              <span className="muted" style={{ fontSize: 14 }}>{packageKind(p)}{p.subtitle ? ` · ${p.subtitle}` : ''}</span>
            </span>
            <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <span className="ps-pocket-price">{mine ? 'A tiéd' : priceLabel(p)}</span>
              <span className="btn sm">{mine ? 'Megnyitom' : p.price_huf === 0 ? 'Olvasom' : 'Megnézem'} →</span>
            </span>
          </Link>
        );
      })}
      {!subscribed && (
        <div className="card dark stack" style={{ '--gap': '10px', padding: 'clamp(20px, 3vw, 28px)', marginTop: 8 } as React.CSSProperties}>
          <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            <span className="eyebrow" style={{ color: 'var(--amber)' }}>PolySuli tagság</span>
            {!SUBSCRIPTION.enabled && <span className="pill new">Hamarosan</span>}
          </span>
          <strong style={{ fontFamily: 'var(--display)', fontSize: 'clamp(22px, 2.6vw, 28px)', lineHeight: 1.15 }}>
            Ne fizess mindenért külön – itt az előfizetés!
          </strong>
          <span style={{ color: '#cfcad4', fontSize: 15, lineHeight: 1.55 }}>
            Tagként minden zsebcsomag és skill-anyag a tiéd, amíg tag vagy, plusz heti online Q&amp;A és zárt közösség – {formatHuf(SUBSCRIPTION.priceHuf)}/hó,
            bármikor lemondható.{separately > SUBSCRIPTION.priceHuf ? ` Csak a fenti csomagok külön ${formatHuf(separately)} lennének.` : ''}
          </span>
          <Link href="/elofizetes" className="btn amber" style={{ alignSelf: 'flex-start' }}>
            {SUBSCRIPTION.enabled ? 'Belépek a tagságba →' : 'A tagságról →'}
          </Link>
        </div>
      )}
    </div>
  );
}
