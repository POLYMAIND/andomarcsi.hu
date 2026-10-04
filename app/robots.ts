import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

// Minden kereső és AI-crawler látja a nyilvános oldalakat; a belső felületeket nem.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/api/', '/auth/', '/belepes', '/fizetes/'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
