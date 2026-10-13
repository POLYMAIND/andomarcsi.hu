import { createServerClient } from '@supabase/ssr';
import { createClient as createJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Componentből hívva nem lehet sütit írni – a proxy frissíti a sessiont.
        }
      },
    },
  });
}

// Csak szerveroldalon (Stripe webhook, fizetés-visszaigazolás): megkerüli az RLS-t.
export function createAdminClient() {
  return createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// E-mailes linkek küldéséhez (belépő link, regisztráció megerősítése, új jelszó).
// „implicit” módban a link BÁRMELYIK böngészőben működik – a PKCE-s link csak ott, ahol kérték.
// A link a /auth/callback-re érkezik, a tokenek az URL # részében jönnek (lásd app/auth/kesz).
export function createEmailAuthClient() {
  return createJsClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { flowType: 'implicit', persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
