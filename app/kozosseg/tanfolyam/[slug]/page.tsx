import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SpaceFeed } from '@/components/community/SpaceFeed';
import { requireUser } from '@/lib/auth';
import { COURSE_SPACE_SLUG, courseSpaceHref, PAGE_SIZE, type Space } from '@/lib/community';
import { loadFeed, loadMyCourses, loadPostExtras, parseFeedFilter } from '@/lib/community-data';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> };

// Tanfolyami tér: kérdések és eredmények egy tanfolyamhoz – csak a tanfolyam résztvevői látják (RLS).
export default async function CourseSpacePage({ params, searchParams }: Props) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const { supabase, user, profile } = await requireUser(courseSpaceHref(slug));
  const [{ data: course }, { data: space }] = await Promise.all([
    supabase.from('courses').select('id, title, slug, subtitle').eq('slug', slug).eq('published', true).maybeSingle(),
    supabase.from('community_spaces').select('*').eq('slug', COURSE_SPACE_SLUG).maybeSingle<Space>(),
  ]);
  if (!course || !space) notFound();
  const { data: ok } = await supabase.rpc('has_course_access', { cid: course.id });
  if (ok !== true) {
    return (
      <section className="card stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <h1 className="h2">{course.title}</h1>
        <p className="lead">Ezt a teret a tanfolyam résztvevői látják. Ha érdekel, nézd meg a tanfolyamot.</p>
        <Link href={`/kurzusok/${course.slug}`} className="btn" style={{ alignSelf: 'flex-start' }}>A tanfolyamról →</Link>
      </section>
    );
  }
  const filter = { ...parseFeedFilter(sp), course: null };
  const [{ posts, count }, courses] = await Promise.all([
    loadFeed(supabase, { spaceId: space.id, courseId: course.id, filter, isQa: false, pageSize: PAGE_SIZE }),
    loadMyCourses(supabase, user.id),
  ]);
  const extras = await loadPostExtras(supabase, posts, user.id);
  await supabase
    .from('community_space_reads')
    .upsert({ user_id: user.id, space_id: space.id, course_key: course.id, last_read_at: new Date().toISOString() }, { onConflict: 'user_id,space_id,course_key' });

  return (
    <SpaceFeed
      space={space}
      title={course.title.replace(/^(Zsebkurzus|Ingyenes): /, '')}
      icon="📘"
      description={space.description}
      headerAction={<Link href={`/kurzusok/${course.slug}`} className="btn sm" style={{ alignSelf: 'flex-start' }}>Tananyag megnyitása →</Link>}
      course={{ id: course.id, title: course.title, slug: course.slug }}
      basePath={courseSpaceHref(course.slug)}
      filter={filter}
      posts={posts}
      count={count}
      extras={extras}
      courseTitles={new Map()}
      courses={courses}
      userId={user.id}
      isAdmin={!!profile?.is_admin}
      sp={sp}
    />
  );
}
