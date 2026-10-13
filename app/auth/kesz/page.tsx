'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/client';

// E-mailes link („implicit” mód) befejezése: a tokenek az URL # részében jönnek, ezekből session lesz (sütiben).
export default function AuthFinishPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const query = new URLSearchParams(window.location.search);
    const nextParam = query.get('next') ?? '/dashboard';
    const safeNext = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';
    const access_token = hash.get('access_token');
    const refresh_token = hash.get('refresh_token');
    if (!access_token || !refresh_token) {
      window.location.replace('/belepes?hiba=1');
      return;
    }
    const target = hash.get('type') === 'recovery' ? '/jelszo' : safeNext;
    createBrowserSupabase()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        if (error) setFailed(true);
        else window.location.replace(target);
      });
  }, []);

  return (
    <div className="page">
      <section className="card" style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
        <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
          {failed ? (
            <>
              <h1 className="h2">Nem sikerült belépni.</h1>
              <p className="lead">A link lejárt vagy már felhasználtad. <a href="/belepes" style={{ textDecoration: 'underline' }}>Próbáld újra</a>.</p>
            </>
          ) : (
            <>
              <h1 className="h2">Beléptetünk…</h1>
              <p className="lead">Egy pillanat.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
