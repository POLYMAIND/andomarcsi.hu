import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const nextParam = searchParams.get('next') ?? '/dashboard';
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  // Nincs ?code= → „implicit” e-mail link: a tokenek az URL # részében vannak, amit csak a böngésző lát.
  // Az átirányítás megtartja a # részt, a /auth/kesz oldal pedig beléptet.
  if (!code) return NextResponse.redirect(`${origin}/auth/kesz?next=${encodeURIComponent(next)}`);
  return NextResponse.redirect(`${origin}/belepes?hiba=1`);
}
