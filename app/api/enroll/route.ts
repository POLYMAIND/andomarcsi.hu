import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';

// Ingyenes kurzus felvétele a "Saját tanulás" listába (RLS csak ingyenes kurzusra engedi).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const courseId = String(form.get('course_id') ?? '');
  const { supabase, user } = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/belepes', SITE_URL), 303);
  const { data: course } = await supabase.from('courses').select('slug').eq('id', courseId).maybeSingle();
  if (!course) return NextResponse.json({ error: 'Ismeretlen kurzus' }, { status: 404 });
  await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId, source: 'free', amount_huf: 0 });
  return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
}
