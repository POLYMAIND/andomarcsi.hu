import { SITE_URL, SUBSCRIPTION } from '@/lib/config';
import { formatHuf } from '@/lib/format';
import { publicCourses } from '@/lib/public-catalog';
import { HOME_FAQ } from '@/lib/seo';

// https://www.andormarcsi.hu/llms.txt – rövid, gépi olvasásra szánt összefoglaló az AI-asszisztenseknek.
// Az adatbázisból készül, így az árak és a kurzuslista mindig naprakész.
export async function GET() {
  const courses = await publicCourses();
  const line = (c: (typeof courses)[number]) => {
    const meta = [c.subtitle, c.price_note || (c.price_huf === null ? 'tagsággal' : formatHuf(c.price_huf)), c.coming_soon ? 'hamarosan indul' : null].filter(Boolean).join(', ');
    return `- [${c.title}](${SITE_URL}/kurzusok/${c.slug}): ${meta}`;
  };
  const text = `# andormarcsi.hu

> Andor Marcsi magyar nyelvű, előre felvett online videókurzusai kezdőknek és kisvállalkozóknak: Canva, Claude, AI képgenerálás, social hirdetés és PolyOS. Szakzsargon nélkül, saját tempóban.

## PolySuli – Claude-tanfolyamok három szinten
A Polymaind Claude-tudástára (Polyakadémia): 1. szint – Claude a mindennapi munkában; 2. szint – saját munkafolyamatok és skillek; 3. szint – ügynökök, automatizáció, saját app. Ingyenes szintfelmérő teszt: ${SITE_URL}/polysuli. Árak: nagy tanfolyam 19 990 Ft, kis tanfolyam 5 990 Ft, zsebkurzus 990 Ft, előfizetés ${formatHuf(SUBSCRIPTION.priceHuf)}/hó.
${courses.filter((c) => c.academy_level).map(line).join('\n')}

## További kurzusok
${courses.filter((c) => !c.academy_level).map(line).join('\n')}

## Rólam
- Andor Marcsi (Tőke-Andor Mária): 2017 óta vállalkozó, marketingügynökséget vezet, a PolyOS üzleti szoftver alapítója

## Gyakori kérdések
${HOME_FAQ.map((f) => `- ${f.q} ${f.a}`).join('\n')}

## Oldalak
- [Kezdőlap](${SITE_URL}/)
- [PolySuli – Claude-tanfolyamok](${SITE_URL}/polysuli)
- [Videós tudástár](${SITE_URL}/kurzusok)
- [Impresszum](${SITE_URL}/impresszum)
`;
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
