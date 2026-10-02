import Link from 'next/link';
import { getCurrentUser, supabaseConfigured } from '@/lib/auth';
import { SUBSCRIPTION } from '@/lib/config';

export async function SiteNav({ bare = false }: { bare?: boolean }) {
  const { user, profile } = supabaseConfigured() ? await getCurrentUser() : { user: null, profile: null };
  return (
    <nav className={bare ? 'nav bare' : 'nav'}>
      <Link href="/" className="logo">
        andormarcsi<span>.</span>
      </Link>
      <div className="nav-links">
        <Link href="/#kurzusok">Kurzusok</Link>
        <Link href="/kurzusok">Tudástár</Link>
        {SUBSCRIPTION.enabled && <Link href="/elofizetes">Előfizetés</Link>}
        {profile?.is_admin && <Link href="/admin">Admin</Link>}
      </div>
      {user ? (
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <Link href="/dashboard" className="btn outline sm">
            Saját tanulás
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn light sm" title="Kijelentkezés">Kilépés</button>
          </form>
        </div>
      ) : (
        <Link href="/belepes" className="btn outline sm">
          Belépés
        </Link>
      )}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <div className="footer-bar">
      <span className="logo" style={{ fontSize: 18 }}>
        andormarcsi<span>.</span>hu
      </span>
      <div className="row" style={{ '--gap': '24px' } as React.CSSProperties}>
        <Link href="/kurzusok">Tudástár</Link>
        {SUBSCRIPTION.enabled && <Link href="/elofizetes">Előfizetés</Link>}
        <a href="mailto:hello@andormarcsi.hu">Kapcsolat</a>
      </div>
    </div>
  );
}
