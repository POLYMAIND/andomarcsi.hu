import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteNav } from '@/components/SiteNav';
import { requestPasswordReset, sendMagicLink, signInWithPassword, signUpWithPassword } from './actions';

export const metadata: Metadata = { title: 'Belépés' };

const ERRORS: Record<string, string> = {
  email: 'Kérlek, adj meg egy érvényes e-mail címet.',
  adatok: 'Add meg az e-mail címed és a jelszavad.',
  jelszo: 'Hibás e-mail cím vagy jelszó. Ha eddig e-mailben kapott linkkel léptél be, még nincs jelszavad – állíts be egyet az „Elfelejtett jelszó” linkkel.',
  megerosites: 'Előbb erősítsd meg az e-mail címed a regisztráció után kapott levélben lévő gombbal.',
  rovid: 'A jelszó legyen legalább 8 karakter.',
  gyenge: 'Ez a jelszó túl gyenge. Válassz hosszabbat, kis- és nagybetűvel, számmal.',
  letezik: 'Ezzel az e-mail címmel már van fiókod. Lépj be, vagy állíts be új jelszót az „Elfelejtett jelszó” linkkel.',
  kuldes: 'Nem sikerült elküldeni a levelet. Próbáld újra pár perc múlva.',
  limit: 'Túl sok levelet kértünk rövid idő alatt. Várj egy kicsit (kb. fél–egy órát), aztán próbáld újra – vagy használd a legutóbb kapott levelet.',
  '1': 'A link lejárt vagy már felhasználtad, vagy egy másik böngészőben nyitottad meg, mint ahol kérted. Lépj be jelszóval, vagy kérj új linket – és mindig a legutolsó levelet használd.',
};

const DONE: Record<string, { title: string; text: (email: string) => React.ReactNode }> = {
  link: { title: 'Elküldtük a belépő linket.', text: (e) => <>A(z) <strong>{e}</strong> címre küldtünk egy levelet. Kattints a benne lévő gombra – ugyanabban a böngészőben, ahol most vagy.</> },
  regisztracio: { title: 'Már csak egy kattintás!', text: (e) => <>A(z) <strong>{e}</strong> címre küldtünk egy megerősítő levelet. Kattints a benne lévő gombra, és utána a jelszavaddal be tudsz lépni.</> },
  jelszo: { title: 'Elküldtük a levelet.', text: (e) => <>Ha a(z) <strong>{e}</strong> címmel van fiókod, kapsz egy levelet. A benne lévő gombra kattintva megadhatod az új jelszavad.</> },
};

type Mode = '' | 'regisztracio' | 'elfelejtett' | 'link';

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const mode = (['regisztracio', 'elfelejtett', 'link'].includes(sp.mod ?? '') ? sp.mod : '') as Mode;
  const next = sp.next ?? '/dashboard';
  const nextQ = sp.next ? `&next=${encodeURIComponent(sp.next)}` : '';
  const done = sp.kesz ? DONE[sp.kesz] : null;
  const error = sp.hiba ? <div className="notice err">{ERRORS[sp.hiba] ?? 'Hiba történt.'}</div> : null;
  const stack = { '--gap': '18px' } as React.CSSProperties;
  const emailField = (
    <label className="field">
      E-mail címed
      <input className="input" name="email" type="email" required autoComplete="email" placeholder="te@pelda.hu" defaultValue={sp.email} />
    </label>
  );

  return (
    <div className="page">
      <SiteNav />
      <section className="card" style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
        {done ? (
          <div className="stack" style={stack}>
            <div className="eyebrow">Nézd meg a postafiókod</div>
            <h1 className="h2">{done.title}</h1>
            <p className="lead">{done.text(sp.email ?? '')}</p>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Nem jött meg? Nézd meg a Promóciók / Spam mappát is. Ha többször kérted, mindig a legutolsó levelet használd.</p>
            <Link href="/belepes" className="btn light">Vissza a belépéshez</Link>
          </div>
        ) : mode === 'regisztracio' ? (
          <form action={signUpWithPassword} className="stack" style={stack}>
            <div className="eyebrow">Regisztráció</div>
            <h1 className="h2">Hozd létre a fiókod.</h1>
            {error}
            <input type="hidden" name="next" value={next} />
            <label className="field">
              Neved (nem kötelező)
              <input className="input" name="name" autoComplete="name" placeholder="pl. Kovács Anna" />
            </label>
            {emailField}
            <label className="field">
              Jelszó (legalább 8 karakter)
              <input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <button className="btn block" type="submit">Regisztrálok</button>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}>Már van fiókod? <Link href={`/belepes?${nextQ.slice(1)}`} style={{ textDecoration: 'underline' }}>Lépj be</Link></p>
          </form>
        ) : mode === 'elfelejtett' ? (
          <form action={requestPasswordReset} className="stack" style={stack}>
            <div className="eyebrow">Elfelejtett jelszó</div>
            <h1 className="h2">Új jelszó beállítása</h1>
            <p className="lead" style={{ fontSize: 16 }}>Küldünk egy levelet, amiben megadhatod az új jelszavad. Ha eddig linkkel léptél be, így tudsz jelszót beállítani.</p>
            {error}
            {emailField}
            <button className="btn block" type="submit">Levél küldése</button>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}><Link href="/belepes" style={{ textDecoration: 'underline' }}>Vissza a belépéshez</Link></p>
          </form>
        ) : mode === 'link' ? (
          <form action={sendMagicLink} className="stack" style={stack}>
            <div className="eyebrow">Belépés jelszó nélkül</div>
            <h1 className="h2">Belépés e-mail linkkel</h1>
            <p className="lead" style={{ fontSize: 16 }}>Küldünk egy belépő linket. Ha még nincs fiókod, automatikusan létrehozzuk.</p>
            {error}
            <input type="hidden" name="next" value={next} />
            {emailField}
            <button className="btn block" type="submit">Belépő link küldése</button>
            <p className="muted" style={{ margin: 0, fontSize: 14 }}><Link href={`/belepes?${nextQ.slice(1)}`} style={{ textDecoration: 'underline' }}>Inkább jelszóval lépek be</Link></p>
          </form>
        ) : (
          <form action={signInWithPassword} className="stack" style={stack}>
            <div className="eyebrow">Belépés</div>
            <h1 className="h2">Jó, hogy itt vagy!</h1>
            {error}
            <input type="hidden" name="next" value={next} />
            {emailField}
            <label className="field">
              <span className="row between" style={{ width: '100%' }}>
                Jelszó
                <Link href="/belepes?mod=elfelejtett" className="muted" style={{ fontSize: 13, textDecoration: 'underline' }}>Elfelejtett jelszó</Link>
              </span>
              <input className="input" name="password" type="password" required autoComplete="current-password" />
            </label>
            <button className="btn block" type="submit">Belépés</button>
            <div className="stack" style={{ '--gap': '8px', fontSize: 14 } as React.CSSProperties}>
              <span className="muted">Még nincs fiókod? <Link href={`/belepes?mod=regisztracio${nextQ}`} style={{ textDecoration: 'underline' }}>Regisztrálj</Link></span>
              <span className="muted">Jelszó nélkül: <Link href={`/belepes?mod=link${nextQ}`} style={{ textDecoration: 'underline' }}>belépés e-mail linkkel</Link></span>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
