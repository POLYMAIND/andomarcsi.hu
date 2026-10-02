-- Csomagok: egy kurzus megvásárlása a bundle_course_ids-ban lévő kurzusokat is megnyitja.
alter table public.courses add column if not exists bundle_course_ids uuid[] not null default '{}';

-- Canva Kalauz: 3 × 90 perces modul (9 990 Ft/modul), teljes csomag 24 990 Ft
insert into public.courses (slug, title, subtitle, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order) values
  ('canva-kalauz-1', 'Canva Kalauz 1. – Alapok és saját arculat', '90 perces videómodul', 'A Canva felülete lépésről lépésre, és a saját arculatod beállítása: színek, betűk, logó, márkakészlet. 90 perc videó + sablonok.', 'Canva', 'Kezdő', 9990, true, true, true, 11),
  ('canva-kalauz-2', 'Canva Kalauz 2. – Social posztok sablonból', '90 perces videómodul', 'Saját, újrahasznosítható sablonkészlet: 10 social poszt a saját arculatoddal. 90 perc videó + sablonok.', 'Canva', 'Kezdő', 9990, true, true, true, 12),
  ('canva-kalauz-3', 'Canva Kalauz 3. – Story és borítókép', '90 perces videómodul', 'Story-k, borítóképek és a kész anyagok exportálása, megosztása. 90 perc videó + sablonok.', 'Canva', 'Kezdő', 9990, true, true, true, 13)
on conflict (slug) do nothing;

update public.courses set
  title = 'Canva Kalauz – teljes csomag',
  subtitle = '3 × 90 perces videómodul + sablonok',
  description = 'Mindhárom Canva Kalauz modul egyben: alapok és saját arculat, social posztok sablonból, story és borítókép. Saját sablonkészlet a saját arculatoddal. 3 × 90 perc videó + sablonok.',
  price_huf = 24990,
  sort_order = 10,
  bundle_course_ids = (select array_agg(id order by sort_order) from public.courses where slug in ('canva-kalauz-1', 'canva-kalauz-2', 'canva-kalauz-3'))
where slug = 'canva-kalauz';
