'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ACADEMY, ACADEMY_LEVELS, ACADEMY_QUIZ, academyLevelFrom, isAcademyLevel, type AcademyLevel } from '@/lib/polyakademia';

const STORE_KEY = 'polyakademia-level';
const LEVEL_ORDER: AcademyLevel[] = [3, 2, 1];

export type PyramidCourse = { slug: string; title: string; mark: 'first' | 'new' | null };

function save(level: AcademyLevel | null) {
  try {
    if (level) localStorage.setItem(STORE_KEY, String(level));
    else localStorage.removeItem(STORE_KEY);
  } catch {}
}

// Az oktatási piramis (szintenként a tanfolyamokkal) + a belépő Claude-piramis teszt.
// Előbb a teszt, alatta a piramis. A teszt eredménye kijelöli a piramis szintjét („Itt tartasz”), és odagörget (#szint-1..3).
export function AcademyQuiz({ pyramid }: { pyramid: Record<AcademyLevel, PyramidCourse[]> }) {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() => ACADEMY_QUIZ.map(() => null));
  const [mine, setMine] = useState<AcademyLevel | null>(null);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORE_KEY));
      if (isAcademyLevel(saved)) setMine(saved);
    } catch {}
  }, []);

  const q = ACADEMY_QUIZ[idx];
  const picked = picks[idx];
  const last = idx === ACADEMY_QUIZ.length - 1;

  function pick(i: number) {
    setPicks((p) => p.map((v, j) => (j === idx ? i : v)));
  }
  function next() {
    if (picked === null) return;
    if (!last) return setIdx(idx + 1);
    const level = academyLevelFrom(picks.map((p) => p ?? 0));
    setMine(level);
    save(level);
  }
  function retry() {
    setIdx(0);
    setPicks(ACADEMY_QUIZ.map(() => null));
    setMine(null);
    save(null);
  }
  const goTo = (level: AcademyLevel) => document.getElementById(`szint-${level}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  return (
    <>
      <section id="teszt" className="card stack ps-anchor" style={{ '--gap': '18px' } as React.CSSProperties} aria-live="polite">
        <div className="row between">
          <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
            <div className="eyebrow">Hol tartasz? · Claude-piramis teszt · ingyenes · 2 perc</div>
            <span className="muted" style={{ fontSize: 14 }}>Instán is megkapod: kommenteld, hogy <span className="ps-kw">{ACADEMY.entryKeyword}</span></span>
          </div>
          <div className="row" style={{ '--gap': '12px' } as React.CSSProperties}>
            <div className="ps-progress" aria-hidden="true">
              {ACADEMY_QUIZ.map((_, i) => (
                <i key={i} className={mine || i < idx ? 'done' : i === idx ? 'now' : ''} />
              ))}
            </div>
            <span className="mono muted" style={{ fontSize: 12 }}>{mine ? 'Kész' : `${idx + 1} / ${ACADEMY_QUIZ.length}`}</span>
          </div>
        </div>

        {mine ? (
          <div className="ps-result">
            <span className="eyebrow">Az eredményed</span>
            <div className="ps-result-level">{ACADEMY_LEVELS[mine].name}</div>
            <p>{ACADEMY_LEVELS[mine].result}</p>
            <div className="row">
              <button type="button" className="btn ps-lime" onClick={() => goTo(mine)}>Mutasd a szintemet a piramison ↓</button>
              <button type="button" className="btn light" onClick={retry}>Újra kitöltöm</button>
            </div>
          </div>
        ) : (
          <>
            <h2 className="h3" style={{ fontSize: 'clamp(22px, 3vw, 30px)' }}>{q.q}</h2>
            <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
              {q.a.map((text, i) => (
                <button key={i} type="button" className={`ps-answer${picked === i ? ' picked' : ''}`} aria-pressed={picked === i} onClick={() => pick(i)}>
                  <span className="ps-letter">{'ABC'[i]}</span>
                  <span>{text}</span>
                </button>
              ))}
            </div>
            <div className="row between">
              <button type="button" className="btn light sm" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>← Vissza</button>
              <button type="button" className="btn sm" onClick={next} disabled={picked === null}>{last ? 'Megnézem az eredményt →' : 'Tovább →'}</button>
            </div>
          </>
        )}
      </section>
      <section id="piramis" className="card stack ps-anchor" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Az oktatási piramis</div>
          <h2 className="h2">Három szint. Mindegyik a lentire épül.</h2>
          <p className="lead">
            Alulról indulsz: előbb Claude megismeri a céged és a hangodat, aztán az ismétlődő munkáidat skillekbe teszed, végül a skilleket ügynökökké és appokká kötöd össze.
            Minden munkaterülethez van tanfolyam – kattints egyre.
          </p>
        </div>
        <div className="ps-pyramid">
          {LEVEL_ORDER.map((level) => (
            <div key={level} id={`szint-${level}`} className={`ps-level ps-anchor${level === 3 ? ' top' : ''}${mine === level ? ' mine' : ''}`} data-level={level}>
              <button type="button" className="ps-level-head" onClick={() => goTo(level)}>
                <span className="mono ps-lnum">{level}. szint · {pyramid[level].length} tanfolyam</span>
                <b>{ACADEMY_LEVELS[level].short}</b>
                <span className="ps-ldesc">{ACADEMY_LEVELS[level].desc}</span>
              </button>
              {mine === level && <span className="ps-you">Itt tartasz</span>}
              <div className="ps-chips">
                {pyramid[level].map((c) => (
                  <Link key={c.slug} href={`/kurzusok/${c.slug}`} className={`ps-chip${c.mark ? ` ${c.mark}` : ''}`}>{c.title}</Link>
                ))}
              </div>
            </div>
          ))}
          <div className="ps-legend">
            <span><i className="first" />ezzel kezdj</span>
            <span><i className="new" />új tanfolyam</span>
          </div>
        </div>
      </section>

    </>
  );
}
