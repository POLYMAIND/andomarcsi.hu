import type { EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// E-mailes linkek fogadása token_hash-sel (a Supabase e-mail sablonjaiból).
// A /auth/callback PKCE-s változatával szemben ez BÁRMELYIK böngészőben működik, nem csak ott, ahol a linket kérték.
const TYPES: EmailOtpType[] = ['email', 'magiclink', 'signup', 'recovery', 'invite', 'email_change'];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next') ?? '';
  const next = type === 'recovery' ? '/jelszo' : nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard';
  if (tokenHash && type && TYPES.includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/belepes?hiba=1`);
}
