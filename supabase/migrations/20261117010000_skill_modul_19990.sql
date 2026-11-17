-- Skill modul: 19 990 Ft (az eredeti 39 900 Ft áthúzva). A modul a Márkahang, Design system és Karusszel témát fogja össze:
-- a videós anyagok (Vágóskill, Fotobump) a külön Videó modulba kerülnek, az Ügyfélszerzés (Űrlap → AI-előminősítés) is kikerül.
-- Újrafuttatható.

-- A videós skill-anyagok és a hozzájuk tartozó zsebcsomagok ki a modulból (a sorrend marad)
update public.courses m set bundle_course_ids = coalesce(array(
  select x from unnest(m.bundle_course_ids) with ordinality as u(x, o)
  where x not in (
    select v.id from public.courses v where v.slug in ('reels-vagas-claude-dal', 'fotobump-skill', 'urlap-ai-elominosites')
    union
    select p.id from public.courses p join public.courses v on p.pocket_for = v.id where v.slug in ('reels-vagas-claude-dal', 'fotobump-skill', 'urlap-ai-elominosites')
  )
  order by o
), '{}')
where m.slug = 'skill-modul';

-- Ár: 39 900 Ft áthúzva, 19 990 Ft (akciós ár, lejárat nélkül)
update public.courses set
  price_huf = 39900,
  sale_price_huf = 19990,
  sale_starts_at = null,
  sale_ends_at = null,
  sale_label = 'Bevezető ár',
  subtitle = 'A skill-anyagok és a témák összes zsebcsomagja egyben, plusz bónuszok',
  description = 'Az ajánlott sorrend:' || E'\n' ||
    '1. Márkacsomag: hang + design system' || E'\n' ||
    '2. Design system alapozó' || E'\n' ||
    '3. Karusszel-gépezet' || E'\n' ||
    '4. A tartalomgép: a skillek egy láncba kötve (Karmester skill), tartalommátrix, kommentből vevő tölcsér, heti elemzés' || E'\n' ||
    E'\n' ||
    'Benne van a témák összes zsebcsomagja is.' || E'\n' ||
    E'\n' ||
    'Bónusz, csak a Skill modulban:' || E'\n' ||
    '• Saját klón: a saját hangod és avatárod rövid, ismétlődő videókhoz' || E'\n' ||
    '• Videó skill: mozgó grafikás Reels a saját design systemedből, felvétel nélkül' || E'\n' ||
    '• Bővített design system: kész elemek (felirat-doboz, matrica, ár-kártya, záró kártya…), amiket minden skill ugyanúgy használ' || E'\n' ||
    '• Saját skill: amit háromszor elmagyaráztál Claude-nak, abból skill lesz' || E'\n' ||
    E'\n' ||
    'A videós anyagok (Vágóskill, Fotobump) külön csomagban érhetők el.'
where slug = 'skill-modul';

-- ── Videó modul: a videós témák (Reels és vágás, Fotóból videó) skill-anyagai és fizetős zsebcsomagjai egyben ──
-- Az ár még nincs megadva: „Hamarosan”, amíg az adminban be nem állítod az árat és ki nem kapcsolod a „Hamarosan”-t.
insert into public.courses (slug, title, subtitle, teaser, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order)
values ('video-modul', 'Videó modul',
  'Skillek, tippek, trükkök egyben, hogy a videód célba érjen',
  'A videós skill-anyagok és zsebcsomagok egy csomagban: vágás a saját stílusodban, fotókból videó, horgok és borítók – hogy a videód célba érjen.',
  'Benne van:' || E'\n' ||
    '• Vágóskill – Reels-vágás a saját vágási stílusodban' || E'\n' ||
    '• Fotobump – fotókból videó, sorozat, sablonok, heti rutin' || E'\n' ||
    '• a videós témák összes zsebcsomagja (Reels-vágás, Hook-csomag, Fotóból videó)',
  'Claude', 'Haladó kezdő', null, true, true, true, 410)
on conflict (slug) do nothing;

update public.courses m set bundle_course_ids = coalesce((
  select array_agg(c.id order by (c.pocket_for is not null), c.sort_order)
  from public.courses c
  where c.slug in ('reels-vagas-claude-dal', 'fotobump-skill')
     or (coalesce(c.price_huf, 0) > 0 and c.pocket_for in (select id from public.courses where slug in ('reels-vagas-claude-dal', 'fotobump-skill')))
), '{}')
where m.slug = 'video-modul';
