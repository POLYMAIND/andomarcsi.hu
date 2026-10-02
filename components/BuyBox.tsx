import Link from 'next/link';
import { SUBSCRIPTION } from '@/lib/config';
import { formatHuf } from '@/lib/format';
import type { Course } from '@/lib/types';

// Vásárlás / beiratkozás doboz egy kurzushoz.
export function BuyBox({ course, loggedIn, hasAccess, enrolled, firstLessonHref }: {
  course: Course;
  loggedIn: boolean;
  hasAccess: boolean;
  enrolled: boolean;
  firstLessonHref: string | null;
}) {
  if (course.coming_soon && !hasAccess) {
    return (
      <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <span className="pill new" style={{ alignSelf: 'flex-start' }}>Hamarosan</span>
        <strong style={{ fontSize: 20 }}>Ez a kurzus hamarosan indul.</strong>
        <span className="muted" style={{ fontSize: 14 }}>
          {course.price_huf > 0 ? `Várható ár: ${formatHuf(course.price_huf)}. ` : 'Ingyenes lesz. '}
          Írj, és szólok, amint elérhető!
        </span>
        <a className="btn light block" href={`mailto:hello@andormarcsi.hu?subject=${encodeURIComponent('Értesítést kérek: ' + course.title)}`}>
          Szólj, ha indul
        </a>
      </div>
    );
  }
  if (hasAccess) {
    return (
      <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <span className="pill ok" style={{ alignSelf: 'flex-start' }}>✓ Hozzáférsz</span>
        {course.price_huf === 0 && loggedIn && !enrolled && (
          <form action="/api/enroll" method="post">
            <input type="hidden" name="course_id" value={course.id} />
            <button className="btn light block" type="submit">Hozzáadom a tanulásaimhoz</button>
          </form>
        )}
        {firstLessonHref && <Link href={firstLessonHref} className="btn block">Indulhat a tanulás →</Link>}
      </div>
    );
  }

  if (course.price_huf === 0) {
    return (
      <Link href={`/belepes?next=${encodeURIComponent(`/kurzusok/${course.slug}`)}`} className="btn block">
        Ingyenes – belépek és kezdem
      </Link>
    );
  }

  return (
    <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
      <div className="plan-price" style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 36, letterSpacing: '-.03em' }}>
        {formatHuf(course.price_huf)}
      </div>
      <span className="muted" style={{ fontSize: 14 }}>Egyszeri díj, örökös hozzáférés ehhez a kurzushoz.</span>
      <form action="/api/checkout" method="post">
        <input type="hidden" name="plan" value="course" />
        <input type="hidden" name="course_id" value={course.id} />
        <button className="btn block" type="submit">{loggedIn ? 'Megveszem bankkártyával' : 'Belépek és megveszem'}</button>
      </form>
      {SUBSCRIPTION.enabled && course.included_in_subscription && (
        <Link href="/elofizetes" className="btn light block">
          Vagy minden anyag: {formatHuf(SUBSCRIPTION.priceHuf)}/hó
        </Link>
      )}
      <span className="muted" style={{ fontSize: 12 }}>Biztonságos fizetés a Stripe-on keresztül.</span>
    </div>
  );
}
