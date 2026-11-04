-- Polyakadémia: a Polymaind Claude-tudástára az andormarcsi.hu-n.
-- Háromszintű piramis (1. Claude a mindennapi munkában · 2. Saját munkafolyamatok és skillek · 3. Ügynökök),
-- belépő: Claude-piramis teszt a /polyakademia oldalon. A kurzusok POLYSULI jelvényt kapnak.
--   academy_level   – 1..3 = a piramis szintje; null = nem Polyakadémia-kurzus
--   academy_tag     – rövid címke a kártyán (pl. „Itt kezdj”, „CRM”, „Élő workshop”)
--   academy_keyword – Instagram-kulcsszó a 990 Ft-os zsebcsomaghoz (kommenteld: CLAUDE)
alter table public.courses add column if not exists academy_level smallint check (academy_level between 1 and 3);
alter table public.courses add column if not exists academy_tag text not null default '';
alter table public.courses add column if not exists academy_keyword text not null default '';
create index if not exists courses_academy_idx on public.courses (academy_level, sort_order) where academy_level is not null;

-- ── A meglévő Claude-kurzusok beolvadnak (slug, ár, hozzáférések maradnak) ──
update public.courses set
  academy_level = 1, academy_tag = 'Itt kezdj', academy_keyword = 'CLAUDE', tool = 'Claude', level = 'Kezdő', sort_order = 101,
  subtitle = 'Alapkurzus: Claude az első héten',
  teaser = 'Már használtad, de még csak kérdezgetsz tőle? Egy hét múlva Claude ismeri a céged, a te hangodon ír, és megvan az első skilled.',
  outcome = 'Lesz egy Claude-projekted a cégedről, telepített kész skilljeid, egy stílusleírásod a saját hangodról és egy saját skilled.'
where slug = 'claude-alapozo';

update public.courses set
  academy_level = 3, academy_tag = 'Saját appok', tool = 'Claude', level = 'Haladó', sort_order = 303,
  title = 'Az első appod vibe codinggal',
  subtitle = 'Kalkulátor, landing oldal vagy kis app – Claude-dal',
  teaser = 'Egy működő kis eszköz – kalkulátor, landing oldal vagy saját app –, amit Claude-dal építesz meg, programozói tudás nélkül.'
where slug = 'kis-eszkozok-ai-jal';

-- ── Új Polyakadémia-kurzusok (mind „Hamarosan”, tagsággal érhetők el) ──
insert into public.courses (slug, title, subtitle, teaser, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order, academy_level, academy_tag, academy_keyword) values
  -- 1. szint · Claude a mindennapi munkában
  ('claude-celok-heti-terv', 'Célok és heti terv Claude-dal', 'A tematika készül', '', 'Claude', 'Kezdő', null, true, true, true, 102, 1, 'Naptár modul', 'TERV'),
  ('claude-ajanlat-szerzodes', 'Ajánlat és szerződés Claude-dal', 'A tematika készül', '', 'Claude', 'Kezdő', null, true, true, true, 103, 1, 'Dokumentumok', ''),
  ('claude-hirleveliras', 'Hírlevélírás Claude-dal', 'A tematika készül', '', 'Claude', 'Kezdő', null, true, true, true, 104, 1, 'Hírlevél modul', ''),
  ('claude-foglalasi-uzenetek', 'Foglalási üzenetek Claude-dal', 'A tematika készül', '', 'Claude', 'Kezdő', null, true, true, true, 105, 1, 'Foglalás modul', ''),
  -- 2. szint · Saját munkafolyamatok és skillek
  ('reels-vagas-claude-dal', 'Reels-vágás Claude-dal', 'Nyers felvételből kész Reels, vágási skillel',
   'Mit vegyél fel, hogyan legyen horog az első képkockán, és hogyan vágja Claude a skilleddel – felirattal, borítóval, render előtti ellenőrzéssel.',
   'Claude', 'Haladó kezdő', null, true, true, true, 201, 2, '1. modul', 'EDIT'),
  ('tartalombomba-claude-dal', 'Tartalombomba Claude-dal', 'Egy ülésben egy heti adag tartalom',
   'Márkahang skill, tartalommátrix és elemzés a saját számaidból: Claude abból ír, ami nálad már bevált.',
   'Claude', 'Haladó kezdő', null, true, true, true, 202, 2, 'Új', 'HANG'),
  ('karusszel-skill-workshop', 'Karusszel skill + workshop', 'Design system és karusszel skill – élő workshoppal',
   'Saját design system Claude-dal, erre épülő karusszel skill, ami témából kész diákat ad – 4:5-ben, biztonsági zónával.',
   'Claude', 'Haladó kezdő', null, true, true, true, 203, 2, 'Élő workshop', 'KARUSSZEL'),
  ('claude-kampanytervezes', 'Kampánytervezés Claude-dal', 'A tematika készül', '', 'Claude', 'Haladó kezdő', null, true, true, true, 204, 2, 'Kampány modul', ''),
  ('claude-ugyfelkovetes', 'Ügyfélkövetés Claude-dal', 'A tematika készül', '', 'Claude', 'Haladó kezdő', null, true, true, true, 205, 2, 'CRM', ''),
  ('delegalj-claude-nak', 'Delegálj Claude-nak', 'A tematika készül', '', 'Claude', 'Haladó kezdő', null, true, true, true, 206, 2, 'Feladatok', ''),
  ('claude-penzugyi-attekintes', 'Pénzügyi áttekintés Claude-dal', 'A tematika készül', '', 'Claude', 'Haladó kezdő', null, true, true, true, 207, 2, 'Cashflow', ''),
  ('claude-kvizkeszites', 'Kvízkészítés Claude-dal', 'A tematika készül', '', 'Claude', 'Haladó kezdő', null, true, true, true, 208, 2, 'Quizzio', ''),
  ('claude-projekt-a-cegedrol', 'Claude-projekt a cégedről', 'A tematika készül', '', 'Claude', 'Haladó kezdő', null, true, true, true, 209, 2, 'AI Chatbot', ''),
  -- 3. szint · Ügynökök
  ('claude-elso-automatizacio', 'Az első automatizációd Claude-dal', 'A tematika készül', '', 'Claude', 'Haladó', null, true, true, true, 301, 3, 'AI Workflow Builder', ''),
  ('claude-ugynokok-epitese', 'Ügynökök építése', 'A tematika készül', '', 'Claude', 'Haladó', null, true, true, true, 302, 3, 'AI Ügynökök', '')
on conflict (slug) do nothing;

-- ── Leckék a kész tematikájú kurzusokhoz (csak ha még nincs leckéjük) ──
insert into public.lessons (course_id, title, description, sort_order)
select c.id, v.title, v.descr, v.ord from public.courses c,
  (values
    (1, 'Projekt a cégedről', 'Claude ismeri a céged, nem kell mindig elmagyarázni.'),
    (2, 'Kész skill telepítése', 'Pár kattintás, és Claude a bevált skilljeinkkel dolgozik – nem neked kell promptot írni.'),
    (3, 'A saját hangod', 'Stílusleírás, hogy ne „AI-szagú” szöveget írjon.'),
    (4, 'Az első skilled', 'Amit nem írsz le, azt mindig te csinálod.')
  ) as v(ord, title, descr)
where c.slug = 'claude-alapozo' and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.lessons (course_id, title, description, sort_order)
select c.id, v.title, v.descr, v.ord from public.courses c,
  (values
    (1, 'A nyers felvételek', 'Mit vegyél fel, hogy legyen miből vágni.'),
    (2, 'Horog az első képkockán', 'Horog, beragasztó, tartalom, újrahorog, CTA.'),
    (3, 'Vágás skillel', 'A vágási skill telepítése és futtatása.'),
    (4, 'Felirat és borító', 'A mentett, megosztott Reels két titka.'),
    (5, 'Render előtt', 'Ellenőrzőlista, hogy ne kelljen újrarenderelni.'),
    (6, 'Vágóskill inspirációból', 'A tetsző videó stíluselemeiből saját vágási stílus. A stílust tanulod el, a tartalom a tiéd.'),
    (7, 'Fotobump: fotókból videó', 'Felvétel nélkül, a saját fotóidból, a szöveg ütemére vágva.')
  ) as v(ord, title, descr)
where c.slug = 'reels-vagas-claude-dal' and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.lessons (course_id, title, description, sort_order)
select c.id, v.title, v.descr, v.ord from public.courses c,
  (values
    (1, 'Márkahang skill', 'Egy skill, ami a te hangodon ír.'),
    (2, 'Tartalommátrix', 'Termék × formátum × szerep tábla – ebből jön a heti ötletlista.'),
    (3, 'Elemzés a saját számaidból', 'Claude kiolvassa, melyik posztod hozott mentést, kommentet, DM-et.'),
    (4, 'Elemzés alapú tartalombomba', 'Egy ülésben egy heti adag tartalom abból, ami nálad bevált.')
  ) as v(ord, title, descr)
where c.slug = 'tartalombomba-claude-dal' and not exists (select 1 from public.lessons l where l.course_id = c.id);

insert into public.lessons (course_id, title, description, sort_order)
select c.id, v.title, v.descr, v.ord from public.courses c,
  (values
    (1, 'Design system Claude-dal', 'Saját színek, fontok, elemek, diaelrendezések egy helyen. Ez a belépés feltétele.'),
    (2, 'Karusszel-szerkezet', 'Hook-dia, tartalom, záródia kulcsszóval.'),
    (3, 'Karusszel skill', 'A design systemre épülő skill, ami témából kész diákat ad.'),
    (4, 'Biztonsági zóna és export', '4:5 méret, a szöveg négyzetes zónában, hogy boostolva is jó legyen.')
  ) as v(ord, title, descr)
where c.slug = 'karusszel-skill-workshop' and not exists (select 1 from public.lessons l where l.course_id = c.id);

-- ── Árak (PolySuli árlista, bruttó; alanyi adómentes) ──
--   nagy tanfolyam 19 990 Ft · kis tanfolyam 5 990 Ft · zsebkurzus 990 Ft (Instagram-kulcsszóval) · előfizetés 10 990 Ft/hó
-- Mind benne van az előfizetésben. Az adminban kurzusonként átírható.
update public.courses set price_huf = 19990, price_note = '', included_in_subscription = true
where slug in ('claude-alapozo', 'reels-vagas-claude-dal', 'tartalombomba-claude-dal', 'karusszel-skill-workshop',
               'claude-elso-automatizacio', 'claude-ugynokok-epitese', 'kis-eszkozok-ai-jal');
update public.courses set price_huf = 5990, price_note = '', included_in_subscription = true
where academy_level is not null
  and slug not in ('claude-alapozo', 'reels-vagas-claude-dal', 'tartalombomba-claude-dal', 'karusszel-skill-workshop',
                   'claude-elso-automatizacio', 'claude-ugynokok-epitese', 'kis-eszkozok-ai-jal');
