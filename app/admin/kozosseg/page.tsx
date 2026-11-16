import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfirmButton } from '@/components/ConfirmButton';
import { SiteNav } from '@/components/SiteNav';
import { SubmitButton } from '@/components/SubmitButton';
import { requireAdmin } from '@/lib/auth';
import { plainText, postHref } from '@/lib/community';
import { formatDate } from '@/lib/format';
import { banUser, removeReported, resolveReport, saveLinkSpace, setModerator, unbanUser } from './actions';

export const metadata: Metadata = { title: 'Közösség – moderálás' };

const DONE: Record<string, string> = {
  lezarva: 'Lezárva.',
  torolve: 'A tartalmat töröltük, a bejelentést lezártuk.',
  kitiltva: 'Kitiltva – a közösséget többé nem látja.',
  feloldva: 'Feloldva.',
  link: 'Link elmentve.',
  moderator: 'Moderátorok frissítve.',
};

type Report = {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  post_id: string | null;
  comment_id: string | null;
  reporter: { email: string | null } | null;
  post: { id: string; title: string; user_id: string; author_name: string } | null;
  comment: { id: string; body: string; post_id: string; user_id: string; author_name: string } | null;
};

export default async function CommunityAdminPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { supabase } = await requireAdmin();
  const [{ data: reports, error }, { data: bans }, { data: links }, { data: admins }] = await Promise.all([
    supabase
      .from('community_reports')
      .select('id, reason, status, created_at, post_id, comment_id, reporter:profiles!community_reports_reporter_id_fkey(email), post:community_posts(id, title, user_id, author_name), comment:community_comments(id, body, post_id, user_id, author_name)')
      .order('created_at', { ascending: false })
      .limit(100)
      .returns<Report[]>(),
    supabase.from('community_bans').select('user_id, reason, created_at, profiles(email, full_name)').order('created_at', { ascending: false }),
    supabase.from('community_spaces').select('id, name, icon, url').eq('kind', 'link').order('sort_order'),
    supabase.from('profiles').select('id, email, full_name').eq('is_admin', true).order('email'),
  ]);
  const open = (reports ?? []).filter((r) => r.status === 'open');
  const closed = (reports ?? []).filter((r) => r.status !== 'open').slice(0, 20);

  const reportRow = (r: Report) => {
    const authorId = r.comment?.user_id ?? r.post?.user_id ?? null;
    const target = r.comment
      ? { label: `Hozzászólás – ${r.comment.author_name}: „${plainText(r.comment.body).slice(0, 160)}”`, href: `${postHref(r.comment.post_id)}#c-${r.comment.id}` }
      : r.post
        ? { label: `Bejegyzés – ${r.post.author_name}: „${r.post.title}”`, href: postHref(r.post.id) }
        : { label: '(a tartalmat már törölték)', href: null };
    return (
      <div key={r.id} className="stack" style={{ '--gap': '8px', background: 'var(--paper)', borderRadius: 16, padding: '14px 16px' } as React.CSSProperties}>
        <span className="muted mono" style={{ fontSize: 12 }}>{formatDate(r.created_at)} · bejelentette: {r.reporter?.email ?? '?'}</span>
        {target.href ? <Link href={target.href} style={{ fontWeight: 700, textDecoration: 'underline' }}>{target.label}</Link> : <b>{target.label}</b>}
        {r.reason && <span>Indok: {r.reason}</span>}
        {r.status === 'open' && (
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            <form action={resolveReport}><input type="hidden" name="id" value={r.id} /><button className="btn sm light" type="submit">Rendben, lezárom</button></form>
            {(r.post || r.comment) && (
              <form action={removeReported}>
                <input type="hidden" name="id" value={r.id} />
                <input type="hidden" name="post_id" value={r.post?.id ?? ''} />
                <input type="hidden" name="comment_id" value={r.comment?.id ?? ''} />
                <ConfirmButton className="btn sm light" message="Biztosan törlöd a bejelentett tartalmat?">Tartalom törlése</ConfirmButton>
              </form>
            )}
            {authorId && (
              <form action={banUser}>
                <input type="hidden" name="user_id" value={authorId} />
                <input type="hidden" name="reason" value={`Bejelentés: ${r.reason}`} />
                <ConfirmButton className="btn sm light" message="Biztosan kitiltod a szerzőt a közösségből?">Szerző kitiltása</ConfirmButton>
              </form>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="page">
      <SiteNav />
      <div className="row between" style={{ padding: '0 8px' }}>
        <Link href="/admin" className="tag">← Admin</Link>
        <Link href="/kozosseg" className="tag">A közösség →</Link>
      </div>
      <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="eyebrow">Admin</div>
        <h1 className="h2">Közösség – moderálás</h1>
        {sp.kesz && DONE[sp.kesz.split('#')[0]] && <div className="notice ok">{DONE[sp.kesz.split('#')[0]]}</div>}
        {sp.hiba && <div className="notice err">{sp.hiba}</div>}
        {error && <div className="notice err">A közösség 2.0 táblái még nincsenek létrehozva – futtasd a 20261116050000_kozosseg_v2.sql migrációt.</div>}
        <p className="muted" style={{ margin: 0 }}>
          Kitűzni, áthelyezni és törölni magán a bejegyzésen tudsz (admin gombok). Itt a bejelentések, a tiltások, a Linkek és a moderátorok vannak.
        </p>
      </section>

      <section className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <h2 className="h3">Bejelentések ({open.length} nyitott)</h2>
        {open.length === 0 && <p className="muted" style={{ margin: 0 }}>Nincs nyitott bejelentés. 🎉</p>}
        {open.map(reportRow)}
        {closed.length > 0 && (
          <details>
            <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Lezártak ({closed.length})</summary>
            <div className="stack" style={{ '--gap': '8px', marginTop: 10 } as React.CSSProperties}>{closed.map(reportRow)}</div>
          </details>
        )}
      </section>

      <section id="tiltas" className="card stack" style={{ '--gap': '12px', scrollMarginTop: 24 } as React.CSSProperties}>
        <h2 className="h3">Kitiltott tagok</h2>
        {(bans ?? []).length === 0 && <p className="muted" style={{ margin: 0 }}>Senki nincs kitiltva.</p>}
        {(bans ?? []).map((b) => {
          const p = b.profiles as unknown as { email: string | null; full_name: string | null } | null;
          return (
            <div key={b.user_id} className="row between" style={{ background: 'var(--paper)', borderRadius: 14, padding: '10px 14px' }}>
              <span><b>{p?.full_name || p?.email}</b> <span className="muted">· {p?.email} · {formatDate(b.created_at)}{b.reason ? ` · ${b.reason}` : ''}</span></span>
              <form action={unbanUser}><input type="hidden" name="user_id" value={b.user_id} /><button className="btn sm light" type="submit">Feloldom</button></form>
            </div>
          );
        })}
        <form action={banUser} className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input className="input" name="email" type="email" required placeholder="email@pelda.hu" style={{ maxWidth: 260 }} />
          <input className="input" name="reason" placeholder="Indok (nem kötelező)" style={{ maxWidth: 260 }} />
          <SubmitButton className="btn sm">Kitiltom</SubmitButton>
        </form>
      </section>

      <section id="linkek" className="card stack" style={{ '--gap': '12px', scrollMarginTop: 24 } as React.CSSProperties}>
        <h2 className="h3">Linkek az oldalsávban</h2>
        <p className="muted" style={{ margin: 0 }}>Ami üres, az nem jelenik meg.</p>
        {(links ?? []).map((l) => (
          <form key={l.id} action={saveLinkSpace} className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            <input type="hidden" name="id" value={l.id} />
            <span style={{ width: 130 }}>{l.icon} {l.name}</span>
            <input className="input" name="url" type="url" defaultValue={l.url ?? ''} placeholder="https://…" style={{ flex: '1 1 260px', width: 'auto' }} />
            <SubmitButton className="btn sm light">Mentés</SubmitButton>
          </form>
        ))}
      </section>

      <section id="moderatorok" className="card stack" style={{ '--gap': '12px', scrollMarginTop: 24 } as React.CSSProperties}>
        <h2 className="h3">Moderátorok (admin)</h2>
        <p className="muted" style={{ margin: 0 }}>Az admin a közösségben „Mentor” jelvényt kap, kitűzhet, bejelenthet, törölhet, és az adminfelületet is eléri.</p>
        {(admins ?? []).map((a) => (
          <div key={a.id} className="row between" style={{ background: 'var(--paper)', borderRadius: 14, padding: '10px 14px' }}>
            <span><b>{a.full_name || a.email}</b> <span className="muted">· {a.email}</span></span>
            <form action={setModerator}>
              <input type="hidden" name="email" value={a.email ?? ''} />
              <input type="hidden" name="on" value="0" />
              <ConfirmButton className="btn sm light" message="Biztosan elveszed az admin jogot?">Elveszem</ConfirmButton>
            </form>
          </div>
        ))}
        <form action={setModerator} className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <input type="hidden" name="on" value="1" />
          <input className="input" name="email" type="email" required placeholder="pl. fanni@…" style={{ maxWidth: 280 }} />
          <SubmitButton className="btn sm">Admin jogot adok</SubmitButton>
        </form>
      </section>
    </div>
  );
}
