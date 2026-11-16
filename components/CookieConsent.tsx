'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useState } from 'react';

// Google Analytics csak hozzájárulás után töltődik be (ePrivacy / GDPR). A döntést a böngészőben tároljuk.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-2ST7B28SX7';
// Meta (Facebook/Instagram) Pixel a hirdetések méréséhez – csak ha be van állítva, és csak hozzájárulás után.
const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '').replace(/\D/g, '');
const KEY = 'cookie-consent'; // 'granted' | 'denied'
const OPEN_EVENT = 'open-cookie-settings';

type Choice = 'granted' | 'denied' | null;

function readChoice(): Choice {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : null;
  } catch {
    return null;
  }
}

export function CookieConsent() {
  const [choice, setChoice] = useState<Choice>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const c = readChoice();
    setChoice(c);
    setOpen(c === null);
    const reopen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  function decide(c: 'granted' | 'denied') {
    try { localStorage.setItem(KEY, c); } catch {}
    setOpen(false);
    // Visszavonáskor a már betöltött GA-t csak oldal-újratöltéssel lehet leállítani.
    if (choice === 'granted' && c === 'denied') {
      document.cookie.split(';').map((s) => s.split('=')[0].trim()).filter((n) => n.startsWith('_ga') || n === '_fbp' || n === '_fbc')
        .forEach((n) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=.${location.hostname.replace(/^www\./, '')}`; document.cookie = `${n}=; Max-Age=0; path=/`; });
      location.reload();
      return;
    }
    setChoice(c);
  }

  return (
    <>
      {choice === 'granted' && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
          </Script>
          {META_PIXEL_ID && (
            <Script id="meta-pixel" strategy="afterInteractive">
              {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
            </Script>
          )}
        </>
      )}
      {open && (
        <div className="cookie-bar" role="dialog" aria-live="polite" aria-label="Sütibeállítások">
          <p>
            {META_PIXEL_ID
              ? '🍪 Statisztikai és hirdetésmérő sütiket (Google Analytics, Meta Pixel) szeretnék használni, hogy lássam, mi hasznos az oldalon, és mely hirdetések működnek. Csak akkor kapcsolom be, ha engeded.'
              : '🍪 Statisztikai sütiket (Google Analytics) szeretnék használni, hogy lássam, mi hasznos az oldalon. Csak akkor kapcsolom be, ha engeded.'}{' '}
            <Link href="/adatvedelem#sutik">Részletek</Link>
          </p>
          <div className="cookie-actions">
            <button className="btn light sm" type="button" onClick={() => decide('denied')}>Csak a szükségesek</button>
            <button className="btn sm" type="button" onClick={() => decide('granted')}>Elfogadom</button>
          </div>
        </div>
      )}
    </>
  );
}

// Lábléc link: a sütisáv újranyitása (hozzájárulás módosítása / visszavonása).
export function CookieSettingsLink() {
  return (
    <button type="button" className="link-btn" onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}>
      Sütibeállítások
    </button>
  );
}
