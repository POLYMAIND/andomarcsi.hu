import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { SITE_URL } from '@/lib/config';
import { forwardToPolyos } from '@/lib/waitlist';

// Ingyenes kurzus felvétele a "Saját tanulás" listába (RLS csak ingyenes kurzusra engedi).
export async function POST(request: NextRequest) {
  const form = await request.formData();
  const courseId = String(form.get('course_id') ?? '');
  const { supabase, user, profile } = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL('/belepes', SITE_URL), 303);
  const { data: course } = await supabase.from('courses').select('id, slug, title').eq('id', courseId).maybeSingle();
  if (!course) return NextResponse.json({ error: 'Ismeretlen kurzus' }, { status: 404 });
  const { error } = await supabase.from('enrollments').insert({ user_id: user.id, course_id: courseId, source: 'free', amount_huf: 0 });
  // Csak az új felvételt továbbítjuk (ismételt kattintásnál az insert ütközik).
  if (!error && user.email) {
    await forwardToPolyos({
      event: 'course.free_enroll',
      email: user.email.toLowerCase(),
      name: profile?.full_name || null,
      course: { id: course.id, slug: course.slug, title: course.title },
      enrolled_at: new Date().toISOString(),
      source: 'andormarcsi.hu',
    });
  }
  return NextResponse.redirect(new URL(`/kurzusok/${course.slug}`, SITE_URL), 303);
}
