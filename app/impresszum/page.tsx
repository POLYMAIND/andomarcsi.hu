import type { Metadata } from 'next';
import { Fill, LegalPage } from '@/components/Legal';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Impresszum' };

export default function ImpressumPage() {
  return (
    <LegalPage eyebrow="Jogi információk" title="Impresszum">
      <h2>Az oldal üzemeltetője</h2>
      <table className="table">
        <tbody>
          <tr><th>Név</th><td><Fill v={COMPANY.name} /></td></tr>
          <tr><th>Székhely</th><td><Fill v={COMPANY.seat} /></td></tr>
          <tr><th>Nyilvántartási szám</th><td><Fill v={COMPANY.registry} /></td></tr>
          <tr><th>Adószám</th><td><Fill v={COMPANY.taxNumber} /></td></tr>
          <tr><th>E-mail</th><td><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></td></tr>
          <tr><th>Telefon</th><td><Fill v={COMPANY.phone} /></td></tr>
          <tr><th>Weboldal</th><td>{COMPANY.website}</td></tr>
        </tbody>
      </table>
      <p>{COMPANY.vatNote}</p>

      <h2>Tárhelyszolgáltató</h2>
      <p>Vercel Inc. – <a href="https://vercel.com" target="_blank" rel="noreferrer">vercel.com</a>, kapcsolat: <a href="https://vercel.com/help" target="_blank" rel="noreferrer">vercel.com/help</a></p>

      <h2>Szerzői jogok</h2>
      <p>
        Az oldalon és a kurzusokban található tartalmak (videók, szövegek, sablonok, képek) szerzői jogi védelem alatt állnak. A kurzusok anyagai kizárólag
        a vásárló saját, személyes tanulására használhatók; másolásuk, továbbadásuk, nyilvános megosztásuk vagy továbbértékesítésük az üzemeltető írásos
        engedélye nélkül tilos.
      </p>
      <p>A Canva, a Claude, a PolyOS és más említett termékek nevei a jogtulajdonosaik védjegyei; az oldal nem áll velük hivatalos kapcsolatban.</p>
    </LegalPage>
  );
}
