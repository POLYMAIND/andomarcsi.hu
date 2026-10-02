-- Canva Kalauz: 3 × max. 60 perces videómodul tematikája (felépítés: rövid bemutató,
-- közös gyakorlás, saját mini feladat). A blokkok videóleckék; a YouTube-linkeket az adminban kell megadni.

update public.courses set
  title = 'Canva Kalauz 1. – Kezdők, mint egy gyerek',
  subtitle = '60 perces videómodul · a végére kész posztod lesz',
  description = 'Cél: ne félj a felülettől, és a végére legyen egy kész posztod. Belépés és kezdőlap, a szerkesztő bal oldala, képek feltöltése és szerkesztése, majd közösen elkészítünk egy Instagram-posztot sablonból, és megnézzük a mentést és letöltést.

Házi feladat: még 2 poszt ugyanabból a sablonból, más képpel.'
where slug = 'canva-kalauz-1';

update public.courses set
  title = 'Canva Kalauz 2. – Grafikai alapok',
  subtitle = '60 perces videómodul · ne csak kitöltsd a sablont, értsd is',
  description = 'Cél: ne csak kitöltsd a sablont, hanem értsd, miért jó vagy rossz egy kép. Grafikai alapok (hierarchia, kontraszt, igazítás, levegő, betűk és színek), Brand Kit, szórólap nyomdakészen, képszerkesztés (háttéreltávolítás, Magic Eraser, Magic Edit, Magic Expand, Grab Text) és méretváltás.

Házi feladat: saját szórólap, és ugyanaz poszt méretben is.'
where slug = 'canva-kalauz-2';

update public.courses set
  title = 'Canva Kalauz 3. – Extra funkciók és AI',
  subtitle = '60 perces videómodul · a Canva már nem csak grafikai eszköz',
  description = 'Cél: megmutatni, hogy a Canva már nem csak grafikai eszköz. Egyoldalas weboldal (landing) Canva Websites-szal, a jó landing logikája, a Canva AI-eszközei (Magic Write, képgenerálás, Magic Design, Magic Media, AI asszisztens), hasznos appok, és a Canva összekötése AI asszisztensekkel (pl. Claude, ChatGPT).'
where slug = 'canva-kalauz-3';

update public.courses set
  subtitle = '3 × 60 perces videómodul + sablonok',
  description = 'Mindhárom Canva Kalauz modul egyben. 1. Kezdők, mint egy gyerek: az első kész posztod. 2. Grafikai alapok: Brand Kit, szórólap, képszerkesztés. 3. Extra funkciók és AI: weboldal, AI-eszközök, appok. Minden modul ugyanígy épül fel: rövid bemutató, közös gyakorlás, majd egy saját mini feladat.'
where slug = 'canva-kalauz';

insert into public.lessons (course_id, title, description, duration_min, sort_order)
select c.id, l.title, l.descr, l.dur, l.ord
from public.courses c
join (values
  ('canva-kalauz-1', 1, 'Bevezető: mire használd a Canvát?', 'Mit fogsz megtanulni ebben a modulban, és mire jó a Canva a vállalkozásodban.', 5),
  ('canva-kalauz-1', 2, 'Belépés és kezdőlap', 'Regisztráció és belépés, kezdőlap, „Tervezés létrehozása”, méretek (poszt, story, A4), Projektek mappa.', 10),
  ('canva-kalauz-1', 3, 'A szerkesztő bal oldala', 'Sablonok, Elemek (formák, ikonok, matricák, fotók), Szöveg, Feltöltések (saját képek, logó), Projektek.', 10),
  ('canva-kalauz-1', 4, 'Képek', 'Saját kép feltöltése és behúzása, csere sablonban, szűrők és beállítások (fényerő, kontraszt), vágás, áttetszőség.', 10),
  ('canva-kalauz-1', 5, 'Gyakorlat: saját Instagram-poszt sablonból', 'Szövegcsere, saját fotó, színcsere, lépésről lépésre együtt.', 15),
  ('canva-kalauz-1', 6, 'Mentés, letöltés, megosztás', 'Automatikus mentés, letöltés (PNG/JPG/PDF), megosztás link alapján. Házi feladat: még 2 poszt ugyanabból a sablonból, más képpel.', 10),
  ('canva-kalauz-2', 1, 'Házi feladat-példák: mi működik és mi nem', 'Néhány elkészült poszt átnézése: mitől jó és mitől gyenge egy kép.', 5),
  ('canva-kalauz-2', 2, 'Grafikai alapok', 'Hierarchia (headline, subheadline, body, CTA), kontraszt, igazítás segédvonalakkal, levegő és margó, max. 2 betűtípus és 3 szín.', 15),
  ('canva-kalauz-2', 3, 'Brand Kit', 'Logó, színek és betűtípusok beállítása, hogy minden anyagod egységes legyen.', 10),
  ('canva-kalauz-2', 4, 'Szórólap A5/A4-ben', 'Nulláról vagy félkész sablonból: headline, 3 előny, kép, CTA, elérhetőség. Nyomdai letöltés (PDF Print, kifutó, vágójel).', 15),
  ('canva-kalauz-2', 5, 'Képszerkesztés', 'Háttéreltávolítás, kép a szövegben (keret), Magic Eraser és Magic Edit, kép kiterjesztése (Magic Expand), Grab Text.', 10),
  ('canva-kalauz-2', 6, 'Méretváltás', 'Egy anyag átméretezése posztra, storyba, bannerbe (Resize / Magic Switch). Házi feladat: saját szórólap, és ugyanaz poszt méretben is.', 5),
  ('canva-kalauz-3', 1, 'Weboldal / landing Canvával', 'Canva Websites: egyoldalas landing sablonból, menü, gombok és linkek, mobilnézet, közzététel (ingyenes vagy saját domain).', 15),
  ('canva-kalauz-3', 2, 'Mitől jó egy landing?', 'Ígéret, bizonyíték, ajánlat, CTA. Gyakorlat: a saját ajánlatod felrakása.', 10),
  ('canva-kalauz-3', 3, 'AI eszközök a Canvában', 'Magic Write (szöveg), képgenerálás, Magic Design (tervből sablon), Magic Media / videó, Canva AI asszisztens, prezentáció promptból.', 15),
  ('canva-kalauz-3', 4, 'Appok', 'Az Apps menü: QR-kód, mockupok, diagramok, fordítás stb. Hogyan keress és telepíts appokat.', 10),
  ('canva-kalauz-3', 5, 'Canva + AI asszisztensek', 'A Canva összekötése AI asszisztensekkel (pl. Claude, ChatGPT): egy chatből készül a Canva-tervezet, amit aztán kézzel finomítunk.', 7),
  ('canva-kalauz-3', 6, 'Zárás: melyik funkció hozza a legtöbb időt?', 'Összefoglaló és hasznos linkek.', 3)
) as l(slug, ord, title, descr, dur) on l.slug = c.slug
where not exists (select 1 from public.lessons x where x.course_id = c.id);
