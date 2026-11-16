import { NextResponse, type NextRequest } from 'next/server';
import { NOTIFICATION_TEXT, type NotificationType } from '@/lib/community';
import { SITE_URL } from '@/lib/config';
import { emailConfigured, notificationEmail, sendEmail } from '@/lib/email';
import { createAdminClient } from '@/lib/supabase/server';

export const maxDuration = 60;

// Napi közösségi összefoglaló e-mail (Vercel Cron, vercel.json): ami az elmúlt napban történt a taggal és még nem
// látta – kedvelés, hozzászólás, válasz, említés. A bejelentés azonnal megy, az itt nem ismétlődik.
// Védelem: Authorization: Bearer <CRON_SECRET> (a Vercel Cron ezt küldi, ha a CRON_SECRET be van állítva).
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 401 });
  if (!emailConfigured()) return NextResponse.json({ sent: 0, note: 'Az e-mail-küldés nincs beállítva.' });

  const admin = createAdminClient();
  const since = new Date(Date.now() - 2 * 864e5).toISOString();
  const { data: notes, error } = await admin
    .from('community_notifications')
    .select('id, user_id, actor_name, type, post_id, comment_id, created_at')
    .is('emailed_at', null)
    .is('read_at', null)
    .neq('type', 'announcement')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!notes?.length) return NextResponse.json({ sent: 0 });

  const byUser = new Map<string, typeof notes>();
  for (const n of notes) byUser.set(n.user_id, [...(byUser.get(n.user_id) ?? []), n]);
  const postIds = Array.from(new Set(notes.map((n) => n.post_id).filter((x): x is string => !!x)));
  const [{ data: people }, { data: posts }] = await Promise.all([
    admin.from('profiles').select('id, email, community_emails').in('id', [...byUser.keys()]),
    admin.from('community_posts').select('id, title').in('id', postIds),
  ]);
  const titles = new Map((posts ?? []).map((p) => [p.id as string, p.title as string]));

  let sent = 0;
  for (const p of people ?? []) {
    const list = byUser.get(p.id) ?? [];
    if (p.email && p.community_emails !== false && list.length) {
      const lines = list.slice(0, 8).map((n) => `• ${n.actor_name} ${NOTIFICATION_TEXT[n.type as NotificationType]}${n.post_id && titles.get(n.post_id) ? `: „${titles.get(n.post_id)}”` : ''}`);
      if (list.length > 8) lines.push(`…és még ${list.length - 8} dolog.`);
      const { text, html } = notificationEmail({
        heading: list.length === 1 ? 'Történt valami a közösségben 👀' : `${list.length} új dolog vár a közösségben 👀`,
        lines,
        cta: 'Megnézem',
        url: `${SITE_URL}/kozosseg/ertesitesek`,
        settingsUrl: `${SITE_URL}/kozosseg/profil#ertesitesek`,
      });
      await sendEmail({ to: p.email, subject: list.length === 1 ? 'Új értesítés a PolySuli közösségben' : `${list.length} új értesítés a PolySuli közösségben`, text, html });
      sent++;
    }
    // akkor is kész, ha nem kér levelet – így nem dolgozzuk fel újra
    await admin.from('community_notifications').update({ emailed_at: new Date().toISOString() }).in('id', list.map((n) => n.id));
  }
  return NextResponse.json({ sent });
}
