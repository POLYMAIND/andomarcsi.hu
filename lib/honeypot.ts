// Botcsapda (honeypot) a nyilvános feliratkozó-űrlapokhoz.
//
// MIÉRT VAN KÜLÖN: a korábbi csapda egy `website` nevű rejtett mező volt. Ezt a nevet a böngészők
// automatikus kitöltése és a jelszókezelők felismerik és kitöltik — és ilyenkor a VALÓDI látogató
// feliratkozását a szerver csendben eldobta, miközben „✓ Feliratkoztál" üzenetet mutatott.
// 2026-10-02-én így egyetlen „Értesítést kérek" feliratkozás sem került be a course_waitlist táblába.
//
// A javítás két része:
//  1. A mező neve semmilyen kitöltési mintára nem hasonlít, és a jelszókezelők kihagyó jelzőit is megkapja.
//  2. Ha a csapda mégis bezár, a szerver NEM állítja, hogy sikerült: naplóz, és hibát ad vissza,
//     hogy egy tévesen megfogott valódi látogató lássa, és újrapróbálhassa.
export const HONEYPOT_FIELD = 'hp_x7q_leave_empty';

// A rejtett mező attribútumai (React-propként terítve a <input>-ra).
export const honeypotInputProps = {
  type: 'text',
  name: HONEYPOT_FIELD,
  tabIndex: -1,
  autoComplete: 'off',
  'aria-hidden': true,
  'data-1p-ignore': 'true',
  'data-lpignore': 'true',
  'data-bwignore': 'true',
  'data-form-type': 'other',
  style: { position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 },
} as const;

export function honeypotTripped(value: unknown): boolean {
  return typeof value === 'string' && value.trim() !== '';
}
