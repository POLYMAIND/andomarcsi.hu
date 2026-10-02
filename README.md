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

Az előfizetés kikapcsolható, amíg kevés a videó: `NEXT_PUBLIC_SUBSCRIPTION_ENABLED=false`.

## Parancsok

- `npm run dev` – fejlesztői szerver
- `npm run build` – éles build
- `npm run lint` – TypeScript ellenőrzés
- `npm test` – egységtesztek (YouTube link felismerés, Ft formázás, budapesti időzóna)
