'use client';

import { useRouter } from 'next/navigation';

// Legördülő szűrő, ami választáskor rögtön az adott címre visz (JS nélkül a „Szűrés” gomb működik).
export function SelectNav({ options, value, label }: { options: { href: string; label: string; value: string }[]; value: string; label: string }) {
  const router = useRouter();
  return (
    <select className="select kz-select" aria-label={label} value={value} onChange={(e) => router.push(options.find((o) => o.value === e.target.value)?.href ?? '#')}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
