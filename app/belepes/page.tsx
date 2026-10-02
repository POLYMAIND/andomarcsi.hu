import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { sendMagicLink } from './actions';

export const metadata: Metadata = { title: 'Belépés' };

const ERRORS: Record<string, string> = {
  email: 'Kérlek, adj meg egy érvényes e-mail címet.',
  kuldes: 'Nem sikerült elküldeni a belépő linket. Próbáld újra pár perc múlva.',
  limit: 'Túl sok belépő linket kértünk rövid idő alatt. Várj egy kicsit (kb. fél–egy órát), aztán próbáld újra – vagy használd a legutóbb kapott linket.',
  '1': 'A belépő link lejárt vagy már felhasználtad. Kérj egy újat!',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  return (
    <div className="page">
      <SiteNav />
      <section className="card" style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
        {sp.elkuldve ? (
          <div className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
            <div className="eyebrow">Nézd meg a postafiókod</div>
            <h1 className="h2">Elküldtük a belépő linket.</h1>
            <p className="lead">
              A(z) <strong>{sp.elkuldve}</strong> címre küldtünk egy levelet. Kattints a benne lévő gombra, és már bent is vagy – jelszó nem kell.
            </p>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nem jött meg? Nézd meg a Promóciók / Spam mappát is.</p>
          </div>
        ) : (
          <form action={sendMagicLink} className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
            <div className="eyebrow">Belépés · regisztráció</div>
            <h1 className="h2">Jó, hogy itt vagy!</h1>
            <p className="lead" style={{ fontSize: 16 }}>
              Add meg az e-mail címed, és küldünk egy belépő linket. Ha még nincs fiókod, automatikusan létrehozzuk.
            </p>
            {sp.hiba && <div className="notice err">{ERRORS[sp.hiba] ?? 'Hiba történt.'}</div>}
            <input type="hidden" name="next" value={sp.next ?? '/dashboard'} />
            <label className="field">
              Neved (nem kötelező)
              <input className="input" name="name" autoComplete="name" placeholder="pl. Kovács Anna" />
            </label>
            <label className="field">
              E-mail címed
              <input className="input" name="email" type="email" required autoComplete="email" placeholder="te@pelda.hu" />
            </label>
            <button className="btn block" type="submit">Belépő link küldése</button>
          </form>
        )}
      </section>
    </div>
  );
}
