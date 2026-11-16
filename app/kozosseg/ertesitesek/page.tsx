import Link from 'next/link';
import { markAllNotificationsRead } from '@/app/kozosseg/actions';
import { Avatar } from '@/components/community/Avatar';
import { requireUser } from '@/lib/auth';
import { NOTIFICATION_TEXT, postHref, timeAgo, type CommunityNotification } from '@/lib/community';

// Értesítések (harang): lájk, komment, válasz, említés, bejelentés. Megnyitáskor olvasottra állnak.
export default async function NotificationsPage() {
  const { supabase, user } = await requireUser('/kozosseg/ertesitesek');
  const { data } = await supabase
    .from('community_notifications')
    .select('id, actor_id, actor_name, type, post_id, comment_id, created_at, read_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(60)
    .returns<CommunityNotification[]>();
  const list = data ?? [];
  const postIds = Array.from(new Set(list.map((n) => n.post_id).filter((x): x is string => !!x)));
  const { data: posts } = postIds.length ? await supabase.from('community_posts').select('id, title').in('id', postIds) : { data: [] };
  const titles = new Map((posts ?? []).map((p) => [p.id as string, p.title as string]));
  const unread = list.filter((n) => !n.read_at).length;
  if (unread) await supabase.from('community_notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).is('read_at', null);

  return (
    <section className="card stack" style={{ '--gap': '14px' } as React.CSSProperties}>
      <div className="row between">
        <h1 className="h2">Értesítések</h1>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <button type="submit" className="kz-react">Mind olvasott</button>
          </form>
        )}
      </div>
      {list.length === 0 && <p className="muted" style={{ margin: 0 }}>Még nincs értesítésed. Posztolj vagy kommentelj – és jönnek a szívek. ❤️</p>}
      <ul className="kz-notes">
        {list.map((n) => (
          <li key={n.id} className={n.read_at ? '' : 'unread'}>
            <Link href={n.post_id ? `${postHref(n.post_id)}${n.comment_id ? `#c-${n.comment_id}` : ''}` : '/kozosseg'}>
              <Avatar name={n.actor_name || '?'} size={36} />
              <span className="stack" style={{ '--gap': '2px', minWidth: 0 } as React.CSSProperties}>
                <span><b>{n.actor_name}</b> {NOTIFICATION_TEXT[n.type]}{n.post_id && titles.get(n.post_id) ? <>: „{titles.get(n.post_id)}”</> : null}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>{timeAgo(n.created_at)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
