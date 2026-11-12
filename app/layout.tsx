import type { Metadata } from 'next';
import './globals.css';
import { AuthHashRedirect } from '@/components/AuthHashRedirect';
import { CookieConsent } from '@/components/CookieConsent';
import { SiteFooter } from '@/components/SiteNav';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: 'Canva és AI kezdőknek – online videókurzus | Andor Marcsi', template: '%s · andormarcsi.hu' },
  description: 'Canva, Claude és AI-eszközök lépésről lépésre, emberi nyelven. Előre felvett videókurzusok kezdőknek és kisvállalkozóknak, Andor Marcsitól.',
  metadataBase: new URL(SITE_URL),
  applicationName: 'andormarcsi.hu',
  // Alapértelmezés minden oldalra; a megosztási kép az app/opengraph-image.png (a /polysuli alatt saját).
  openGraph: { siteName: 'andormarcsi.hu', locale: 'hu_HU', type: 'website' },
  twitter: { card: 'summary_large_image' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>
        {children}
        <div className="page" style={{ paddingTop: 0 }}>
          <SiteFooter />
        </div>
        <CookieConsent />
        <AuthHashRedirect />
      </body>
    </html>
  );
}
