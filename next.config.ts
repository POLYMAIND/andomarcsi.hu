import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'i.ytimg.com' }] },
  async redirects() {
    return [
      { source: '/polysuli', destination: '/polyakademia', permanent: true },
      { source: '/claude-tanfolyamok', destination: '/polyakademia', permanent: true },
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
