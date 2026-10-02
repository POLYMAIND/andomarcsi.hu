import Link from 'next/link';
import { SUBSCRIPTION } from '@/lib/config';
import { formatHuf } from '@/lib/format';
import { soonLabel, type Course } from '@/lib/types';
import { PurchaseConsents } from '@/components/PurchaseConsents';
import { honeypotInputProps } from '@/lib/honeypot';

// Vásárlás / beiratkozás doboz egy kurzushoz.
export function BuyBox({ course, loggedIn, hasAccess, enrolled, firstLessonHref, bundle = null, userEmail = null, waitlisted = false }: {
  course: Course;
  loggedIn: boolean;
  hasAccess: boolean;
  enrolled: boolean;
  firstLessonHref: string | null;
  bundle?: Course | null; // csomag, amiben ez a kurzus is benne van
  userEmail?: string | null;
  waitlisted?: boolean; // már kért értesítést
}) {
  const upsell = bundle && !hasAccess && !enrolled ? (
    <Link href={`/kurzusok/${bundle.slug}`} className="btn light block" style={{ whiteSpace: 'normal', textAlign: 'center' }}>
      Vagy a teljes csomag: {formatHuf(bundle.price_huf)} ({bundle.bundle_course_ids.length} modul)
    </Link>
  ) : null;
  if (course.coming_soon && !hasAccess) {
    if (enrolled) {
      return (
        <div className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
          <span className="pill ok" style={{ alignSelf: 'flex-start' }}>✓ Megvetted</span>
          <span className="muted" style={{ fontSize: 14 }}>A videók az induláskor nyílnak meg.</span>
        </div>
      );
    }
    return (
      <div id="ertesites" className="stack" style={{ '--gap': '12px' } as React.CSSProperties}>
        <span className="pill new" style={{ alignSelf: 'flex-start' }}>{soonLabel(course)}</span>
        {course.price_huf !== null && (
          <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 32, letterSpacing: '-.03em' }}>{formatHuf(course.price_huf)}</div>
        )}
        {waitlisted ? (
          <div className="notice ok">✓ Feliratkoztál – szólok e-mailben, amint elérhető a kurzus.</div>
        ) : (
          <form action="/api/waitlist" method="post" className="stack" style={{ '--gap': '10px' } as React.CSSProperties}>
            <strong style={{ fontSize: 18 }}>Kérj értesítést, amint elérhető!</strong>
            <span className="muted" style={{ fontSize: 14 }}>Nem kell most fizetned – e-mailben szólok, amikor indul a kurzus.</span>
            <input type="hidden" name="course_id" value={course.id} />
            <input {...honeypotInputProps} />
            <input className="input" name="name" placeholder="Neved (nem kötelező)" autoComplete="name" />
            <input className="input" name="email" type="email" required placeholder="E-mail címed" defaultValue={userEmail ?? ''} autoComplete="email" />
            <label className="check" style={{ alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-3)' }}>
              <input type="checkbox" name="consent" required style={{ marginTop: 3 }} />
              <span>Hozzájárulok, hogy az andormarcsi.hu e-mailben értesítsen a kurzus indulásáról és kapcsolódó ajánlatokról. Bármikor leiratkozhatok. <Link href="/adatvedelem" target="_blank" style={{ textDecoration: 'underline' }}>Adatkezelési tájékoztató</Link></span>
            </label>
            <button className="btn block" type="submit">Értesítést kérek</button>
          </form>
        )}
        {upsell}
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
      <span className="muted" style={{ fontSize: 14 }}>Egyszeri díj, a kurzushoz korlátlan ideig hozzáférsz.</span>
      <form action="/api/checkout" method="post">
        <input type="hidden" name="plan" value="course" />
        <input type="hidden" name="course_id" value={course.id} />
        {loggedIn && <PurchaseConsents />}
        <button className="btn block" type="submit" style={{ marginTop: 10 }}>{loggedIn ? 'Megveszem bankkártyával' : 'Belépek és megveszem'}</button>
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
