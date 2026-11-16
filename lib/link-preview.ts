import { detectPlatform, PLATFORM_LABEL, type LinkPreview } from '@/lib/community';
import { parseOg, safePublicUrl } from '@/lib/link-preview-parse';

// Link-előnézet a közösségi bejegyzésekhez: YouTube és TikTok oEmbed-del, minden más az oldal OG-adataiból
// (og:title, og:description, og:image). Ha nem sikerül (pl. az Instagram nem ad ki adatot), egy egyszerű kártya marad
// a platform nevével és a címmel.

async function getJson(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { Accept: 'application/json' } });
  return res.ok ? ((await res.json()) as Record<string, unknown>) : null;
}

export async function fetchLinkPreview(raw: string): Promise<LinkPreview | null> {
  const u = safePublicUrl(raw);
  if (!u) return null;
  const url = u.toString();
  const platform = detectPlatform(url);
  const provider = platform ? PLATFORM_LABEL[platform] : u.hostname.replace(/^www\./, '');
  const base: LinkPreview = { url, provider, title: null, description: null, image: null };
  try {
    if (platform === 'youtube' || platform === 'tiktok') {
      const endpoint = platform === 'youtube' ? 'https://www.youtube.com/oembed?format=json&url=' : 'https://www.tiktok.com/oembed?url=';
      const j = await getJson(endpoint + encodeURIComponent(url));
      if (j) {
        return {
          ...base,
          title: typeof j.title === 'string' ? j.title.slice(0, 200) : null,
          description: typeof j.author_name === 'string' ? j.author_name : null,
          image: typeof j.thumbnail_url === 'string' ? j.thumbnail_url : null,
        };
      }
    }
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; linkpreview/1.0)', Accept: 'text/html' },
    });
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('html') || !safePublicUrl(res.url || url)) return base;
    const og = parseOg((await res.text()).slice(0, 300_000));
    const image = og.image && safePublicUrl(new URL(og.image, res.url || url).toString()) ? new URL(og.image, res.url || url).toString() : null;
    return { ...base, title: og.title, description: og.description, image };
  } catch {
    return base;
  }
}
