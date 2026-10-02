-- Hírlevél-feliratkozók (lábléc űrlap + fejléc „Ingyenes tippek” gomb). Csak admin olvassa,
-- a feliratkozás a szerveren, service role-lal történik (/api/newsletter).
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text,
  user_id uuid references auth.users(id) on delete set null,
  consent_at timestamptz not null default now(),
  source text not null default 'footer',
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "hírlevél: admin kezeli" on public.newsletter_subscribers
  for all using (public.is_admin()) with check (public.is_admin());
