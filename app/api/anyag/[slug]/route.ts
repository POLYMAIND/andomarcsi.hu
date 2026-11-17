import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { COURSE_FILES, courseLeadCookie, courseLeadKey, verifyLead } from '@/lib/lead-magnets';

// Ingyenes anyag PDF-je: csak az kapja meg, aki a kurzusoldalon megadta az e-mail-címét (aláírt süti), vagy be van lépve.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const f = COURSE_FILES[slug];
  if (!f) return NextResponse.json({ error: 'Nincs ilyen anyag.' }, { status: 404 });

  let allowed = verifyLead(courseLeadKey(slug), request.cookies.get(courseLeadCookie(slug))?.value);
  if (!allowed) {
    const { user } = await getCurrentUser();
    allowed = !!user;
  }
  if (!allowed) return NextResponse.redirect(new URL(`/kurzusok/${slug}`, request.url));

  const body = await readFile(path.join(process.cwd(), f.file));
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${f.filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
