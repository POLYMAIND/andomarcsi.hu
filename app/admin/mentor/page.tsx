import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { requireAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { toggleHandled } from './actions';

export const metadata: Metadata = { title: 'Mentor-jelentkezések' };

type Row = { id: string; name: string; email: string; phone: string | null; business: string; created_at: string; handled_at: string | null };

export default async function MentorApplicationsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from('mentor_applications').select('id, name, email, phone, business, created_at, handled_at').order('created_at', { ascending: false }).returns<Row[]>();
  const rows = data ?? [];
  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
      </div>
      <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
          <div className="eyebrow">Admin · PolySuli</div>
          <h1 className="h2">Mentor-jelentkezések</h1>
          <p className="muted" style={{ margin: 0 }}>A mentorprogramra (249 000 Ft, 10 alkalom) jelentkezők. Hívd vissza őket, és ha egyeztettetek, jelöld „Elintézve”-nek.</p>
        </div>
        <div className="grid" style={{ '--min': '170px', '--gap': '12px' } as React.CSSProperties}>
          <div className="stat"><span className="label">Jelentkezés</span><span className="value">{rows.length}</span></div>
          <div className="stat"><span className="label">Még nincs elintézve</span><span className="value">{rows.filter((r) => !r.handled_at).length}</span></div>
        </div>
        {rows.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>Még nincs jelentkező.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Dátum</th><th>Név</th><th>Elérhetőség</th><th>A vállalkozásáról</th><th style={{ textAlign: 'right' }}></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} style={r.handled_at ? { opacity: 0.55 } : undefined}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>{formatDate(r.created_at)}</td>
                    <td><strong>{r.name}</strong></td>
                    <td>
                      <a href={`mailto:${r.email}?subject=${encodeURIComponent('PolySuli mentorprogram')}`}>{r.email}</a>
                      {r.phone && <div><a href={`tel:${r.phone}`}>{r.phone}</a></div>}
                    </td>
                    <td style={{ maxWidth: 420, whiteSpace: 'pre-line' }}>{r.business || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <form action={toggleHandled}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="handled" value={r.handled_at ? '1' : '0'} />
                        <button className="btn light sm" type="submit">{r.handled_at ? 'Visszanyitom' : 'Elintézve'}</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
