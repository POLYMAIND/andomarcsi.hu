import { formatHuf, priceLabel } from '@/lib/format';
import { saleInfo, type Course } from '@/lib/types';

type PriceCourse = Pick<Course, 'price_huf'> & Partial<Pick<Course, 'price_note' | 'was_price_huf' | 'sale_ends_at' | 'sale_label'>>;

// Ár megjelenítése, aktív akciónál az eredeti ár áthúzva és egy „Bevezető ár · −50% · dec. 31-ig” jelzés.
// (A kurzust előbb withStart-tal kell betölteni – az számolja ki az akciós árat.)
export function PriceTag({ course, size = 22, dark = false, badge = true }: { course: PriceCourse; size?: number; dark?: boolean; badge?: boolean }) {
  const sale = course.price_note?.trim() ? null : saleInfo(course);
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: size, letterSpacing: '-.02em', lineHeight: 1.05, color: sale ? 'var(--sale)' : undefined }}>{priceLabel(course)}</span>
        {sale && (
          <s style={{ fontSize: Math.max(13, Math.round(size * 0.5)), color: dark ? '#a9a3af' : 'var(--muted)', fontWeight: 500 }}>{formatHuf(sale.listPrice)}</s>
        )}
      </span>
      {sale && badge && (
        <span className="pill" style={{ background: 'var(--sale)', color: '#fff', fontSize: 12, padding: '4px 10px', fontWeight: 700 }}>
          {sale.label} · −{sale.pct}%{sale.until ? ` · ${sale.until}` : ''}
        </span>
      )}
    </span>
  );
}
