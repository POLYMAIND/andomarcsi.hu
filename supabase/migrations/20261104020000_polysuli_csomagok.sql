-- PolySuli értéklétra az oktatási terv szerint: ingyenes anyag (0 Ft) → zsebkurzus (990 Ft) → tanfolyam → előfizetés.
-- Az ingyenes anyagok és a zsebkurzusok is letölthető csomagok egy tanfolyam alatt (pocket_for): 0 Ft = ingyenes anyag
-- (belépéssel letölthető), 990 Ft = zsebkurzus. A letöltési linket az adminban kell megadni, utána „Elérhető”-re állítani.

-- ── Zsebkurzusok a terv táblája szerint ──
update public.courses set title = 'Zsebkurzus: Reels-vágás',
  subtitle = 'Vágási skill, felirat- és borítópromptok, „render előtt” ellenőrzőlista',
  teaser = 'A Reels-vágás tanfolyam teljes promptcsomagja: vágási skill, felirat- és borítópromptok és a „render előtt” ellenőrzőlista, telepítési leírással.',
  academy_keyword = 'EDIT'
where slug = 'zseb-reels-vagas-claude-dal';

update public.courses set title = 'Zsebkurzus: Márkahang',
  subtitle = 'Skill-sablon + kitöltő kérdéssor',
  teaser = 'Egy skill, ami a te hangodon ír: skill-sablon és kitöltő kérdéssor, telepítési leírással.',
  academy_keyword = 'HANG'
where slug = 'zseb-tartalombomba-claude-dal';

update public.courses set title = 'Zsebkurzus: Design system',
  subtitle = 'Sablon + kitöltő kérdéssor',
  teaser = 'A saját design systemed Claude-ban: sablon és kitöltő kérdéssor – erre épül a karusszel skill.',
  academy_keyword = 'KARUSSZEL'
where slug = 'zseb-karusszel-skill-workshop';

-- A terv nem tartalmazza: vázlatba kerülnek (az adminban visszakapcsolhatók).
update public.courses set published = false where slug in ('zseb-claude-alapozo', 'zseb-claude-celok-heti-terv');

-- Új zsebkurzusok és az ingyenes anyagok
insert into public.courses (slug, title, subtitle, teaser, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order,
                            academy_level, academy_tag, academy_keyword, pocket_for)
select v.slug, v.title, v.subtitle, v.teaser,
       case when v.price = 0
         then 'Ingyenes anyag – belépés (ingyenes regisztráció) után azonnal letöltheted.' || E'\n\n' || 'Ha tetszik, a következő lépés a zsebkurzus, utána a teljes tanfolyam.'
         else 'Mit kapsz?' || E'\n' || '• ' || v.subtitle || E'\n' || '• telepítési leírást lépésről lépésre' || E'\n' || '• előtte–utána példát minden prompt mellé' || E'\n\n' || 'Ha a teljes folyamatot videón is végignéznéd, válaszd a teljes tanfolyamot.'
       end,
       'Claude', p.level, v.price, true, true, true, p.sort_order + v.ord,
       p.academy_level, case when v.price = 0 then 'Ingyenes anyag' else 'Zsebkurzus' end, v.kw, p.id
from (values
  -- zsebkurzusok (990 Ft)
  ('zseb-skill-iro', 'Zsebkurzus: Skill-író', 'Skill-sablon, „mi kell egy jó skillbe” keret, 5 kész minta-skill',
   'Írd meg a saját skilljeidet: sablon, ellenőrző keret és 5 kész minta-skill, telepítési leírással.', 990, 'SKILL', 'claude-alapozo', 1002),
  ('zseb-horogcsomag', 'Zsebkurzus: Horogcsomag', '100 horog kkv-knak témák szerint + horogíró prompt',
   '100 kipróbált horog kis- és középvállalkozásoknak, témák szerint, és egy prompt, ami a te témádra ír újakat.', 990, 'HOOK', 'reels-vagas-claude-dal', 1002),
  ('zseb-fotobump', 'Zsebkurzus: Fotobump', 'Fotóból videó skill',
   'Felvétel nélkül, a saját fotóidból Reels a szöveg ütemére vágva – azoknak, akik nem állnak kamera elé.', 990, 'FOTO', 'reels-vagas-claude-dal', 1003),
  -- ingyenes anyagok (0 Ft)
  ('ingyenes-reels-vagas-utmutato', 'Ingyenes: Reels-vágás Claude-dal útmutató', 'Így vágok Reelst Claude-dal – útmutató',
   'Az útmutató, amiből kiderül, hogyan vágja Claude a Reelsedet. Ingyenes, belépés után letöltheted.', 0, 'EDIT', 'reels-vagas-claude-dal', 500),
  ('ingyenes-100-horog', 'Ingyenes: 100 horog kkv-knak', '100 horog témák szerint',
   'Száz kipróbált horog kis- és középvállalkozásoknak, témák szerint. Ingyenes, belépés után letöltheted.', 0, 'HOOK', 'reels-vagas-claude-dal', 501),
  ('ingyenes-skill-utmutato', 'Ingyenes: Skill-útmutató', 'Mi az a skill, és hogyan írj egyet',
   'Rövid útmutató arról, mi az a skill, mire jó, és hogyan írod meg az elsőt. Ingyenes, belépés után letöltheted.', 0, 'SKILL', 'claude-alapozo', 500),
  ('ingyenes-heti-terv', 'Ingyenes: Felnőtt matricás tábla és Káoszmanager', 'Heti terv és káoszkezelés PDF-ben',
   'Felnőtt matricás tábla és Káoszmanager PDF a heti tervezéshez. Ingyenes, belépés után letöltheted.', 0, 'TERV', 'claude-celok-heti-terv', 500),
  ('ingyenes-markahang-kerdessor', 'Ingyenes: Márkahang-kérdéssor', 'A kérdések, amikből Claude megtanulja a hangodat',
   'A kérdéssor, amit ha kitöltesz, Claude a te hangodon ír. Ingyenes, belépés után letöltheted.', 0, 'HANG', 'tartalombomba-claude-dal', 500),
  ('ingyenes-design-system-sablon', 'Ingyenes: Design system sablon', 'Színek, fontok, elemek egy helyen',
   'Sablon a saját design systemedhez – a karusszel skill alapja. Ingyenes, belépés után letöltheted.', 0, 'KARUSSZEL', 'karusszel-skill-workshop', 500)
) as v(slug, title, subtitle, teaser, price, kw, parent, ord)
join public.courses p on p.slug = v.parent
on conflict (slug) do nothing;
