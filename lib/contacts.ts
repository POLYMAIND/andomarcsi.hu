// Közös kapcsolatlista: minden forrás (regisztráció, hírlevél, értesítés, ingyenes kurzus,
// ingyenes letöltés, külső források pl. Polysuli) egy e-mail címre összefésülve.
// Ez a fájl tiszta logika (teszt: lib/contacts.test.ts); az adatbázis-olvasás az admin oldalon van.

export type TouchKind = 'registered' | 'newsletter' | 'waitlist' | 'free_course' | 'download' | 'external';

export const KIND_LABEL: Record<TouchKind, string> = {
  registered: 'Regisztrált',
  newsletter: 'Hírlevél',
  waitlist: 'Értesítést kért',
  free_course: 'Ingyenes kurzus',
  download: 'Ingyenes letöltés',
  external: 'Külső forrás',
};

export const KIND_ORDER: TouchKind[] = ['registered', 'newsletter', 'waitlist', 'free_course', 'download', 'external'];

// Egy „érintés”: valaki egy forráson keresztül bekerült. detail: a kurzus / anyag / külső forrás neve.
export type Touch = { email: string; name: string | null; kind: TouchKind; detail: string | null; at: string };

export type Contact = {
  email: string;
  name: string | null;
  first_at: string;
  last_at: string;
  kinds: TouchKind[];
  details: Partial<Record<TouchKind, string[]>>;
};

export const normalizeEmail = (e: string) => e.trim().toLowerCase();

export function mergeContacts(touches: Touch[]): Contact[] {
  const byEmail = new Map<string, Contact>();
  // Időrendben megyünk végig, így a legkorábbi név marad meg, ha később üres jön.
  const sorted = [...touches].sort((a, b) => a.at.localeCompare(b.at));
  for (const t of sorted) {
    const email = normalizeEmail(t.email ?? '');
    if (!email) continue;
    let c = byEmail.get(email);
    if (!c) {
      c = { email, name: null, first_at: t.at, last_at: t.at, kinds: [], details: {} };
      byEmail.set(email, c);
    }
    const name = t.name?.trim();
    if (name && !c.name) c.name = name;
    if (t.at < c.first_at) c.first_at = t.at;
    if (t.at > c.last_at) c.last_at = t.at;
    if (!c.kinds.includes(t.kind)) c.kinds.push(t.kind);
    if (t.detail) {
      const list = (c.details[t.kind] ??= []);
      if (!list.includes(t.detail)) list.push(t.detail);
    }
  }
  for (const c of byEmail.values()) c.kinds.sort((a, b) => KIND_ORDER.indexOf(a) - KIND_ORDER.indexOf(b));
  return [...byEmail.values()].sort((a, b) => b.last_at.localeCompare(a.last_at));
}

// Szűrés az admin listához és a CSV-hez (ugyanazokkal a paraméterekkel).
// forras: egy TouchKind, vagy 'external:<forrás>' egy konkrét külső forrásra (pl. external:polysuli).
export function filterContacts(list: Contact[], opts: { q?: string | null; forras?: string | null }): Contact[] {
  const q = (opts.q ?? '').trim().toLowerCase();
  const f = opts.forras ?? '';
  return list.filter((c) => {
    if (q && !c.email.includes(q) && !(c.name ?? '').toLowerCase().includes(q)) return false;
    if (!f) return true;
    if (f.startsWith('external:')) return (c.details.external ?? []).includes(f.slice('external:'.length));
    return c.kinds.includes(f as TouchKind);
  });
}

export const CSV_HEADER = ['email', 'nev', 'elso_alkalom', 'utolso_alkalom', 'forrasok', 'regisztralt', 'hirlevel', 'ertesitest_kert', 'ingyenes_kurzus', 'ingyenes_letoltes', 'kulso_forras'];

export function contactCsvRow(c: Contact): (string | boolean)[] {
  const d = (k: TouchKind) => (c.details[k] ?? []).join('; ');
  return [
    c.email,
    c.name ?? '',
    c.first_at,
    c.last_at,
    c.kinds.map((k) => KIND_LABEL[k]).join('; '),
    c.kinds.includes('registered'),
    c.kinds.includes('newsletter'),
    d('waitlist'),
    d('free_course'),
    d('download'),
    d('external'),
  ];
}

export const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // képletinjekció ellen (Excel): =, +, -, @ kezdetű cellák elé aposztróf
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Külső forrás neve: kisbetű, szám, kötőjel (pl. „polysuli”). Rossz bemenetre null.
export function sanitizeSourceName(v: unknown): string | null {
  const s = String(v ?? '').trim().toLowerCase();
  return /^[a-z0-9][a-z0-9_-]{0,39}$/.test(s) ? s : null;
}
