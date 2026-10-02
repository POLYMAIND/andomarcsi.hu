export function formatHuf(amount: number): string {
  if (amount === 0) return 'Ingyenes';
  return `${String(Math.round(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} Ft`;
}

export const TOOL_COLORS: Record<string, string> = {
  Canva: 'oklch(0.79 0.16 68)',
  Claude: 'oklch(0.72 0.13 295)',
  Polyos: 'oklch(0.75 0.14 15)',
  'Hirdetés': 'oklch(0.78 0.13 165)',
};

export function toolColor(tool: string): string {
  return TOOL_COLORS[tool] ?? 'oklch(0.85 0.05 260)';
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Europe/Budapest' });
}

// <input type="datetime-local"> értékek budapesti időzónában (a szerver UTC-ben fut).
const TZ = 'Europe/Budapest';

function tzOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    .formatToParts(date)
    .reduce<Record<string, number>>((acc, p) => (p.type !== 'literal' ? { ...acc, [p.type]: Number(p.value) } : acc), {});
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function budapestLocalToIso(local: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  let ts = naive - tzOffsetMinutes(new Date(naive)) * 60000;
  ts = naive - tzOffsetMinutes(new Date(ts)) * 60000; // DST-határ korrekció
  return new Date(ts).toISOString();
}

export function isoToBudapestLocal(iso: string): string {
  const d = new Date(iso);
  const local = new Date(d.getTime() + tzOffsetMinutes(d) * 60000);
  return local.toISOString().slice(0, 16);
}
