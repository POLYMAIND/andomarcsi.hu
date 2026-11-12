# andormarcsi.hu – oktatási platform

Workshop-landing + videós tudástár (YouTube-leckék), tanulói dashboard, admin felület,
Stripe fizetés: egyedi kurzusvásárlás és **havidíjas tagság (19 900 Ft/hó: minden anyag + heti Q&A + zárt közösség)**.

**Stack:** Next.js 16 (App Router) · Supabase (belépés + Postgres + RLS) · Stripe Checkout / Billing · Vercel

## Funkciók

| Rész | Útvonal | Mit tud |
|---|---|---|
| Főoldal | `/` | A Claude Design dizájn; a tudástár blokk élő kurzusokat mutat |
| PolySuli | `/polysuli` | Kész AI-skillek vállalkozóknak, témák szerinti mátrixban (sor = téma, oszlop = mélység: ingyenes → zsebcsomag → skill-anyag); lépcsők: (ingyenes kóstoló 0 Ft → zsebcsomag 990 Ft → skill-anyag 9 990 Ft → Skill modul 39 900 Ft → tagság 19 900 Ft/hó → mentorprogram 249 000 Ft, jelentkezéssel), 6 skill-anyag, oktatási piramis + szintfelmérő teszt. A kurzusok POLYSULI jelvényt kapnak. `/polyakademia` és `/claude-tanfolyamok` → ide irányít |
| Tudástár | `/kurzusok` | Kurzuslista, „legújabb anyagok”, „+N új” jelvények |
| Kurzus | `/kurzusok/[slug]` | Tananyag, ingyenes előzetes leckék, vásárlás / előfizetés |
| Lecke | `/kurzusok/[slug]/[id]` | YouTube lejátszó (youtube-nocookie), „Kész vagyok vele”, előző/következő |
| Előfizetés | `/elofizetes` | Havi csomag vs. egyedi kurzusok |
| Belépés | `/belepes` | Jelszó nélküli, e-mailes belépő link (egyben regisztráció) |
| Dashboard | `/dashboard` | Haladás, „folytasd ahol abbahagytad”, heti új anyagok, számlák, előfizetés kezelése (Stripe portál) |
| Admin | `/admin` | Bevétel (előfizetés + eladás), felhasználók, **heti ritmus grafikon**, ütemezett anyagok |
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
   - PolySuli: futtasd a `supabase/migrations/20261104000000_polyakademia.sql`-t is.
   - Zsebkurzus: futtasd a `supabase/migrations/20261104010000_zsebkurzus.sql`-t is. A zsebkurzus saját, 990 Ft-os kurzussor (`pocket_for` → a tanfolyam); a letöltési linket a kurzusszerkesztőben add meg, majd állítsd „Elérhető”-re.
   - Ingyenes anyagok és zsebkurzusok a terv szerint: `supabase/migrations/20261104020000_polysuli_csomagok.sql`. A 0 Ft-os csomag ingyenes anyag (belépéssel letölthető), a 990 Ft-os zsebkurzus.
   - PolySuli aloldal (lépcsőház, 6 skill-anyag, Skill modul, mentor-jelentkezés): `supabase/migrations/20261104030000_polyakademia_aloldal.sql`. Tagoknak a Q&A és a közösség linkje: `NEXT_PUBLIC_MEMBER_QA_URL`, `NEXT_PUBLIC_MEMBER_COMMUNITY_URL`. Mentor-jelentkezések: `/admin/mentor`.
   - Az előfizetés ára alapból kódból jön (19 900 Ft/hó); ha Stripe-ban saját Price-t hozol létre, add meg: `STRIPE_SUBSCRIPTION_PRICE_ID`.
3. **Környezeti változók**: lásd `.env.example` (Vercelen: Project → Settings → Environment Variables).
4. `npm install && npm run dev`

Az előfizetés kikapcsolható, amíg kevés a videó: `NEXT_PUBLIC_SUBSCRIPTION_ENABLED=false`.

## Parancsok

- `npm run dev` – fejlesztői szerver
- `npm run build` – éles build
- `npm run lint` – TypeScript ellenőrzés
- `npm test` – egységtesztek (YouTube link felismerés, Ft formázás, budapesti időzóna)
