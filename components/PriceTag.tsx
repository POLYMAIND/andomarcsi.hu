import { formatHuf, priceLabel, saleActive } from '@/lib/format';
import type { Course } from '@/lib/types';

type Props = { course: Pick<Course, 'price_huf' | 'price_note' | 'list_price_huf' | 'sale_until'>; size?: number };

/** Ár megjelenítése: akció alatt áthúzott eredeti ár + nagy, piros akciós ár. */
export function PriceTag({ course, size }: Props) {
  if (course.price_note?.trim() || !saleActive(course)) return <>{priceLabel(course)}</>;
  return (
    <span className="price-sale" style={size ? { fontSize: size } : undefined}>
      <s className="price-old">{formatHuf(course.list_price_huf ?? null)}</s>{' '}
      <span className="price-new">{formatHuf(course.price_huf)}</span>
    </span>
  );
}
