import type { Metadata } from 'next';
import { Fill, LegalPage } from '@/components/Legal';
import { COMPANY, PROCESSORS } from '@/lib/company';

export const metadata: Metadata = { title: 'Adatkezelési tájékoztató' };

const ACTIVITIES = [
  {
    name: 'Felhasználói fiók és belépés',
    data: 'e-mail cím, név (ha megadod), belépések időpontja',
    purpose: 'a fiók létrehozása, belépő link küldése, a megvásárolt kurzusok elérése',
    basis: 'szerződés teljesítése (GDPR 6. cikk (1) b))',
    retention: 'a fiók törléséig; törlést bármikor kérhetsz',
  },
  {
    name: 'Vásárlás és számlázás',
    data: 'név, e-mail, számlázási cím, a vásárolt termék, összeg, időpont; a kártyaadatokat csak a Stripe kezeli',
    purpose: 'a vásárlás teljesítése, számla kiállítása, könyvelés',
    basis: 'szerződés teljesítése és jogi kötelezettség (GDPR 6. cikk (1) b) és c)); a számviteli bizonylatokat a számviteli törvény (2000. évi C. tv. 169. §) alapján 8 évig meg kell őrizni',
    retention: '8 év (számviteli bizonylatok)',
  },
  {
    name: 'Tanulási haladás',
    data: 'elvégzett leckék, beiratkozott kurzusok',
    purpose: 'a haladásod megjelenítése a „Saját tanulás” oldalon',
    basis: 'szerződés teljesítése (GDPR 6. cikk (1) b))',
    retention: 'a fiók törléséig',
  },
  {
    name: '„Értesítést kérek” feliratkozás',
    data: 'e-mail cím, név (ha megadod), a kurzus, a hozzájárulás időpontja',
    purpose: 'értesítés a kurzus indulásáról és kapcsolódó ajánlatokról; az adatokat ügyfélkezelő rendszerünkben (PolyOS) is tároljuk',
    basis: 'hozzájárulás (GDPR 6. cikk (1) a)), amely bármikor visszavonható',
    retention: 'a hozzájárulás visszavonásáig (leiratkozásig)',
  },
  {
    name: 'Hírlevél',
    data: 'e-mail cím, a hozzájárulás időpontja',
    purpose: 'havi hírlevél, hasznos tippek és ajánlatok küldése; az adatokat ügyfélkezelő rendszerünkben (PolyOS) is tároljuk',
    basis: 'hozzájárulás (GDPR 6. cikk (1) a)), amely bármikor visszavonható',
    retention: 'a hozzájárulás visszavonásáig (leiratkozásig)',
  },
  {
    name: 'AI segítő (csevegő)',
    data: 'a csevegőbe írt kérdések és a megnyitott kurzus/lecke címe; a felhasználó azonosítója a napi keret számolásához',
    purpose: 'válasz a tanulással kapcsolatos kérdésekre',
    basis: 'szerződés teljesítése (GDPR 6. cikk (1) b))',
    retention: 'a beszélgetések szövegét mi nem tároljuk; a napi kérdésszámot napi bontásban tároljuk. Az Anthropic a saját feltételei szerint, korlátozott ideig kezelheti a kéréseket.',
  },
  {
    name: 'Kapcsolatfelvétel e-mailben',
    data: 'név, e-mail cím, az üzenet tartalma',
    purpose: 'kérdések, panaszok megválaszolása',
    basis: 'jogos érdek / panasz esetén jogi kötelezettség (GDPR 6. cikk (1) f) és c))',
    retention: 'az ügy lezárásától számított 5 évig (panasz esetén a fogyasztóvédelmi törvény szerint)',
  },
  {
    name: 'Szervernaplók',
    data: 'IP-cím, böngésző adatai, a kérés időpontja és útvonala',
    purpose: 'a Weboldal biztonságos működése, hibakeresés, visszaélések megelőzése',
    basis: 'jogos érdek (GDPR 6. cikk (1) f))',
    retention: 'a tárhelyszolgáltató beállításai szerint, jellemzően néhány nap–néhány hét',
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Jogi információk" title="Adatkezelési tájékoztató">
      <p>
        Ez a tájékoztató leírja, hogyan kezeljük a személyes adataidat a {COMPANY.brand} használata során, az Európai Unió általános adatvédelmi
        rendelete (GDPR, 2016/679/EU) és az információs önrendelkezési jogról szóló 2011. évi CXII. törvény (Infotv.) alapján.
      </p>

      <h2>1. Az adatkezelő</h2>
      <p>
        <Fill v={COMPANY.name} /> · Székhely: <Fill v={COMPANY.seat} /> · Adószám: <Fill v={COMPANY.taxNumber} /> · E-mail:{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> · Telefon: <Fill v={COMPANY.phone} />
      </p>

      <h2>2. Milyen adatokat, miért és meddig kezelünk?</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Adatkezelés</th><th>Kezelt adatok</th><th>Cél</th><th>Jogalap</th><th>Időtartam</th></tr></thead>
          <tbody>
            {ACTIVITIES.map((a) => (
              <tr key={a.name}>
                <td><strong>{a.name}</strong></td>
                <td>{a.data}</td>
                <td>{a.purpose}</td>
                <td>{a.basis}</td>
                <td>{a.retention}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>3. Adatfeldolgozók, adattovábbítás</h2>
      <p>Az alábbi szolgáltatókat vesszük igénybe; ők csak a feladatukhoz szükséges adatokat kapják meg, a mi utasításaink szerint.</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Szolgáltató</th><th>Feladat</th><th>Adatvédelmi tájékoztató</th></tr></thead>
          <tbody>
            {PROCESSORS.map((p) => (
              <tr key={p.name}>
                <td><strong>{p.name}</strong>{p.transfer && <><br /><span className="muted" style={{ fontSize: 12 }}>EU-n kívüli (USA) adattovábbítás is lehetséges</span></>}</td>
                <td>{p.role}</td>
                <td><a href={p.site} target="_blank" rel="noreferrer">megnyitás ↗</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        A hírlevél- és „Értesítést kérek” feliratkozók adatait saját ügyfélkezelő rendszerünkben, a <strong>PolyOS</strong>-ben kezeljük, és a hírleveleket,
        illetve a kurzusindulásról szóló értesítéseket is innen küldjük. A PolyOS-t maga az adatkezelő ({COMPANY.name}) üzemelteti, így ez nem jelent
        adattovábbítást harmadik félnek.
      </p>
      <p>
        Az EU-n kívüli (USA) adattovábbítás az Európai Bizottság megfelelőségi határozata (EU–USA adatvédelmi keretrendszer) vagy általános szerződési
        feltételek (SCC) alapján történik. Adatot harmadik félnek nem adunk el, és csak jogszabályi kötelezettség esetén adunk át hatóságnak.
      </p>

      <h2 id="sutik">4. Sütik (cookie-k)</h2>
      <p>
        A Weboldal <strong>csak a működéshez feltétlenül szükséges sütiket</strong> használja – ezekhez nem kell hozzájárulás. Nem használunk
        statisztikai, hirdetési vagy követő sütiket.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Süti</th><th>Cél</th><th>Időtartam</th></tr></thead>
          <tbody>
            <tr><td><code>sb-…-auth-token</code></td><td>Bejelentkezés megőrzése (Supabase)</td><td>a kijelentkezésig, legfeljebb néhány hét</td></tr>
            <tr><td><code>__stripe_mid</code>, <code>__stripe_sid</code></td><td>Biztonságos fizetés, csalásmegelőzés – csak a Stripe fizetési oldalán</td><td>a Stripe szabályai szerint</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        A videókat a YouTube „fokozott adatvédelmi módjában” (youtube-nocookie.com) ágyazzuk be: a YouTube csak a videó elindításakor tárolhat adatot a
        böngésződben, a saját adatkezelési szabályai szerint.
      </p>

      <h2>5. A jogaid</h2>
      <ul>
        <li><strong>Hozzáférés:</strong> tájékoztatást kérhetsz arról, milyen adataidat kezeljük.</li>
        <li><strong>Helyesbítés:</strong> kérheted a pontatlan adatok javítását.</li>
        <li><strong>Törlés:</strong> kérheted az adataid törlését (kivéve, amit jogszabály alapján meg kell őriznünk, pl. számlák).</li>
        <li><strong>Korlátozás és tiltakozás:</strong> kérheted az adatkezelés korlátozását, illetve tiltakozhatsz a jogos érdeken alapuló adatkezelés ellen.</li>
        <li><strong>Adathordozhatóság:</strong> kérheted, hogy az általad megadott adatokat géppel olvasható formában kiadjuk.</li>
        <li><strong>Hozzájárulás visszavonása:</strong> a feliratkozásodat bármikor visszavonhatod (pl. a levelekben lévő leiratkozó linkkel vagy e-mailben); ez nem érinti a korábbi adatkezelés jogszerűségét.</li>
      </ul>
      <p>
        Kérésedet a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> címre küldheted; legkésőbb 1 hónapon belül válaszolunk.
      </p>

      <h2>6. Jogorvoslat</h2>
      <p>
        Ha úgy érzed, hogy az adataid kezelése nem jogszerű, panaszt tehetsz a Nemzeti Adatvédelmi és Információszabadság Hatóságnál (NAIH, 1055
        Budapest, Falk Miksa utca 9–11., <a href="https://naih.hu" target="_blank" rel="noreferrer">naih.hu</a>, ugyfelszolgalat@naih.hu), vagy bírósághoz
        fordulhatsz. Kérjük, előbb keress minket, hátha gyorsabban rendezni tudjuk.
      </p>

      <h2>7. Adatbiztonság</h2>
      <p>
        Az adatokat titkosított kapcsolaton (HTTPS) keresztül továbbítjuk, a hozzáférést jogosultságokhoz kötjük, jelszót nem tárolunk (belépés e-mailes
        linkkel), a bankkártyaadatok pedig hozzánk nem kerülnek.
      </p>
    </LegalPage>
  );
}
