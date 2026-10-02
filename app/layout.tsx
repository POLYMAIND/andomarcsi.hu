import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'andormarcsi.hu – Digitális eszközök félelem nélkül', template: '%s · andormarcsi.hu' },
  description: 'Canva, Claude és Polyos – lépésről lépésre, emberi nyelven. Workshopok és videós tudástár kezdőknek.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
