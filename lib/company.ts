// Az oldal üzemeltetőjének adatai – az Impresszum, ÁSZF, Adatkezelési tájékoztató és a lábléc innen veszi.
// A „KITÖLTENDŐ” értékeket a valós adatokra kell cserélni (cégkivonat / vállalkozói igazolvány alapján).
export const COMPANY = {
  brand: 'andormarcsi.hu',
  name: 'Tőke-Andor Mária egyéni vállalkozó',
  seat: '2013 Pomáz, Nyár utca 46. A épület 1. ajtó',
  registry: '51044840 (egyéni vállalkozói nyilvántartás)',
  taxNumber: '67982774-1-33',
  vatNote: 'Alanyi adómentes (AAM) – az árak végösszegek, ÁFA-t nem tartalmaznak.',
  email: 'hello@andormarcsi.hu',
  phone: '+36 70 600 5655',
  website: 'https://www.andormarcsi.hu',
  // A székhely szerinti megyei békéltető testület (pl. Budapest: Budapesti Békéltető Testület)
  conciliationBody: 'Pest Vármegyei Békéltető Testület',
  lastUpdated: '2026. október 2.',
};

// Tárhely és adatfeldolgozók (adatvédelmi tájékoztatóhoz)
export const PROCESSORS = [
  { name: 'Vercel Inc.', role: 'Weboldal tárhely és futtatás', site: 'https://vercel.com/legal/privacy-policy', transfer: true },
  { name: 'Supabase Inc.', role: 'Adatbázis és felhasználói fiókok (belépés)', site: 'https://supabase.com/privacy', transfer: true },
  { name: 'Stripe Payments Europe Ltd.', role: 'Online bankkártyás fizetés', site: 'https://stripe.com/privacy', transfer: false },
  { name: 'Sendinblue SAS (Brevo)', role: 'E-mail küldés (belépő linkek, értesítések)', site: 'https://www.brevo.com/legal/privacypolicy/', transfer: false },
  { name: 'Anthropic PBC', role: 'AI segítő (Claude) – a csevegőbe írt kérdések feldolgozása', site: 'https://www.anthropic.com/legal/privacy', transfer: true },
  { name: 'Google Ireland Ltd. (YouTube)', role: 'Videók lejátszása (youtube-nocookie beágyazás)', site: 'https://policies.google.com/privacy', transfer: false },
];
