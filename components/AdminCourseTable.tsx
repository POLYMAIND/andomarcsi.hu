'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { toolColor } from '@/lib/format';
import { STATUS_LABEL, type CourseStatus } from '@/lib/types';

export type AdminCourseRow = {
  id: string;
  title: string;
  tool: string;
  lessons: number;
  price: string;
  status: CourseStatus;
  soonLabel: string;
};

type StatusFilter = 'all' | CourseStatus;
const STATUS_FILTERS: StatusFilter[] = ['all', 'live', 'soon', 'draft'];

// Admin kurzustábla: keresés cím szerint, szűrés állapotra és eszközre.
export function AdminCourseTable({ courses }: { courses: AdminCourseRow[] }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [tool, setTool] = useState('all');

  const tools = useMemo(() => Array.from(new Set(courses.map((c) => c.tool).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'hu')), [courses]);
  const counts = useMemo(() => {
    const byTool = tool === 'all' ? courses : courses.filter((c) => c.tool === tool);
    const n = (s: CourseStatus) => byTool.filter((c) => c.status === s).length;
    return { all: byTool.length, live: n('live'), soon: n('soon'), draft: n('draft') };
  }, [courses, tool]);

  const q = query.trim().toLocaleLowerCase('hu');
  const list = courses.filter(
    (c) => (status === 'all' || c.status === status) && (tool === 'all' || c.tool === tool) && (!q || c.title.toLocaleLowerCase('hu').includes(q)),
  );
  const filtered = status !== 'all' || tool !== 'all' || q !== '';

  return (
    <>
      <div className="row" style={{ '--gap': '8px', alignItems: 'center' } as React.CSSProperties}>
        <input
          type="search"
          className="input"
          placeholder="Keresés a kurzusok között…"
          aria-label="Keresés a kurzusok között"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ flex: '1 1 220px', width: 'auto', padding: '9px 14px' }}
        />
        {tools.length > 1 && (
          <select
            className="select"
            aria-label="Szűrés eszközre"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            style={{ flex: '0 1 180px', width: 'auto', padding: '9px 14px' }}
          >
            <option value="all">Minden eszköz</option>
            {tools.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>
      <div className="row" style={{ '--gap': '8px' } as React.CSSProperties} role="group" aria-label="Szűrés állapotra">
        {STATUS_FILTERS.map((s) => {
          const active = status === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={active}
              className="btn sm"
              style={{ background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', borderColor: 'var(--ink)', fontSize: 13 }}
            >
              {s === 'all' ? 'Összes' : STATUS_LABEL[s]} <span className="mono" style={{ opacity: 0.6, marginLeft: 4 }}>{counts[s]}</span>
            </button>
          );
        })}
        {filtered && (
          <button
            type="button"
            className="btn sm light"
            onClick={() => { setQuery(''); setStatus('all'); setTool('all'); }}
            style={{ fontSize: 13 }}
          >
            Szűrők törlése
          </button>
        )}
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Kurzus</th><th>Leckék</th><th>Ár</th><th>Állapot</th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/admin/kurzusok/${c.id}`} className="row" style={{ '--gap': '10px', flexWrap: 'nowrap' } as React.CSSProperties}>
                    <span style={{ width: 12, height: 12, borderRadius: 4, background: toolColor(c.tool), flex: 'none' }} title={c.tool} />
                    <strong>{c.title}</strong>
                  </Link>
                </td>
                <td>{c.lessons}</td>
                <td className="mono">{c.price}</td>
                <td>{{ live: <span className="pill ok">Elérhető</span>, soon: <span className="pill new">{c.soonLabel}</span>, draft: <span className="pill warn">Vázlat</span> }[c.status]}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="muted">{courses.length === 0 ? 'Még nincs kurzus.' : 'Nincs a szűrésnek megfelelő kurzus.'}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
