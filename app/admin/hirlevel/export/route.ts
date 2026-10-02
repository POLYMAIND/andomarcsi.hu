import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // képletinjekció ellen (Excel): =, +, -, @ kezdetű cellák elé aposztróf
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Hírlevél-feliratkozók CSV-ben (Excel / PolyOS importhoz).
export async function GET() {
  const { supabase, profile } = await getCurrentUser();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
  const { data } = await supabase.from('newsletter_subscribers').select('email, name, created_at, consent_at, source').order('created_at', { ascending: false });
  const rows = (data ?? []).map((r) => [r.email, r.name, r.created_at, r.consent_at, r.source]);
  const header = ['email', 'nev', 'feliratkozott', 'hozzajarulas', 'forras'];
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="hirlevel-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
