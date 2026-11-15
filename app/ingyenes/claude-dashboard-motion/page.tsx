import type { Metadata } from 'next';
import { LeadMagnetForm } from '@/components/LeadMagnetForm';
import { SiteNav } from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'Ingyenes segédlet: Claude Dashboard + Claude Motion',
  description:
    'Táblázatból élő dashboard és animált videó, egyetlen Claude-beszélgetésben, programozás és vágóprogram nélkül. Ingyenes, 8 oldalas PDF-segédlet bemásolható promptokkal.',
  alternates: { canonical: '/ingyenes/claude-dashboard-motion' },
};

const IMG = '/segedlet/claude-dashboard-motion';

const inside = [
  ['Mire lesz szükséged', 'Mit tud a Dashboard és a Motion, és miért kell a Motionhöz Team előfizetés.'],
  ['3 lépés, bemásolható promptokkal', 'Adatok → élő dashboard → animált videó. Mindegyikhez kész prompt, csak a cégnevet írod át.'],
  ['Valódi példa', 'Egy pékség eladási táblázatából lett dashboard és egy 20 másodperces kisfilm. Képekkel, lépésről lépésre.'],
  ['Hogy ne legyen „Claude-os”', 'Design skill, márkahang és narráció: ettől lesz a videó a tiéd, nem a sablon.'],
  ['Puska és ellenőrzőlista', 'A három prompt egy helyen, és amit kiposztolás előtt nézz meg.'],
];

export default function ClaudeDashboardMotionLanding() {
  return (
    <div className="page">
      <SiteNav />

      <section className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))', gap: 'clamp(24px,4vw,56px)', alignItems: 'center' }}>
        <div className="stack" style={{ '--gap': '20px' } as React.CSSProperties}>
          <div className="row" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="pill new">Ingyenes</span>
            <span className="eyebrow">PolySuli · segédlet</span>
          </div>
          <h1 className="h1">Táblázatból videó. Egy beszélgetésben.</h1>
          <p className="lead">
            Claude két új eszköze, a <b>Dashboard</b> és a <b>Motion</b>, együtt már nem játék: a számaidból élő felület és animált videó lesz,
            programozás és vágóprogram nélkül. A 8 oldalas segédletben megmutatom, hogyan.
          </p>
          <LeadMagnetForm magnet="claude-dashboard-motion" />
          <p className="muted" style={{ margin: 0, fontSize: 13.5 }}>PDF, azonnal letölthető. Csak az e-mail-címed kell hozzá.</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <video
            src={`${IMG}/video.mp4`}
            poster={`${IMG}/borito.jpg`}
            controls
            playsInline
            preload="metadata"
            width={720}
            height={1280}
            style={{ width: 'min(100%, 340px)', height: 'auto', borderRadius: 24, background: 'var(--ink)' }}
          />
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '24px' } as React.CSSProperties}>
        <div className="eyebrow">Mi van benne?</div>
        <h2 className="h2">Nem elmélet. Bemásolod, és működik.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 16 }}>
          {inside.map(([t, d], i) => (
            <div key={t} style={{ background: 'var(--paper)', borderRadius: 20, padding: 22 }}>
              <div className="tag" style={{ color: 'var(--purple)' }}>{String(i + 1).padStart(2, '0')}</div>
              <h3 style={{ margin: '8px 0 6px', fontFamily: 'var(--display)', fontSize: 20 }}>{t}</h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.55 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card amber stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="eyebrow" style={{ color: 'var(--ink)' }}>Mielőtt letöltöd</div>
        <h2 className="h2">Egy dolgot mondok előre.</h2>
        <p className="lead" style={{ color: 'var(--ink)' }}>
          A Motion jelenleg bétában van, és csak Claude <b>Team</b> vagy Enterprise előfizetéssel érhető el (a Team legalább 2 fős). A Dashboardhoz
          már a Pro csomag is elég. Nem akarom, hogy letöltsd, aztán ott állj, hogy nincs meg a gomb.
        </p>
      </section>

      <section id="kerem" className="card stack" style={{ '--gap': '20px', alignItems: 'flex-start', scrollMarginTop: 24 } as React.CSSProperties}>
        <div className="eyebrow">Ingyenes segédlet</div>
        <h2 className="h2">Kérem, és kipróbálom ma este.</h2>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <LeadMagnetForm magnet="claude-dashboard-motion" />
        </div>
      </section>
    </div>
  );
}
