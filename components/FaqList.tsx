import type { Faq } from '@/lib/seo';

// Lenyitható GYIK. A válaszok a HTML-ben mindig benne vannak (a keresők és AI-k is látják).
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="faq">
      {items.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  );
}
