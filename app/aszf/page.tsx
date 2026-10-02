import type { Metadata } from 'next';
import Link from 'next/link';
import { Fill, LegalPage } from '@/components/Legal';
import { COMPANY } from '@/lib/company';

export const metadata: Metadata = { title: 'Általános Szerződési Feltételek' };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Jogi információk" title="Általános Szerződési Feltételek (ÁSZF)">
      <h2>1. A Szolgáltató</h2>
      <p>
        Név: <Fill v={COMPANY.name} /> · Székhely: <Fill v={COMPANY.seat} /> · Nyilvántartási szám: <Fill v={COMPANY.registry} /> · Adószám:{' '}
        <Fill v={COMPANY.taxNumber} /> · E-mail: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> · Telefon: <Fill v={COMPANY.phone} />
      </p>
      <p>
        A jelen ÁSZF a {COMPANY.brand} weboldalon (a továbbiakban: Weboldal) elérhető szolgáltatások igénybevételének feltételeit tartalmazza a Szolgáltató és
        a szolgáltatást igénybe vevő személy (a továbbiakban: Felhasználó) között. A szerződés nyelve magyar, a szerződés elektronikus úton jön létre, nem
        minősül írásba foglalt szerződésnek, és azt a Szolgáltató nem iktatja.
      </p>

      <h2>2. A szolgáltatás tárgya</h2>
      <ul>
        <li><strong>Online videókurzusok:</strong> előre felvett videóleckékből, leírásokból és kiegészítő anyagokból (pl. sablonokból) álló digitális tartalom, amely a Weboldalon, belépés után érhető el.</li>
        <li><strong>Csomagok:</strong> több kurzust együtt, kedvezményes áron tartalmazó termékek.</li>
        <li><strong>Ingyenes tartalmak:</strong> ingyenes kurzusok és előzetes leckék.</li>
        <li><strong>„Hamarosan” kurzusok:</strong> még el nem indult kurzusok, amelyekre fizetés nélkül értesítés kérhető az indulásról. Ezekre a Weboldalon nem lehet fizetni.</li>
        <li><strong>AI segítő:</strong> a kurzusoldalakon elérhető, mesterséges intelligenciával működő tanulássegítő csevegő (lásd 9. pont).</li>
        <li><strong>Előfizetés (tudástár-tagság):</strong> ha a Weboldalon elérhető, havidíjas hozzáférés az előfizetésbe tartozó összes kurzushoz (lásd 7. pont).</li>
      </ul>

      <h2>3. Regisztráció és belépés</h2>
      <p>
        A kurzusok használatához felhasználói fiók szükséges, amely az e-mail cím megadásával, a kiküldött belépő link megnyitásával jön létre. A Felhasználó
        felel azért, hogy a megadott e-mail cím a sajátja, és a fiókjához más ne férjen hozzá. Egy fiókot egy személy használhat; a belépési lehetőség
        továbbadása, megosztása tilos.
      </p>

      <h2>4. Árak</h2>
      <p>
        Az árak forintban értendők és végösszegek. {COMPANY.vatNote} Az aktuális árakat a kurzusoldalak tartalmazzák. A Szolgáltató az árak változtatásának
        jogát fenntartja; a változás a már megkötött szerződéseket nem érinti. Nyilvánvalóan hibás ár (pl. 0 Ft vagy a szokásostól jelentősen eltérő ár)
        esetén a Szolgáltató nem köteles a hibás áron teljesíteni, hanem felajánlja a helyes áron történő teljesítést, amelynek ismeretében a Felhasználó
        elállhat a vásárlástól.
      </p>

      <h2>5. A vásárlás menete, a szerződés létrejötte</h2>
      <ol>
        <li>A Felhasználó belép, kiválasztja a kurzust vagy csomagot, és a „Megveszem” gombra kattint.</li>
        <li>A megrendelés elküldése előtt elfogadja a jelen ÁSZF-et és az Adatkezelési tájékoztatót, és kifejezetten hozzájárul a teljesítés azonnali megkezdéséhez (lásd 6. pont).</li>
        <li>A fizetés a Stripe biztonságos fizetési oldalán, bankkártyával történik. A kártyaadatokat a Szolgáltató nem látja és nem tárolja.</li>
        <li>A szerződés a sikeres fizetéssel jön létre. A Szolgáltató a vásárlást e-mailben visszaigazolja, és a számlát / nyugtát elektronikusan megküldi.</li>
        <li>A megrendelés adatbeviteli hibái a fizetés véglegesítése előtt bármikor javíthatók (visszalépés a kurzusoldalra, a fizetési oldal bezárása).</li>
      </ol>

      <h2>6. Teljesítés és elállási jog</h2>
      <p>
        A megvásárolt kurzus a sikeres fizetés után azonnal elérhetővé válik a Felhasználó fiókjában, a „Saját tanulás” oldalon. A hozzáférés határozatlan
        időre szól, a Weboldal működéséig; a Szolgáltató a kurzusok tartalmát frissítheti, javíthatja.
      </p>
      <p>
        A Felhasználót – ha fogyasztó – főszabály szerint 14 napos elállási jog illeti meg. A nem tárgyi adathordozón nyújtott digitális tartalomra
        vonatkozó szerződés esetén azonban a 45/2014. (II. 26.) Korm. rendelet 29. § (1) bekezdés m) pontja alapján a Felhasználó nem gyakorolhatja az
        elállási jogát, ha a Szolgáltató a teljesítést a Felhasználó kifejezett, előzetes beleegyezésével kezdte meg, és a Felhasználó e beleegyezésével
        egyidejűleg nyilatkozott annak tudomásul vételéről, hogy a teljesítés megkezdését követően elveszíti az elállási jogát. Ezt a nyilatkozatot a
        Felhasználó a vásárlás előtt egy jelölőnégyzet bejelölésével teszi meg, és a Szolgáltató a visszaigazoló e-mailben megerősíti.
      </p>

      <h2>7. Előfizetés (tudástár-tagság)</h2>
      <p>
        Ha az előfizetés a Weboldalon elérhető: a havidíj a fizetés napján, majd havonta automatikusan terhelődik a megadott bankkártyára. Az előfizetés
        bármikor lemondható a „Saját tanulás” oldalon a „Előfizetés kezelése / lemondás” gombbal; a lemondás a már kifizetett időszak végén lép hatályba,
        addig a hozzáférés megmarad. Időarányos visszatérítés nincs. Az előfizetés megszűnésével az előfizetésbe tartozó, külön meg nem vásárolt kurzusokhoz
        való hozzáférés megszűnik.
      </p>

      <h2>8. Felhasználási jog</h2>
      <p>
        A Felhasználó a megvásárolt tartalmat kizárólag saját, személyes tanulására használhatja. A videók, szövegek és sablonok letöltése (a kifejezetten
        letölthetőnek jelölt sablonok kivételével), másolása, rögzítése, továbbadása, nyilvános megosztása, továbbértékesítése vagy oktatási célú
        felhasználása tilos. A kurzusokban kapott sablonokból a Felhasználó saját vállalkozása számára készíthet anyagokat. Jogsértés esetén a Szolgáltató a
        fiókot felfüggesztheti.
      </p>

      <h2>9. AI segítő</h2>
      <p>
        Az AI segítő mesterséges intelligencia (az Anthropic Claude modellje) segítségével válaszol a kurzusokkal, valamint a Canva, a Claude és a PolyOS
        használatával kapcsolatos kérdésekre. A válaszok automatikusan készülnek, tévedhetnek vagy elavultak lehetnek, ezért fontos döntés előtt ellenőrizni
        kell őket; a Szolgáltató a válaszok helyességéért nem vállal felelősséget. A használat napi kerethez kötött. A csevegőbe ne írj személyes vagy
        érzékeny adatot (pl. jelszót, bankkártyaszámot).
      </p>

      <h2>10. Felelősség</h2>
      <p>
        A kurzusok oktatási célú, általános információkat tartalmaznak; konkrét üzleti eredményt a Szolgáltató nem garantál. A bemutatott külső eszközök
        (pl. Canva, Claude, PolyOS, Meta, Google) felülete és díjai a Szolgáltatótól függetlenül változhatnak. A Szolgáltató törekszik a Weboldal
        folyamatos működésére, de a karbantartásból vagy külső szolgáltatók hibájából eredő átmeneti elérhetetlenségért nem felel.
      </p>

      <h2>11. Hibás teljesítés</h2>
      <p>
        Ha a megvásárolt digitális tartalom nem működik vagy nem felel meg a leírásnak, a Felhasználó jogszabály szerint kérheti a hiba kijavítását; ha ez
        nem lehetséges vagy nem történik meg észszerű időn belül, árleszállítást kérhet vagy elállhat a szerződéstől. A hibát a{' '}
        <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> címen lehet jelezni.
      </p>

      <h2>12. Panaszkezelés, jogorvoslat</h2>
      <p>
        Panaszodat e-mailben küldheted a <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> címre. A Szolgáltató a panaszt legkésőbb 30 napon belül
        írásban érdemben megválaszolja. Ha a panasz rendezése nem sikerül, fogyasztóként az alábbiakhoz fordulhatsz:
      </p>
      <ul>
        <li>Békéltető testület: <Fill v={COMPANY.conciliationBody} /> (a fogyasztó lakóhelye szerinti testület is választható; lista: <a href="https://bekeltetes.hu" target="_blank" rel="noreferrer">bekeltetes.hu</a>)</li>
        <li>Fogyasztóvédelmi hatóság: a lakóhely szerint illetékes kormányhivatal (<a href="https://fogyasztovedelem.kormany.hu" target="_blank" rel="noreferrer">fogyasztovedelem.kormany.hu</a>)</li>
        <li>Bíróság: a polgári perrendtartás szabályai szerint.</li>
      </ul>

      <h2>13. Adatkezelés</h2>
      <p>A személyes adatok kezeléséről az <Link href="/adatvedelem">Adatkezelési tájékoztató</Link> rendelkezik.</p>

      <h2>14. Záró rendelkezések</h2>
      <p>
        A jelen ÁSZF-ben nem szabályozott kérdésekben a magyar jog, különösen a Polgári Törvénykönyv (2013. évi V. törvény), az elektronikus kereskedelmi
        szolgáltatásokról szóló 2001. évi CVIII. törvény és a 45/2014. (II. 26.) Korm. rendelet az irányadó. A Szolgáltató az ÁSZF-et egyoldalúan
        módosíthatja; a módosítás a Weboldalon való közzététellel lép hatályba, és a már megkötött szerződéseket nem érinti.
      </p>
    </LegalPage>
  );
}
