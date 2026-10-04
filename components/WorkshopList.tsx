'use client';

import Link from 'next/link';
import { useState } from 'react';
import { priceLabel, toolColor } from '@/lib/format';
import { soonLabel } from '@/lib/types';

export type ListCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  teaser: string;
  tool: string;
  level: string;
  price_huf: number | null;
  price_note: string;
  coming_soon: boolean;
  starts_at: string | null;
  bundle_course_ids: string[];
};

// Főoldali kurzuslista témaszűrővel – az adatbázisban lévő (publikus) kurzusokból.
export function WorkshopList({ courses }: { courses: ListCourse[] }) {
  const [filter, setFilter] = useState('Összes');
  const tools = ['Összes', ...Array.from(new Set(courses.map((c) => c.tool)))];
  const list = courses.filter((c) => filter === 'Összes' || c.tool === filter);
  return (
    <>
      <div className="row between" style={{ alignItems: 'flex-end', '--gap': '24px' } as React.CSSProperties}>
        <div className="stack" style={{ maxWidth: 620, '--gap': '12px' } as React.CSSProperties}>
          <div className="eyebrow">Kurzusok</div>
          <h2 className="h2">Mit tanulhatsz nálam?</h2>
          <p className="lead" style={{ margin: 0 }}>
            Válaszd ki, mivel kezdenéd. Ha nem tudod, kezdd a Canvával – az a legkevésbé ijesztő, és a végére lesz valami, amit megmutathatsz anyukádnak.
          </p>
        </div>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          {tools.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className="btn sm"
              style={{ background: filter === f ? 'var(--ink)' : '#fff', color: filter === f ? '#fff' : 'var(--ink)', borderColor: 'var(--ink)', fontSize: 14 }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        {list.length === 0 && <p className="lead">Hamarosan érkeznek az első kurzusok.</p>}
        {list.map((c) => (
          <article key={c.id} className="ws-card">
            <div className="ws-tool" style={{ background: toolColor(c.tool) }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, letterSpacing: '-.03em' }}>{c.tool}</span>
              <span className="tag">{c.bundle_course_ids?.length ? `Csomag · ${c.bundle_course_ids.length} modul` : c.level}</span>
            </div>
            <div className="ws-body">
              <h3 className="h3">
                <Link href={`/kurzusok/${c.slug}`}>{c.title}</Link>
              </h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)' }}>{c.teaser || c.description || c.subtitle}</p>
            </div>
            <div className="ws-meta">
              <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
                {c.coming_soon && <span className="pill new" style={{ alignSelf: 'flex-start' }}>{soonLabel(c)}</span>}
                <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 22, letterSpacing: '-.02em' }}>{priceLabel(c)}</span>
              </div>
              <Link href={`/kurzusok/${c.slug}`} className="btn sm">
                {c.coming_soon ? 'Szólj, ha indul' : 'Részletek'}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
