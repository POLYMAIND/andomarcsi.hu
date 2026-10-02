'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { HONEYPOT_FIELD, honeypotInputProps } from '@/lib/honeypot';

// Lábléc: „Havonta egy hasznos tipp, spam nélkül.”
export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // A fejléc „Ingyenes tippek” gombja ide ugrik (#hirlevel) – tegyük a kurzort az e-mail mezőbe.
  useEffect(() => {
    const focus = () => {
      if (window.location.hash === '#hirlevel') setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 300);
    };
    focus();
    window.addEventListener('hashchange', focus);
    return () => window.removeEventListener('hashchange', focus);
  }, []);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const hp = (new FormData(e.currentTarget).get(HONEYPOT_FIELD) as string) ?? '';
    setState('busy');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, consent, [HONEYPOT_FIELD]: hp }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) {
      setState('ok');
    } else {
      setState('error');
      setMsg(data.error ?? 'Nem sikerült a feliratkozás, próbáld újra.');
    }
  }

  return (
    <div id="hirlevel" className="newsletter">
      <h2 className="h2" style={{ fontSize: 'clamp(28px,3.4vw,44px)' }}>Havonta egy hasznos tipp, spam nélkül.</h2>
      {state === 'ok' ? (
        <div className="notice ok">Köszönöm, feliratkoztál! 💜 Hamarosan jövök az első tippel.</div>
      ) : (
        <form onSubmit={submit} className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
          <div className="newsletter-field">
            <input {...honeypotInputProps} />
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail címed"
              autoComplete="email"
              aria-label="E-mail címed"
            />
            <button className="btn" type="submit" disabled={state === 'busy'}>Feliratkozom</button>
          </div>
          <label className="check" style={{ alignItems: 'flex-start', fontSize: 12.5, color: 'var(--ink-3)' }}>
            <input type="checkbox" required checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2 }} />
            <span>
              Hozzájárulok, hogy az andormarcsi.hu havonta hírlevelet és ajánlatokat küldjön. Bármikor leiratkozhatok.{' '}
              <Link href="/adatvedelem" style={{ textDecoration: 'underline' }}>Adatkezelési tájékoztató</Link>
            </span>
          </label>
          {state === 'error' && <div className="notice err">{msg}</div>}
        </form>
      )}
    </div>
  );
}
