import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { loadPurchases, SOURCE_LABEL } from '../data';

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // képletinjekció ellen (Excel): =, +, -, @ kezdetű cellák elé aposztróf
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Vásárlók CSV-ben (Excel / PolyOS importhoz). Ugyanazokkal a szűrőkkel, mint az admin lista.
export async function GET(request: NextRequest) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') ?? '').trim().toLowerCase();
  const rows = (await loadPurchases(supabase)).filter((p) =>
    (!sp.get('forras') || p.source === sp.get('forras')) &&
    (!sp.get('kurzus') || p.slug === sp.get('kurzus')) &&
    (sp.get('csomag') === '1' || !p.fromBundle) &&
    (!q || p.email.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)),
  );
  const header = ['datum', 'email', 'nev', 'kurzus', 'forras', 'osszeg_ft', 'szamlaszam', 'csomag'];
  const data = rows.map((p) => [p.created_at, p.email, p.name, p.course, SOURCE_LABEL[p.source], p.amount_huf, p.invoice, p.fromBundle]);
  const csv = '﻿' + [header, ...data].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="vasarlok-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
