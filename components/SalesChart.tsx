'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export type SalesDay = { date: string; revenue: number; orders: number }; // date: 'YYYY-MM-DD' (Budapest)

const PERIODS = [7, 30, 90] as const;
const PAD = { top: 16, right: 14, bottom: 28, left: 52 };
const LINE = 'oklch(0.5 0.22 295)'; // --purple
const PREV = '#8a8490'; // előző időszak: szürke, szaggatott (viszonyítás, nem önálló sorozat)

const huf = (n: number) => `${Math.round(n).toLocaleString('hu-HU')} Ft`;
const short = (n: number) => (n >= 1e6 ? `${(n / 1e6).toLocaleString('hu-HU', { maximumFractionDigits: 1 })} M` : n >= 1e3 ? `${Math.round(n / 1e3)} e` : `${n}`);
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric', timeZone: 'UTC' }).replace(/\.$/, '');
const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('hu-HU', { weekday: 'short', timeZone: 'UTC' });

// Kerek függőleges tengely: négy egyenlő lépés, a lépés 1 / 2 / 2,5 / 5 × 10^n (pl. 0, 5e, 10e, 15e, 20e).
function niceScale(v: number) {
  const raw = Math.max(v, 1000) / 4;
  const p = 10 ** Math.floor(Math.log10(raw));
  const n = raw / p;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  return { max: step * 4, ticks: [0, 1, 2, 3, 4].map((k) => k * step) };
}

// Napi eladások (Shopify-szerű): a választott időszak vonala, mögötte szaggatottan az előző azonos hosszú időszak.
export function SalesChart({ days }: { days: SalesDay[] }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  // A rajz a tényleges szélességben készül (nem nagyított/kicsinyített), így a feliratok mobilon is olvashatók.
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const H = W < 500 ? 200 : 240;

  const { cur, prev, total, prevTotal, orders, max, ticks } = useMemo(() => {
    const cur = days.slice(-period);
    const prev = days.slice(-2 * period, -period);
    const total = cur.reduce((s, d) => s + d.revenue, 0);
    const prevTotal = prev.reduce((s, d) => s + d.revenue, 0);
    const orders = cur.reduce((s, d) => s + d.orders, 0);
    const { max, ticks } = niceScale(Math.max(...cur.map((d) => d.revenue), ...prev.map((d) => d.revenue)));
    return { cur, prev, total, prevTotal, orders, max, ticks };
  }, [days, period]);

  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (cur.length <= 1 ? iw / 2 : (i / (cur.length - 1)) * iw);
  const y = (v: number) => PAD.top + ih - (v / max) * ih;
  const path = (pts: SalesDay[]) => pts.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.revenue).toFixed(1)}`).join(' ');
  const area = `${path(cur)} L${x(cur.length - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z`;
  const change = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null;
  // Kb. 70 px-enként egy dátumfelirat, a legutolsó nap mindig kap feliratot.
  const labelEvery = Math.max(1, Math.ceil(cur.length / Math.max(2, Math.floor(iw / 70))));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.left) / iw) * (cur.length - 1));
    setHover(Math.max(0, Math.min(cur.length - 1, i)));
  }

  const h = hover != null ? cur[hover] : null;
  const hp = hover != null ? prev[hover] : null;

  return (
    <div className="stack sales" style={{ '--gap': '14px' } as React.CSSProperties}>
      <div className="row between" style={{ alignItems: 'flex-end', '--gap': '12px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '4px' } as React.CSSProperties}>
          <span className="label">Kurzuseladás · utolsó {period} nap</span>
          <div className="row" style={{ '--gap': '10px', alignItems: 'baseline' } as React.CSSProperties}>
            <span className="sales-total">{huf(total)}</span>
            {change != null && (
              <span className={`sales-change${change < 0 ? ' down' : ''}`}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}%</span>
            )}
          </div>
          <span className="muted" style={{ fontSize: 13 }}>
            {orders} rendelés{orders ? ` · átlag ${huf(total / orders)}` : ''} · előző {period} nap: {huf(prevTotal)}
          </span>
        </div>
        <div className="sales-tabs" role="tablist" aria-label="Időszak">
          {PERIODS.map((p) => (
            <button key={p} type="button" role="tab" aria-selected={p === period} className={p === period ? 'on' : ''} onClick={() => { setPeriod(p); setHover(null); }}>
              {p} nap
            </button>
          ))}
        </div>
      </div>

      <div className="sales-plot" ref={boxRef}>
        <svg
          ref={svgRef}
          width={W}
          height={H}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`Napi kurzuseladás az utolsó ${period} napban, összesen ${huf(total)}`}
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#ece8e2" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="sales-axis">{short(t)}</text>
            </g>
          ))}
          {cur.map((d, i) =>
            i % labelEvery === (cur.length - 1) % labelEvery ? (
              <text key={d.date} x={x(i)} y={H - 8} textAnchor={i === cur.length - 1 ? 'end' : i === 0 ? 'start' : 'middle'} className="sales-axis">{dayLabel(d.date)}</text>
            ) : null,
          )}
          {prev.length === cur.length && <path d={path(prev)} fill="none" stroke={PREV} strokeWidth={1.5} strokeDasharray="4 4" />}
          <path d={area} fill={LINE} opacity={0.08} />
          <path d={path(cur)} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {h && hover != null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + ih} stroke="#141216" strokeOpacity={0.25} />
              <circle cx={x(hover)} cy={y(h.revenue)} r={5} fill={LINE} stroke="#fff" strokeWidth={2} />
            </g>
          )}
        </svg>
        {h && hover != null && (
          <div
            className="sales-tip"
            role="status"
            style={{ left: `${(x(hover) / W) * 100}%`, transform: `translateX(${x(hover) / W < 0.2 ? '0' : x(hover) / W > 0.8 ? '-100%' : '-50%'})` }}
          >
            <b>{weekday(h.date)} · {dayLabel(h.date)}</b>
            <span>{huf(h.revenue)} · {h.orders} rendelés</span>
            {hp && <span className="muted">előző időszak ({dayLabel(hp.date)}): {huf(hp.revenue)}</span>}
          </div>
        )}
      </div>

      <div className="row" style={{ '--gap': '16px', fontSize: 13 } as React.CSSProperties}>
        <span className="sales-key"><i style={{ background: LINE }} /> utolsó {period} nap</span>
        <span className="sales-key"><i className="dash" style={{ borderColor: PREV }} /> előző {period} nap</span>
      </div>

      <details>
        <summary className="muted" style={{ fontSize: 13, cursor: 'pointer' }}>Napi bontás táblázatban</summary>
        <table className="table" style={{ marginTop: 8 }}>
          <thead><tr><th>Nap</th><th>Rendelés</th><th style={{ textAlign: 'right' }}>Eladás</th></tr></thead>
          <tbody>
            {[...cur].reverse().filter((d) => d.orders > 0).map((d) => (
              <tr key={d.date}><td>{weekday(d.date)} · {dayLabel(d.date)}</td><td>{d.orders}</td><td style={{ textAlign: 'right' }}>{huf(d.revenue)}</td></tr>
            ))}
            {!cur.some((d) => d.orders > 0) && <tr><td colSpan={3} className="muted">Ebben az időszakban nem volt eladás.</td></tr>}
          </tbody>
        </table>
      </details>
    </div>
  );
}
