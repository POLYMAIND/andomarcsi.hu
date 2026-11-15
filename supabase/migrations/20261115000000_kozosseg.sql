-- Közösség (/kozosseg): kérdések és válaszok, „Munkáim” galéria, kurzusonkénti témák.
-- Hozzáférés: admin, aktív havidíjas tag, és aki fizetős kurzust vett vagy kézi hozzáférést kapott.
-- A képek a privát „community” tárhelyen vannak; csak a közösség tagjai látják (aláírt linkkel).
-- Újrafuttatható.

-- ── Ki léphet be a közösségbe? ───────────────────────────────────────────
create or replace function public.has_community_access()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select auth.uid() is not null and (
    public.is_admin()
    or public.has_active_subscription()
    or exists (select 1 from public.enrollments e where e.user_id = auth.uid() and e.source in ('stripe', 'manual'))
  );
$$;

-- E-mail értesítés a közösségből (a profil oldalon / a közösségben kikapcsolható)
alter table public.profiles add column if not exists community_emails boolean not null default true;

-- ── Táblák ───────────────────────────────────────────────────────────────
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('question', 'showcase')),
  title text not null check (char_length(title) between 3 and 140),
  body text not null default '' check (char_length(body) <= 5000),
  course_id uuid references public.courses (id) on delete set null,
  images text[] not null default '{}' check (cardinality(images) <= 4),
  best_comment_id uuid,
  pinned boolean not null default false,
  -- A szerző neve és admin-jelzése beíráskor másolódik ide (a profilok más tagok elől rejtve vannak).
  author_name text not null default '',
  author_is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists community_posts_created_idx on public.community_posts (pinned desc, created_at desc);
create index if not exists community_posts_course_idx on public.community_posts (course_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  author_name text not null default '',
  author_is_admin boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists community_comments_post_idx on public.community_comments (post_id, created_at);

do $$ begin
  alter table public.community_posts
    add constraint community_posts_best_comment_fk foreign key (best_comment_id) references public.community_comments (id) on delete set null;
exception when duplicate_object then null; end $$;

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Szerzőadatok kitöltése, védett mezők ─────────────────────────────────
create or replace function public.community_set_author()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare p record;
begin
  select full_name, email, is_admin into p from public.profiles where id = new.user_id;
  new.author_name := coalesce(nullif(trim(p.full_name), ''), split_part(coalesce(p.email, ''), '@', 1), 'Tag');
  new.author_is_admin := coalesce(p.is_admin, false);
  return new;
end;
$$;

drop trigger if exists community_posts_author on public.community_posts;
create trigger community_posts_author before insert on public.community_posts
  for each row execute function public.community_set_author();
drop trigger if exists community_comments_author on public.community_comments;
create trigger community_comments_author before insert on public.community_comments
  for each row execute function public.community_set_author();

-- Kiemelni csak admin tud; a szerző, a létrehozás ideje és a típus nem módosítható;
-- legjobb válasz csak a bejegyzéshez tartozó hozzászólás lehet.
create or replace function public.community_guard_post()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_admin() then new.pinned := false; end if;
    new.best_comment_id := null;
    return new;
  end if;
  if new.pinned is distinct from old.pinned and not public.is_admin() then
    raise exception 'Kiemelni csak admin tud.';
  end if;
  new.user_id := old.user_id;
  new.kind := old.kind;
  new.created_at := old.created_at;
  new.author_name := old.author_name;
  new.author_is_admin := old.author_is_admin;
  if new.best_comment_id is not null and not exists (
    select 1 from public.community_comments c where c.id = new.best_comment_id and c.post_id = new.id
  ) then
    raise exception 'A legjobb válasz csak ehhez a bejegyzéshez tartozó hozzászólás lehet.';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists community_posts_guard on public.community_posts;
create trigger community_posts_guard before insert or update on public.community_posts
  for each row execute function public.community_guard_post();

-- ── RLS ──────────────────────────────────────────────────────────────────
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;

drop policy if exists "közösség: bejegyzések olvasása" on public.community_posts;
create policy "közösség: bejegyzések olvasása" on public.community_posts
  for select using (public.has_community_access());
drop policy if exists "közösség: saját bejegyzés írása" on public.community_posts;
create policy "közösség: saját bejegyzés írása" on public.community_posts
  for insert with check (public.has_community_access() and user_id = auth.uid());
drop policy if exists "közösség: saját bejegyzés módosítása" on public.community_posts;
create policy "közösség: saját bejegyzés módosítása" on public.community_posts
  for update using (public.has_community_access() and (user_id = auth.uid() or public.is_admin()))
  with check (public.has_community_access() and (user_id = auth.uid() or public.is_admin()));
drop policy if exists "közösség: saját bejegyzés törlése" on public.community_posts;
create policy "közösség: saját bejegyzés törlése" on public.community_posts
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "közösség: hozzászólások olvasása" on public.community_comments;
create policy "közösség: hozzászólások olvasása" on public.community_comments
  for select using (public.has_community_access());
drop policy if exists "közösség: saját hozzászólás írása" on public.community_comments;
create policy "közösség: saját hozzászólás írása" on public.community_comments
  for insert with check (public.has_community_access() and user_id = auth.uid());
drop policy if exists "közösség: saját hozzászólás törlése" on public.community_comments;
create policy "közösség: saját hozzászólás törlése" on public.community_comments
  for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "közösség: kedvelések olvasása" on public.community_likes;
create policy "közösség: kedvelések olvasása" on public.community_likes
  for select using (public.has_community_access());
drop policy if exists "közösség: saját kedvelés" on public.community_likes;
create policy "közösség: saját kedvelés" on public.community_likes
  for insert with check (public.has_community_access() and user_id = auth.uid());
drop policy if exists "közösség: saját kedvelés visszavonása" on public.community_likes;
create policy "közösség: saját kedvelés visszavonása" on public.community_likes
  for delete using (user_id = auth.uid());

-- ── Képtárhely (privát) ──────────────────────────────────────────────────
-- Fájlnév: <user_id>/<véletlen>.jpg · max. 5 MB · csak kép
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community', 'community', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "közösség: képek olvasása" on storage.objects;
create policy "közösség: képek olvasása" on storage.objects
  for select using (bucket_id = 'community' and public.has_community_access());
drop policy if exists "közösség: saját kép feltöltése" on storage.objects;
create policy "közösség: saját kép feltöltése" on storage.objects
  for insert with check (bucket_id = 'community' and public.has_community_access() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "közösség: saját kép törlése" on storage.objects;
create policy "közösség: saját kép törlése" on storage.objects
  for delete using (bucket_id = 'community' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));
