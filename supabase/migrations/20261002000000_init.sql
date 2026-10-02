-- andormarcsi.hu oktatási platform – alap séma
-- Kurzusok + YouTube-os leckék, egyedi vásárlás (Stripe Checkout),
-- havi előfizetés (Stripe Billing), haladáskövetés, admin jogosultság.

create extension if not exists pgcrypto;

-- ── Profilok ──────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  is_admin boolean not null default false,
  stripe_customer_id text unique,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ── Kurzusok és leckék ────────────────────────────────────────────────────
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  tool text not null default 'Canva',           -- Canva | Claude | Polyos | Hirdetés | ...
  level text not null default 'Kezdő',
  price_huf integer not null default 0 check (price_huf >= 0), -- 0 = ingyenes
  included_in_subscription boolean not null default true,
  published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  duration_min integer,
  sort_order integer not null default 0,
  is_preview boolean not null default false,  -- bárki megnézheti (kedvcsináló)
  published_at timestamptz not null default now(), -- ütemezett megjelenés ("heti 2 új anyag")
  created_at timestamptz not null default now()
);
create index lessons_course_idx on public.lessons (course_id, sort_order);
create index lessons_published_idx on public.lessons (published_at desc);

-- A YouTube-azonosító külön táblában van, így a tananyag-vázlat (címek)
-- nyilvános lehet, a videó viszont csak jogosultsággal érhető el.
create table public.lesson_videos (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$')
);

-- ── Vásárlások, előfizetések, haladás ─────────────────────────────────────
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  source text not null default 'stripe' check (source in ('free', 'stripe', 'manual')),
  stripe_session_id text unique,
  amount_huf integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_subscription_id text unique not null,
  stripe_customer_id text not null,
  status text not null,               -- Stripe státusz: active, trialing, past_due, canceled, ...
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id uuid not null references public.lessons (id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

-- ── Hozzáférés-logika ─────────────────────────────────────────────────────
create function public.has_active_subscription(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and s.status in ('active', 'trialing')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;

create function public.has_course_access(cid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin()
    or exists (select 1 from public.courses c where c.id = cid and c.published and c.price_huf = 0)
    or exists (select 1 from public.enrollments e where e.course_id = cid and e.user_id = auth.uid())
    or (
      public.has_active_subscription()
      and exists (select 1 from public.courses c where c.id = cid and c.included_in_subscription)
    );
$$;

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.enrollments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.lesson_progress enable row level security;

create policy "profil: saját vagy admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "kurzus: publikált mindenkinek" on public.courses
  for select using (published or public.is_admin());
create policy "kurzus: admin kezeli" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "lecke: megjelent leckék vázlata nyilvános" on public.lessons
  for select using (
    public.is_admin()
    or (published_at <= now() and exists (select 1 from public.courses c where c.id = course_id and c.published))
  );
create policy "lecke: admin kezeli" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "videó: csak jogosultaknak" on public.lesson_videos
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_id
        and c.published
        and l.published_at <= now()
        and (l.is_preview or public.has_course_access(l.course_id))
    )
  );
create policy "videó: admin kezeli" on public.lesson_videos
  for all using (public.is_admin()) with check (public.is_admin());

create policy "beiratkozás: saját vagy admin" on public.enrollments
  for select using (user_id = auth.uid() or public.is_admin());
-- Ingyenes kurzusra a felhasználó maga is beiratkozhat; fizetőst csak a szerver (service role) ír.
create policy "beiratkozás: ingyenes kurzusra" on public.enrollments
  for insert with check (
    user_id = auth.uid()
    and source = 'free'
    and amount_huf = 0
    and stripe_session_id is null
    and exists (select 1 from public.courses c where c.id = course_id and c.published and c.price_huf = 0)
  );
create policy "beiratkozás: admin kezeli" on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

create policy "előfizetés: saját vagy admin" on public.subscriptions
  for select using (user_id = auth.uid() or public.is_admin());

create policy "haladás: saját" on public.lesson_progress
  for select using (user_id = auth.uid() or public.is_admin());
create policy "haladás: saját beírása" on public.lesson_progress
  for insert with check (user_id = auth.uid());
create policy "haladás: saját törlése" on public.lesson_progress
  for delete using (user_id = auth.uid());
