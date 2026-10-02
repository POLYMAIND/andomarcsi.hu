import type { Metadata } from 'next';
import './globals.css';
import { SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: 'andormarcsi.hu – Digitális eszközök félelem nélkül', template: '%s · andormarcsi.hu' },
  description: 'Canva, Claude és Polyos – lépésről lépésre, emberi nyelven. Workshopok és videós tudástár kezdőknek.',
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
