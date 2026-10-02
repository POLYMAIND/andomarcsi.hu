// Botvédelem a nyilvános feliratkozó-űrlapokhoz: IDŐALAPÚ, nem rejtett szövegmező.
//
// MIÉRT NEM REJTETT SZÖVEGMEZŐ (a klasszikus „honeypot"): 2026-10-02-én kétszer is kiderült, hogy
// a böngésző automatikus kitöltése / jelszókezelő kitölti — előbb a `website` nevűt, aztán egy
// semmire nem hasonlító nevűt is. Ilyenkor a VALÓDI látogató feliratkozását dobtuk el. Egy védelem,
// ami valódi embereket fog meg, rosszabb, mint ha nem volna.
//
// HOGYAN MŰKÖDIK: az űrlap egy rejtett (type="hidden") mezőben hozza, mennyi ideig volt nyitva,
// mielőtt elküldték. A type="hidden" mezőt a böngésző nem tölti ki. Ami ennél gyorsabban jön
// (vagy a mező nélkül — a közvetlenül POST-oló botok), az bot.
//   • kurzusoldal (szerver-komponens): a szerver a renderelés idejét teszi bele (FORM_TS_FIELD),
//     a szerver a saját órájával számol → nincs óraeltérés;
//   • lábléc (kliens-komponens): a böngésző a mount óta eltelt időt küldi (FORM_ELAPSED_FIELD).
export const FORM_TS_FIELD = 'form_ts';
export const FORM_ELAPSED_FIELD = 'form_elapsed_ms';
export const MIN_FILL_MS = 2000;

// Szerver-renderelt űrlap: a renderelés időbélyegéből számolunk.
export function tooFastSince(renderedAt: unknown, now: number = Date.now()): boolean {
  const t = Number(renderedAt);
  if (!Number.isFinite(t) || t <= 0) return true; // hiányzik → közvetlen POST
  return now - t < MIN_FILL_MS;
}

// Kliens-űrlap: a böngészőben mért eltelt időből.
export function tooFastElapsed(elapsedMs: unknown): boolean {
  const ms = Number(elapsedMs);
  if (!Number.isFinite(ms) || ms < 0) return true;
  return ms < MIN_FILL_MS;
}
