import type { Metadata } from 'next';
import './globals.css';
import { SiteFooter } from '@/components/SiteNav';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: 'Canva és AI kezdőknek – online videókurzus | Andor Marcsi', template: '%s · andormarcsi.hu' },
  description: 'Canva, Claude és AI-eszközök lépésről lépésre, emberi nyelven. Előre felvett videókurzusok kezdőknek és kisvállalkozóknak, Andor Marcsitól.',
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>
        {children}
        <div className="page" style={{ paddingTop: 0 }}>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
