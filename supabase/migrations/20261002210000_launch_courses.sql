-- „Csak tagsággal” kurzusok: price_huf = null (külön nem vásárolható).
alter table public.courses alter column price_huf drop not null;

-- Induló kurzuscsomag (andormarcsi.hu oktatási felület – témák, eszközök, árak, 2026. okt.)
-- Mind „Hamarosan” állapotban. A régi mintakurzusok vázlatba kerülnek (az adminban törölhetők).
update public.courses set published = false, coming_soon = false, sort_order = 900 + sort_order, title = '[MINTA] ' || title
where slug in ('canva-gyorstalpalo', 'claude-alapok', 'instagram-sabloncsomag', 'polyos-videosorozat', 'hirdeteskezeles-ai')
  and title not like '[MINTA]%';

insert into public.courses (slug, title, subtitle, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order) values
  ('canva-kalauz', 'Canva Kalauz', 'Canva vállalkozóknak – saját sablonkészlettel',
   'Saját sablonkészlet a saját arculatoddal: 10 social poszt, story és borítókép. 60–90 perc videó + sablonok.',
   'Canva', 'Kezdő', 14900, true, true, true, 10),
  ('claude-alapozo', 'Claude Alapozó', 'Claude a mindennapi munkában',
   'Projekt a saját cégedre: ajánlatírás, e-mailek, posztszövegek a saját hangodon. 2–3 óra videó + promptkönyvtár.',
   'Claude', 'Kezdő', 24900, true, true, true, 20),
  ('ai-kepgeneralas-hirdetesekhez', 'AI képgenerálás hirdetésekhez', 'Referenciaképből kész hirdetési kreatív',
   'Referenciaképből készült, feliratozott hirdetési kreatívok Seedream / Higgsfield és GPT-image segítségével.',
   'AI kép', 'Haladó kezdő', null, true, true, true, 30),
  ('social-kreativ-boost', 'Social kreatív, ami boostolva is működik', '4:5 kreatív, boostolásra készen',
   '4:5 arányú kreatív négyzetes biztonsági zónával, ami boostolva is jól működik.',
   'Social', 'Haladó kezdő', null, true, true, true, 40),
  ('hirdetesi-alapok', 'Hirdetési alapok', 'Meta boost és Google Ads',
   'Egy beállított, kis költségvetésű kampány a saját vállalkozásodra – lépésről lépésre, előre felvett videókban.',
   'Hirdetés', 'Kezdő', null, true, true, true, 50),
  ('kis-eszkozok-ai-jal', 'Kis eszközök AI-jal', 'Kalkulátor vagy landing oldal Claude-dal',
   'Egy működő kalkulátor vagy landing oldal, amit Claude-dal építesz meg.',
   'AI eszközök', 'Haladó', null, true, true, true, 60),
  ('rendszerben-mukodo-vallalkozas', 'Rendszerben működő vállalkozás', 'Űrlap → CRM → feladat → e-mail',
   'Automatizált folyamat: űrlapból CRM, feladat és e-mail – a PolyOS-szel.',
   'PolyOS', 'Haladó', null, true, true, true, 70)
on conflict (slug) do nothing;
