import { detectPlatform, PLATFORM_COLOR, type LinkPreview } from '@/lib/community';

// Link-előnézet kártya (YouTube/TikTok oEmbed, más oldal OG-adatai; ha nincs adat, a platform neve és a cím).
export function LinkCard({ url, preview, compact = false }: { url: string; preview: LinkPreview | null; compact?: boolean }) {
  const platform = detectPlatform(url);
  const color = platform ? PLATFORM_COLOR[platform] : 'var(--ink)';
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {}
  return (
    <a href={url} target="_blank" rel="noopener noreferrer nofollow ugc" className={`kz-linkcard${compact ? ' compact' : ''}`}>
      {preview?.image && <img src={preview.image} alt="" loading="lazy" referrerPolicy="no-referrer" />}
      <span className="kz-linkcard-body">
        <span className="kz-linkcard-provider" style={{ color }}>● {preview?.provider ?? host}</span>
        <b>{preview?.title || url}</b>
        {preview?.description && !compact && <span className="muted">{preview.description}</span>}
      </span>
    </a>
  );
}
