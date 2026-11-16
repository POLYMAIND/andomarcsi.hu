-- Vélemények (testimonialok) a tanulóktól: csillag, szöveg, megjelenő név, vállalkozás.
-- A hozzájárulással (consent_at) a vélemény a weboldalon és a közösségi médiában (posztokban) is felhasználható.
-- Tanuló: csak a saját, hozzáférhető kurzusához ír, és csak a sajátját látja / módosítja. Admin: mindent.
-- Az adminban: /admin/velemenyek. Újrafuttatható.

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 2000),
  display_name text not null check (char_length(display_name) between 1 and 80),
  business text not null default '' check (char_length(business) <= 120),
  consent_at timestamptz not null,
  status text not null default 'new' check (status in ('new', 'approved', 'hidden')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index if not exists testimonials_created_idx on public.testimonials (created_at desc);

-- A tanuló módosításakor a vélemény újra „új” lesz (az admin újra átnézi); az állapotot csak admin állítja.
create or replace function public.testimonials_guard()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'new';
    else
      new.user_id := old.user_id;
      new.course_id := old.course_id;
      new.status := 'new';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists testimonials_guard on public.testimonials;
create trigger testimonials_guard before insert or update on public.testimonials
  for each row execute function public.testimonials_guard();

alter table public.testimonials enable row level security;

drop policy if exists "vélemény: saját vagy admin olvassa" on public.testimonials;
create policy "vélemény: saját vagy admin olvassa" on public.testimonials
  for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "vélemény: saját, hozzáférhető kurzushoz" on public.testimonials;
create policy "vélemény: saját, hozzáférhető kurzushoz" on public.testimonials
  for insert with check (user_id = auth.uid() and public.has_course_access(course_id));
drop policy if exists "vélemény: saját módosítása" on public.testimonials;
create policy "vélemény: saját módosítása" on public.testimonials
  for update using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
drop policy if exists "vélemény: saját vagy admin törli" on public.testimonials;
create policy "vélemény: saját vagy admin törli" on public.testimonials
  for delete using (user_id = auth.uid() or public.is_admin());
