import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { FORM_TS_FIELD } from '@/lib/honeypot';
import { downloadLink, publicResource } from '@/lib/resources';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await publicResource(slug);
  if (!r) return {};
  const description = r.description.slice(0, 160);
  return { title: r.title, description, alternates: { canonical: `/ingyenes/${slug}` } };
}

const ERRORS: Record<string, string> = {
  email: 'Kérlek, adj meg egy érvényes e-mail címet.',
  hozzajarulas: 'A letöltéshez pipáld be a hozzájárulást.',
  '1': 'Nem sikerült, próbáld újra.',
};

export default async function FreeResourcePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const resource = await publicResource(slug);
  if (!resource) notFound();
  const [{ user }, link] = await Promise.all([getCurrentUser(), downloadLink(resource.id, sp.kesz)]);
  const error = sp.hiba ? ERRORS[sp.hiba] ?? ERRORS['1'] : null;

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/ingyenes" className="tag">← Ingyenes anyagok</Link>
      </div>
      <div className="layout-sidebar">
        <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
          <div className="eyebrow">Ingyenes anyag</div>
          <h1 className="h2">{resource.title}</h1>
          {resource.description.split('\n').filter(Boolean).map((p, i) => <p key={i} className="lead">{p}</p>)}
        </section>
        <aside id="letoltes" className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          {link ? (
            <>
              <div className="notice ok">Köszönöm! 💜 Itt a letöltési link:</div>
              <a className="btn block purple" href={link} target="_blank" rel="noreferrer">Letöltés</a>
              <span className="muted" style={{ fontSize: 13 }}>Érdemes most elmenteni – ezt az oldalt is könyvjelzőzheted.</span>
            </>
          ) : (
            <form action="/api/download" method="post" className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
              <strong style={{ fontSize: 18 }}>Kérem ingyen!</strong>
              <input type="hidden" name="resource_id" value={resource.id} />
              <input type="hidden" name={FORM_TS_FIELD} value={String(Date.now())} />
              <input className="input" name="name" placeholder="Neved (nem kötelező)" autoComplete="name" />
              <input className="input" name="email" type="email" required placeholder="E-mail címed" defaultValue={user?.email ?? ''} autoComplete="email" />
              <label className="check" style={{ alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-3)' }}>
                <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
                <span>
                  Hozzájárulok, hogy az andormarcsi.hu a letöltéshez kezelje az e-mail címemet, és ehhez az anyaghoz kapcsolódó tippeket, ajánlatokat
                  küldjön. Bármikor leiratkozhatok. <Link href="/adatvedelem" target="_blank" style={{ textDecoration: 'underline' }}>Adatkezelési tájékoztató</Link>
                </span>
              </label>
              <label className="check" style={{ alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-3)' }}>
                <input type="checkbox" name="newsletter" style={{ marginTop: 3 }} />
                <span>A havi hírlevelet is kérem (nem kötelező).</span>
              </label>
              {error && <div className="notice err">{error}</div>}
              <button className="btn block" type="submit">Letöltöm</button>
            </form>
          )}
        </aside>
      </div>
    </div>
  );
}
