// Link-előnézet: OG-adatok kiolvasása és a cím ellenőrzése (függőség nélkül, tesztelhető).
const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

// <meta property="og:title" content="…"> (a sorrend és az idézőjel bármilyen lehet)
export function parseOg(html: string): { title: string | null; description: string | null; image: string | null } {
  const head = html.slice(0, 200_000);
  const meta = (names: string[]) => {
    for (const tag of head.match(/<meta\b[^>]*>/gi) ?? []) {
      const key = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase();
      if (key && names.includes(key)) {
        const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
        if (content?.trim()) return decode(content.trim());
      }
    }
    return null;
  };
  const title = meta(['og:title', 'twitter:title']) ?? (/<title[^>]*>([^<]{1,300})<\/title>/i.exec(head)?.[1] ? decode(/<title[^>]*>([^<]{1,300})<\/title>/i.exec(head)![1].trim()) : null);
  return {
    title: title?.slice(0, 200) ?? null,
    description: meta(['og:description', 'twitter:description', 'description'])?.slice(0, 300) ?? null,
    image: meta(['og:image', 'og:image:secure_url', 'twitter:image']),
  };
}

// Csak nyilvános webcím (nem IP-cím, nem localhost, nem belső hálózat)
export function safePublicUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw.trim());
  } catch {
    return null;
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const h = u.hostname.toLowerCase();
  if (!h.includes('.') || /^[\d.]+$/.test(h) || h.includes(':') || h === 'localhost' || /\.(local|internal|lan|home)$/.test(h)) return null;
  if (u.username || u.password) return null;
  return u;
}
