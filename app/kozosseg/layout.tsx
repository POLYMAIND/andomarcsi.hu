import type { Metadata } from 'next';
import Link from 'next/link';
import { SidebarNav, type NavGroup, type NavItem } from '@/components/community/SidebarNav';
import { SiteNav } from '@/components/SiteNav';
import { requireUser } from '@/lib/auth';
import { courseSpaceHref, GROUP_LABEL, GROUP_ORDER, hasCommunityAccess, spaceHref, ZERO_UUID, type Space } from '@/lib/community';
import { SUBSCRIPTION } from '@/lib/config';
import { ACADEMY } from '@/lib/polyakademia';

export const metadata: Metadata = { title: 'Közösség', robots: { index: false, follow: false } };

// A közösségi tér kerete: oldalsáv a terekkel (olvasatlan-számlálóval) + a tartalom.
export default async function CommunityLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await requireUser('/kozosseg');
  if (!(await hasCommunityAccess(supabase))) return <NoAccess />;
  const isAdmin = !!profile?.is_admin;

  await supabase.rpc('community_ensure_profile', { uid: user.id });
  const [{ data: spaces, error }, { data: unread }, { data: enr }, { data: me }, { data: subscribed }, { data: adminCourses }] = await Promise.all([
    supabase.from('community_spaces').select('*').order('sort_order').returns<Space[]>(),
    supabase.rpc('community_unread_counts'),
    supabase.from('enrollments').select('source, courses(id, title, slug, pocket_for, bundle_course_ids, published)').eq('user_id', user.id),
    supabase.from('community_profiles').select('display_name').eq('user_id', user.id).maybeSingle(),
    supabase.rpc('has_active_subscription'),
    isAdmin
      ? supabase.from('courses').select('id, title, slug, pocket_for, bundle_course_ids, published').eq('published', true).eq('coming_soon', false).is('pocket_for', null)
      : Promise.resolve({ data: [] }),
  ]);

  if (error || !spaces) {
    return (
      <div className="page">
        <SiteNav />
        <section className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <h1 className="h2">A közösség épp frissül.</h1>
          <p className="lead">Pár perc, és újra itt vagyunk.{isAdmin ? ' (Admin: futtasd a 20261116050000_kozosseg_v2.sql migrációt.)' : ''}</p>
        </section>
      </div>
    );
  }

  const unreadOf = (spaceId: string, courseKey = ZERO_UUID) =>
    Number((unread as { space_id: string; course_key: string; n: number }[] | null)?.find((u) => u.space_id === spaceId && u.course_key === courseKey)?.n ?? 0);
  type C = { id: string; title: string; slug: string; pocket_for: string | null; bundle_course_ids: string[] | null; published: boolean };
  const myCourses: C[] = [
    ...((enr ?? [])
      .filter((e) => e.source === 'stripe' || e.source === 'manual')
      .map((e) => e.courses as unknown as C | null)
      .filter((c): c is C => !!c && c.published && !c.bundle_course_ids?.length)),
    ...((adminCourses ?? []) as C[]).filter((c) => !c.bundle_course_ids?.length),
  ].filter((c, i, a) => a.findIndex((x) => x.id === c.id) === i);
  const courseSpace = spaces.find((s) => s.kind === 'course');

  const item = (s: Space): NavItem =>
    s.kind === 'link'
      ? { href: s.url ?? '#', icon: s.icon, label: s.name, external: true }
      : { href: spaceHref(s.slug), icon: s.icon, label: s.name, badge: unreadOf(s.id), locked: s.members_only && !isAdmin && subscribed !== true };
  const groups: NavGroup[] = GROUP_ORDER.map((g) => ({
    label: GROUP_LABEL[g],
    items:
      g === 'courses'
        ? myCourses.map((c) => ({ href: courseSpaceHref(c.slug), icon: c.pocket_for ? '🎒' : '📘', label: c.title.replace(/^(Zsebkurzus|Ingyenes): /, ''), badge: courseSpace ? unreadOf(courseSpace.id, c.id) : 0 }))
        : spaces.filter((s) => s.grp === g && s.kind !== 'course' && (s.kind !== 'link' || !!s.url)).map(item),
  }));

  return (
    <div className="page">
      <SiteNav />
      <div className="kz-shell">
        <SidebarNav groups={groups} profileHref="/kozosseg/profil" profileName={me?.display_name ?? 'én'} />
        <div className="kz-main stack" style={{ '--gap': '16px' } as React.CSSProperties}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Aki még nem tag és nem vett kurzust: rövid bemutató, hová léphet tovább.
function NoAccess() {
  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '18px', maxWidth: 760, margin: '0 auto', width: '100%' } as React.CSSProperties}>
        <div className="eyebrow">PolySuli közösség</div>
        <h1 className="h2">Ez a tanulók zárt közössége.</h1>
        <p className="lead">
          Itt kérdezünk, dicsekszünk és egymástól tanulunk. A közösségbe a PolySuli tagjai és a fizetős anyagok tanulói lépnek be – már egy 990 Ft-os zsebcsomaggal is.
        </p>
        <div className="row" style={{ '--gap': '10px' } as React.CSSProperties}>
          <Link href={`${ACADEMY.path}/zsebcsomagok`} className="btn">Zsebcsomagok</Link>
          <Link href={ACADEMY.path} className="btn light">{ACADEMY.menu}</Link>
          {SUBSCRIPTION.enabled && <Link href="/elofizetes" className="btn light">Tagság</Link>}
        </div>
      </section>
    </div>
  );
}
