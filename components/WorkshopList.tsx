'use client';

import { useState } from 'react';
import { TOOL_COLORS } from '@/lib/format';

const WORKSHOPS = [
  { tool: 'Canva', level: 'Kezdő', title: 'Canva az első lépésektől', desc: 'Felület, sablonok, színek, betűk – és az első saját poszted 90 perc alatt.', meta: '90 perc · online' },
  { tool: 'Canva', level: 'Haladó kezdő', title: 'Egységes arculat Canvában', desc: 'Márkakészlet, újrahasználható sablonok és közösségi média csomag egyszerre.', meta: '2 × 90 perc · online' },
  { tool: 'Claude', level: 'Kezdő', title: 'Claude alapok: beszélgess az AI-jal', desc: 'Hogyan kérdezz jól? Szövegírás, ötletelés és összefoglalás a mindennapokban.', meta: '2 óra · online / élő' },
  { tool: 'Claude', level: 'Haladó kezdő', title: 'Claude a munkádban', desc: 'Ismétlődő feladatok kiszervezése, e-mailek, dokumentumok és saját munkafolyamatok.', meta: '3 óra · élő' },
  { tool: 'Polyos', level: 'Kezdő', title: 'Polyos bevezető', desc: 'Az első projekted felépítése nulláról, magyarázatokkal és közös gyakorlással.', meta: '2 óra · online' },
  { tool: 'Hirdetés', level: 'Kezdő', title: 'Hirdetéskezelés AI eszközökkel', desc: 'Hirdetésszövegek Claude-dal, kreatívok Canvában, célzás és mérés – az első kampányod lépésről lépésre.', meta: '3 óra · online / élő' },
];
const FILTERS = ['Összes', 'Canva', 'Claude', 'Polyos', 'Hirdetés'];

export function WorkshopList() {
  const [filter, setFilter] = useState('Összes');
  const list = WORKSHOPS.filter((w) => filter === 'Összes' || w.tool === filter);
  return (
    <>
      <div className="row between" style={{ alignItems: 'flex-end', '--gap': '24px' } as React.CSSProperties}>
        <div className="stack" style={{ maxWidth: 620, '--gap': '12px' } as React.CSSProperties}>
          <div className="eyebrow">Workshopok</div>
          <h2 className="h2">Válaszd ki, mivel kezdenéd.</h2>
        </div>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          {FILTERS.map((f) => (
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
        {list.map((w) => (
          <article key={w.title} style={{ display: 'flex', flexWrap: 'wrap', background: 'var(--paper)', borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ background: TOOL_COLORS[w.tool], padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 16, borderRight: '2px dashed var(--ink)', flex: '1 1 180px', maxWidth: 240 }}>
              <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 26, letterSpacing: '-.03em' }}>{w.tool}</span>
              <span className="tag">{w.level}</span>
            </div>
            <div style={{ flex: '3 1 320px', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
              <h3 className="h3">{w.title}</h3>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink-2)' }}>{w.desc}</p>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', gap: 12, borderLeft: '1px solid var(--line)', flex: '1 0 180px' }}>
              <span style={{ fontSize: 14, color: 'var(--ink-3)' }}>{w.meta}</span>
              <a href="#idopontok" className="btn sm">Jelentkezem</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
