-- Közös kapcsolatlista: ingyenes letölthető anyagok, külső források (pl. Polysuli) feliratkozói,
-- és a regisztrációk PolyOS-be továbbításának nyilvántartása.

-- ── Ingyenes letölthető anyagok (PDF, sablon, checklist…) ─────────────────
-- A file_url NEM publikus: a nyilvános oldal a szerveren, service role-lal olvassa a többi mezőt,
-- a linket csak az kapja meg, aki megadta az e-mail címét.
create table public.free_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  file_url text not null,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.free_resources enable row level security;
create policy "ingyenes anyag: admin kezeli" on public.free_resources
  for all using (public.is_admin()) with check (public.is_admin());

-- Ki töltötte le (e-mail megadásával). Írni csak a szerver (service role) ír.
create table public.resource_downloads (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.free_resources (id) on delete cascade,
  email text not null,
  name text,
  user_id uuid references auth.users (id) on delete set null,
  consent_at timestamptz not null default now(),
  newsletter boolean not null default false,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  unique (resource_id, email)
);
alter table public.resource_downloads enable row level security;
create policy "letöltések: admin kezeli" on public.resource_downloads
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Külső források feliratkozói (pl. Polysuli) ────────────────────────────
-- A /api/contacts/ingest végpont írja (CONTACTS_INGEST_SECRET-tel), csak admin olvassa.
create table public.external_contacts (
  id uuid primary key default gen_random_uuid(),
  source text not null,          -- pl. 'polysuli'
  list text,                     -- a forráson belüli lista / űrlap neve (nem kötelező)
  email text not null,
  name text,
  consent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, email)
);
alter table public.external_contacts enable row level security;
create policy "külső kapcsolatok: admin kezeli" on public.external_contacts
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Regisztrációk PolyOS-be továbbítása ──────────────────────────────────
-- Az első bejelentkezett oldalbetöltéskor küldjük el (lásd lib/contacts.ts), egyszer.
-- A már meglévő felhasználókat késznek jelöljük: őket az admin „Kapcsolatok” CSV-jével egyszer kell importálni.
alter table public.profiles add column if not exists polyos_synced_at timestamptz;
update public.profiles set polyos_synced_at = now() where polyos_synced_at is null;
