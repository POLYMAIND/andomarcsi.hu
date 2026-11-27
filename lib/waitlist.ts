// Feliratkozások, regisztrációk, ingyenes letöltések továbbítása külső rendszerbe (PolyOS).
// POLYOS_WEBHOOK_URL: ide küldünk minden új eseményt JSON-ben (POST). Az „event” mező mondja meg, honnan jött.
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
  | { event: 'newsletter.signup'; email: string; name: string | null; consent_at: string; source: string }
  // Új fiók az andormarcsi.hu-n (első belépéskor küldjük, egyszer).
  | { event: 'user.registered'; email: string; name: string | null; registered_at: string; source: 'andormarcsi.hu' }
  // Ingyenes kurzus felvétele a „Saját tanulás” listába.
  | { event: 'course.free_enroll'; email: string; name: string | null; course: { id: string; slug: string; title: string }; enrolled_at: string; source: 'andormarcsi.hu' }
  // Ingyenes anyag letöltése (e-mail megadásával). newsletter: kért-e hírlevelet is.
  | {
      event: 'resource.download';
      email: string;
      name: string | null;
      resource: { id: string; slug: string; title: string };
      newsletter: boolean;
      consent_at: string;
      source: string;
    }
  // Külső forrásból (pl. Polysuli) beküldött feliratkozó.
  | { event: 'external.signup'; email: string; name: string | null; source: string; list: string | null; consent_at: string | null };

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
