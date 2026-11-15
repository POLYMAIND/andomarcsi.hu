import type { Metadata } from 'next';
import Link from 'next/link';
import { JsonLd } from '@/components/JsonLd';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL, SUBSCRIPTION } from '@/lib/config';
import { courseAccessible, getCatalog, getUserAccess } from '@/lib/data';
import { formatHuf, priceLabel } from '@/lib/format';
import { ACADEMY, ACADEMY_PRICES, ACADEMY_TOPICS, byPackageOrder } from '@/lib/polyakademia';
import { graph, ORGANIZATION } from '@/lib/seo';
import { soonLabel, type Course } from '@/lib/types';

const PATH = `${ACADEMY.path}/zsebcsomagok`;
const TITLE = `Zsebcsomagok – kész Claude-skillek ${formatHuf(ACADEMY_PRICES.pocket)}-ért`;
const DESCRIPTION = `Minden PolySuli zsebcsomag egy helyen: egy kész skill vagy prompt-pack egyoldalas útmutatóval, ${formatHuf(ACADEMY_PRICES.pocket)}-ért. Azonnal letöltheted, és bármikor újra eléred.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: { title: TITLE, description: DESCRIPTION, url: PATH, siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website' },
};

const gap = (g: string) => ({ '--gap': g }) as React.CSSProperties;
const shortTitle = (t: string) => t.replace(/ Claude-dal$/, '').replace(/^(Zsebkurzus|Zsebcsomag|Ingyenes): /, '');

const FACTS = [
  ['Kész skill vagy prompt-pack', 'Nem elmélet: egy működő eszköz, amit rögtön használhatsz.'],
  ['Egyoldalas útmutató', 'Lépésről lépésre, kezdőknek is. Nem kell promptot írnod.'],
  ['Azonnal a tiéd', 'Fizetés után letöltöd, és a fiókodban bármikor újra eléred.'],
] as const;

export default async function PocketsPage() {
  const { supabase, user, profile } = await getCurrentUser();
  const [catalog, access] = await Promise.all([getCatalog(supabase), getUserAccess(supabase, user?.id)]);
  const byId = new Map(catalog.courses.map((c) => [c.id, c]));
  const topicOrder = (c: Course | undefined) => {
    const i = c ? ACADEMY_TOPICS.findIndex((t) => t.slug === c.slug) : -1;
    return i === -1 ? ACADEMY_TOPICS.length : i;
  };
  const topicName = (parent: Course | undefined) =>
    (parent && ACADEMY_TOPICS.find((t) => t.slug === parent.slug)?.name) || (parent ? shortTitle(parent.title) : 'Egyéb');

  // Csak a fizetős (zseb)csomagok; az ingyenes anyagok a PolySuli oldalon vannak.
  // Sorrend: előbb a megvehetők, a „Hamarosan” a végén; azon belül téma, majd csomagsorrend.
  const pockets = catalog.pockets
    .filter((p) => p.price_huf !== 0 && p.pocket_for && byId.has(p.pocket_for))
    .sort(
      (a, b) =>
        Number(a.coming_soon) - Number(b.coming_soon) ||
        topicOrder(byId.get(a.pocket_for!)) - topicOrder(byId.get(b.pocket_for!)) ||
        byPackageOrder(a, b),
    );
  const available = pockets.filter((p) => !p.coming_soon);
  const canUse = (c: Course) => !!user && courseAccessible(c, access, profile?.is_admin);

  const jsonLd = graph(ORGANIZATION, {
    '@type': 'ItemList',
    name: 'PolySuli zsebcsomagok',
    url: `${SITE_URL}${PATH}`,
    itemListElement: available.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/kurzusok/${p.slug}`, name: shortTitle(p.title) })),
  });

  return (
    <div className="page ps">
      <SiteNav />
      <JsonLd data={jsonLd} />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href={ACADEMY.path} className="tag">← {ACADEMY.name}</Link>
      </div>

      <section className="card dark ps-hero stack" style={gap('28px')}>
        <div className="stack" style={gap('18px')}>
          <div className="ps-eyebrow lime">{ACADEMY.name} · Zsebcsomagok</div>
          <h1 className="h1" style={{ maxWidth: 900 }}>
            Egy kész skill, {formatHuf(ACADEMY_PRICES.pocket).replace(' Ft', ' forintért')}.
          </h1>
          <p className="lead" style={{ color: '#cfcad4', maxWidth: 680 }}>
            Kevesebb, mint egy kávé és egy kifli. Válassz egy témát, töltsd le a skillt, és még ma használd – a te márkádban, a te hangodon.
          </p>
        </div>
        <div className="ps-three">
          {FACTS.map(([t, d]) => (
            <div key={t} className="stack" style={{ ...gap('6px'), background: 'rgba(255,255,255,.06)', borderRadius: 20, padding: '18px 20px' }}>
              <b style={{ fontSize: 16 }}>{t}</b>
              <span style={{ color: '#cfcad4', fontSize: 14, lineHeight: 1.5 }}>{d}</span>
            </div>
          ))}
        </div>
      </section>

      <section id="lista" className="ps-section ps-anchor">
        <div className="stack ps-head" style={gap('12px')}>
          <div className="eyebrow">{available.length} zsebcsomag{pockets.length > available.length ? ` · ${pockets.length - available.length} hamarosan` : ''}</div>
          <h2 className="h2">Válaszd ki, mivel kezdenéd.</h2>
        </div>

        {pockets.length === 0 ? (
          <div className="ps-box">
            <p>Hamarosan érkeznek az első zsebcsomagok. Addig nézz körül az ingyenes anyagok között.</p>
            <Link href={`${ACADEMY.path}#anyagok`} className="btn" style={{ alignSelf: 'flex-start' }}>Ingyenes anyagok</Link>
          </div>
        ) : (
          <div className="grid" style={{ '--min': '280px', '--gap': '16px' } as React.CSSProperties}>
            {pockets.map((p) => {
              const owned = canUse(p);
              return (
                <Link key={p.id} href={`/kurzusok/${p.slug}`} className="ps-box" style={{ color: 'var(--ink)', gap: 12 }}>
                  <div className="row between" style={gap('8px')}>
                    <span className="ps-pill grey">{topicName(byId.get(p.pocket_for!))}</span>
                    {p.coming_soon && <span className="ps-pill grey">{soonLabel(p)}</span>}
                  </div>
                  <h3 className="h3">{shortTitle(p.title)}</h3>
                  {(p.teaser || p.subtitle) && <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>{p.teaser || p.subtitle}</p>}
                  <div className="row between" style={{ ...gap('10px'), marginTop: 'auto', paddingTop: 8 }}>
                    <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 24, letterSpacing: '-.02em' }}>{priceLabel(p)}</span>
                    <span className="ps-more" style={{ marginTop: 0 }}>
                      {owned ? 'A tiéd · Megnyitom →' : p.coming_soon ? 'Szólj, ha kész →' : 'Megnézem →'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="ps-section">
        <div className="ps-three">
          <div className="ps-box">
            <span className="ps-pill lime">Még nem döntöttél?</span>
            <p>Kezdd egy ingyenes kóstolóval: útmutató, prompt vagy mini skill, regisztráció után azonnal olvasható.</p>
            <Link href={`${ACADEMY.path}#anyagok`} className="ps-more">Ingyenes anyagok →</Link>
          </div>
          <div className="ps-box">
            <span className="ps-pill lime">Bejött?</span>
            <p>A {formatHuf(ACADEMY_PRICES.material)}-os skill-anyagban videóval együtt megépíted a saját, a márkádra szabott eszközödet.</p>
            <Link href={`${ACADEMY.path}#anyagok`} className="ps-more">Skill-anyagok →</Link>
          </div>
          <div className="ps-box green">
            <span className="ps-pill lime">{SUBSCRIPTION.enabled ? 'Tagság' : 'Hol tartasz?'}</span>
            {SUBSCRIPTION.enabled ? (
              <>
                <p>Tagként minden zsebcsomag és skill-anyag a tiéd, amíg tag vagy – {formatHuf(SUBSCRIPTION.priceHuf)}/hó.</p>
                <Link href="/elofizetes" className="ps-more" style={{ color: 'var(--lime)' }}>A tagságról →</Link>
              </>
            ) : (
              <>
                <p>A 2 perces Claude-piramis teszt megmutatja, melyik témával érdemes kezdened.</p>
                <Link href={`${ACADEMY.path}#teszt`} className="ps-more" style={{ color: 'var(--lime)' }}>Kitöltöm a tesztet →</Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
