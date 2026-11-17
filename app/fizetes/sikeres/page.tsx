import type { Metadata } from 'next';
import Link from 'next/link';
import { PixelEvent } from '@/components/PixelEvent';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { fulfillCheckoutSession } from '@/lib/fulfillment';
import { guestEmail, isGuestSession } from '@/lib/guest-checkout';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { withStart } from '@/lib/types';

export const metadata: Metadata = { title: 'Sikeres fizetés', robots: { index: false, follow: false } };

// A webhook is rögzíti a vásárlást; itt azonnal is lezárjuk, hogy ne kelljen várni rá.
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const { user } = await getCurrentUser();
  let ok = false;
  let courseSlug: string | null = null;
  let isSub = false;
  let preorder = false;
  let pocket = false;
  let purchaseValue = 0;
  let purchaseCurrency = 'HUF';
  let guestMail: string | null = null; // vendégvásárlás: erre a címre készült / ehhez került a fiók

  if (session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    try {
      const session = await stripe().checkout.sessions.retrieve(session_id);
      const owner = session.metadata?.user_id ?? session.client_reference_id;
      const guest = isGuestSession(session);
      if (guest) guestMail = guestEmail(session);
      if (((user && owner === user.id) || guest) && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required' || session.status === 'complete')) {
        await fulfillCheckoutSession(session);
        ok = true;
        isSub = session.mode === 'subscription';
        // A Stripe a HUF-ot fillérben adja vissza (lásd hufToStripe).
        purchaseValue = (session.amount_total ?? 0) / 100;
        purchaseCurrency = (session.currency ?? 'huf').toUpperCase();
        if (session.metadata?.course_id) {
          const { data } = await createAdminClient().from('courses').select('slug, coming_soon, starts_at, pocket_for').eq('id', session.metadata.course_id).maybeSingle();
          courseSlug = data?.slug ?? null;
          preorder = !!data && withStart(data).coming_soon;
          pocket = !!data?.pocket_for;
        }
      }
    } catch {
      ok = false;
    }
  }

  return (
    <div className="page">
      <SiteNav />
      <section className="card stack" style={{ '--gap': '18px', maxWidth: 720, margin: '0 auto', width: '100%' } as React.CSSProperties}>
        {ok ? (
          <>
            <PixelEvent
              event={isSub ? 'Subscribe' : 'Purchase'}
              params={{ value: purchaseValue, currency: purchaseCurrency, content_ids: courseSlug ? [courseSlug] : [], content_type: 'product' }}
              eventId={session_id}
              once={session_id}
            />
            <div className="eyebrow">Sikeres fizetés</div>
            <h1 className="h2">Köszönöm! Indulhat a tanulás. 🎉</h1>
            <p className="lead">
              {isSub ? 'Az előfizetésed aktív – minden videóhoz hozzáférsz.' : preorder ? 'Az előrendelésed rögzítve! A kurzus indulásakor azonnal hozzáférsz, erről e-mailt is küldök.' : pocket ? 'A zsebkurzus a tiéd – a kurzusoldalon letöltheted a csomagot, és bármikor újra letöltheted.' : 'A kurzus mostantól a tiéd, bármikor visszanézheted.'} A számlát e-mailben
              küldjük.
            </p>
            {guestMail && !user && (
              <div className="notice ok">
                A fiókodat a <strong>{guestMail}</strong> címre hoztam létre, és oda küldtem egy belépő linket is – később azzal bármikor visszajössz. Jelszót a belépés után állíthatsz be.
              </div>
            )}
            <div className="row">
              {guestMail && !user ? (
                <a href={`/api/checkout/belepes?session_id=${encodeURIComponent(session_id ?? '')}`} className="btn">{pocket ? 'Belépek és letöltöm' : 'Belépek és kezdem a kurzust →'}</a>
              ) : (
                <>
                  {courseSlug && <Link href={`/kurzusok/${courseSlug}`} className="btn">{pocket ? 'Letöltés' : 'Kurzus megnyitása'}</Link>}
                  <Link href="/dashboard" className={courseSlug ? 'btn light' : 'btn'}>Saját tanulás</Link>
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="eyebrow">Fizetés feldolgozása</div>
            <h1 className="h2">Még dolgozunk rajta…</h1>
            <p className="lead">Ha a fizetés sikeres volt, pár percen belül megjelenik a dashboardodon. Ha nem, írj nekem: hello@andormarcsi.hu</p>
            <Link href="/dashboard" className="btn" style={{ alignSelf: 'flex-start' }}>Saját tanulás</Link>
          </>
        )}
      </section>
    </div>
  );
}
