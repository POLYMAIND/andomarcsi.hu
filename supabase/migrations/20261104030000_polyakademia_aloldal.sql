-- Polyakadémia aloldal (2026. nov. 4-i szöveg szerint): lépcsőház
--   0. ingyenes kóstoló 0 Ft · 1. zsebcsomag 990 Ft · 2. skill-anyag 9 990 Ft · 3. Skill modul egyben 39 900 Ft
--   3+. havidíjas tagság 19 900 Ft/hó (kódban: SUBSCRIPTION) · 4. mentorprogram 249 000 Ft (jelentkezéssel)
-- skill_material: 1–6 = a hat skill-anyag sorszáma az aloldalon; null = egyéb kurzus.
alter table public.courses add column if not exists skill_material smallint check (skill_material between 1 and 6);

-- ── A hat skill-anyag ──
-- Meglévő tanfolyamok: Karusszel (2.) és a Reels-vágás → Vágóskill (5.). A slug és a hozzáférések maradnak.
update public.courses set title = 'Karusszel skill', skill_material = 2, academy_tag = 'Skill-anyag',
  subtitle = 'Témától a kész diákig, a saját designodban',
  teaser = 'Témától a kész diákig, a saját designodban. Boostolásra is figyelve: a szöveg ott lesz, ahol a négyzetes megjelenés sem vágja le. Előfeltétele a Design system alapozó.'
where slug = 'karusszel-skill-workshop';

update public.courses set title = 'Vágóskill', skill_material = 5, academy_tag = 'Skill-anyag',
  subtitle = 'Reels-vágás a saját vágási stílusodban',
  teaser = 'Megtanítod az AI-nak a saját vágási stílusodat, a saját nyers anyagaidból. Nem mások videóit másoljuk, hanem a te stílusodat gépesítjük.'
where slug = 'reels-vagas-claude-dal';

insert into public.courses (slug, title, subtitle, teaser, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order,
                            academy_level, academy_tag, academy_keyword, skill_material) values
  ('design-system-alapozo', 'Design system alapozó', 'Színek, betűk, rácsok, ismétlődő elemek egy helyen',
   'Színek, betűk, rácsok, ismétlődő elemek egy helyen. Ez a „ne nézzen ki minden posztod más cég posztjának” anyag. A Karusszel skill előfeltétele.',
   'Claude', 'Haladó kezdő', 9990, true, true, true, 211, 2, 'Skill-anyag', 'KARUSSZEL', 1),
  ('markahang-skill', 'Márkahang skill', 'Kérdéssor, mintaszövegek, tiltólista, hangnem csatornánként',
   'Kérdéssor, mintaszövegek, tiltólista, hangnem csatornánként. Erre épül minden más.',
   'Claude', 'Haladó kezdő', 9990, true, true, true, 212, 2, 'Skill-anyag', 'HANG', 3),
  ('fotobump-skill', 'Fotobump – fotókból videó', 'Válogatás, mozgás, ütemre vágás, felirat',
   'A telefonodon porosodó fotókból rövid videó: válogatás, mozgás, ütemre vágás, felirat.',
   'Claude', 'Haladó kezdő', 9990, true, true, true, 213, 2, 'Skill-anyag', 'FOTO', 4),
  ('urlap-ai-elominosites', 'Űrlap → táblázat → AI-előminősítés', 'Kérdőív a weboldaladra, válaszok Google Sheetbe, AI-előminősítés',
   'Részletes kérdőív a weboldaladra, a válaszok Google Sheetbe mennek, az AI pedig megmondja, kivel érdemes beszélned először. Mint egy recepciós, aki sosem megy ebédszünetre.',
   'Claude', 'Haladó', 9990, true, true, true, 304, 3, 'Skill-anyag', '', 6)
on conflict (slug) do nothing;

-- ── Bónuszanyagok: csak a Skill modulban érhetők el ──
insert into public.courses (slug, title, subtitle, teaser, tool, level, price_huf, price_note, included_in_subscription, published, coming_soon, sort_order) values
  ('bonusz-ai-munkakornyezet', 'Bónusz: AI-munkakörnyezet beállítása', 'Claude, projektek, skillek',
   'A Claude, a projektek és a skillek beállítása lépésről lépésre – ezzel indul a Skill modul.', 'Claude', 'Kezdő', null, 'Csak a Skill modulban', true, true, true, 401),
  ('bonusz-tartalomtervezes', 'Bónusz: tartalomtervezés elemzés alapján', 'A saját számaidból a következő heti tartalom',
   'Tartalomtervezés abból, ami nálad már bevált: elemzés a saját számaidból.', 'Claude', 'Haladó kezdő', null, 'Csak a Skill modulban', true, true, true, 402),
  ('bonusz-heti-rutin', 'Bónusz: heti rutin és mérés', 'Hogy ne csak egyszer legyen lendületed',
   'Heti rutin és mérés, hogy a skillek hétről hétre dolgozzanak – ne csak egyszer legyen lendületed.', 'Claude', 'Haladó kezdő', null, 'Csak a Skill modulban', true, true, true, 403)
on conflict (slug) do nothing;

-- ── Skill modul egyben: a hat anyag + három bónusz, ajánlott sorrendben (a csomag a sorrendet a tömbből veszi) ──
insert into public.courses (slug, title, subtitle, teaser, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order)
values ('skill-modul', 'Skill modul egyben', 'Mind a 6 skill-anyag + bónuszok, ajánlott sorrendben',
  'Mind a hat skill-anyag egy csomagban, ajánlott sorrendben, plusz bónuszok, amik csak itt érhetők el. Külön 59 940 Ft lenne.',
  'Az ajánlott sorrend:' || E'\n' ||
  '1. Bónusz: AI-munkakörnyezet beállítása (Claude, projektek, skillek)' || E'\n' ||
  '2. Márkahang skill' || E'\n' || '3. Design system alapozó' || E'\n' ||
  '4. Bónusz: tartalomtervezés elemzés alapján' || E'\n' || '5. Karusszel skill' || E'\n' ||
  '6. Fotobump és vágóskill' || E'\n' || '7. Űrlap → táblázat → AI-előminősítés' || E'\n' ||
  '8. Bónusz: heti rutin és mérés – hogy ne csak egyszer legyen lendületed',
  'Claude', 'Haladó kezdő', 39900, true, true, true, 400)
on conflict (slug) do nothing;

update public.courses m set bundle_course_ids = (
  select array_agg(c.id order by o.ord)
  from unnest(array['bonusz-ai-munkakornyezet', 'markahang-skill', 'design-system-alapozo', 'bonusz-tartalomtervezes',
                    'karusszel-skill-workshop', 'fotobump-skill', 'reels-vagas-claude-dal', 'urlap-ai-elominosites', 'bonusz-heti-rutin'])
       with ordinality as o(slug, ord)
  join public.courses c on c.slug = o.slug
)
where m.slug = 'skill-modul';

-- ── Árak: minden Polyakadémia-tanfolyam 9 990 Ft / anyag (a csomagok kivételével) ──
update public.courses set price_huf = 9990, price_note = ''
where academy_level is not null and pocket_for is null;

-- ── Zsebcsomagok a szöveg szerint (990 Ft-ot levonunk, ha utána a hozzá tartozó anyagot is megveszi) ──
update public.courses z set pocket_for = p.id, academy_level = p.academy_level,
  title = 'Zsebkurzus: Márkahang', subtitle = 'Pár kérdés, és a skill megírja, hogyan beszél a márkád',
  teaser = 'Pár kérdés, és a skill megírja, hogyan beszél a márkád. Végre nem minden posztod kezdődik úgy, hogy „Izgatottan jelentjük be…”'
from public.courses p where z.slug = 'zseb-tartalombomba-claude-dal' and p.slug = 'markahang-skill';

update public.courses z set pocket_for = p.id, academy_level = p.academy_level,
  title = 'Zsebkurzus: Fotóból videó', subtitle = 'A telefonodon porosodó fotókból rövid videó, ütemre',
  teaser = 'A telefonodon porosodó fotókból rövid videó, ütemre – felvétel nélkül.'
from public.courses p where z.slug = 'zseb-fotobump' and p.slug = 'fotobump-skill';

update public.courses z set pocket_for = p.id, academy_level = p.academy_level
from public.courses p where z.slug in ('zseb-karusszel-skill-workshop', 'ingyenes-design-system-sablon') and p.slug = 'design-system-alapozo';

update public.courses z set pocket_for = p.id, academy_level = p.academy_level
from public.courses p where z.slug = 'ingyenes-markahang-kerdessor' and p.slug = 'markahang-skill';

update public.courses set title = 'Zsebkurzus: Hook-csomag', subtitle = 'Horoggyártó skill Reelshez és karusszelhez',
  teaser = 'Horoggyártó skill Reelshez és karusszelhez, mert az első 3 másodperc dönt. A többit a nézők már görgetés közben nem látják.'
where slug = 'zseb-horogcsomag';

insert into public.courses (slug, title, subtitle, teaser, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order,
                            academy_level, academy_tag, academy_keyword, pocket_for)
select 'zseb-karusszel-szovegiro', 'Zsebkurzus: Karusszel-szövegíró', 'Egy témából 7–10 diás karusszelszöveg, logikus ívvel',
  'Egy témából 7–10 diás karusszelszöveg, logikus ívvel – kész skill, egyoldalas használati útmutatóval.',
  'Mit kapsz?' || E'\n' || '• egy kész skillt, ami egy témából 7–10 diás karusszelszöveget ír' || E'\n' || '• egyoldalas használati útmutatót' || E'\n\n' ||
  'A 990 Ft-ot levonjuk, ha utána megveszed a Karusszel skill anyagot.',
  'Claude', p.level, 990, true, true, true, p.sort_order + 1004, p.academy_level, 'Zsebkurzus', '', p.id
from public.courses p where p.slug = 'karusszel-skill-workshop'
on conflict (slug) do nothing;

-- ── Mentorprogram-jelentkezések (249 000 Ft, 10 személyes alkalom) ──
create table if not exists public.mentor_applications (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  business text not null default '',
  user_id uuid references auth.users (id) on delete set null,
  consent_at timestamptz not null default now(),
  handled_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.mentor_applications enable row level security;
drop policy if exists "mentor: admin kezeli" on public.mentor_applications;
create policy "mentor: admin kezeli" on public.mentor_applications for all using (public.is_admin()) with check (public.is_admin());
