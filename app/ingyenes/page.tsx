import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { publicResources } from '@/lib/resources';

export const metadata: Metadata = {
  title: 'Ingyenes anyagok',
  description: 'Ingyenesen letölthető sablonok, checklistek és útmutatók Canvához, AI-eszközökhöz és tartalomkészítéshez.',
  alternates: { canonical: '/ingyenes' },
};

export default async function FreeResourcesPage() {
  const list = await publicResources();
  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '20px' } as React.CSSProperties}>
        <div className="eyebrow">Ingyenes anyagok</div>
        <h1 className="h1">Töltsd le, használd.</h1>
        <p className="lead">Sablonok, checklistek és rövid útmutatók – add meg az e-mail címed, és már töltheted is.</p>
      </section>
      <section className="grid" style={{ '--min': '280px', '--gap': '16px' } as React.CSSProperties}>
        {list.map((r) => (
          <Link key={r.id} href={`/ingyenes/${r.slug}`} className="card stack" style={{ '--gap': '12px', padding: 32 } as React.CSSProperties}>
            <span className="pill ok" style={{ alignSelf: 'flex-start' }}>Ingyenes</span>
            <strong className="h3">{r.title}</strong>
            {r.description && <span className="muted" style={{ fontSize: 15 }}>{r.description.split('\n')[0]}</span>}
            <span style={{ fontWeight: 700 }}>Letöltöm →</span>
          </Link>
        ))}
        {list.length === 0 && <div className="card muted">Hamarosan érkeznek az első ingyenes anyagok.</div>}
      </section>
    </div>
  );
}
