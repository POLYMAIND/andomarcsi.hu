import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { CopyButton } from '@/components/CopyButton';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { deleteTestimonial, setTestimonialStatus } from '@/lib/testimonial-actions';

export const metadata: Metadata = { title: 'Vélemények' };

type Row = {
  id: string;
  rating: number;
  body: string;
  display_name: string;
  business: string;
  status: 'new' | 'approved' | 'hidden';
  created_at: string;
  updated_at: string;
  courses: { title: string; slug: string } | null;
  profiles: { email: string | null } | null;
};
type Props = { searchParams: Promise<Record<string, string | undefined>> };

const STATUS: Record<Row['status'], [string, string]> = { new: ['Új', 'new'], approved: ['Jóváhagyva', 'ok'], hidden: ['Elrejtve', 'warn'] };
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

// Posztba másolható szöveg: idézet, név, vállalkozás, kurzus, csillagok.
const postText = (r: Row) =>
  `„${r.body}”\n– ${r.display_name}${r.business ? `, ${r.business}` : ''}${r.courses ? ` · ${r.courses.title}` : ''}\n${stars(r.rating)}`;

export default async function TestimonialsAdminPage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from('testimonials')
    .select('id, rating, body, display_name, business, status, created_at, updated_at, courses(title, slug), profiles(email)')
    .order('created_at', { ascending: false })
    .returns<Row[]>();
  const all = data ?? [];
  const status = sp.allapot && ['new', 'approved', 'hidden'].includes(sp.allapot) ? (sp.allapot as Row['status']) : null;
  const minRating = Math.min(5, Math.max(1, parseInt(sp.csillag ?? '1', 10) || 1));
  const list = all.filter((r) => (!status || r.status === status) && r.rating >= minRating);
  const avg = all.length ? (all.reduce((s, r) => s + r.rating, 0) / all.length).toFixed(1).replace('.', ',') : '–';
  const qs = new URLSearchParams(Object.entries({ allapot: status ?? '', csillag: minRating > 1 ? String(minRating) : '' }).filter(([, v]) => v)).toString();
  const href = (over: Record<string, string | null>) => {
    const p = new URLSearchParams(qs);
    for (const [k, v] of Object.entries(over)) (v ? p.set(k, v) : p.delete(k));
    const s = p.toString();
    return s ? `/admin/velemenyek?${s}` : '/admin/velemenyek';
  };

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
            <h1 className="h2">Vélemények</h1>
            <p className="muted" style={{ margin: 0 }}>
              A tanulók a kurzusoldalon értékelhetnek (★ + szöveg). Mindegyik hozzájárult, hogy a véleménye a weboldalon, hirdetésben és posztokban megjelenjen.
            </p>
          </div>
          <a className="btn" href="/admin/velemenyek/export">CSV letöltése</a>
        </div>
        {error && <div className="notice err">A vélemények tábla még nincs létrehozva – futtasd a 20261116020000_velemenyek.sql migrációt.</div>}
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Vélemény</span><span className="value">{all.length}</span></div>
          <div className="stat"><span className="label">Átlag</span><span className="value">{avg} ★</span></div>
          <div className="stat"><span className="label">Átnézésre vár</span><span className="value">{all.filter((r) => r.status === 'new').length}</span></div>
          <div className="stat"><span className="label">Jóváhagyva</span><span className="value">{all.filter((r) => r.status === 'approved').length}</span></div>
        </div>
      </section>

      <section className="card stack" style={{ '--gap': '16px' } as React.CSSProperties}>
        <div className="row between" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            {([null, 'new', 'approved', 'hidden'] as const).map((s) => {
              const active = status === s;
              return (
                <Link key={s ?? 'all'} href={href({ allapot: s })} className="btn sm" style={{ background: active ? 'var(--ink)' : '#fff', color: active ? '#fff' : 'var(--ink)', borderColor: 'var(--ink)' }}>
                  {s ? STATUS[s][0] : 'Mind'} <span className="mono" style={{ opacity: 0.6, marginLeft: 4 }}>{s ? all.filter((r) => r.status === s).length : all.length}</span>
                </Link>
              );
            })}
          </div>
          <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
            {[1, 4, 5].map((n) => (
              <Link key={n} href={href({ csillag: n > 1 ? String(n) : null })} className="btn sm light" style={minRating === n ? { borderColor: 'var(--ink)' } : undefined}>
                {n === 1 ? 'Minden értékelés' : n === 5 ? 'Csak 5★' : '4★ fölött'}
              </Link>
            ))}
          </div>
        </div>

        {list.length === 0 && <p className="muted" style={{ margin: 0 }}>{all.length ? 'Nincs a szűrésnek megfelelő vélemény.' : 'Még nincs vélemény. A tanulók a kurzusoldal alján és a Saját tanulás oldalon kapnak rá felhívást.'}</p>}

        {list.map((r) => (
          <article key={r.id} className="stack" style={{ '--gap': '10px', background: 'var(--paper)', borderRadius: 18, padding: '18px 20px', opacity: r.status === 'hidden' ? 0.6 : 1 } as React.CSSProperties}>
            <div className="row between" style={{ '--gap': '8px' } as React.CSSProperties}>
              <span style={{ color: 'var(--amber)', fontSize: 20, letterSpacing: 2 }} aria-label={`${r.rating} csillag`}>{stars(r.rating)}</span>
              <span className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
                <span className={`pill ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span>
                <span className="muted mono" style={{ fontSize: 12 }}>{formatDate(r.created_at)}</span>
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>„{r.body}”</p>
            <span style={{ fontSize: 14 }}>
              <b>{r.display_name}</b>
              {r.business && `, ${r.business}`}
              {r.courses && <> · <Link href={`/kurzusok/${r.courses.slug}`} style={{ textDecoration: 'underline' }}>{r.courses.title}</Link></>}
              {r.profiles?.email && <span className="muted"> · {r.profiles.email}</span>}
            </span>
            <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
              <CopyButton text={postText(r)} />
              {(['approved', 'hidden', 'new'] as const)
                .filter((s) => s !== r.status)
                .map((s) => (
                  <form key={s} action={setTestimonialStatus}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="status" value={s} />
                    <input type="hidden" name="qs" value={qs} />
                    <button type="submit" className="btn sm light">{s === 'approved' ? '✓ Jóváhagyom' : s === 'hidden' ? 'Elrejtem' : 'Vissza újnak'}</button>
                  </form>
                ))}
              <form action={deleteTestimonial}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="qs" value={qs} />
                <ConfirmButton className="btn sm light" message="Biztosan törlöd ezt a véleményt? (Pl. ha visszavonta a hozzájárulását.)">Törlés</ConfirmButton>
              </form>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
