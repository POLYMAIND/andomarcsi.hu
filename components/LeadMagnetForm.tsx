'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { FORM_ELAPSED_FIELD } from '@/lib/honeypot';

// Ingyenes anyag letöltése e-mail-címért cserébe (lead magnet landing oldalak).
export function LeadMagnetForm({ magnet, button = 'Kérem a segédletet' }: { magnet: string; button?: string }) {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [download, setDownload] = useState('');
  const mountedAt = useRef(0); // botvédelem (lib/honeypot.ts)
  useEffect(() => { mountedAt.current = performance.now(); }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const elapsed = mountedAt.current ? Math.round(performance.now() - mountedAt.current) : 0;
    setState('busy');
    const res = await fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ magnet, email, consent, [FORM_ELAPSED_FIELD]: elapsed }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && data.download) {
      setDownload(data.download);
      setState('ok');
    } else {
      setState('error');
      setMsg(data.error ?? 'Nem sikerült, próbáld újra.');
    }
  }

  if (state === 'ok') {
    return (
      <div className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <div className="notice ok">Köszönöm! Itt a segédleted, töltsd le nyugodtan. 💜</div>
        <a className="btn purple block" href={download} download>Letöltöm a PDF-et</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
      <div className="newsletter-field" style={{ background: '#fff' }}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail címed"
          autoComplete="email"
          aria-label="E-mail címed"
        />
        <button className="btn purple" type="submit" disabled={state === 'busy'}>{button}</button>
      </div>
      <label className="check" style={{ alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ink-3)' }}>
        <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
        <span>
          Kérem az ingyenes segédletet, és hozzájárulok, hogy az andormarcsi.hu hírlevelet és ajánlatokat küldjön. Bármikor leiratkozhatok.{' '}
          <Link href="/adatvedelem" style={{ textDecoration: 'underline' }}>Adatkezelési tájékoztató</Link>
        </span>
      </label>
      {state === 'error' && <div className="notice err">{msg}</div>}
    </form>
  );
}
