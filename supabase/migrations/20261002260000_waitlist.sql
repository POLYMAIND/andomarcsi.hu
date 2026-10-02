-- „Értesítést kérek” lista a „Hamarosan” kurzusokhoz (előre fizetés helyett).
-- Írni csak a szerver (service role) ír, az admin olvassa/kezeli; PolyOS felé webhook + CSV export.
create table if not exists public.course_waitlist (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  email text not null,
  name text,
  user_id uuid references auth.users (id) on delete set null,
  consent_at timestamptz not null default now(),
  notified_at timestamptz,
  source text not null default 'web',
  created_at timestamptz not null default now(),
  unique (course_id, email)
);
alter table public.course_waitlist enable row level security;
create policy "értesítési lista: admin kezeli" on public.course_waitlist for all using (public.is_admin()) with check (public.is_admin());
create policy "értesítési lista: saját feliratkozás látható" on public.course_waitlist for select using (user_id = auth.uid());
