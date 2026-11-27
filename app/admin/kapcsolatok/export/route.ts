import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { contactCsvRow, CSV_HEADER, csvCell, filterContacts } from '@/lib/contacts';
import { loadContacts } from '../data';

// Közös kapcsolatlista CSV-ben (Excel / PolyOS importhoz). Ugyanazokkal a szűrőkkel, mint az admin lista.
export async function GET(request: NextRequest) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
  const sp = request.nextUrl.searchParams;
  const rows = filterContacts(await loadContacts(supabase), { q: sp.get('q'), forras: sp.get('forras') });
  const csv = '﻿' + [CSV_HEADER, ...rows.map(contactCsvRow)].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="kapcsolatok-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
