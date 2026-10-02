import Link from 'next/link';
import { getCurrentUser, supabaseConfigured } from '@/lib/auth';
import { COMPANY } from '@/lib/company';
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
    <footer className="site-footer">
      <div className="row between" style={{ alignItems: 'flex-start', '--gap': '24px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
          <span className="logo" style={{ fontSize: 20 }}>
            andormarcsi<span>.</span>hu
          </span>
          <span className="muted" style={{ fontSize: 13 }}>Online videókurzusok kezdőknek – Canva, Claude, PolyOS.</span>
        </div>
        <nav className="footer-links" aria-label="Lábléc">
          <Link href="/kurzusok">Tudástár</Link>
          {SUBSCRIPTION.enabled && <Link href="/elofizetes">Előfizetés</Link>}
          <a href={`mailto:${COMPANY.email}`}>Kapcsolat</a>
          <Link href="/aszf">ÁSZF</Link>
          <Link href="/adatvedelem">Adatkezelési tájékoztató</Link>
          <Link href="/adatvedelem#sutik">Sütik</Link>
          <Link href="/impresszum">Impresszum</Link>
        </nav>
      </div>
      <div className="footer-legal">
        © {new Date().getFullYear()} {COMPANY.name} · {COMPANY.seat} · Adószám: {COMPANY.taxNumber} · {COMPANY.vatNote.split(' –')[0]}
      </div>
    </footer>
  );
}
