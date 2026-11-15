import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // A lead magnet PDF-ek a private/ mappában vannak (nem nyilvánosak), az API-útvonalnak be kell csomagolnia őket.
  outputFileTracingIncludes: { '/api/segedlet/[slug]': ['./private/segedlet/**'] },
  images: { remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }] },
  async redirects() {
    return [
      { source: '/polyakademia', destination: '/polysuli', permanent: true },
      { source: '/claude-tanfolyamok', destination: '/polysuli', permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
