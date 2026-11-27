import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { normalizeEmail, sanitizeSourceName } from '@/lib/contacts';
import { createAdminClient } from '@/lib/supabase/server';
import { forwardToPolyos } from '@/lib/waitlist';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BATCH = 500;

// Külső források (pl. Polysuli) feliratkozóinak fogadása a közös kapcsolatlistába.
//
//   POST /api/contacts/ingest
//   Authorization: Bearer <CONTACTS_INGEST_SECRET>
//   { "source": "polysuli", "email": "...", "name": "...", "list": "...", "consent_at": "ISO dátum" }
//   vagy egyszerre több (pl. a régi feliratkozók egyszeri áttöltése):
//   { "source": "polysuli", "contacts": [ { "email": "...", ... }, ... ] }   (max. 500 / kérés)
//
// Ugyanaz a cím ugyanabból a forrásból csak egyszer kerül be; az újakat továbbítjuk PolyOS-be is.
function authorized(request: NextRequest) {
  const secret = process.env.CONTACTS_INGEST_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : request.headers.get('x-webhook-secret') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Incoming = { email?: unknown; name?: unknown; list?: unknown; consent_at?: unknown; source?: unknown };

const isoOrNull = (v: unknown) => {
  if (typeof v !== 'string' || !v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export async function POST(request: NextRequest) {
  if (!process.env.CONTACTS_INGEST_SECRET) return NextResponse.json({ error: 'A végpont nincs bekapcsolva (CONTACTS_INGEST_SECRET)' }, { status: 503 });
  if (!authorized(request)) return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Érvénytelen JSON' }, { status: 400 });
  const items: Incoming[] = Array.isArray(body.contacts) ? body.contacts : [body];
  if (items.length > MAX_BATCH) return NextResponse.json({ error: `Legfeljebb ${MAX_BATCH} kapcsolat küldhető egyszerre` }, { status: 413 });

  const rows: { source: string; list: string | null; email: string; name: string | null; consent_at: string | null }[] = [];
  const rejected: { index: number; reason: string }[] = [];
  items.forEach((it, index) => {
    const source = sanitizeSourceName(it.source ?? body.source);
    const email = normalizeEmail(String(it.email ?? ''));
    if (!source) return rejected.push({ index, reason: 'source' });
    if (!EMAIL.test(email) || email.length > 200) return rejected.push({ index, reason: 'email' });
    const name = String(it.name ?? '').trim().slice(0, 120) || null;
    const list = String(it.list ?? body.list ?? '').trim().slice(0, 120) || null;
    rows.push({ source, list, email, name, consent_at: isoOrNull(it.consent_at ?? body.consent_at) });
  });

  // Egy kérésen belüli ismétlődések kiszűrése (különben az upsert hibát dob).
  const unique = [...new Map(rows.map((r) => [`${r.source}|${r.email}`, r])).values()];
  let inserted: typeof unique = [];
  if (unique.length) {
    const { data, error } = await createAdminClient()
      .from('external_contacts')
      .upsert(unique, { onConflict: 'source,email', ignoreDuplicates: true })
      .select('source, list, email, name, consent_at');
    if (error) {
      console.error('[contacts/ingest]', error);
      return NextResponse.json({ error: 'Adatbázis hiba' }, { status: 500 });
    }
    inserted = data ?? [];
  }

  // 20-asával párhuzamosan, hogy egy nagy áttöltés se fusson ki az időkeretből.
  for (let i = 0; i < inserted.length; i += 20) {
    await Promise.all(
      inserted.slice(i, i + 20).map((r) =>
        forwardToPolyos({ event: 'external.signup', email: r.email, name: r.name, source: r.source, list: r.list, consent_at: r.consent_at }),
      ),
    );
  }
  return NextResponse.json({ ok: true, received: items.length, added: inserted.length, duplicates: unique.length - inserted.length, rejected });
}
