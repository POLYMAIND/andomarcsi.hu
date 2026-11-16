import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Avatar } from '@/components/community/Avatar';
import { PostCard } from '@/components/community/PostCard';
import { requireUser } from '@/lib/auth';
import { memberFor, UUID_RE, type CommunityPost, type CommunityProfile } from '@/lib/community';
import { courseTitleMap, loadPostExtras } from '@/lib/community-data';

type Props = { params: Promise<{ userId: string }> };

// Egy tag profilja: kép, bemutatkozás, linkek, „tag óta”, tanfolyam-jelvények és a bejegyzései.
export default async function MemberPage({ params }: Props) {
  const { userId } = await params;
  if (!UUID_RE.test(userId)) notFound();
  const { supabase, user } = await requireUser(`/kozosseg/tag/${userId}`);
  const [{ data: prof }, { data: courses }, { data: posts }, { data: admin }] = await Promise.all([
    supabase.from('community_profiles').select('*').eq('user_id', userId).maybeSingle<CommunityProfile>(),
    supabase.rpc('community_member_courses', { uid: userId }),
    supabase.from('community_posts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(30).returns<CommunityPost[]>(),
    supabase.from('community_posts').select('author_is_admin').eq('user_id', userId).limit(1).maybeSingle(),
  ]);
  if (!prof) notFound();
  const list = posts ?? [];
  const [extras, courseTitles, spaces] = await Promise.all([
    loadPostExtras(supabase, list, user.id, [userId]),
    courseTitleMap(supabase, list.map((p) => p.course_id)),
    supabase.from('community_spaces').select('id, name, icon'),
  ]);
  const spaceLabel = new Map((spaces.data ?? []).map((s) => [s.id as string, `${s.icon} ${s.name}`]));
  const since = new Date(prof.member_since).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', timeZone: 'Europe/Budapest' });

  return (
    <>
      <section className="card kz-profile">
        <Avatar name={prof.display_name} src={extras.avatarOf(userId)} size={96} />
        <div className="stack" style={{ '--gap': '8px', minWidth: 0 } as React.CSSProperties}>
          <h1 className="h2" style={{ fontSize: 'clamp(28px, 3.4vw, 40px)' }}>
            {prof.display_name} {admin?.author_is_admin && <span className="kz-badge mentor" style={{ verticalAlign: 'middle' }}>Mentor</span>}
          </h1>
          {prof.bio && <p className="lead" style={{ margin: 0 }}>{prof.bio}</p>}
          <span className="muted" style={{ fontSize: 14 }}>Tag {since} óta · {memberFor(prof.member_since)}</span>
          <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
            {prof.instagram && <a href={prof.instagram} target="_blank" rel="noopener noreferrer nofollow" className="kz-react">📸 Instagram</a>}
            {prof.website && <a href={prof.website} target="_blank" rel="noopener noreferrer nofollow" className="kz-react">🌐 Weboldal</a>}
            {userId === user.id && <Link href="/kozosseg/profil" className="kz-react">✏️ Profil szerkesztése</Link>}
          </div>
          {(courses ?? []).length > 0 && (
            <div className="row" style={{ '--gap': '6px' } as React.CSSProperties}>
              {(courses as { title: string; slug: string }[]).map((c) => (
                <span key={c.slug} className="kz-badge course">🎓 {c.title}</span>
              ))}
            </div>
          )}
        </div>
      </section>
      <h2 className="h3" style={{ padding: '0 4px' }}>Bejegyzései ({list.length})</h2>
      {list.length === 0 && <div className="card kz-empty"><strong>Még nem posztolt.</strong></div>}
      {list.map((p) => (
        <PostCard
          key={p.id}
          post={p}
          profile={prof}
          avatar={extras.avatarOf(userId)}
          signed={extras.signed}
          liked={extras.liked.has(p.id)}
          courseTitle={p.course_id ? courseTitles.get(p.course_id) ?? null : null}
          spaceLabel={spaceLabel.get(p.space_id) ?? null}
        />
      ))}
    </>
  );
}
