import { connection } from 'next/server';
import { supabaseConfigured } from '@/lib/auth';
import { getCatalog } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

// Nyilvános kurzuslista sitemaphez / llms.txt-hez. Supabase nélkül (helyi build) üres listát ad.
export async function publicCourses() {
  await connection();
  if (!supabaseConfigured()) return [];
  try {
    return (await getCatalog(await createClient())).courses;
  } catch {
    return [];
  }
}
