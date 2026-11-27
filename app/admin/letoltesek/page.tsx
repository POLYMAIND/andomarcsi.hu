import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import type { FreeResourceAdmin } from '@/lib/resources';
import { deleteDownloader, deleteResource, saveResource } from './actions';

export const metadata: Metadata = { title: 'Ingyenes anyagok' };

type Download = { id: string; resource_id: string; email: string; name: string | null; newsletter: boolean; created_at: string };
type Props = { searchParams: Promise<Record<string, string | undefined>> };

const ERRORS: Record<string, string> = {
  adatok: 'Add meg a címet és egy http(s) letöltési linket.',
  slug: 'Ez az URL-név már foglalt.',
  mentes: 'Nem sikerült menteni.',
};

export default async function FreeResourcesAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: resources }, { data: downloads }] = await Promise.all([
    supabase.from('free_resources').select('*').order('sort_order').order('created_at').returns<FreeResourceAdmin[]>(),
    supabase.from('resource_downloads').select('id, resource_id, email, name, newsletter, created_at').order('created_at', { ascending: false }).limit(5000).returns<Download[]>(),
  ]);
  const all = downloads ?? [];
  const list = resources ?? [];
  const titleOf = new Map(list.map((r) => [r.id, r.title]));
  const countOf = (id: string) => all.filter((d) => d.resource_id === id).length;
  const editing = sp.szerk ? list.find((r) => r.id === sp.szerk) : null;
  const q = (sp.q ?? '').trim().toLowerCase();
  const shown = all.filter((d) => (!sp.anyag || d.resource_id === sp.anyag) && (!q || d.email.includes(q) || (d.name ?? '').toLowerCase().includes(q)));
  const qs = new URLSearchParams(Object.entries({ q: sp.q, anyag: sp.anyag }).filter(([, v]) => v) as [string, string][]).toString();
  const people = new Set(all.map((d) => d.email)).size;

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      {sp.mentve && <div className="notice ok">Elmentve.</div>}
      {sp.torolve && <div className="notice ok">Az anyagot töröltük (a letöltői is lekerültek a listáról).</div>}
      {sp.hiba && <div className="notice err">{ERRORS[sp.hiba] ?? ERRORS.mentes}</div>}

      <section className="card stack" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="eyebrow">Admin</div>
          <h1 className="h2">Ingyenes anyagok</h1>
          <p className="muted" style={{ margin: 0 }}>
            E-mail címért letölthető anyagok (<Link href="/ingyenes" style={{ textDecoration: 'underline' }}>/ingyenes</Link>). A letöltési link (pl. Google Drive,
            Canva, Supabase Storage) csak az e-mail megadása után jelenik meg.
          </p>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Anyag</span><span className="value">{list.length}</span></div>
          <div className="stat"><span className="label">Letöltés</span><span className="value">{all.length}</span></div>
          <div className="stat"><span className="label">Letöltő (egyedi)</span><span className="value">{people}</span></div>
          <div className="stat"><span className="label">Hírlevelet is kért</span><span className="value">{all.filter((d) => d.newsletter).length}</span></div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Anyag</th><th>Állapot</th><th>Letöltés</th><th></th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.title}</strong><br /><span className="muted mono" style={{ fontSize: 12 }}>/ingyenes/{r.slug}</span></td>
                  <td>{r.published ? <span className="pill ok">Élő</span> : <span className="pill warn">Vázlat</span>}</td>
                  <td><Link href={`/admin/letoltesek?anyag=${r.id}#letoltok`}>{countOf(r.id)}</Link></td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row" style={{ '--gap': '6px', justifyContent: 'flex-end' } as React.CSSProperties}>
                      <Link href={`/admin/letoltesek?szerk=${r.id}#szerkeszto`} className="btn light sm">Szerkesztés</Link>
                      <form action={deleteResource}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmButton className="btn light sm" message={`Törlöd: ${r.title}? A letöltők listája is törlődik.`}>Törlés</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={4} className="muted">Még nincs anyag – vedd fel lent az elsőt.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section id="szerkeszto" className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <h2 className="h3">{editing ? `Szerkesztés: ${editing.title}` : 'Új ingyenes anyag'}</h2>
        <form action={saveResource} className="stack" style={{ '--gap': '14px' } as React.CSSProperties} key={editing?.id ?? 'uj'}>
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <div className="grid" style={{ '--min': '260px', '--gap': '14px' } as React.CSSProperties}>
            <label className="field">Cím<input className="input" name="title" required defaultValue={editing?.title} /></label>
            <label className="field">URL-név (üresen hagyva a címből)<input className="input" name="slug" defaultValue={editing?.slug} /></label>
            <label className="field">Letöltési link (https://…)<input className="input" name="file_url" type="url" required defaultValue={editing?.file_url} /></label>
            <label className="field">Sorrend<input className="input" name="sort_order" type="number" defaultValue={editing?.sort_order ?? 0} /></label>
          </div>
          <label className="field">Leírás (az első sor a listában is megjelenik)<textarea className="textarea" name="description" defaultValue={editing?.description} /></label>
          <label className="check"><input type="checkbox" name="published" defaultChecked={editing?.published ?? false} /> Élő (megjelenik az oldalon)</label>
          <div className="row">
            <button className="btn" type="submit">Mentés</button>
            {editing && <Link href="/admin/letoltesek" className="btn light">Mégse</Link>}
          </div>
        </form>
      </section>

      <section id="letoltok" className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="row between">
          <h2 className="h3">Letöltők</h2>
          <Link href="/admin/kapcsolatok?forras=download" className="btn light sm">Közös listában →</Link>
        </div>
        <form className="row" method="get" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input className="input" name="q" defaultValue={sp.q ?? ''} placeholder="Keresés e-mailre vagy névre" style={{ maxWidth: 260 }} />
          <select className="select" name="anyag" defaultValue={sp.anyag ?? ''} style={{ maxWidth: 300 }}>
            <option value="">Minden anyag</option>
            {list.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
          <button className="btn sm" type="submit">Szűrés</button>
          {qs && <Link href="/admin/letoltesek#letoltok" className="btn light sm">Törlés</Link>}
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Dátum</th><th>E-mail</th><th>Név</th><th>Anyag</th><th>Hírlevél</th><th></th></tr></thead>
            <tbody>
              {shown.map((d) => (
                <tr key={d.id}>
                  <td>{formatDate(d.created_at)}</td>
                  <td><a href={`mailto:${d.email}`}>{d.email}</a></td>
                  <td>{d.name ?? '—'}</td>
                  <td>{titleOf.get(d.resource_id) ?? '—'}</td>
                  <td>{d.newsletter ? 'igen' : '—'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <form action={deleteDownloader}>
                      <input type="hidden" name="email" value={d.email} />
                      <input type="hidden" name="qs" value={qs} />
                      <ConfirmButton className="btn light sm" message={`Törlöd ${d.email} összes letöltését? (pl. leiratkozási kérésre)`}>Törlés</ConfirmButton>
                    </form>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && <tr><td colSpan={6} className="muted">{all.length ? 'Nincs találat.' : 'Még senki nem töltött le.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
