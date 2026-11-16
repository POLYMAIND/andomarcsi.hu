// Meta (Facebook) pixel – csak a sütihozzájárulás („Elfogadom”) után töltődik be, a Google Analyticsszel együtt.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1838171120131726';

type Fbq = (...args: unknown[]) => void;

function consentGranted() {
  try {
    return localStorage.getItem('cookie-consent') === 'granted';
  } catch {
    return false;
  }
}

// Esemény küldése. Ha a pixel még nem töltött be (afterInteractive), pár másodpercig vár rá.
export function fbqTrack(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === 'undefined' || !consentGranted()) return;
  let tries = 0;
  const send = () => {
    const fbq = (window as unknown as { fbq?: Fbq }).fbq;
    if (fbq) {
      if (eventId) fbq('track', event, params ?? {}, { eventID: eventId });
      else fbq('track', event, params ?? {});
      return;
    }
    if (++tries < 40) setTimeout(send, 250);
  };
  send();
}
