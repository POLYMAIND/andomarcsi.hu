import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { filterContacts, KIND_LABEL, KIND_ORDER } from '@/lib/contacts';
import { formatDate } from '@/lib/format';
import { importExternalCsv } from './actions';
import { loadContacts } from './data';

export const metadata: Metadata = { title: 'Kapcsolatok' };

type Props = { searchParams: Promise<Record<string, string | undefined>> };

const SHOW = 500; // ennyit mutatunk az oldalon; a CSV-ben mindenki benne van

const IMPORT_ERR: Record<string, string> = {
  forras: 'Adj meg egy forrásnevet (kisbetű, szám, kötőjel – pl. polysuli).',
  fajl: 'Válassz ki egy CSV-fájlt.',
  meret: 'A fájl legfeljebb 5 MB lehet.',
  ures: 'Nem találtunk érvényes e-mail címet a fájlban (kell egy „email” vagy „e-mail cím” oszlop).',
  hiba: 'Az importálás közben hiba történt.',
};

export default async function ContactsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const all = await loadContacts(supabase);
  const list = filterContacts(all, { q: sp.q, forras: sp.forras });
  const count = (k: (typeof KIND_ORDER)[number]) => all.filter((c) => c.kinds.includes(k)).length;
  const externalSources = [...new Set(all.flatMap((c) => c.details.external ?? []))].sort();
  const monthAgo = new Date(Date.now() - 30 * 864e5).toISOString();
  const qs = new URLSearchParams(Object.entries({ q: sp.q, forras: sp.forras }).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>

      <section className="card stack" style={{ '--gap': '22px' } as React.CSSProperties}>
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <div className="eyebrow">Admin</div>
            <h1 className="h2">Kapcsolatok</h1>
            <p className="muted" style={{ margin: 0, maxWidth: 640 }}>
              Mindenki egy listában, e-mail cím szerint összefésülve: regisztrálók, hírlevél-feliratkozók, „Értesítést kérek” feliratkozók,
              ingyenes kurzusok és ingyenes anyagok letöltői, valamint a külső források (pl. Polysuli) feliratkozói.
            </p>
          </div>
          <a className="btn" href={`/admin/kapcsolatok/export${qs ? `?${qs}` : ''}`}>CSV letöltése</a>
        </div>
        <div className="grid" style={{ '--min': '150px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Összes kapcsolat</span><span className="value">{all.length}</span></div>
          <div className="stat"><span className="label">Új · 30 nap</span><span className="value">{all.filter((c) => c.first_at > monthAgo).length}</span></div>
          {KIND_ORDER.map((k) => (
            <Link key={k} href={`/admin/kapcsolatok?forras=${k}`} className="stat"><span className="label">{KIND_LABEL[k]}</span><span className="value">{count(k)}</span></Link>
          ))}
        </div>
        <div className="row" style={{ '--gap': '8px', fontSize: 14 } as React.CSSProperties}>
          <span className="muted">PolyOS webhook:</span><strong>{process.env.POLYOS_WEBHOOK_URL ? 'bekötve' : 'nincs beállítva'}</strong>
          <span className="muted">· Külső források fogadása:</span><strong>{process.env.CONTACTS_INGEST_SECRET ? 'bekapcsolva' : 'kikapcsolva'}</strong>
        </div>
      </section>

      {sp.import === 'ok' && (
        <div className="notice ok">
          Import kész: {sp.uj ?? 0} új cím{Number(sp.megvolt) > 0 && `, ${sp.megvolt} már megvolt`}{Number(sp.hibas) > 0 && `, ${sp.hibas} hibás sor kimaradt`}.
        </div>
      )}
      {sp.import && sp.import !== 'ok' && (
        <div className="notice err">
          {IMPORT_ERR[sp.import] ?? IMPORT_ERR.hiba}
          {sp.import === 'hiba' && Number(sp.uj) > 0 && ` (${sp.uj} cím addig bekerült)`}
        </div>
      )}

      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <form className="row" method="get" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input className="input" name="q" defaultValue={sp.q ?? ''} placeholder="Keresés e-mailre vagy névre" style={{ maxWidth: 260 }} />
          <select className="select" name="forras" defaultValue={sp.forras ?? ''} style={{ maxWidth: 240 }}>
            <option value="">Minden forrás</option>
            {KIND_ORDER.map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            {externalSources.map((s) => <option key={s} value={`external:${s}`}>Külső: {s}</option>)}
          </select>
          <button className="btn sm" type="submit">Szűrés</button>
          {qs && <Link href="/admin/kapcsolatok" className="btn light sm">Törlés</Link>}
          <span className="muted" style={{ fontSize: 14 }}>{list.length} találat</span>
        </form>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Első alkalom</th><th>E-mail</th><th>Név</th><th>Források</th><th>Részletek</th></tr></thead>
            <tbody>
              {list.slice(0, SHOW).map((c) => (
                <tr key={c.email}>
                  <td>{formatDate(c.first_at)}{c.last_at !== c.first_at && <><br /><span className="muted" style={{ fontSize: 12 }}>utoljára {formatDate(c.last_at)}</span></>}</td>
                  <td><a href={`mailto:${c.email}`}>{c.email}</a></td>
                  <td>{c.name ?? '—'}</td>
                  <td>
                    <div className="row" style={{ '--gap': '4px' } as React.CSSProperties}>
                      {c.kinds.map((k) => <span key={k} className="pill" style={{ fontSize: 12, padding: '4px 10px' }}>{KIND_LABEL[k]}</span>)}
                    </div>
                  </td>
                  <td className="muted" style={{ fontSize: 13 }}>
                    {(['waitlist', 'free_course', 'download', 'external'] as const).map((k) =>
                      c.details[k]?.length ? <div key={k}>{KIND_LABEL[k]}: {c.details[k]!.join(', ')}</div> : null,
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="muted">{all.length ? 'Nincs találat.' : 'Még nincs kapcsolat.'}</td></tr>}
            </tbody>
          </table>
        </div>
        {list.length > SHOW && <p className="muted" style={{ margin: 0 }}>Az első {SHOW} látszik – a teljes lista a CSV-ben van.</p>}
      </section>

      <section id="import" className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <h2 className="h3">Külső lista importálása (CSV)</h2>
        <p className="muted" style={{ margin: 0, maxWidth: 680 }}>
          Egy másik oldal meglévő feliratkozóinak egyszeri betöltése (pl. a Polysuli PolyOS-ből exportált listája). Kell egy „email” vagy
          „e-mail cím” oszlop; a név a „név” / „name” vagy a „vezetéknév” + „keresztnév” oszlopból jön. Ami már megvan, nem duplikálódik.
          Az új feliratkozók ezután maguktól érkeznek (WordPress: PolyOS bővítmény → Közös kapcsolatlista).
        </p>
        <form action={importExternalCsv} className="row" style={{ '--gap': '8px', alignItems: 'flex-end' } as React.CSSProperties}>
          <label className="field" style={{ maxWidth: 200 }}>Forrás<input className="input" name="source" required defaultValue="polysuli" pattern="[a-z0-9][a-z0-9_\-]{0,39}" /></label>
          <label className="field" style={{ maxWidth: 220 }}>Lista (nem kötelező)<input className="input" name="list" placeholder="pl. hírlevél" /></label>
          <label className="field" style={{ maxWidth: 320 }}>CSV-fájl<input className="input" name="file" type="file" accept=".csv,text/csv" required /></label>
          <button className="btn" type="submit">Importálás</button>
        </form>
      </section>
    </div>
  );
}
