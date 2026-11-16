import { avatarColor, initials } from '@/lib/community';

// Profilkép, vagy ha nincs: monogram tömör színes körben.
export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  const style = { width: size, height: size, borderRadius: 999, flex: 'none' } as const;
  if (src) return <img src={src} alt="" style={{ ...style, objectFit: 'cover', display: 'block', background: 'var(--paper)' }} />;
  return (
    <span aria-hidden="true" style={{ ...style, display: 'grid', placeItems: 'center', background: avatarColor(name), color: 'var(--ink)', fontWeight: 800, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  );
}
