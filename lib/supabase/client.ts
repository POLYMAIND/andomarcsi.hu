'use client';

import { createBrowserClient } from '@supabase/ssr';

// Böngészőoldali kliens – a sessiont sütiben tárolja, így a szerver is látja.
export const createBrowserSupabase = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
