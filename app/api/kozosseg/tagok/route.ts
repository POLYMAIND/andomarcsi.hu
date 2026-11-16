import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

// @említéshez: tagok keresése név szerint (csak a közösség tagjai kapnak választ – az RLS szűr).
export async function GET(request: NextRequest) {
  const { supabase, user } = await getCurrentUser();
  if (!user) return NextResponse.json([], { status: 401 });
  const q = (request.nextUrl.searchParams.get('q') ?? '').replace(/[%_,()\\]/g, ' ').trim().slice(0, 40);
  let query = supabase.from('community_profiles').select('user_id, display_name').neq('user_id', user.id).order('display_name').limit(8);
  if (q) query = query.ilike('display_name', `%${q}%`);
  const { data } = await query;
  return NextResponse.json((data ?? []).map((p) => ({ id: p.user_id, name: p.display_name })), { headers: { 'Cache-Control': 'no-store' } });
}
