'use client';

import { useMemo, useState } from 'react';
import { formatDate, formatHuf, formatMoney } from '@/lib/format';

export type AdminEnrollmentRow = {
  createdAt: string;
  email: string;
  courseId: string;
  courseTitle: string;
  source: string;
  amount: number;
};

const SOURCE_LABEL: Record<string, string> = { stripe: 'Stripe', free: 'Ingyenes', manual: 'Kézi' };
const PERIODS = [
  { value: 'all', label: 'Teljes időszak', days: 0 },
  { value: '7', label: 'Utolsó 7 nap', days: 7 },
  { value: '30', label: 'Utolsó 30 nap', days: 30 },
  { value: '90', label: 'Utolsó 90 nap', days: 90 },
];
const PAGE = 20;
const DAY = 864e5;

const fieldStyle = { width: 'auto', padding: '9px 14px' };

// Admin beiratkozás-tábla: keresés (e-mail, kurzus), szűrés kurzusra, forrásra és időszakra.
export function AdminEnrollmentTable({ enrollments }: { enrollments: AdminEnrollmentRow[] }) {
  const [query, setQuery] = useState('');
  const [course, setCourse] = useState('all');
  const [source, setSource] = useState('all');
  const [period, setPeriod] = useState('all');
  const [limit, setLimit] = useState(PAGE);

  const courses = useMemo(() => {
    const m = new Map<string, string>();
    enrollments.forEach((e) => m.set(e.courseId, e.courseTitle));
    return Array.from(m, ([id, title]) => ({ id, title })).sort((a, b) => a.title.localeCompare(b.title, 'hu'));
  }, [enrollments]);
  const sources = useMemo(() => Array.from(new Set(enrollments.map((e) => e.source))), [enrollments]);

  const q = query.trim().toLocaleLowerCase('hu');
  const days = PERIODS.find((p) => p.value === period)?.days ?? 0;
  // A forrás gombok számai a többi szűrőt (keresés, kurzus, időszak) már figyelembe veszik.
  const base = enrollments.filter(
    (e) =>
      (course === 'all' || e.courseId === course) &&
      (!days || Date.now() - new Date(e.createdAt).getTime() < days * DAY) &&
      (!q || e.email.toLocaleLowerCase('hu').includes(q) || e.courseTitle.toLocaleLowerCase('hu').includes(q)),
  );
  const list = source === 'all' ? base : base.filter((e) => e.source === source);
  const total = list.reduce((s, e) => s + e.amount, 0);
  const filtered = q !== '' || course !== 'all' || source !== 'all' || period !== 'all';

  // Szűrőváltáskor újra az első 20 sor látszik.
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setLimit(PAGE); };

  return (
    <>
      <div className="row" style={{ '--gap': '8px', alignItems: 'center' } as React.CSSProperties}>
        <input
          type="search"
          className="input"
          placeholder="Keresés e-mail vagy kurzus szerint…"
          aria-label="Keresés a beiratkozások között"
          value={query}
          onChange={(e) => reset(setQuery)(e.target.value)}
          style={{ ...fieldStyle, flex: '1 1 240px' }}
        />
        <select className="select" aria-label="Szűrés kurzusra" value={course} onChange={(e) => reset(setCourse)(e.target.value)} style={{ ...fieldStyle, flex: '0 1 240px' }}>
          <option value="all">Minden kurzus</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <select className="select" aria-label="Szűrés időszakra" value={period} onChange={(e) => reset(setPeriod)(e.target.value)} style={{ ...fieldStyle, flex: '0 1 170px' }}>
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>
      <div className="row between" style={{ '--gap': '8px', alignItems: 'center' } as React.CSSProperties}>
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties} role="group" aria-label="Szűrés forrásra">
          {['all', ...sources].map((s) => {
            const active = source === s;
            const n = s === 'all' ? base.length : base.filter((e) => e.source === s).length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => reset(setSource)(s)}
                aria-pressed={active}
                className="btn sm"
                style={{ background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', borderColor: 'var(--ink)', fontSize: 13 }}
              >
                {s === 'all' ? 'Összes' : SOURCE_LABEL[s] ?? s} <span className="mono" style={{ opacity: 0.6, marginLeft: 4 }}>{n}</span>
              </button>
            );
          })}
          {filtered && (
            <button
              type="button"
              className="btn sm light"
              onClick={() => { setQuery(''); setCourse('all'); setSource('all'); setPeriod('all'); setLimit(PAGE); }}
              style={{ fontSize: 13 }}
            >
              Szűrők törlése
            </button>
          )}
        </div>
        <span className="muted" style={{ fontSize: 13 }}>
          {list.length} beiratkozás · <span className="mono">{formatMoney(total)}</span>
        </span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Dátum</th><th>Felhasználó</th><th>Kurzus</th><th>Forrás</th><th style={{ textAlign: 'right' }}>Összeg</th></tr></thead>
          <tbody>
            {list.slice(0, limit).map((e, i) => (
              <tr key={i}>
                <td>{formatDate(e.createdAt)}</td>
                <td>{e.email}</td>
                <td>{e.courseTitle}</td>
                <td>{SOURCE_LABEL[e.source] ?? e.source}</td>
                <td style={{ textAlign: 'right' }} className="mono">{formatHuf(e.amount)}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={5} className="muted">{enrollments.length === 0 ? 'Még nincs beiratkozás.' : 'Nincs a szűrésnek megfelelő beiratkozás.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {list.length > limit && (
        <button type="button" className="btn light sm" onClick={() => setLimit((l) => l + PAGE)} style={{ alignSelf: 'center' }}>
          További {Math.min(PAGE, list.length - limit)} megjelenítése ({list.length - limit} rejtve)
        </button>
      )}
    </>
  );
}
