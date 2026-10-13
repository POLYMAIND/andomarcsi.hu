'use client';

import { useEffect } from 'react';

// Ha a Supabase a belépő linket nem a /auth/callback-re, hanem pl. a főoldalra irányítja (Site URL),
// a tokenek akkor is a # részben jönnek – ilyenkor átadjuk a /auth/kesz oldalnak.
export function AuthHashRedirect() {
  useEffect(() => {
    const h = window.location.hash;
    if (window.location.pathname === '/auth/kesz') return;
    if (h.includes('access_token=')) window.location.replace(`/auth/kesz${h}`);
    else if (h.includes('error_code=')) window.location.replace('/belepes?hiba=1');
  }, []);
  return null;
}
