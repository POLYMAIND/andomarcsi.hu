import Link from 'next/link';
import { saveProfile, setCommunityEmails } from '@/app/kozosseg/actions';
import { AvatarUpload } from '@/components/community/AvatarUpload';
import { SubmitButton } from '@/components/SubmitButton';
import { requireUser } from '@/lib/auth';
import { memberHref, signImages, type CommunityProfile } from '@/lib/community';

type Props = { searchParams: Promise<Record<string, string | undefined>> };

// Saját közösségi profil: név, kép, egysoros bemutatkozás, Instagram, weboldal + e-mail értesítések.
export default async function MyProfilePage({ searchParams }: Props) {
  const sp = await searchParams;
  const { supabase, user, profile } = await requireUser('/kozosseg/profil');
  const { data: prof } = await supabase.from('community_profiles').select('*').eq('user_id', user.id).maybeSingle<CommunityProfile>();
  const signed = await signImages(supabase, [prof?.avatar_path]);
  const avatar = prof?.avatar_path ? signed.get(prof.avatar_path) ?? null : null;
  const emailsOn = profile?.community_emails !== false;

  return (
    <>
      <section className="card stack" style={{ '--gap': '18px' } as React.CSSProperties}>
        <div className="row between">
          <h1 className="h2">Profilom</h1>
          <Link href={memberHref(user.id)} className="kz-react">Így látnak mások →</Link>
        </div>
        {sp.mentve && <div className="notice ok">Elmentve. ✨</div>}
        {sp.hiba && <div className="notice err">{sp.hiba}</div>}
        <form action={saveProfile} className="stack" style={{ '--gap': '14px', maxWidth: 640 } as React.CSSProperties}>
          <AvatarUpload userId={user.id} name={prof?.display_name ?? 'Én'} current={avatar} />
          <label className="field">Név (így jelensz meg)<input className="input" name="display_name" required maxLength={60} defaultValue={prof?.display_name ?? ''} /></label>
          <label className="field">
            Egy mondat magadról
            <input className="input" name="bio" maxLength={80} defaultValue={prof?.bio ?? ''} placeholder="pl. Kávézótulaj Szentendrén" />
          </label>
          <div className="grid" style={{ '--min': '240px', '--gap': '12px' } as React.CSSProperties}>
            <label className="field">Instagram<input className="input" name="instagram" maxLength={100} defaultValue={prof?.instagram ?? ''} placeholder="@felhasznalonev" /></label>
            <label className="field">Weboldal<input className="input" name="website" maxLength={200} defaultValue={prof?.website ?? ''} placeholder="www.pelda.hu" /></label>
          </div>
          <SubmitButton className="btn" pending="Mentés…">Mentés</SubmitButton>
        </form>
      </section>

      <section id="ertesitesek" className="card stack" style={{ '--gap': '12px', scrollMarginTop: 24 } as React.CSSProperties}>
        <h2 className="h3">E-mail értesítések</h2>
        {sp.ertesites && <div className="notice ok">{sp.ertesites === 'be' ? 'Bekapcsoltad az e-maileket.' : 'Kikapcsoltad az e-maileket.'}</div>}
        <p className="muted" style={{ margin: 0 }}>
          {emailsOn
            ? 'Naponta egyszer összefoglalót küldünk arról, ami veled történt (válasz, kedvelés, említés). Bejelentésnél azonnal szólunk.'
            : 'Most nem kapsz e-mailt a közösségből. A harangnál továbbra is látod az értesítéseket.'}
        </p>
        <form action={setCommunityEmails}>
          <input type="hidden" name="on" value={emailsOn ? '0' : '1'} />
          <button type="submit" className="btn sm light">{emailsOn ? 'Kikapcsolom' : 'Bekapcsolom'}</button>
        </form>
      </section>
    </>
  );
}
