import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const csvCell = (v: unknown) => {
  const s = v == null ? '' : String(v);
  // képletinjekció ellen (Excel): =, +, -, @ kezdetű cellák elé aposztróf
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[";\n,]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

// CSV export (Excel / PolyOS importhoz). ?kurzus=<id> szűrhető.
export async function GET(request: NextRequest) {
  const { supabase, profile } = await getCurrentUser();
  if (!profile?.is_admin) return NextResponse.json({ error: 'Nincs jogosultság' }, { status: 403 });
  const courseId = request.nextUrl.searchParams.get('kurzus');
  let q = supabase.from('course_waitlist').select('email, name, created_at, consent_at, notified_at, source, courses(title, slug)').order('created_at', { ascending: false });
  if (courseId) q = q.eq('course_id', courseId);
  const { data } = await q;
  const rows = (data ?? []).map((r) => {
    const c = r.courses as unknown as { title: string; slug: string } | null;
    return [r.email, r.name, c?.title, c?.slug, r.created_at, r.consent_at, r.notified_at, r.source];
  });
  const header = ['email', 'nev', 'kurzus', 'kurzus_slug', 'feliratkozott', 'hozzajarulas', 'ertesitve', 'forras'];
  const csv = '﻿' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="ertesitesi-lista-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
