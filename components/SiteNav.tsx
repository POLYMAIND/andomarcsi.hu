import Link from 'next/link';
import { getCurrentUser, supabaseConfigured } from '@/lib/auth';
import { CookieSettingsLink } from '@/components/CookieConsent';
import { NewsletterForm } from '@/components/NewsletterForm';
import { COMPANY } from '@/lib/company';
import { SUBSCRIPTION } from '@/lib/config';

function TipsButton() {
  return (
    <a href="#hirlevel" className="btn light sm tips-btn" title="Ingyenes tippek – hírlevél">
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a7 7 0 0 0-4 12.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26A7 7 0 0 0 12 2Z" fill="#FFC21A" stroke="#C98A00" strokeWidth="1.2" />
        <path d="M9.5 20h5M10.5 22h3" stroke="#6b5a2e" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      Ingyenes tippek
    </a>
  );
}

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
          <TipsButton />
          <Link href="/dashboard" className="btn outline sm">
            Saját tanulás
          </Link>
          <form action="/auth/signout" method="post">
            <button type="submit" className="btn light sm" title="Kijelentkezés">Kilépés</button>
          </form>
        </div>
      ) : (
        <div className="row" style={{ '--gap': '8px' } as React.CSSProperties}>
          <TipsButton />
          <Link href="/belepes" className="btn outline sm">
            Belépés
          </Link>
        </div>
      )}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <NewsletterForm />
      <div className="row between" style={{ alignItems: 'flex-start', '--gap': '24px' } as React.CSSProperties}>
        <div className="stack" style={{ '--gap': '6px' } as React.CSSProperties}>
          <span className="logo" style={{ fontSize: 20 }}>
            andormarcsi<span>.</span>hu
          </span>
          <span className="muted" style={{ fontSize: 13, maxWidth: 420 }}>andormarcsi.hu – online videókurzusok kezdőknek: Canva, Claude, AI-eszközök és PolyOS. Emberi nyelven, félelem nélkül.</span>
        </div>
        <nav className="footer-links" aria-label="Lábléc">
          <Link href="/kurzusok">Tudástár</Link>
          {SUBSCRIPTION.enabled && <Link href="/elofizetes">Előfizetés</Link>}
          <a href={`mailto:${COMPANY.email}`}>Kapcsolat</a>
          <Link href="/aszf">ÁSZF</Link>
          <Link href="/adatvedelem">Adatkezelési tájékoztató</Link>
          <Link href="/adatvedelem#sutik">Sütik</Link>
          <CookieSettingsLink />
          <Link href="/impresszum">Impresszum</Link>
        </nav>
      </div>
      <div className="footer-legal">
        © {new Date().getFullYear()} {COMPANY.name} · {COMPANY.seat} · Adószám: {COMPANY.taxNumber} · {COMPANY.vatNote.split(' –')[0]}
      </div>
    </footer>
  );
}
