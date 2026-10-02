import { SiteNav } from '@/components/SiteNav';
import { COMPANY } from '@/lib/company';

// Ki nem töltött cégadat: sárgán kiemelve, hogy azonnal látszódjon.
export function Fill({ v }: { v: string }) {
  return v.startsWith('KITÖLTENDŐ') ? <mark style={{ background: 'oklch(0.93 0.12 95)', padding: '0 4px', borderRadius: 4 }}>{v}</mark> : <>{v}</>;
}

export function LegalPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="page">
      <SiteNav />
      <article className="card legal">
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="h2" style={{ margin: '10px 0 6px' }}>{title}</h1>
        <p className="muted" style={{ marginTop: 0 }}>Hatályos: {COMPANY.lastUpdated}</p>
        {children}
      </article>
    </div>
  );
}
