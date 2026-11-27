# andormarcsi.hu – oktatási platform

Workshop-landing + videós tudástár (YouTube-leckék), tanulói dashboard, admin felület,
Stripe fizetés: egyedi kurzusvásárlás és **havi előfizetés (14 990 Ft/hó, heti 2 új anyag)**.

**Stack:** Next.js 16 (App Router) · Supabase (belépés + Postgres + RLS) · Stripe Checkout / Billing · Vercel

## Funkciók

| Rész | Útvonal | Mit tud |
|---|---|---|
| Főoldal | `/` | A Claude Design dizájn; a tudástár blokk élő kurzusokat mutat |
| Tudástár | `/kurzusok` | Kurzuslista, „legújabb anyagok”, „+N új” jelvények |
| Kurzus | `/kurzusok/[slug]` | Tananyag, ingyenes előzetes leckék, vásárlás / előfizetés |
| Lecke | `/kurzusok/[slug]/[id]` | YouTube lejátszó (youtube-nocookie), „Kész vagyok vele”, előző/következő |
| Előfizetés | `/elofizetes` | Havi csomag vs. egyedi kurzusok |
| Belépés | `/belepes` | Jelszó nélküli, e-mailes belépő link (egyben regisztráció) |
| Dashboard | `/dashboard` | Haladás, „folytasd ahol abbahagytad”, heti új anyagok, számlák, előfizetés kezelése (Stripe portál) |
| Admin | `/admin` | Bevétel (előfizetés + eladás), felhasználók, **heti ritmus grafikon**, ütemezett anyagok |
| Ingyenes anyagok | `/ingyenes`, `/ingyenes/[slug]` | E-mail címért letölthető anyagok (link csak beküldés után), opcionális hírlevél-feliratkozással |
| Kapcsolatok (admin) | `/admin/kapcsolatok` | **Közös lista**: regisztrálók, hírlevél, értesítés, ingyenes kurzus, letöltők, külső források (Polysuli) – e-mail szerint összefésülve, CSV |
| Ingyenes anyagok (admin) | `/admin/letoltesek` | Anyagok felvétele / szerkesztése, letöltők listája |
| Kurzus szerkesztő | `/admin/kurzusok/[id]` | Kurzus adatai, leckék YouTube linkkel, **ütemezett megjelenés**, kézi hozzáférés |

### Hozzáférési szabályok (Postgres RLS – nem csak a felületen)

- A lecke **címe** publikus, a **YouTube-azonosító** (`lesson_videos`) csak jogosultnak jön le az adatbázisból.
- Jogosult: admin · ingyenes kurzus · megvásárolt kurzus · aktív előfizetés (ha a kurzus „benne van az előfizetésben”) · előzetes lecke.
- Ütemezett lecke (`published_at` a jövőben) csak adminnak látszik, a megadott időpontban magától megjelenik.
- Tipp: a YouTube-on a videókat **„Nem listázott”** láthatósággal töltsd fel.

## Beüzemelés

1. **Supabase projekt** → SQL Editorban futtasd: `supabase/migrations/20261002000000_init.sql`, majd (opcionálisan) `supabase/seed.sql`.
   - Authentication → URL Configuration: Site URL = az oldal címe, Redirect URL: `https://andormarcsi.hu/auth/callback`.
   - Lépj be egyszer az oldalon, majd tedd magad adminná:
     `update profiles set is_admin = true where email = 'te@email.hu';`
2. **Stripe**
   - API kulcs: `STRIPE_SECRET_KEY`.
   - Webhook végpont: `https://andormarcsi.hu/api/stripe/webhook`, események:
     `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
     `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` → `STRIPE_WEBHOOK_SECRET`.
   - Customer portal bekapcsolása (Settings → Billing → Customer portal) a lemondáshoz/kártyacseréhez.
   - Az előfizetés ára alapból kódból jön (14 990 Ft/hó); ha Stripe-ban saját Price-t hozol létre, add meg: `STRIPE_SUBSCRIPTION_PRICE_ID`.
3. **Környezeti változók**: lásd `.env.example` (Vercelen: Project → Settings → Environment Variables).
4. `npm install && npm run dev`

### Kapcsolatok összegyűjtése (PolyOS + külső források)

- **PolyOS felé** (`POLYOS_WEBHOOK_URL`): minden új esemény JSON-ben megy, az `event` mező szerint:
  `user.registered` (új fiók, első belépéskor), `newsletter.signup`, `waitlist.signup`, `course.free_enroll`, `resource.download`, `external.signup`.
  A migráció előtti felhasználókat egyszer a `/admin/kapcsolatok` CSV-jével kell importálni.
- **Külső források befelé** (pl. Polysuli): állítsd be a `CONTACTS_INGEST_SECRET`-et, és a Polysuli küldje a feliratkozóit ide:

  ```
  POST https://andormarcsi.hu/api/contacts/ingest
  Authorization: Bearer <CONTACTS_INGEST_SECRET>
  Content-Type: application/json

  {"source": "polysuli", "email": "valaki@pelda.hu", "name": "Valaki", "list": "hirlevel", "consent_at": "2026-11-27T10:00:00Z"}
  ```

  Régi feliratkozók egyszeri áttöltése: `{"source": "polysuli", "contacts": [{"email": "..."}, ...]}` (max. 500 / kérés).
  A válasz: `{ ok, received, added, duplicates, rejected }`. Ugyanaz a cím ugyanabból a forrásból csak egyszer kerül be.
- **Polysuli (WordPress)**: a PolyOS for WordPress bővítmény (1.8.0+) → Vezérlőpult → PolyOS → *Közös kapcsolatlista*:
  végpont `https://andormarcsi.hu/api/contacts/ingest`, kulcs = `CONTACTS_INGEST_SECRET`, forrás = `polysuli`.
  Ettől minden új `[polyos_newsletter]` feliratkozó ide is megérkezik (a PolyOS által elfogadottak közül).
- **Régi feliratkozók egyszeri áttöltése**: `/admin/kapcsolatok` → *Külső lista importálása (CSV)* (pl. a PolyOS-ből exportált lista).
  Ezeket nem küldjük vissza a PolyOS-be, mert onnan jönnek.

Az előfizetés kikapcsolható, amíg kevés a videó: `NEXT_PUBLIC_SUBSCRIPTION_ENABLED=false`.

## Parancsok

- `npm run dev` – fejlesztői szerver
- `npm run build` – éles build
- `npm run lint` – TypeScript ellenőrzés
- `npm test` – egységtesztek (YouTube link felismerés, Ft formázás, budapesti időzóna)
