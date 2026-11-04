-- Zsebkurzus (990 Ft): egy tanfolyam kész promptjai és skilljei telepítési leírással – az oldalon is megvásárolható.
-- Minden zsebkurzus egy saját kurzussor (ugyanaz a Stripe-fizetés, számla, vásárlólista), a pocket_for mutat a „szülő” tanfolyamra.
-- A tartalom egy letölthető csomag: a link a course_downloads táblában van, és csak jogosult (vásárló, előfizető, admin) kapja meg.
alter table public.courses add column if not exists pocket_for uuid references public.courses (id) on delete set null;
create index if not exists courses_pocket_for_idx on public.courses (pocket_for) where pocket_for is not null;

create table if not exists public.course_downloads (
  course_id uuid primary key references public.courses (id) on delete cascade,
  url text not null check (url ~ '^https://'),
  label text not null default 'Letöltöm a csomagot',
  updated_at timestamptz not null default now()
);
alter table public.course_downloads enable row level security;
drop policy if exists "letöltés: admin kezeli" on public.course_downloads;
create policy "letöltés: admin kezeli" on public.course_downloads for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "letöltés: csak jogosultaknak" on public.course_downloads;
create policy "letöltés: csak jogosultaknak" on public.course_downloads for select using (public.has_course_access(course_id));

-- Zsebkurzusok a kulcsszavas PolySuli-tanfolyamokhoz. „Hamarosan” állapotban indulnak:
-- az adminban add meg a letöltési linket, majd állítsd „Elérhető”-re – onnantól megvásárolható.
insert into public.courses (slug, title, subtitle, teaser, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order,
                            academy_level, academy_tag, academy_keyword, pocket_for)
select 'zseb-' || p.slug,
       'Zsebkurzus: ' || p.title,
       'Kész promptok és skillek, telepítési leírással',
       'Kész promptok és skillek a „' || p.title || '” tanfolyamból, egy letölthető csomagban, lépésről lépésre telepítési leírással. Videó nélkül, azonnal használható.',
       'Mit kapsz?' || E'\n' || '• a tanfolyam kész promptjait, bemásolható formában' || E'\n' || '• a kész skilleket, amiket pár kattintással telepítesz Claude-ba' || E'\n' || '• telepítési leírást lépésről lépésre' || E'\n\n' ||
       'Ha a teljes folyamatot videón is végignéznéd, válaszd a teljes tanfolyamot.',
       'Claude', p.level, 990, true, true, true, p.sort_order + 1000,
       p.academy_level, 'Zsebkurzus', p.academy_keyword, p.id
from public.courses p
where p.slug in ('claude-alapozo', 'claude-celok-heti-terv', 'reels-vagas-claude-dal', 'tartalombomba-claude-dal', 'karusszel-skill-workshop')
on conflict (slug) do nothing;
