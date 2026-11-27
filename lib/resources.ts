import { connection } from 'next/server';
import { supabaseConfigured } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/server';

// Ingyenes letölthető anyagok. A file_url-t NEM adjuk ki a nyilvános listában:
// csak az kapja meg, aki megadta az e-mail címét (lásd /api/download és /ingyenes/[slug]).
export type FreeResource = { id: string; slug: string; title: string; description: string; sort_order: number };
export type FreeResourceAdmin = FreeResource & { file_url: string; published: boolean; created_at: string };

const PUBLIC_COLS = 'id, slug, title, description, sort_order';

export async function publicResources(): Promise<FreeResource[]> {
  await connection();
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data } = await createAdminClient().from('free_resources').select(PUBLIC_COLS).eq('published', true).order('sort_order').order('created_at');
  return (data ?? []) as FreeResource[];
}

export async function publicResource(slug: string): Promise<FreeResource | null> {
  await connection();
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { data } = await createAdminClient().from('free_resources').select(PUBLIC_COLS).eq('slug', slug).eq('published', true).maybeSingle();
  return (data as FreeResource | null) ?? null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// A letöltési link a sikeres beküldés után: a letöltés azonosítója (kitalálhatatlan uuid) nyitja.
export async function downloadLink(resourceId: string, downloadId: string | undefined): Promise<string | null> {
  if (!downloadId || !UUID.test(downloadId)) return null;
  const admin = createAdminClient();
  const { data } = await admin.from('resource_downloads').select('id').eq('id', downloadId).eq('resource_id', resourceId).maybeSingle();
  if (!data) return null;
  const { data: res } = await admin.from('free_resources').select('file_url').eq('id', resourceId).maybeSingle();
  return res?.file_url ?? null;
}
