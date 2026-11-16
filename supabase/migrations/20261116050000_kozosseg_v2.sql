-- Közösség 2.0 (PolySuli közösségi tér): terek oldalsávval, Sikerfal, Bejelentések, Kérdezz!, tanfolyami terek,
-- profilok, válasz és kedvelés a hozzászólásokra, @említés, értesítések (harang + napi e-mail), olvasatlan-számlálók,
-- bejelentés (report), tiltás. Előtte: 20261115000000_kozosseg.sql (és a videós 20261116000000). Újrafuttatható.

-- ── Tiltás és hozzáférés ─────────────────────────────────────────────────
create table if not exists public.community_bans (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now()
);
alter table public.community_bans enable row level security;
drop policy if exists "tiltás: admin" on public.community_bans;
create policy "tiltás: admin" on public.community_bans for all using (public.is_admin()) with check (public.is_admin());

-- Bármely felhasználóra (értesítésekhez is): admin, aktív tag, vagy fizetős kurzust vett / kézi hozzáférést kapott – és nincs kitiltva.
create or replace function public.user_has_community_access(uid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select uid is not null and (
    coalesce((select is_admin from public.profiles where id = uid), false)
    or (
      not exists (select 1 from public.community_bans b where b.user_id = uid)
      and (
        exists (select 1 from public.subscriptions s where s.user_id = uid and s.status in ('active', 'trialing')
                and (s.current_period_end is null or s.current_period_end > now()))
        or exists (select 1 from public.enrollments e where e.user_id = uid and e.source in ('stripe', 'manual'))
      )
    )
  );
$$;

create or replace function public.has_community_access()
returns boolean
language sql
stable
security definer set search_path = public
as $$ select public.user_has_community_access(auth.uid()); $$;

-- ── Terek (oldalsáv) ─────────────────────────────────────────────────────
create table if not exists public.community_spaces (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name text not null,
  icon text not null default '',
  grp text not null check (grp in ('start', 'courses', 'bonus', 'questions', 'links')),
  sort_order integer not null default 0,
  kind text not null check (kind in ('feed', 'qa', 'announcement', 'course', 'link')),
  admin_only_post boolean not null default false, -- csak admin posztolhat (a tanuló kommentelhet)
  members_only boolean not null default false,    -- csak aktív tagoknak (pl. Élő Q&A felvételek)
  url text,                                        -- link-tér: külső cím
  description text not null default '',
  header_video text,                               -- a tér tetején megjelenő videó (pl. bemutató)
  empty_text text not null default '',
  created_at timestamptz not null default now()
);
alter table public.community_spaces enable row level security;
drop policy if exists "terek: tagok látják" on public.community_spaces;
create policy "terek: tagok látják" on public.community_spaces for select using (public.has_community_access());
drop policy if exists "terek: admin kezeli" on public.community_spaces;
create policy "terek: admin kezeli" on public.community_spaces for all using (public.is_admin()) with check (public.is_admin());

insert into public.community_spaces (slug, name, icon, grp, sort_order, kind, admin_only_post, members_only, url, description, header_video, empty_text) values
  ('kezdd-itt', 'Ezt nézd meg először', '👉', 'start', 10, 'feed', true, false, null,
   'Pár perc, és tudod, hol mit találsz – és hogyan hozod ki a legtöbbet a PolySuliból.', '/video/polysuli-intro.mp4', ''),
  ('udv', 'Üdv a PolySuliban', '👋', 'start', 20, 'feed', false, false, null,
   'Írd meg, ki vagy, mivel foglalkozol, és mit szeretnél megtanulni. Mi is szívesen megismerünk.', null,
   'Még senki nem köszönt. Legyél te az első – egy szia is elég.'),
  ('sikerfal', 'Sikerfal – mutasd, mit csináltál!', '🏆', 'start', 30, 'feed', false, false, null,
   'Kész poszt, karusszel, Reels, beállított skill – minden számít. Dicsekedj, megérdemled.', null,
   'Még csend van. Legyél te az első, aki dicsekszik – megérdemled.'),
  ('bejelentesek', 'Bejelentések', '📣', 'start', 40, 'announcement', true, false, null,
   'Újdonságok, új anyagok, élő alkalmak – Marcsitól. Kommentelni lehet.', null, 'Még nincs bejelentés.'),
  ('elo-qa', 'Élő Q&A és felvételek', '🎥', 'start', 50, 'feed', true, true, null,
   'A heti élő Q&A időpontja és a felvételek – tagoknak.', null, 'Hamarosan itt lesznek a felvételek.'),
  ('tanfolyam', 'Tanfolyami beszélgetések', '📚', 'courses', 10, 'course', false, false, null,
   'Kérdések és eredmények egy-egy tanfolyamhoz – csak a tanfolyam résztvevői látják.', null,
   'Még nincs itt bejegyzés. Kérdezz, vagy mutasd meg, hol tartasz!'),
  ('bonuszok', 'Bónuszok', '🎁', 'bonus', 10, 'feed', true, false, null,
   'Ingyenes és bónusz anyagok, heti Claude-újdonságok.', null, 'Hamarosan jönnek a bónuszok.'),
  ('gyik', 'GYIK videók', '⁉️', 'questions', 10, 'feed', true, false, null,
   'Rövid videók a leggyakoribb kérdésekre.', null, 'Hamarosan jönnek a GYIK videók.'),
  ('kerdezz', 'Kérdezz!', '🙋', 'questions', 20, 'qa', false, false, null,
   'Elakadtál? Kérdezz bátran – nincs hülye kérdés. A legjobb választ megjelölheted.', null,
   'Még nincs kérdés. Ha elakadtál, kezdd te – biztos nem vagy egyedül vele.'),
  ('youtube', 'YouTube', '▶️', 'links', 10, 'link', true, false, null, '', null, ''),
  ('instagram', 'Instagram', '📸', 'links', 20, 'link', true, false, null, '', null, ''),
  ('polyos', 'PolyOS', '🧩', 'links', 30, 'link', true, false, 'https://www.polyos.hu', '', null, ''),
  ('sikermaker', 'Sikermaker', '🚀', 'links', 40, 'link', true, false, null, '', null, '')
on conflict (slug) do nothing;

-- Látja-e a hívó egy tér egy bejegyzését? (tagoknak szóló tér, tanfolyami tér csak a tanfolyam résztvevőinek)
create or replace function public.community_can_see(space uuid, course uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.community_spaces s
    where s.id = space
      and s.kind <> 'link'
      and (not s.members_only or public.is_admin() or public.has_active_subscription())
      and (s.kind <> 'course' or (course is not null and public.has_course_access(course)))
  );
$$;

-- ── Profilok (a közösségben látható adatok; az e-mail nem) ──────────────
create table if not exists public.community_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  avatar_path text,
  bio text not null default '' check (char_length(bio) <= 80),
  instagram text not null default '' check (char_length(instagram) <= 100),
  website text not null default '' check (char_length(website) <= 200),
  member_since timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_profiles enable row level security;
drop policy if exists "profil: tagok látják" on public.community_profiles;
create policy "profil: tagok látják" on public.community_profiles for select using (public.has_community_access());
drop policy if exists "profil: saját létrehozása" on public.community_profiles;
create policy "profil: saját létrehozása" on public.community_profiles for insert with check (user_id = auth.uid() and public.has_community_access());
drop policy if exists "profil: saját módosítása" on public.community_profiles;
create policy "profil: saját módosítása" on public.community_profiles for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- Közösségi profil létrehozása, ha még nincs (a fiók nevével; ha nincs név, az e-mail eleje)
create or replace function public.community_ensure_profile(uid uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.community_profiles (user_id, display_name, member_since)
  select p.id, left(coalesce(nullif(trim(p.full_name), ''), nullif(split_part(coalesce(p.email, ''), '@', 1), ''), 'Tag'), 60), p.created_at
  from public.profiles p where p.id = uid
  on conflict (user_id) do nothing;
end;
$$;

-- A tanuló megvett tanfolyamai jelvényként (csak tagok kérdezhetik le)
create or replace function public.community_member_courses(uid uuid)
returns table (title text, slug text)
language sql
stable
security definer set search_path = public
as $$
  select c.title, c.slug from public.enrollments e
  join public.courses c on c.id = e.course_id
  where public.has_community_access() and e.user_id = uid and e.source in ('stripe', 'manual') and c.pocket_for is null and c.published
  order by e.created_at;
$$;

-- ── Bejegyzések bővítése ─────────────────────────────────────────────────
alter table public.community_posts add column if not exists space_id uuid references public.community_spaces (id) on delete restrict;
alter table public.community_posts add column if not exists tag text;
alter table public.community_posts add column if not exists platforms text[] not null default '{}';
alter table public.community_posts add column if not exists link_url text;
alter table public.community_posts add column if not exists link_preview jsonb;
alter table public.community_posts add column if not exists solved boolean not null default false;
alter table public.community_posts add column if not exists like_count integer not null default 0;
alter table public.community_posts add column if not exists comment_count integer not null default 0;
alter table public.community_posts add column if not exists edited_at timestamptz;

alter table public.community_posts drop constraint if exists community_posts_kind_check;
alter table public.community_posts add constraint community_posts_kind_check check (kind in ('question', 'showcase', 'post'));
do $$ begin
  alter table public.community_posts add constraint community_posts_tag_check check (tag is null or tag in ('success', 'first_try', 'feedback'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.community_posts add constraint community_posts_link_check check (link_url is null or (link_url ~ '^https?://' and char_length(link_url) <= 500));
exception when duplicate_object then null; end $$;

-- A meglévő bejegyzések: kérdés → Kérdezz!, munka → Sikerfal
update public.community_posts set space_id = (select id from public.community_spaces where slug = 'kerdezz') where space_id is null and kind = 'question';
update public.community_posts set space_id = (select id from public.community_spaces where slug = 'sikerfal') where space_id is null;
alter table public.community_posts alter column space_id set not null;
update public.community_posts set solved = true where best_comment_id is not null and not solved;
create index if not exists community_posts_space_idx on public.community_posts (space_id, pinned desc, created_at desc);

-- ── Hozzászólások bővítése: egyszintű válasz, kép, kedvelés ──────────────
alter table public.community_comments add column if not exists parent_id uuid references public.community_comments (id) on delete cascade;
alter table public.community_comments add column if not exists images text[] not null default '{}';
alter table public.community_comments add column if not exists like_count integer not null default 0;
do $$ begin
  alter table public.community_comments add constraint community_comments_images_check check (cardinality(images) <= 2);
exception when duplicate_object then null; end $$;

create table if not exists public.community_comment_likes (
  comment_id uuid not null references public.community_comments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
alter table public.community_comment_likes enable row level security;

-- Számlálók újraszámolása (a meglévő adatokhoz)
update public.community_posts p set
  like_count = (select count(*) from public.community_likes l where l.post_id = p.id),
  comment_count = (select count(*) from public.community_comments c where c.post_id = p.id);

-- ── Szerző, védett mezők ────────────────────────────────────────────────
-- A szerző neve a közösségi profilból jön (ha nincs, létrejön); a bejegyzés szerzője, tere és számlálói védettek.
create or replace function public.community_set_author()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare p record;
begin
  perform public.community_ensure_profile(new.user_id);
  select cp.display_name, coalesce(pr.is_admin, false) as is_admin into p
  from public.community_profiles cp join public.profiles pr on pr.id = cp.user_id where cp.user_id = new.user_id;
  new.author_name := coalesce(p.display_name, 'Tag');
  new.author_is_admin := coalesce(p.is_admin, false);
  return new;
end;
$$;

create or replace function public.community_guard_post()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  privileged boolean := public.is_admin() or auth.uid() is null; -- admin, vagy SQL-szerkesztő / szerver
  sp record;
begin
  -- a számlálókat a kedvelés/hozzászólás triggerei írják
  if current_setting('community.counter', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    select * into sp from public.community_spaces where id = new.space_id;
    if sp.id is null or sp.kind = 'link' then raise exception 'Ismeretlen tér.'; end if;
    if not privileged then
      if sp.admin_only_post then raise exception 'Ebbe a térbe csak Marcsi posztolhat – kommentelni tudsz.'; end if;
      if sp.kind = 'course' and new.course_id is null then raise exception 'A tanfolyami térben válaszd ki a tanfolyamot.'; end if;
      new.pinned := false;
    end if;
    new.kind := case when sp.kind = 'qa' then 'question' when new.kind = 'question' then 'showcase' else new.kind end;
    new.best_comment_id := null;
    new.solved := false;
    new.like_count := 0;
    new.comment_count := 0;
    return new;
  end if;
  if not privileged then
    if new.pinned is distinct from old.pinned then raise exception 'Kiemelni csak admin tud.'; end if;
    new.space_id := old.space_id;
  end if;
  new.user_id := old.user_id;
  new.kind := case when (select kind from public.community_spaces where id = new.space_id) = 'qa' then 'question'
                   when old.kind = 'question' then 'showcase' else old.kind end;
  new.created_at := old.created_at;
  new.author_name := old.author_name;
  new.author_is_admin := old.author_is_admin;
  new.like_count := old.like_count;
  new.comment_count := old.comment_count;
  if new.best_comment_id is not null and not exists (
    select 1 from public.community_comments c where c.id = new.best_comment_id and c.post_id = new.id
  ) then
    raise exception 'A legjobb válasz csak ehhez a bejegyzéshez tartozó hozzászólás lehet.';
  end if;
  if new.best_comment_id is not null then new.solved := true; end if;
  if new.title is distinct from old.title or new.body is distinct from old.body then new.edited_at := now(); end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Válasz csak egy szint mélyen, ugyanannál a bejegyzésnél; a számláló és a szerző védett.
create or replace function public.community_guard_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare par record;
begin
  if current_setting('community.counter', true) = '1' then return new; end if;
  if tg_op = 'INSERT' then
    if new.parent_id is not null then
      select post_id, parent_id into par from public.community_comments where id = new.parent_id;
      if par.post_id is distinct from new.post_id then raise exception 'A válasz csak ugyanannál a bejegyzésnél lehet.'; end if;
      if par.parent_id is not null then new.parent_id := par.parent_id; end if; -- válaszra válasz → ugyanabba a szálba
    end if;
    new.like_count := 0;
  end if;
  return new;
end;
$$;
drop trigger if exists community_comments_guard on public.community_comments;
create trigger community_comments_guard before insert on public.community_comments
  for each row execute function public.community_guard_comment();

-- ── Számlálók (kedvelés, hozzászólás) ───────────────────────────────────
create or replace function public.community_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare d integer := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  perform set_config('community.counter', '1', true);
  if tg_table_name = 'community_likes' then
    update public.community_posts set like_count = greatest(0, like_count + d) where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'community_comments' then
    update public.community_posts set comment_count = greatest(0, comment_count + d) where id = coalesce(new.post_id, old.post_id);
  elsif tg_table_name = 'community_comment_likes' then
    update public.community_comments set like_count = greatest(0, like_count + d) where id = coalesce(new.comment_id, old.comment_id);
  end if;
  perform set_config('community.counter', '', true);
  return null;
end;
$$;
drop trigger if exists community_likes_count on public.community_likes;
create trigger community_likes_count after insert or delete on public.community_likes for each row execute function public.community_count();
drop trigger if exists community_comments_count on public.community_comments;
create trigger community_comments_count after insert or delete on public.community_comments for each row execute function public.community_count();
drop trigger if exists community_comment_likes_count on public.community_comment_likes;
create trigger community_comment_likes_count after insert or delete on public.community_comment_likes for each row execute function public.community_count();

-- ── RLS: bejegyzések, hozzászólások, kedvelések (terek szerint) ──────────
drop policy if exists "közösség: bejegyzések olvasása" on public.community_posts;
create policy "közösség: bejegyzések olvasása" on public.community_posts
  for select using (public.has_community_access() and public.community_can_see(space_id, course_id));
drop policy if exists "közösség: saját bejegyzés írása" on public.community_posts;
create policy "közösség: saját bejegyzés írása" on public.community_posts
  for insert with check (public.has_community_access() and user_id = auth.uid() and public.community_can_see(space_id, course_id));
drop policy if exists "közösség: saját bejegyzés módosítása" on public.community_posts;
create policy "közösség: saját bejegyzés módosítása" on public.community_posts
  for update using (public.has_community_access() and (user_id = auth.uid() or public.is_admin()))
  with check (public.has_community_access() and (user_id = auth.uid() or public.is_admin()) and public.community_can_see(space_id, course_id));

drop policy if exists "közösség: hozzászólások olvasása" on public.community_comments;
create policy "közösség: hozzászólások olvasása" on public.community_comments
  for select using (public.has_community_access() and exists (select 1 from public.community_posts p where p.id = post_id));
drop policy if exists "közösség: saját hozzászólás írása" on public.community_comments;
create policy "közösség: saját hozzászólás írása" on public.community_comments
  for insert with check (public.has_community_access() and user_id = auth.uid() and exists (select 1 from public.community_posts p where p.id = post_id));

drop policy if exists "közösség: kedvelések olvasása" on public.community_likes;
create policy "közösség: kedvelések olvasása" on public.community_likes
  for select using (public.has_community_access() and exists (select 1 from public.community_posts p where p.id = post_id));
drop policy if exists "közösség: saját kedvelés" on public.community_likes;
create policy "közösség: saját kedvelés" on public.community_likes
  for insert with check (public.has_community_access() and user_id = auth.uid() and exists (select 1 from public.community_posts p where p.id = post_id));

drop policy if exists "közösség: hozzászólás-kedvelések olvasása" on public.community_comment_likes;
create policy "közösség: hozzászólás-kedvelések olvasása" on public.community_comment_likes
  for select using (public.has_community_access());
drop policy if exists "közösség: saját hozzászólás-kedvelés" on public.community_comment_likes;
create policy "közösség: saját hozzászólás-kedvelés" on public.community_comment_likes
  for insert with check (public.has_community_access() and user_id = auth.uid() and exists (select 1 from public.community_comments c where c.id = comment_id));
drop policy if exists "közösség: saját hozzászólás-kedvelés visszavonása" on public.community_comment_likes;
create policy "közösség: saját hozzászólás-kedvelés visszavonása" on public.community_comment_likes
  for delete using (user_id = auth.uid());

-- ── Értesítések (harang + napi összefoglaló) ────────────────────────────
create table if not exists public.community_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_name text not null default '',
  type text not null check (type in ('like', 'comment', 'reply', 'mention', 'announcement', 'best_answer', 'comment_like')),
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  created_at timestamptz not null default now(),
  read_at timestamptz,
  emailed_at timestamptz
);
create index if not exists community_notifications_user_idx on public.community_notifications (user_id, created_at desc);
alter table public.community_notifications enable row level security;
drop policy if exists "értesítés: saját" on public.community_notifications;
create policy "értesítés: saját" on public.community_notifications for select using (user_id = auth.uid());
drop policy if exists "értesítés: saját olvasottra állítása" on public.community_notifications;
create policy "értesítés: saját olvasottra állítása" on public.community_notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.community_notify(target uuid, actor uuid, kind text, post uuid, comment uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if target is null or target = actor or not public.user_has_community_access(target) then return; end if;
  -- a bejegyzést látnia is kell (pl. tanfolyami tér) – ezt a kattintáskor az RLS úgyis ellenőrzi; itt a tagság elég
  insert into public.community_notifications (user_id, actor_id, actor_name, type, post_id, comment_id)
  values (target, actor, coalesce((select display_name from public.community_profiles where user_id = actor), 'Valaki'), kind, post, comment);
end;
$$;

-- @említés: @[Név](uuid) a szövegben
create or replace function public.community_mentions(txt text)
returns setof uuid
language sql
immutable
as $$
  select distinct (m[1])::uuid from regexp_matches(coalesce(txt, ''), '@\[[^\]]{1,60}\]\(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\)', 'g') as m;
$$;

create or replace function public.community_on_post()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare uid uuid; sp text;
begin
  if tg_op = 'INSERT' then
    for uid in select * from public.community_mentions(new.body) loop
      perform public.community_notify(uid, new.user_id, 'mention', new.id, null);
    end loop;
    select kind into sp from public.community_spaces where id = new.space_id;
    if sp = 'announcement' then
      insert into public.community_notifications (user_id, actor_id, actor_name, type, post_id)
      select p.id, new.user_id, new.author_name, 'announcement', new.id
      from public.profiles p where p.id <> new.user_id and public.user_has_community_access(p.id);
    end if;
  elsif new.best_comment_id is not null and new.best_comment_id is distinct from old.best_comment_id then
    perform public.community_notify((select user_id from public.community_comments where id = new.best_comment_id),
                                    auth.uid(), 'best_answer', new.id, new.best_comment_id);
  end if;
  return null;
end;
$$;
drop trigger if exists community_posts_notify on public.community_posts;
create trigger community_posts_notify after insert or update of best_comment_id on public.community_posts
  for each row execute function public.community_on_post();

create or replace function public.community_on_comment()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare post_author uuid; parent_author uuid; uid uuid;
begin
  select user_id into post_author from public.community_posts where id = new.post_id;
  if new.parent_id is not null then
    select user_id into parent_author from public.community_comments where id = new.parent_id;
    perform public.community_notify(parent_author, new.user_id, 'reply', new.post_id, new.id);
  end if;
  if post_author is distinct from parent_author then
    perform public.community_notify(post_author, new.user_id, 'comment', new.post_id, new.id);
  end if;
  for uid in select * from public.community_mentions(new.body) loop
    if uid is distinct from post_author and uid is distinct from parent_author then
      perform public.community_notify(uid, new.user_id, 'mention', new.post_id, new.id);
    end if;
  end loop;
  return null;
end;
$$;
drop trigger if exists community_comments_notify on public.community_comments;
create trigger community_comments_notify after insert on public.community_comments
  for each row execute function public.community_on_comment();

create or replace function public.community_on_like()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_table_name = 'community_likes' then
    perform public.community_notify((select user_id from public.community_posts where id = new.post_id), new.user_id, 'like', new.post_id, null);
  else
    perform public.community_notify((select user_id from public.community_comments where id = new.comment_id), new.user_id, 'comment_like',
                                    (select post_id from public.community_comments where id = new.comment_id), new.comment_id);
  end if;
  return null;
end;
$$;
drop trigger if exists community_likes_notify on public.community_likes;
create trigger community_likes_notify after insert on public.community_likes for each row execute function public.community_on_like();
drop trigger if exists community_comment_likes_notify on public.community_comment_likes;
create trigger community_comment_likes_notify after insert on public.community_comment_likes for each row execute function public.community_on_like();

-- ── Olvasottság (olvasatlan-számlálók terenként) ────────────────────────
create table if not exists public.community_space_reads (
  user_id uuid not null references public.profiles (id) on delete cascade,
  space_id uuid not null references public.community_spaces (id) on delete cascade,
  course_key uuid not null default '00000000-0000-0000-0000-000000000000', -- tanfolyami térnél a tanfolyam
  last_read_at timestamptz not null default now(),
  primary key (user_id, space_id, course_key)
);
alter table public.community_space_reads enable row level security;
drop policy if exists "olvasottság: saját" on public.community_space_reads;
create policy "olvasottság: saját" on public.community_space_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Olvasatlan bejegyzések terenként (a hívó szemével, RLS-sel); az új tag az utolsó 14 nap bejegyzéseit látja újnak.
create or replace function public.community_unread_counts()
returns table (space_id uuid, course_key uuid, n bigint)
language sql
stable
security invoker set search_path = public
as $$
  select p.space_id,
         case when s.kind = 'course' then p.course_id else '00000000-0000-0000-0000-000000000000'::uuid end as course_key,
         count(*)
  from public.community_posts p
  join public.community_spaces s on s.id = p.space_id
  left join public.community_space_reads r
    on r.user_id = auth.uid() and r.space_id = p.space_id
   and r.course_key = case when s.kind = 'course' then p.course_id else '00000000-0000-0000-0000-000000000000'::uuid end
  where p.user_id <> auth.uid() and p.created_at > coalesce(r.last_read_at, now() - interval '14 days')
  group by 1, 2;
$$;

-- ── Bejelentés (report) ─────────────────────────────────────────────────
create table if not exists public.community_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.community_posts (id) on delete cascade,
  comment_id uuid references public.community_comments (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reason text not null default '' check (char_length(reason) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved')),
  created_at timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);
alter table public.community_reports enable row level security;
drop policy if exists "bejelentés: tag beküldi" on public.community_reports;
create policy "bejelentés: tag beküldi" on public.community_reports for insert with check (reporter_id = auth.uid() and public.has_community_access());
drop policy if exists "bejelentés: admin kezeli" on public.community_reports;
create policy "bejelentés: admin kezeli" on public.community_reports for all using (public.is_admin()) with check (public.is_admin());

-- ── Tárhely: videó max. 100 MB ──────────────────────────────────────────
update storage.buckets set file_size_limit = 104857600 where id = 'community';

-- ── Kitűzött nyitó bejegyzések (ha van admin, és még nincs kitűzött poszt az adott térben) ──
insert into public.community_posts (user_id, space_id, kind, title, body, pinned)
select a.id, s.id, 'post', v.title, v.body, true
from (values
  ('kezdd-itt', 'Kezdd itt: így hozod ki a legtöbbet a PolySuliból',
   E'Nézd meg fent a rövid bemutatót, aztán:\n1. Köszönj be az „Üdv a PolySuliban” térben – írd meg, ki vagy és mit szeretnél megtanulni.\n2. A tanfolyamaidat a bal oldali „Tanfolyamaim” alatt találod.\n3. Ha elakadsz: „Kérdezz!”. Ha elkészült valami: „Sikerfal”.\nNem kell tökéletesnek lennie. Kész jobb, mint tökéletes.'),
  ('udv', '👋 Mutatkozz be!',
   E'Írd meg kommentben: ki vagy, mivel foglalkozol, és mit szeretnél megtanulni itt. Egy mondat is elég – innen indulunk.'),
  ('sikerfal', '🤩 Mutasd, mit hoztál össze!',
   E'Dobd be ide a kész posztod, karusszeled, Reelsed – link, kép, videó, bármi. És írd meg, mi volt a legnehezebb.')
) as v(slug, title, body)
join public.community_spaces s on s.slug = v.slug
cross join lateral (select id from public.profiles where is_admin order by created_at limit 1) a
where not exists (select 1 from public.community_posts p where p.space_id = s.id and p.pinned);
