import { getCurrentUser } from '@/lib/auth';

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // képletinjekció ellen (Excel): =, +, -, @ kezdetű cellák elé aposztróf
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// Vélemények CSV-ben (posztokhoz, táblázatban válogatáshoz).
export async function GET() {
  const { supabase, profile } = await getCurrentUser();
  if (!profile?.is_admin) return Response.json({ error: 'Nincs jogosultság' }, { status: 403 });
  const { data } = await supabase
    .from('testimonials')
    .select('rating, body, display_name, business, status, created_at, consent_at, courses(title)')
    .order('created_at', { ascending: false });
  const rows = (data ?? []).map((r) => [
    r.created_at,
    (r.courses as unknown as { title: string } | null)?.title ?? '',
    r.rating,
    r.body,
    r.display_name,
    r.business,
    { new: 'új', approved: 'jóváhagyva', hidden: 'elrejtve' }[r.status as string] ?? r.status,
    r.consent_at,
  ]);
  const header = ['datum', 'kurzus', 'csillag', 'velemeny', 'nev', 'vallalkozas', 'allapot', 'hozzajarulas'];
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="velemenyek-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
