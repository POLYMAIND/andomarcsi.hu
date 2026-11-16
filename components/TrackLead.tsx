'use client';

import { useEffect } from 'react';

type W = Window & { fbq?: (...a: unknown[]) => void; gtag?: (...a: unknown[]) => void };

// Sikeres feliratkozás (értesítéskérés) jelzése a hirdetésmérőknek – csak ha a sütihozzájárulás után betöltődtek.
// A szkriptek a hozzájárulás után aszinkron töltenek be, ezért pár másodpercig újrapróbáljuk.
export function TrackLead({ name }: { name: string }) {
  useEffect(() => {
    let tries = 0;
    let sent = false;
    const t = setInterval(() => {
      const w = window as W;
      if (!sent && (w.fbq || w.gtag)) {
        w.fbq?.('track', 'Lead', { content_name: name });
        w.gtag?.('event', 'generate_lead', { item_name: name });
        sent = true;
      }
      if (sent || ++tries > 10) clearInterval(t);
    }, 500);
    return () => clearInterval(t);
  }, [name]);
  return null;
}
