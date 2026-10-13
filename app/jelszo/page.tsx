import type { Metadata } from 'next';
import { SiteNav } from '@/components/SiteNav';
import { requireUser } from '@/lib/auth';
import { setPassword } from './actions';

export const metadata: Metadata = { title: 'Jelszó beállítása' };

const ERRORS: Record<string, string> = {
  rovid: 'A jelszó legyen legalább 8 karakter.',
  egyezes: 'A két jelszó nem egyezik.',
  gyenge: 'Ez a jelszó túl gyenge. Válassz hosszabbat, kis- és nagybetűvel, számmal.',
  ugyanaz: 'Ez megegyezik a mostani jelszavaddal – adj meg egy újat.',
  hiba: 'Nem sikerült menteni. Próbáld újra.',
};

export default async function PasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const { user } = await requireUser('/jelszo');
  return (
    <div className="page">
      <SiteNav />
      <section className="card" style={{ maxWidth: 560, width: '100%', margin: '0 auto' }}>
        <form action={setPassword} className="stack" style={{ '--gap': '18px' } as React.CSSProperties}>
          <div className="eyebrow">Fiók</div>
          <h1 className="h2">Jelszó beállítása</h1>
          <p className="lead" style={{ fontSize: 16 }}>Ezzel a jelszóval a(z) <strong>{user.email}</strong> címmel tudsz belépni.</p>
          {sp.hiba && <div className="notice err">{ERRORS[sp.hiba] ?? 'Hiba történt.'}</div>}
          <input type="email" name="username" autoComplete="username" defaultValue={user.email ?? ''} hidden readOnly />
          <label className="field">
            Új jelszó (legalább 8 karakter)
            <input className="input" name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <label className="field">
            Még egyszer
            <input className="input" name="confirm" type="password" required minLength={8} autoComplete="new-password" />
          </label>
          <button className="btn block" type="submit">Jelszó mentése</button>
        </form>
      </section>
    </div>
  );
}
