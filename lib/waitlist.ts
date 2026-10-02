// „Értesítést kérek” feliratkozások továbbítása külső rendszerbe (PolyOS).
// POLYOS_WEBHOOK_URL: ide küldünk minden új feliratkozást JSON-ben (POST).
// POLYOS_WEBHOOK_SECRET: opcionális, X-Webhook-Secret fejlécben megy át.
export type WaitlistEvent =
  | {
      event: 'waitlist.signup';
      email: string;
      name: string | null;
      course: { id: string; slug: string; title: string };
      consent_at: string;
      source: string;
    }
  | { event: 'newsletter.signup'; email: string; name: string | null; consent_at: string; source: string };

export async function forwardToPolyos(payload: WaitlistEvent) {
  const url = process.env.POLYOS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.POLYOS_WEBHOOK_SECRET ? { 'X-Webhook-Secret': process.env.POLYOS_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    // A feliratkozás az adatbázisban így is megvan – az adminból CSV-ben exportálható.
    console.error('PolyOS webhook hiba', err);
  }
}
