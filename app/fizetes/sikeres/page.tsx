import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { getCurrentUser } from '@/lib/auth';
import { fulfillCheckoutSession } from '@/lib/fulfillment';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Sikeres fizetés' };

// A webhook is rögzíti a vásárlást; itt azonnal is lezárjuk, hogy ne kelljen várni rá.
export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id } = await searchParams;
  const { user } = await getCurrentUser();
  let ok = false;
  let courseSlug: string | null = null;
  let isSub = false;

  if (session_id && user && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    try {
      const session = await stripe().checkout.sessions.retrieve(session_id);
      const owner = session.metadata?.user_id ?? session.client_reference_id;
      if (owner === user.id && (session.payment_status === 'paid' || session.status === 'complete')) {
        await fulfillCheckoutSession(session);
        ok = true;
        isSub = session.mode === 'subscription';
        if (session.metadata?.course_id) {
          const { data } = await createAdminClient().from('courses').select('slug').eq('id', session.metadata.course_id).maybeSingle();
          courseSlug = data?.slug ?? null;
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
            <div className="eyebrow">Sikeres fizetés</div>
            <h1 className="h2">Köszönöm! Indulhat a tanulás. 🎉</h1>
            <p className="lead">
              {isSub ? 'Az előfizetésed aktív – minden videóhoz hozzáférsz.' : 'A kurzus mostantól a tiéd, bármikor visszanézheted.'} A számlát e-mailben
              küldjük.
            </p>
            <div className="row">
              {courseSlug && <Link href={`/kurzusok/${courseSlug}`} className="btn">Kurzus megnyitása</Link>}
              <Link href="/dashboard" className={courseSlug ? 'btn light' : 'btn'}>Saját tanulás</Link>
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
