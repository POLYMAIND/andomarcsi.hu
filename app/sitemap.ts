import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { publicCourses } from '@/lib/public-catalog';

// Google Search Console: https://www.andormarcsi.hu/sitemap.xml
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await publicCourses();
  const now = new Date();
  const page = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });
  return [
    page('/', 1, 'weekly'),
    page('/kurzusok', 0.9, 'weekly'),
    ...courses.map((c) => page(`/kurzusok/${c.slug}`, 0.8, 'weekly')),
    page('/aszf', 0.2, 'yearly'),
    page('/adatvedelem', 0.2, 'yearly'),
    page('/impresszum', 0.2, 'yearly'),
  ];
}
