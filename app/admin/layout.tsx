import type { Metadata } from 'next';

// Az admin felület soha ne kerüljön keresőbe (a robots.txt is tiltja, ez a második védővonal).
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
