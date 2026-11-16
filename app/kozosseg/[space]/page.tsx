import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { SpaceFeed } from '@/components/community/SpaceFeed';
import { requireUser } from '@/lib/auth';
import { PAGE_SIZE, postHref, UUID_RE, ZERO_UUID, type Space } from '@/lib/community';
import { courseTitleMap, loadFeed, loadMyCourses, loadPostExtras, parseFeedFilter } from '@/lib/community-data';
import { SUBSCRIPTION } from '@/lib/config';

type Props = { params: Promise<{ space: string }>; searchParams: Promise<Record<string, string | undefined>> };

export default async function SpacePage({ params, searchParams }: Props) {
  const [{ space: slug }, sp] = await Promise.all([params, searchParams]);
  // régi bejegyzés-linkek (/kozosseg/<id>) – pl. korábbi e-mailekből
  if (UUID_RE.test(slug)) redirect(postHref(slug));
  const { supabase, user, profile } = await requireUser(`/kozosseg/${slug}`);
  const { data: space } = await supabase.from('community_spaces').select('*').eq('slug', slug).maybeSingle<Space>();
  if (!space) notFound();
  if (space.kind === 'link') redirect(space.url ?? '/kozosseg');
  if (space.kind === 'course') redirect('/kozosseg/sikerfal');
  const isAdmin = !!profile?.is_admin;

  if (space.members_only && !isAdmin) {
    const { data: member } = await supabase.rpc('has_active_subscription');
    if (member !== true) {
      return (
        <section className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <h1 className="h2 kz-title"><span aria-hidden="true">{space.icon}</span> {space.name}</h1>
          <p className="lead">Ez a tér a PolySuli tagjainak szól: heti élő Q&amp;A, és itt vannak a felvételek is.</p>
          <Link href="/elofizetes" className="btn" style={{ alignSelf: 'flex-start' }}>{SUBSCRIPTION.enabled ? 'Belépek a tagságba →' : 'A tagságról →'}</Link>
        </section>
      );
    }
  }

  const filter = parseFeedFilter(sp);
  const [{ posts, count }, courses] = await Promise.all([
    loadFeed(supabase, { spaceId: space.id, filter, isQa: space.kind === 'qa', pageSize: PAGE_SIZE }),
    loadMyCourses(supabase, user.id),
  ]);
  const [extras, courseTitles] = await Promise.all([loadPostExtras(supabase, posts, user.id), courseTitleMap(supabase, posts.map((p) => p.course_id))]);
  // olvasottnak jelöljük a teret (az oldalsáv számlálójához)
  await supabase
    .from('community_space_reads')
    .upsert({ user_id: user.id, space_id: space.id, course_key: ZERO_UUID, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,space_id,course_key' });

  return (
    <SpaceFeed
      space={space}
      title={space.name}
      icon={space.icon}
      description={space.description}
      basePath={`/kozosseg/${space.slug}`}
      filter={filter}
      posts={posts}
      count={count}
      extras={extras}
      courseTitles={courseTitles}
      courses={courses}
      userId={user.id}
      isAdmin={isAdmin}
      sp={sp}
    />
  );
}
