import Link from 'next/link';
import { SUBSCRIPTION } from '@/lib/config';
import { formatHuf } from '@/lib/format';
import { soonLabel, type Course } from '@/lib/types';

// Vásárlás / beiratkozás doboz egy kurzushoz.
export function BuyBox({ course, loggedIn, hasAccess, enrolled, firstLessonHref, bundle = null }: {
  course: Course;
  loggedIn: boolean;
  hasAccess: boolean;
  enrolled: boolean;
  firstLessonHref: string | null;
  bundle?: Course | null; // csomag, amiben ez a kurzus is benne van
}) {
  const upsell = bundle && !hasAccess && !enrolled ? (
    <Link href={`/kurzusok/${bundle.slug}`} className="btn light block" style={{ whiteSpace: 'normal', textAlign: 'center' }}>
      Vagy a teljes csomag: {formatHuf(bundle.price_huf)} ({bundle.bundle_course_ids.length} modul)
    </Link>
  ) : null;
  if (course.coming_soon && !hasAccess) {
    const note = (
      <span className="muted" style={{ fontSize: 14 }}>
        {course.starts_at ? `A kurzus ${soonLabel(course).replace('Indul: ', '')}-án/én indul` : 'A kurzus hamarosan indul'} – a videók az induláskor nyílnak meg.
      </span>
    );
    if (enrolled) {
      return (
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <span className="pill ok" style={{ alignSelf: 'flex-start' }}>✓ Megvetted</span>
          <strong style={{ fontSize: 20 }}>Köszönöm az előrendelést!</strong>
          {note}
        </div>
      );
    }
    if (course.price_huf === null) {
      return (
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <span className="pill new" style={{ alignSelf: 'flex-start' }}>{soonLabel(course)}</span>
          <strong style={{ fontSize: 20 }}>A tudástár-tagság része</strong>
          {SUBSCRIPTION.enabled ? (
            <>
              <span className="muted" style={{ fontSize: 14 }}>Előfizetőként induláskor azonnal hozzáférsz.</span>
              <Link href="/elofizetes" className="btn purple block">Előfizetés – {formatHuf(SUBSCRIPTION.priceHuf)}/hó</Link>
            </>
          ) : (
            <>
              <span className="muted" style={{ fontSize: 14 }}>A tudástár-tagság hamarosan indul. Írj, és szólok, amint elérhető!</span>
              <a className="btn light block" href={`mailto:hello@andormarcsi.hu?subject=${encodeURIComponent('Értesítést kérek: ' + course.title)}`}>Szólj, ha indul</a>
            </>
          )}
        </div>
      );
    }
    if (course.price_huf === 0) {
      return (
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <span className="pill new" style={{ alignSelf: 'flex-start' }}>{soonLabel(course)} · ingyenes</span>
          {note}
          <a className="btn light block" href={`mailto:hello@andormarcsi.hu?subject=${encodeURIComponent('Értesítést kérek: ' + course.title)}`}>Szólj, ha indul</a>
        </div>
      );
    }
    return (
      <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <span className="pill new" style={{ alignSelf: 'flex-start' }}>{soonLabel(course)} · előrendelhető</span>
        <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 36, letterSpacing: '-.03em' }}>{formatHuf(course.price_huf)}</div>
        {note}
        <form action="/api/checkout" method="post">
          <input type="hidden" name="plan" value="course" />
          <input type="hidden" name="course_id" value={course.id} />
          <button className="btn block" type="submit">{loggedIn ? 'Előrendelem bankkártyával' : 'Belépek és előrendelem'}</button>
        </form>
        {upsell}
        {SUBSCRIPTION.enabled && course.included_in_subscription && (
          <Link href="/elofizetes" className="btn light block">Vagy minden anyag: {formatHuf(SUBSCRIPTION.priceHuf)}/hó</Link>
        )}
        <span className="muted" style={{ fontSize: 12 }}>Biztonságos fizetés a Stripe-on keresztül.</span>
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

  if (course.price_huf === null) {
    return (
      <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <strong style={{ fontSize: 20 }}>A tudástár-tagság része</strong>
        {SUBSCRIPTION.enabled ? (
          <>
            <span className="muted" style={{ fontSize: 14 }}>Ez a kurzus külön nem vásárolható, az előfizetéssel minden anyag elérhető.</span>
            <Link href="/elofizetes" className="btn purple block">Előfizetés – {formatHuf(SUBSCRIPTION.priceHuf)}/hó</Link>
          </>
        ) : (
          <>
            <span className="muted" style={{ fontSize: 14 }}>A tudástár-tagság hamarosan indul. Írj, és szólok, amint elérhető!</span>
            <a className="btn light block" href={`mailto:hello@andormarcsi.hu?subject=${encodeURIComponent('Értesítést kérek: ' + course.title)}`}>Szólj, ha indul</a>
          </>
        )}
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
        {formatHuf(course.price_huf as number)}
      </div>
      <span className="muted" style={{ fontSize: 14 }}>Egyszeri díj, örökös hozzáférés ehhez a kurzushoz.</span>
      <form action="/api/checkout" method="post">
        <input type="hidden" name="plan" value="course" />
        <input type="hidden" name="course_id" value={course.id} />
        <button className="btn block" type="submit">{loggedIn ? 'Megveszem bankkártyával' : 'Belépek és megveszem'}</button>
      </form>
      {upsell}
      {SUBSCRIPTION.enabled && course.included_in_subscription && (
        <Link href="/elofizetes" className="btn light block">
          Vagy minden anyag: {formatHuf(SUBSCRIPTION.priceHuf)}/hó
        </Link>
      )}
      <span className="muted" style={{ fontSize: 12 }}>Biztonságos fizetés a Stripe-on keresztül.</span>
    </div>
  );
}
