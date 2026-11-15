import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { LEAD_MAGNETS, leadCookieName, verifyLead } from '@/lib/lead-magnets';

// Ingyenes PDF letöltése: csak e-mail-cím megadása után (aláírt süti) vagy belépve.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lm = LEAD_MAGNETS[slug];
  if (!lm) return NextResponse.json({ error: 'Nincs ilyen anyag.' }, { status: 404 });

  let allowed = verifyLead(slug, request.cookies.get(leadCookieName(slug))?.value);
  if (!allowed) {
    const { user } = await getCurrentUser();
    allowed = !!user;
  }
  if (!allowed) return NextResponse.redirect(new URL(`${lm.landing}#kerem`, request.url));

  const body = await readFile(path.join(process.cwd(), lm.file));
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${lm.filename}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
