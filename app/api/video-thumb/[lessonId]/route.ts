import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Egy lecke videójának borítóképe a YouTube-azonosító kiadása nélkül (lásd lib/video-preview.ts).
// Csak megjelent leckéhez, publikált kurzusban.
export async function GET(_request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const notFound = () => new NextResponse(null, { status: 404 });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lessonId) || !process.env.SUPABASE_SERVICE_ROLE_KEY) return notFound();

  const admin = createAdminClient();
  const [{ data: video }, { data: lesson }] = await Promise.all([
    admin.from('lesson_videos').select('youtube_id').eq('lesson_id', lessonId).maybeSingle(),
    admin.from('lessons').select('published_at, courses(published)').eq('id', lessonId).maybeSingle(),
  ]);
  const course = lesson?.courses as unknown as { published: boolean } | null;
  if (!video?.youtube_id || !lesson || !course?.published || new Date(lesson.published_at).getTime() > Date.now()) return notFound();

  const res = await fetch(`https://i.ytimg.com/vi/${video.youtube_id}/hqdefault.jpg`, { signal: AbortSignal.timeout(5000) }).catch(() => null);
  if (!res?.ok) return notFound();
  return new NextResponse(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('content-type') ?? 'image/jpeg',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
    },
  });
}
