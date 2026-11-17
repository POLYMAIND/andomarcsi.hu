-- Skill modul: 19 990 Ft (az eredeti 39 900 Ft áthúzva), és a videós anyagok (Vágóskill, Fotobump) külön csomagok lesznek,
-- ezért ezek és a zsebcsomagjaik kikerülnek a modulból. Újrafuttatható.

-- A videós skill-anyagok és a hozzájuk tartozó zsebcsomagok ki a modulból (a sorrend marad)
update public.courses m set bundle_course_ids = coalesce(array(
  select x from unnest(m.bundle_course_ids) with ordinality as u(x, o)
  where x not in (
    select v.id from public.courses v where v.slug in ('reels-vagas-claude-dal', 'fotobump-skill')
    union
    select p.id from public.courses p join public.courses v on p.pocket_for = v.id where v.slug in ('reels-vagas-claude-dal', 'fotobump-skill')
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
    '4. Űrlap → táblázat → AI-előminősítés' || E'\n' ||
    '5. A tartalomgép: a skillek egy láncba kötve (Karmester skill), tartalommátrix, kommentből vevő tölcsér, heti elemzés' || E'\n' ||
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
