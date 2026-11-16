import { SubmitButton } from '@/components/SubmitButton';
import { article } from '@/lib/seo';
import { submitTestimonial } from '@/lib/testimonial-actions';

export type ExistingTestimonial = { rating: number; body: string; display_name: string; business: string; status: string } | null;

const MSG: Record<string, [string, string]> = {
  ok: ['ok', 'Köszönöm szépen! 💜 Sokat jelent – és másoknak is segít eldönteni, hogy belevágjanak-e.'],
  csillag: ['err', 'Kérlek, válassz 1–5 csillagot.'],
  rovid: ['err', 'Írj legalább egy-két mondatot.'],
  nev: ['err', 'Add meg, milyen névvel jelenjen meg.'],
  hozzajarulas: ['err', 'A beküldéshez pipáld be a hozzájárulást.'],
  hiba: ['err', 'Nem sikerült elmenteni, próbáld újra.'],
};

// „Mondd el a véleményed” – a kurzusoldalon, annak, aki hozzáfér a kurzushoz.
export function TestimonialForm({
  courseId,
  slug,
  courseTitle,
  existing,
  defaultName,
  status,
}: {
  courseId: string;
  slug: string;
  courseTitle: string;
  existing: ExistingTestimonial;
  defaultName: string;
  status?: string;
}) {
  const msg = status ? MSG[status] : null;
  return (
    <section id="velemeny" className="card stack testimonial" style={{ '--gap': '18px', scrollMarginTop: 24 } as React.CSSProperties}>
      <div className="stack" style={{ '--gap': '8px' } as React.CSSProperties}>
        <div className="eyebrow">Mondd el a véleményed</div>
        <h2 className="h3" style={{ fontSize: 'clamp(24px, 2.6vw, 32px)' }}>
          {existing ? 'Köszönöm a véleményed! Bármikor módosíthatod.' : `Milyen volt ${article(courseTitle).toLowerCase()} ${courseTitle}?`}
        </h2>
        {!existing && (
          <p className="muted" style={{ margin: 0 }}>
            Két-három mondat is elég: mit tudsz most, amit előtte nem, mi volt a legjobb, kinek ajánlanád. A véleményeddel másoknak segítesz dönteni.
          </p>
        )}
      </div>
      {msg && <div className={`notice ${msg[0]}`}>{msg[1]}</div>}
      <form action={submitTestimonial} className="stack" style={{ '--gap': '14px' } as React.CSSProperties}>
        <input type="hidden" name="course_id" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <fieldset className="stars" aria-label="Értékelés (1–5 csillag)">
          {[5, 4, 3, 2, 1].map((n) => (
            <span key={n}>
              <input type="radio" id={`star-${n}`} name="rating" value={n} defaultChecked={(existing?.rating ?? 5) === n} required />
              <label htmlFor={`star-${n}`} title={`${n} csillag`}>★</label>
            </span>
          ))}
        </fieldset>
        <label className="field">
          A véleményed
          <textarea
            className="input textarea"
            name="body"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            defaultValue={existing?.body ?? ''}
            placeholder="Pl. Eddig minden posztnál órákig ültem. Most beállítottam a cégkártyát és a skilleket, és egy délután alatt kész a heti tartalom…"
          />
        </label>
        <div className="grid" style={{ '--min': '260px', '--gap': '12px' } as React.CSSProperties}>
          <label className="field">
            Milyen névvel jelenjen meg?
            <input className="input" name="display_name" required maxLength={80} defaultValue={existing?.display_name ?? defaultName} placeholder="pl. Kiss Anna" />
          </label>
          <label className="field">
            Vállalkozásod / mivel foglalkozol (nem kötelező)
            <input className="input" name="business" maxLength={120} defaultValue={existing?.business ?? ''} placeholder="pl. cukrászda, Pomáz" />
          </label>
        </div>
        <label className="check" style={{ alignItems: 'flex-start', fontSize: 13, color: 'var(--ink-3)' }}>
          <input type="checkbox" name="consent" required defaultChecked={!!existing} style={{ marginTop: 3 }} />
          <span>
            Hozzájárulok, hogy a véleményemet a megadott névvel (és vállalkozással) az andormarcsi.hu felhasználja a weboldalon, hirdetésekben és a közösségi
            médiában (pl. Instagram, Facebook posztokban). A hozzájárulást bármikor visszavonhatom egy e-maillel.
          </span>
        </label>
        <div className="row between" style={{ '--gap': '10px' } as React.CSSProperties}>
          <span className="muted" style={{ fontSize: 13 }}>{existing ? 'Ha módosítasz, újra átnézem, mielőtt bárhol megjelenik.' : 'Átnézem, mielőtt bárhol megjelenik.'}</span>
          <SubmitButton className="btn" pending="Küldés…">{existing ? 'Módosítom' : 'Elküldöm'}</SubmitButton>
        </div>
      </form>
    </section>
  );
}
