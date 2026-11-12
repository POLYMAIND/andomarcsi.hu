-- Ingyenes anyagok online, regisztrációhoz kötve.
-- 1) course_guides: az anyag szövege (Markdown) – CSAK belépett és jogosult felhasználó olvashatja (RLS).
-- 2) course_downloads: a letöltési link is csak belépett felhasználónak jön le (eddig a 0 Ft-os csomag linkje
--    belépés nélkül is lekérhető volt, mert a has_course_access ingyenes kurzusnál nem nézi az auth.uid()-t).
-- 3) A három ingyenes anyag tartalma + „Elérhető” állapot. Újrafuttatható.

create table if not exists public.course_guides (
  course_id uuid primary key references public.courses (id) on delete cascade,
  body_md text not null,
  updated_at timestamptz not null default now()
);
alter table public.course_guides enable row level security;
drop policy if exists "tananyag: admin kezeli" on public.course_guides;
create policy "tananyag: admin kezeli" on public.course_guides for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "tananyag: belépett jogosultnak" on public.course_guides;
create policy "tananyag: belépett jogosultnak" on public.course_guides for select
  using (auth.uid() is not null and public.has_course_access(course_id));

drop policy if exists "letöltés: csak jogosultaknak" on public.course_downloads;
create policy "letöltés: csak jogosultaknak" on public.course_downloads for select
  using (auth.uid() is not null and public.has_course_access(course_id));

-- ── Új ingyenes anyag: Saját videós design skill (Reels és vágás téma, a Vágóskill alá) ──
insert into public.courses (slug, title, subtitle, teaser, description, tool, level, price_huf, included_in_subscription, published, coming_soon, sort_order,
                            academy_level, academy_tag, academy_keyword, pocket_for)
select 'ingyenes-videos-design-skill', 'Ingyenes: Saját videós design skill Claude-dal', '', '', '',
       'Claude', p.level, 0, true, true, false, p.sort_order + 502,
       p.academy_level, 'Ingyenes anyag', '', p.id
from public.courses p where p.slug = 'reels-vagas-claude-dal'
on conflict (slug) do nothing;

-- ── Nyilvános leírás (ezt látja az is, aki még nem lépett be) ──
update public.courses set
  title = 'Ingyenes: Reels-vágás Claude-dal',
  subtitle = 'Nyers telefonos videóból kész Reels, vágóprogram nélkül',
  teaser = 'A nyers, telefonnal felvett beszélős videódból kész Reels lesz feliratokkal, effektekkel és hangokkal. Első alkalommal kb. 45–50 perc, utána kb. 5 perc a te munkád videónként.',
  description = 'Mit találsz benne?' || E'\n' ||
    '• mi kell hozzá (és mi nem: se CapCut, se vágóprogram)' || E'\n' ||
    '• design system építése a márkádhoz, bemásolható prompttal' || E'\n' ||
    '• 6 lépés a felvételtől a kész Reelsig, storyboard-jóváhagyással' || E'\n' ||
    '• így mented el skillnek, hogy legközelebb elég legyen egy mondat' || E'\n' ||
    '• hibaelhárító táblázat és puska az összes prompttal'
where slug = 'ingyenes-reels-vagas-utmutato';

update public.courses set
  subtitle = 'Arculat, vágási nyelvtan és kész SKILL.md a videóidhoz',
  teaser = 'Hogy a videóid ne úgy nézzenek ki, mint mindenki másé. Lépésről lépésre, bemásolható promptokkal és kész sablonnal – egy délután alatt.',
  description = 'Mit találsz benne?' || E'\n' ||
    '• miért kell skill, és mi van egy videós design skillben' || E'\n' ||
    '• 5 lépés: stílus, arculat, vágási nyelvtan, munkafolyamat, teszt' || E'\n' ||
    '• bemásolható promptok minden lépéshez' || E'\n' ||
    '• kész SKILL.md sablon, amit Claude kitölt a döntéseidből' || E'\n' ||
    '• 10 szabály, amitől menő lesz, és a gyakori hibák javítása'
where slug = 'ingyenes-videos-design-skill';

update public.courses set
  title = 'Ingyenes: Káoszmanager',
  subtitle = 'Hiperfókusz, napi egy cél és matricás heti tervező – nyomtatható lapokkal',
  teaser = 'Nem megjavítunk. Megmutatjuk, hogyan dolgozz együtt az agyaddal: hiperfókusz, azonnali jutalom, egyetlen napi cél és egy rakás matrica, amit tényleg kiérdemelsz.',
  description = 'Mit találsz benne?' || E'\n' ||
    '• útmutató: miért nem működik a hosszú lista, és mi működik helyette' || E'\n' ||
    '• a hiperfókusz előhívása 6 lépésben (és a fékje)' || E'\n' ||
    '• jutalomrendszer: matrica, heti nyeremény, dopaminmenü' || E'\n' ||
    '• nyomtatható lapok: matricás heti tervező, 40 vicces matrica, napi és heti értékelő, káoszkiürítő mindmap'
where slug = 'ingyenes-heti-terv';

update public.courses set coming_soon = false, starts_at = null, published = true
where slug in ('ingyenes-heti-terv', 'ingyenes-reels-vagas-utmutato', 'ingyenes-videos-design-skill');

-- ── Letöltés: csak a Káoszmanager nyomtatható lapjai (a többi anyag az oldalon olvasható) ──
insert into public.course_downloads (course_id, url, label, updated_at)
select c.id, 'https://drive.google.com/file/d/1GHlPpZgdbZjGX7fKC9wqUxURcZppor50/view', 'Nyomtatható lapok (PDF)', now()
from public.courses c where c.slug = 'ingyenes-heti-terv'
on conflict (course_id) do update set url = excluded.url, label = excluded.label, updated_at = now();

-- ── Tartalom ──
insert into public.course_guides (course_id, body_md, updated_at)
select c.id, v.body, now()
from (values
('ingyenes-reels-vagas-utmutato', $md$
## Mit tudsz a végére?

**Felveszed, jóváhagyod, kész.** A lecke végére a nyers videódból kész Reels lesz, úgy, hogy egyetlen vágóprogramot sem nyitsz meg. A munkát Claude csinálja. Te három dolgot csinálsz: felveszed, jóváhagyod, és ha kell, egy mondattal javíttatsz.

A mintavideó a Canva-workshopomról szóló Reels. Ennyi lett belőle:

- **99 → 91 mp** nyers felvételből kész videó
- **18** kivágott szünet
- **11** animált jelenet, hangeffektekkel
- **kb. 5 perc** a te munkád, a többi várakozás

Az első alkalommal kb. 45–50 perc a feltöltéstől a kész videóig. Főzz közben egy kávét. Ha ennyi időd nincs minden videóra, az oldal alján találsz egy rövidebb utat.

## Mi kell hozzá?

Három dolog, és egyik sem vágóprogram.

- **Claude**, olyan módban, ahol fájlokkal és kóddal is tud dolgozni. A vágást Claude a saját gépén, kódból csinálja, ezért egy sima csevegés kevés hozzá.
- **Egy nyers felvétel** a telefonodról. Álló, beszélős, 30 másodperc és 2 perc között. Az 1. lépésben leírom, mire figyelj felvételkor.
- **A márkád színei és betűi.** Nem kötelező. A legjobb, ha előtte építesz egy design systemet. Ha nincs rá időd, elég 2–3 szín és egy betűtípus.

Amire nincs szükség: CapCut, Premiere, vágóprogram, sablon, előfizetéses feliratozó app. És vágási tudás sem.

## Előtte: építs egy design systemet

A design system a márkád kézikönyve Claude-ban: a színek, a betűk, a formák és a hangnem egy helyen. Egyszer építed meg, és onnantól minden videó, poszt és dia abból készül. Nem kell minden alkalommal elmagyaráznod, milyen a márkád.

1. Gyűjtsd össze, ami van: a weboldalad címét, a logódat, 2–3 posztot, ami szerinted „nagyon te vagy”. Ha semmi nincs, az sem baj.
2. Kérd meg Claude-ot:

```prompt Design system
Építs nekem egy design systemet a márkámhoz. Itt a weboldalam: [cím], csatoltam a logómat és néhány posztomat. A hangulat három szóban: [pl. pimasz, közvetlen, vidám]. Ami biztosan NEM én vagyok: [pl. arany-fekete luxus, pasztell].
```

3. Nézd át, amit kapsz: színek, betűk, gombok, egy rövid leírás arról, mit szabad és mit nem. Amit nem érzel a tieidnek, írd meg egy mondattal: „A lila legyen sötétebb”, „Kevesebb kerekítés”.
4. Frissítheted bármikor. Ha később átírod, a következő videó már az újjal készül. Én is átírtam menet közben, és a skillhez sem kellett nyúlnom.

> **Tipp:** Ha ügyfeleknek is vágsz, mindegyiknek készíts külön design systemet. Utána csak annyit kell írnod: „Vágd meg ezt Reelsnek a [márka] arculatával.”

## 1. lépés: Vedd fel a nyers videót

Egy dolgod van: beszélj a kamerába. A vágást, a szüneteket és az „ööö”-ket Claude kiszedi.

1. Álló formátumban vegyél fel, akár az előlapi kamerával. Az arcod legyen a kép közepén, a fejed fölött és a vállad alatt maradjon egy kis hely: oda kerülnek a feliratok és a grafikák.
2. Csendes helyen vegyél fel. A feliratok a hangodból készülnek, és a zörejben elvesznek a szavak.
3. Mondj egy horgot az elején. Például: „Te is úgy nyitod meg a Canvát, mint egy idegen ország térképét?” Erre jön az első nagy effekt.
4. Ha elrontod, csak állj meg egy másodpercre, és mondd újra. A szünetet Claude kivágja. A rossz mondatot és az újrát is benne hagyja, ezért a storyboardnál szólj, ha az első változat törölhető.
5. A végén mondd ki, mit csináljon a néző: „Kövess be!”, „Regisztrálj az andormarcsi.hu-n!”. Ebből lesz a felhívás gombokkal.
6. Tartsd 2 perc alatt. Hosszabb videónál minden lépés arányosan tovább tart.

## 2. lépés: Töltsd fel, és mondd meg, mit kérsz

Húzd be a videót a Claude-ablakba, és írd mellé a kérést. Az első alkalommal ezt a hosszabb promptot használd, mert Claude még nem tudja, hogyan dolgozol:

```prompt Első videó
Ez egy nyers, álló, beszélős videó. Vágd meg Instagram Reelsnek:
- készíts szószintű magyar leiratot a hangomból,
- vágd ki a szüneteket,
- legyenek szavanként felvillanó feliratok, az épp kimondott szó kiemelve,
- a fontos mondatokhoz tegyél animált grafikákat és hangeffekteket,
- a márkám színei és betűi: [ide írd, vagy: használd a design systememet].
Renderelés előtt készíts storyboardot, és várd meg a jóváhagyásomat.
```

Ha már elmentetted a skillt (6. lépés), elég ennyi:

```prompt Ha már van skilled
Vágd meg ezt Reelsnek.
```

Ami közben történik (nem kell csinálnod semmit):

1. Claude megnézi a videót, és leírja, amit mondasz, szavanként, másodpercre pontosan. Ez 100 másodpercnél kb. 8 perc.
2. Megkeresi a szüneteket, és kivágja őket. Ettől lesz pörgős a videó.
3. Kijavítja, amit félrehallott. Nálam az „AI-eszközök”-ből először „éjjelj eszközök” lett, az andormarcsi.hu-ból pedig „anormaldsi.hu”. Ezeket én is javítottam volna, ő megcsinálta helyettem.

## 3. lépés: Nézd át a storyboardot, és hagyd jóvá

Kb. 15–20 perc múlva kapsz egy oldalt: ez a storyboard, a videó forgatókönyve. Jelenetekre van bontva, és mindegyiknél látod:

| Időpont | Szöveg | Kép | Hang |
|---|---|---|---|
| és egy képkocka a videódból | amit abban a pillanatban mondasz | mi jelenik meg, pl. „egy óriási 4-es csapódik be felülre” | mi szól alatta: whoosh, pop, boom |

> **Ez a legfontosabb lépés:** Itt még egy mondattal bármit átírathatsz. Renderelés után minden változtatás újabb 20 perc.

Mire figyelj:

1. **Jók-e a szavak?** Claude a végén leírja, amiben bizonytalan. Nálam ez a „Kövess be!” volt.
2. **Jók-e a színek?** Ha nem a tieid, írd meg. Én itt szóltam, hogy használja a design systememet, és átállt.
3. **Tetszenek-e a poénok?** Ha egy jelenet sok vagy kevés, írd meg: „A Word-doksis rész maradjon ki.”
4. **Jó-e a vége?** A felhasználóneved és a weboldalad legyen benne, betűre pontosan.

Ha minden oké:

```prompt Jóváhagyás
Mehet, renderelheted.
```

## 4. lépés: Várd meg a renderelést, és töltsd le

A renderelés azt jelenti, hogy Claude képkockánként összerakja a kész videót. Egy 90 másodperces Reels 2 700 képkocka, ezért kb. 20 perc. Nem kell ott ülnöd mellette: ha kész, Claude elküldi a fájlt a beszélgetésbe.

1. Nézd végig hanggal és hang nélkül is. A nézők nagy része némán görget, nekik a feliratnak elég kell lennie.
2. Töltsd le a telefonodra, és onnan töltsd fel Reelsként, ahogy szoktad.
3. A fájl mérete: a beszélgetésbe legfeljebb 30 MB-os fájl fér, ezért Claude kicsit tömöríti. Telefonon nem látszik a különbség. Ha mégis a nagyobb kell, kérd meg, hogy tegye fel a Google Drive-odra.

## 5. lépés: Javíttass egy mondattal

Ha valami nem tetszik, nem kell semmit állítgatnod. Írd le úgy, mintha egy kollégának szólnál. Claude kijavítja és újrarendereli (kb. 20 perc).

- „A feliratok legyenek kisebbek, és kerüljenek lejjebb.”
- „A 40. másodpercnél lévő telefonos rész takarja a számat, tedd odébb.”
- „A ‚Nem.’ legyen még nagyobb, és maradjon fent egy másodperccel tovább.”
- „A hangeffektek túl hangosak, vedd le a felére.”
- „A ‚Kövess be’ helyett az legyen írva, hogy ‚Kattints a linkre a bióban’.”

> **Tipp:** Egyszerre több dolgot írj, ne egyesével. Öt javítás egy körben 20 perc, külön-külön viszont 100 perc lenne.

## 6. lépés: Ha jó lett az első videó, mentsd el skillnek

A skill egy elmentett munkamenet-leírás: Claude ebből tudja, hogyan szoktad. Ha egyszer elmented, a következő videónál nem kell elmagyaráznod, mit kérsz, elég ennyi: „Vágd meg ezt Reelsnek.”

Ne várj vele. Amint az első videó tetszik, ugyanabban a beszélgetésben mentsd el. Ott van előtte minden, amit közben kitalált és kijavított: hol legyenek a feliratok, milyen effektek működtek, mit kértél másképp. Egy új beszélgetésben ez már elveszne.

1. Amikor elégedett vagy a kész videóval, írd meg Claude-nak:

```prompt Skill mentése
Ez nagyon jó lett. Csinálj ebből skillt, hogy legközelebb is így vágj.
```

2. Claude megmutat egy kártyát a skill leírásával. Fusd át, és mentsd el.
3. Figyelj arra, hogy a skill ne a márkád színeit tárolja, hanem azt, hogy honnan vegye őket. A design system külön marad. Ha frissíted, a következő videó már az újjal készül, a skillhez nem kell nyúlni. Én ezt így kértem:

```prompt Színek a design systemből
A skill ne tároljon színeket és betűket. Mindig a design systemből dolgozzon, és ha nem mondom, melyikből, kérdezze meg.
```

Az így mentett skill más arculattal is működik, például egy ügyfélével: „Vágd meg ezt Reelsnek a POLY-OS arculatával.”

## Ha elakadsz

| Mi történt | Mit csinálj |
|---|---|
| Claude nem tudja megnyitni a videót | Várj egy percet, a nagy fájl lassan ér fel. Ha még mindig nincs, töltsd fel újra. |
| Rossz szó van a feliratban | Írd meg a storyboardnál: „A 12. másodpercnél nem éjjel, hanem AI.” |
| A felirat vagy egy grafika eltakarja az arcod | „Tedd lejjebb a feliratot, ne takarja a számat.” |
| Nem a te színeid vannak rajta | „Használd a design systememet”, vagy írd meg a színkódokat. |
| Túl sok minden villog a képen | „Felényi effekt legyen, csak a csattanóknál.” |
| Nem jön meg a kész fájl, mert túl nagy | „Tömörítsd 30 MB alá.” |
| Hosszú a videód (3 perc felett) | Vágd két részre felvételkor, vagy számolj dupla várakozással. |

Ha valamit nem értesz, kérdezd meg Claude-ot ugyanabban a beszélgetésben. Ott van előtte minden, amit addig csinált.

## Puska: az összes prompt egy helyen

| Mikor | Mit írj Claude-nak |
|---|---|
| Legelőször, egyszer | „Építs nekem egy design systemet a márkámhoz.” (a weboldaladdal, logóddal, posztjaiddal) |
| Első videó, feltöltéskor | A 2. lépés hosszú promptja, a végén: „Használd a design systememet.” |
| Ha már van skilled | „Vágd meg ezt Reelsnek.” |
| Más arculattal | „Vágd meg ezt Reelsnek a [márka] arculatával.” |
| Storyboard után, ha jó | „Mehet, renderelheted.” |
| Storyboard után, ha módosítanál | Minden kérés egy üzenetben, pl. „A színek a design systemből legyenek, a végén pedig a bióra mutass.” |
| Kész videónál javítás | „A feliratok legyenek kisebbek, a hangeffektek halkabbak.” |
| Nagyobb minőség kell | „Tedd fel a nagy felbontásút a Google Drive-omra.” |
| Ha jó lett az első videó | „Csinálj ebből skillt. Ne tároljon színeket, mindig a design systemből dolgozzon.” |

## A rövidebb út: bízd ránk

Ezen az oldalon minden benne van, hogy magad megcsináld. De ha nincs kedved előfizetést beállítani, design systemet építeni és videónként 45 percet várni, van egy rövidebb út: a getsnitt.

1. **Feltöltöd** a nyers videót, egyenesen a telefonodról.
2. **Jóváhagyod:** megnézed a storyboardot, és előre látod az árát.
3. **Letöltöd:** ha tetszik az előnézet, letöltöd teljes minőségben.

- **kb. 1 700 Ft / Reels:** egy 90 másodperces videó, feliratokkal, effektekkel, hangokkal. Az első javítás benne van.
- **4 990 Ft / hó** bruttó. A teljes összeg kreditként a Snitt Bukszádba kerül, és videókra költöd el.
- Nem kell hozzá AI-előfizetés, fizetés előtt látod az árat, a saját színeiddel és betűiddel dolgozik, és a kredit nem jár le.

A getsnitt már elérhető, itt kipróbálhatod: [getsnitt.hu →](https://getsnitt.hu/?utm_source=andormarcsi&utm_medium=lead_magnet&utm_campaign=reels_utmutato)

| Havi 8 Reels | Magad, Claude-dal | getsnitt | Külsős vágó |
|---|---|---|---|
| Költség | Claude-előfizetés + a te időd | kb. 14 000 Ft | 64 000 Ft-tól |
| Időd videónként | 45–50 perc, plusz a tanulás | pár perc | egyeztetés |
| Megtakarítás a vágóhoz képest | – | kb. 50 000 Ft havonta | – |

A külsős vágó ára nyilvános magyar árlisták alapján: Reels-vágás 8 000–9 000 Ft-tól videónként. A getsnitt ára egy 90 másodperces, AI-képek nélküli videóra vonatkozik. AI-képekkel és -animációkkal kb. 3 000–6 000 Ft.
$md$),
('ingyenes-videos-design-skill', $md$
## Miért kell skill?

**A menő videó mögött szabályok vannak.** Ha annyit írsz Claude-nak, hogy „vágd meg, legyen menő”, kapsz egy videót. Pont olyat, mint bárki más. A menő videó nem attól menő, hogy sok rajta az effekt, hanem attól, hogy minden döntés mögött szabály van: mikor jön a nagy betű, meddig állhat a kép, mit jelent egy átmenet.

A skill ezeket a szabályokat írja le, egyszer. Utána Claude minden videódnál ezek szerint dolgozik, és nem kell újra elmagyaráznod.

Az útmutató végére meglesz:

- a saját arculatod (színek, betűk, formák) számokban leírva,
- a vágási „nyelvtanod” mért értékekkel,
- egy kész SKILL.md fájl, amit Claude betölt,
- és egy első videó, amin kipróbáltad.

Időigény: egy délután. Kell hozzá: Claude Pro vagy Max.

## Mi az a videós design skill?

**Egy mappa, három rész.** A skill egy mappa, benne egy SKILL.md nevű szövegfájllal. Ebben vannak az utasítások, amiket Claude betölt, amikor az adott feladatot csinálja. A videós skill három dolgot ír le:

| Rész | Kérdés | Példa |
|---|---|---|
| Arculat | Mi és milyen színben? | „A kimondott szó vajsárga, a cím Bodoni Moda.” |
| Vágási nyelvtan | Mikor és hogyan? | „A kép legfeljebb 3 mp-ig áll, a hook az első kockán van.” |
| Munkafolyamat | Milyen sorrendben? | Leirat → vágási terv → storyboard → render. |

Így néz ki a mappa:

```
sajat-reels-stilus/
├── SKILL.md      ← a vágási nyelvtan és a munkafolyamat
├── arculat.md    ← színek, betűk, formák, biztonsági zónák
└── minta/        ← képkockák a saját korábbi videóidból (nem kötelező)
```

> **Tipp:** Az arculatot és a vágást érdemes külön fájlba tenni. Így ugyanazt a vágási stílust más arculattal is használhatod, például egy ügyfél videójánál.

## Mit készíts elő?

Öt dolog kell, és egyik sem drága.

1. **Fizetős Claude-csomag** (Pro vagy Max), a beállításokban bekapcsolt kódfuttatással. Enélkül nincs skill és nincs videókészítés.
2. **A rendereléshez Claude Code** a saját gépeden. Ez a legbiztosabb út, mert ott nincs letöltési korlát a beszédfelismerő modellre. Ha a Reels-vágás útmutatóval már beállítottad, kész vagy.
3. **Saját korábbi videóid** (nem kötelező). 1–3 videó, amivel elégedett vagy. Ha nincs ilyen, Claude kikérdez, abból is megy.
4. **Márkaanyag:** logó, 2–3 szín hex kóddal és 1–2 font neve. Ha nincs ilyened, elég a weboldalad címe, abból Claude kiolvassa.
5. **1 nyers próbavideó:** álló (9:16), beszélős, 30–60 mp. Nem kell tökéletesnek lennie, a teszthez kell.

## 1. lépés: Mondd el a stílusodat

Nem kell mások videóit szétszedni. A stílusod a tiéd: Claude kikérdez, és minden kérdésnél számokkal leírt lehetőségeket ad, amikből választasz. Ha vannak saját videóid, amikkel elégedett vagy, azokból azt méri le, amit már most is jól csinálsz.

```prompt Stílus-kikérdezés
Segíts megírni a saját Reels-vágási stílusomat egy skillhez. Kérdezz ki egyenként, és minden kérdésnél adj 2–3 konkrét, számokkal leírt lehetőséget, amiből választhatok:

1. Szerkezet: hogyan induljon a videó (hook), mi jöjjön utána, hogyan záruljon (CTA).
2. Ritmus: milyen gyakran változzon a kép, meddig állhat legfeljebb, milyen gyakran legyen plánváltás vagy zoom.
3. Hook: mekkora legyen a nyitószöveg, hol üljön, takarhatja-e a fejem.
4. Feliratok: hány szó egyszerre, hogyan jelenjenek meg (szavanként, gépelve, egyszerre).
5. Grafikai elemek: kártyák, ikonok, számok, kézzel rajzolt jelölések. Mikor jönnek, hogyan mozognak, meddig maradnak.
6. Átmenetek: melyiket mikor használjuk, és mit jelentsen.
7. Hang: zene, hangeffektek, mihez kötjük őket.
8. Hangulat: milyen legyen a videóim hangulata három szóban.

Ha csatolok 1–3 saját korábbi videót, előbb abból mérd le, amit már most csinálok, és azzal kezdj. A végén foglald össze táblázatban a döntéseimet.
```

> **Tipp:** Ha egy kérdésnél bizonytalan vagy, válaszd a középső lehetőséget. A teszt úgyis megmutatja, mit kell állítani.

## 2. lépés: Írd le az arculatod

Az arculatban minden színnek és betűnek szerepe van, nem csak neve. Claude nem azt tudja meg, hogy „a lila szép”, hanem azt, hogy „a kimondott szó lila, a doboz sötét, a cím serif”.

| Szerep | Mire való | Hány legyen |
|---|---|---|
| Háttér, szöveg | alap olvashatóság | 1-1 |
| Kiemelés | az éppen kimondott szó, a csattanó | pontosan 1 |
| Doboz, kártya | felirat mögé, grafikai elemekhez | 1–2 |
| Jelölő | kézzel rajzolt karika, X, aláhúzás | 1 |
| Óriás betű (display) | hook, nagy számok | 1 font |
| Felirat (sans) | a folyamatos szöveg | 1 font |
| Hangsúly (dőlt vagy kézírás) | egy-egy kiemelt szó | 1 font |
| Számláló (mono) | időkód, százalék | 1 font, ha kell |

**Biztonsági zóna.** 1080×1920-as képen felül kb. 140 px, alul kb. 230 px maradjon szövegmentes, különben az Instagram felülete letakarja. Ha boostolni fogod, a fontos szöveg a középső 1350 px-ben legyen (felül és alul 285 px szabadon), mert a hírfolyamban 4:5-re vágva is megjelenhet.

```prompt Videós arculat
Készíts nekem videós arculatot (design system) 1080×1920-as Reelshez. Forrás: [weboldalam címe / a csatolt logó / ezek a színek: …].

Minden elemnek adj szerepet:
- Színek: háttér, szöveg, kiemelés (a kimondott szó), doboz, kártya, jelölő (kézzel rajzolt karika, X).
- Fontok: óriás hook-betű, felirat, kiemelt szó (dőlt vagy kézírás), számláló (mono). Csak ingyenes, Google Fontson elérhető fontokat válassz, magyar ékezetekkel (latin-ext).
- Formák: lekerekítés, keretvastagság, árnyék px-ben, 1080 px széles képkockára méretezve.
- Szabályok: melyik színen milyen szöveg olvasható, milyen gyakran jöhet a kiemelés-szín, kis- vagy nagybetűs címek.
- Biztonsági zónák: felül 140 px, alul 230 px szövegmentes; boostolásnál a fontos szöveg a középső 1350 px-ben.

Add vissza arculat.md fájlként, és mutass róla egy mintalapot egy hookkal, egy felirattal és egy kártyával.
```

A mintalapon látod először, hogy működik-e. Ha a kiemelés-szín mindenhol ott van, az már nem kiemelés. Egy szín, ritkán, és akkor üt.

## 3. lépés: Írd meg a vágási nyelvtant

Ez a skill szíve, és itt dől el, hogy menő lesz-e. A titok: **számok, nem jelzők.** Claude a „dinamikus” szót mindenkinél ugyanúgy érti. A „3 mp” szót csak úgy lehet érteni, ahogy te gondoltad.

| Jelző – ebből sablon lesz | Szabály – ebből a te stílusod lesz |
|---|---|
| „dinamikus vágás” | a kép legfeljebb 3 mp-ig áll változatlanul |
| „figyelemfelkeltő eleje” | a hook szövege már az első képkockán ott van, beúszás nélkül |
| „nagy felirat” | a kép szélességének 85–95%-a, két sorban, a felső harmadban |
| „szép átmenetek” | alapból keményvágás; a felfelé toldás (250 ms) csak új fejezetnél |
| „pörgős” | képi változás 0,2–0,5 mp-enként, plánváltás 5–10 mp-enként |

Minden átmenetnek jelentése van. Ha nem tudod megmondani, mit jelent, akkor keményvágás legyen. Ettől a szabálytól lesz a videó profi és nem karácsonyfa.

```prompt Ugyanabban a beszélgetésben
A döntéseimből írd meg a vágási nyelvtanomat egy SKILL.md fájlba.

Szabályok:
- Szabályként csak az kerüljön be, amit egyértelműen eldöntöttem. A bizonytalan pontok „opcionális” címke alá.
- Minden szabály mérhető legyen (mp, ms, %, px). Jelzőt ne használj.
- Minden átmenethez írd oda, MIT jelent, vagyis mikor használható. Ha nincs jelentése, legyen keményvágás.
- Színt és fontot ne írj bele, csak szerepnévvel hivatkozz rájuk (pl. „kiemelés”), mert azok az arculat.md-ben vannak.
- A végére tegyél „Ne felejtsd” listát a 6–8 legfontosabb szabállyal.

Fejezetek: szerkezet, ritmus, hook, háttér-eltávolítás, szöveganimációk, grafikai elemek, átmenetek, hang, felvétel és képkivágás, munkafolyamat.
```

## 4. lépés: Írd bele a munkafolyamatot

A jó skill nemcsak a stílust tudja, hanem a sorrendet is. Ha ez kimarad, Claude rögtön renderel, és te egy kész, de rossz videót kapsz. A legfontosabb pont a storyboard: ott még percek alatt javítható minden.

1. **Leirat szóidőkkel.** A beszédfelismerést kifejezetten magyarra kell állítani, különben halandzsa lesz a felirat.
2. **Jump cut.** A szünetek kivágása, például a 0,35 mp-nél hosszabb csendeké, 0,07 mp ráhagyással.
3. **Vágási terv.** Táblázat mondatonként: időkód, plán, háttér, grafika, animáció, átmenet, hang.
4. **Storyboard.** 8–12 jelenet képkockával és a kimondott mondattal. Amíg rá nem bólintasz, nincs render.
5. **Render.** Kódból készülő videó (pl. Remotionnel), minden animáció a kimondott szóhoz időzítve.
6. **Ellenőrző kontaktlap.** 8–14 kulcspillanat állóképen: takar-e a felirat szájat, szemet, kilóg-e valami.

> **Tipp:** Ha a storyboard nem jó, a vágási tervhez mész vissza, nem a kész videóhoz. Ezért éri meg ott megállni.

```prompt Munkafolyamat
Add hozzá a SKILL.md-hez a munkafolyamatot ebben a sorrendben: leirat szóidőkkel (magyar nyelvre állítva), jump cut, vágási terv táblázatban, storyboard jóváhagyásra, render, ellenőrző kontaktlap. A storyboard után állj meg, és csak a jóváhagyásom után renderelj.
```

## 5. lépés: Teszteld, és csiszold a skillt

Töltsd fel a nyers próbavideót, és kérd így: „Vágd meg ezt a sajat-reels-stilus skill szerint.” Az első videó soha nem lesz tökéletes. Nem is ez a cél, hanem hogy lásd, hol hiányos a skill.

Ezeket nézd meg rajta:

- Az első kockán ott a hook, beúszás és „sziasztok” nélkül?
- Van 3 mp-nél hosszabb álló kép?
- Takar-e felirat vagy grafika szájat, szemet?
- Rendben vannak a magyar ékezetek (ő, ű)?
- Hang nélkül nézve is felismerhető, hogy ez a te videód?

**A lényeg: ne a videót javíttasd, hanem a skillt.** Ne csak annyit írj, hogy „legyen nagyobb a felirat”, hanem azt, hogy „a felirat legyen nagyobb, és ezt írd bele a skillbe szabályként”. Így a következő videó már elsőre jó lesz. Kb. 3–5 videó után áll be a stílus.

## Sablon: a SKILL.md váza

Ha gyorsabban akarsz haladni, ezt a vázat add oda Claude-nak a kikérdezés után: „Töltsd ki ezt a sablont a döntéseimből.” A szögletes zárójeles részeket ő írja át a mért értékekre.

```
---
name: sajat-reels-stilus
description: Beszélős Reels vágása a [MÁRKANÉV] stílusában: hook, ritmus, feliratok, grafikák, átmenetek, CTA. Akkor használd, ha nyers beszélős videóból kész Reelset kérek.
---

# [Márkanév] Reels-stílus

Ez a skill azt írja le, HOGYAN vágom a videóimat. A színek, fontok és formák az arculat.md-ben vannak: minden videó előtt olvasd be.

## 1. Szerkezet (20–60 mp)
1. Hook, 0–[1,5] mp: [mi van az első kockán]
2. [Bizonyíték / probléma], [1,5–4] mp: [...]
3. [Bemutatás / 1-2-3 lépés]: [...]
4. CTA, utolsó [3–5] mp: [kulcsszó kommentbe]. A videó a CTA mondat végén véget ér, nincs lezáró képernyő.

## 2. Ritmus
- Képi változás: [0,2–0,5] mp-enként
- Új fő elem: [1,5–3] mp-enként, álló kép legfeljebb [3] mp
- Jump cut: minden szünet ki, [0,07] mp ráhagyással
- Plánváltás vagy zoom: [5–10] mp-enként

## 3. Hook
- Méret: a kép szélességének [85–95]%-a, [két] sorban
- Hely: [a felső harmadban, a fej a betűk alsó részébe lóg]
- Időzítés: az első kockán már ott van, [0,8–1,6] mp-ig marad

## 4. Feliratok és szöveganimáció
- Egyszerre legfeljebb [3] szó, a kimondott szó kiemelés színű
- Hely: [az arc alatt], grafika alatt [felülre költözik]
- Szavankénti megjelenés: [keményen, áttűnés nélkül]

## 5. Grafikai elemek
| Elem | Mikor jön | Mozgás | Meddig marad |
| [számozott kártya] | [lépéseknél] | [alulról, rugóval] | [1,5 mp] |

## 6. Átmenetek (mindegyiknek jelentése van)
- Keményvágás: alapértelmezés
- [Felfelé toldás, 250 ms]: [új fejezetnél]
- [Zoom-elmosás]: [ugrás a széles plánra]

## 7. Hang
- [Nincs zene / halk alap], hangeffekt csak képi eseményhez
- Végén hangerő-normalizálás: -14 LUFS

## 8. Felvétel és biztonsági zónák
- 1080×1920, felül 140 px, alul 230 px szövegmentes
- A fej a képmagasság [35–45]%-ánál

## 9. Munkafolyamat
1. Leirat szóidőkkel, magyar nyelvre állítva
2. Jump cut
3. Vágási terv táblázatban
4. Storyboard: jóváhagyásig nincs render
5. Render
6. Ellenőrző kontaktlap

## Ne felejtsd
- A hook az első kockán van.
- Legfeljebb [3] mp álló kép.
- Egyszerre egy fő elem.
- Az átmenet jelent valamit, különben keményvágás.
- A szöveg a biztonsági zónában marad.
```

**Így töltöd fel:** a mappát (benne a SKILL.md és az arculat.md) tömörítsd ZIP-be. Pro és Max csomagban a Beállítások > Capabilities oldalon, a Skills résznél tudod feltölteni az „Upload skill” gombbal. A Claude Code-ban a skill a saját gépeden, a skillek mappájában él, oda is bemásolhatod. (Forrás: Claude Help Center, „Using Skills in Claude”, support.claude.com.)

## 10 szabály, amitől menő lesz

1. A hook az első kockán van. Nincs logó, nincs „sziasztok”.
2. A kép legfeljebb 3 mp-ig áll változatlanul.
3. Egyszerre egy fő elem van a képen.
4. Minden átmenetnek jelentése van, különben keményvágás.
5. Egy kiemelés-szín van, és ritkán jön.
6. A szöveg a biztonsági zónában marad.
7. Minden animáció a kimondott szóhoz van időzítve.
8. A skillben számok vannak, nem jelzők.
9. Előbb storyboard, utána render.
10. A CTA mondat végén vége a videónak.

## Gyakori hibák

| Hiba | Mi okozza | Javítás |
|---|---|---|
| Halandzsa a felirat | angolra állított beszédfelismerés | a magyar nyelvet kifejezetten állítsd be |
| Kocka az ő és ű helyén | a fontból hiányzik a latin-ext készlet | latin-ext változatú fontot kérj |
| Olyan, mint mindenki másé | jelzők a skillben számok helyett | mérhető szabályok (mp, ms, %, px) |
| Karácsonyfa-hatás | minden átmenet és effekt egyszerre | csak jelentéssel bíró átmenet |
| Felirat a szájon | nincs szabály az arc helyére | fej a kép 35–45%-ánál, felirat alatta |
| Nem a te hangod | más alkotó stílusát utánzod | a saját döntéseidből és videóidból dolgozz |

## És most?

Menj végig a lépéseken egy délután alatt, és vágd meg az első videódat a saját skilleddel. Ha elkészült, jelöld meg a Polymaindet, kíváncsi vagyok rá.

Ha inkább nem építenéd meg magad, a Snitt megcsinálja helyetted: feltöltöd a nyers videót, főzöl egy kávét, és kész a vágott anyag. [getsnitt.hu →](https://getsnitt.hu/?utm_source=andormarcsi&utm_medium=lead_magnet&utm_campaign=videos_design_skill)
$md$),
('ingyenes-heti-terv', $md$
> **Mielőtt belekezdesz:** Ez a csomag önsegítő, motiváló eszköz, nem diagnózis és nem terápia. Nem vagyunk pszichológusok, és nem diagnosztizálunk. Ha úgy érzed, az ADHD vagy a káosz komolyan rányomja a bélyegét az életedre, beszélj háziorvossal, pszichiáterrel vagy pszichológussal.

## A káoszod nem hiba. Üzemmód.

Ha a fejedben egyszerre 12 fül van nyitva, a teendőlistád hosszabb, mint a bevásárlólistád, és közben elképesztő ötleteid vannak: ismerős a helyzet. Sok ADHD-val élő felnőtt agya nem a „fontos” szóra indul be, hanem arra, ami érdekes, új, kihívás vagy sürgős. Ez nem lustaság. Ez egy másik motor, és egy másik kezelési útmutató kell hozzá.

### A rejtett szuperképesség: a hiperfókusz

Sokan ismerik: ha valami igazán megfog, órákra elmerülsz benne, nem hallod a telefont, elfelejtesz enni, és közben annyit alkotsz, mint más egy hét alatt. Ez a hiperfókusz. Nem lehet parancsra bekapcsolni, de lehet olyan környezetet építeni, amiben sokkal nagyobb eséllyel beindul. A cél nem az, hogy több fegyelmed legyen, hanem hogy kevesebbre legyen szükséged.

## Hiperfókusz előhívása 6 lépésben

1. **Ürítsd ki a fejed.** Minden, ami kavarog, menjen a mindmapre (a nyomtatható lapok között). Ami le van írva, azt nem kell fejben tartani.
2. **Válassz EGYET.** Egy feladat. Nem három. A többi megvár a papíron.
3. **Tedd érdekessé.** Verseny az órával, új helyszín, új zene, „vajon kész leszek 30 perc alatt?” Az agyadnak tét kell.
4. **Csak a 2 perces start.** „Csak megnyitom a fájlt.” „Csak előveszem a papírokat.” A kezdés a nehéz, a folytatás megy magától.
5. **Zárd ki a zajt.** Telefon másik szobába, értesítések ki, egy fókuszzene, amit mindig ugyanehhez használsz. A zene lesz a jel.
6. **Készíts be előre.** Víz, nasi, töltő a kezed ügyébe. Hiperfókuszban nem fogsz felállni érte.

> **A hiperfókusznak fék is kell!** Ugyanaz az erő, ami csodát művel, el is nyelheti a napod (és a vacsorát, és az alvást). Állíts ébresztőt 45–90 percre, és előre döntsd el, mire használod a hiperfókuszt. Ha egy új sorozatra, egy kattintós játékra vagy egy háttérkutatásra „ugrik rá”, az is hiperfókusz, csak rossz helyen.

### Miért nem működik neked a hosszú lista?

A 15 tételes lista nem motivál, hanem lebénít: az agyad nem tudja eldönteni, mivel kezdjen, ezért inkább semmivel. A megoldás nem az erősebb akarat, hanem a kevesebb, kisebb és látható cél, és a jutalom, ami nem „egyszer majd” jön, hanem most.

## Jutalom, ami tényleg jár

Az ADHD-s agy nehezen pörög fel a távoli jutalomra („majd a negyedév végén jó lesz”). Közeli, látható, azonnali jutalom kell neki. Pont úgy, mint a gyerekeknek a matricás tábla, csak felnőttesen (és viccesebb feliratokkal).

### Állandó jutalom: a matrica

- Minden kész fő cél és bónusz után azonnal ragassz egy matricát a heti tervezőre.
- Nem este, nem péntek. Most. A gyorsaság a lényeg.
- A kapott matricát soha nem veszed vissza, akkor sem, ha a nap többi része szétesett.
- Félig kész is számít, ha haladtál. Ez nem vizsga.

### Heti jutalom: a nagy nyeremény

- Hétfőn döntsd el: ha összegyűlik X matrica, mi jár érte.
- Legyen valami, amit tényleg vársz: mozi, masszázs, egy könyv, egy szabad délután.
- Az X legyen elérhető. Inkább könnyű elsőre, mint lehetetlen.
- Vasárnap a heti értékelőn számold össze, és vedd át a jutalmad.

### A dopaminmenüd

Írj össze 5 apró, egészséges jutalmat, ami 10 percen belül megvan. Ha elakadsz, ebből választasz: nem kell gondolkodni rajta. Például: kávé a kedvenc bögréből, 10 perc séta zenével.

## Napi cél és heti cél

**Napi cél: 1 + 2**

- 1 fő cél: ha csak ez lesz kész, a nap jó volt.
- Max. 2 bónusz: ha belefér. Ha nem, nem baj.
- A fő célt reggel írd fel, ne este akard kitalálni.

**Heti cél: 1 nagy, 3 lépésben**

- Egy nagy dolog a hétre, ami számít neked.
- Bontsd 3 kis lépésre, ezek lesznek egyes napok fő céljai.
- Ha csúszik, ne dobd ki: vidd át a következő hétre.

## Így használd a csomagot

| Mikor | Mit csinálsz |
|---|---|
| Hétfő | Mindmap: fej kiürítése, heti cél és heti jutalom |
| Reggel | Felírod a nap EGY fő célját a tervezőbe |
| Napközben | Hiperfókusz-blokk, kész, matrica! |
| Este | 2 perc napi értékelő, holnapi 1 dolog |
| Vasárnap | Heti értékelő, matricák össze, jutalom |

## A nyomtatható lapok

A csomag lapjait töltsd le a „Letöltöm PDF-ben” gombbal, és nyomtasd ki. A matricaívet öntapadós A4-es matricapapírra nyomtasd (vagy sima papírra, és ragasztóstift).

- **Matricás heti tervező:** a heti nagy cél 3 lépésben, naponta fő cél, két bónusz, hiperfókusz-percek, matricagyűjtő és heti jutalom.
- **Matricaív – 40 vicces felirat:** „Ma ezt tényleg befejeztem”, „Hiperfókusz: ON”, „Elkezdtem. Ez volt a nehéz rész.”, „Ma én győztem, nem a káosz” és még 36 másik.
- **Napi értékelő (2 db / lap):** fő cél, hiperfókusz, energiaszint, mi ment jól, mi vitte el a fókuszt, holnapi EGY dolog.
- **Heti értékelő:** vasárnap esti 10 perc a hét legjobb pillanataival és a jövő heti nagy céllal.
- **Káoszkiürítő mindmap:** mi van most a fejedben? Írj mindent a gömbök köré, a végén karikázd be, mi a legfontosabb: ezt csinálom most, ez várhat, ezt elengedem.

## Következő szint: Sikermaker

Bejött a matricás tábla? A papír jó kezdet, de a hűtőn elveszik, a tollat meg sosem találod. A Sikermaker ugyanez a rendszer, csak okosan: mindig nálad van, emlékeztet, és összeadja helyetted a sikereidet.

- **Következő lépés:** nem lista, mindig csak az az egy, amit most kell. Nincs bénulás.
- **Napi lépések, lendületpontok:** minden kártya kész után pont és matrica, azonnal.
- **Sikernaptár:** arany nap minden jó napodra. Látod, hogy haladsz, akkor is, ha nem érzed.
- **Digitális matricák:** díszítsd, gyűjtsd, büszkélkedj. A vicces feliratokkal együtt.

Próbáld ki a Sikermakert, és fordítsd a káoszt sikerré: [sikermaker.hu →](https://sikermaker.hu)
$md$)
) as v(slug, body)
join public.courses c on c.slug = v.slug
on conflict (course_id) do update set body_md = excluded.body_md, updated_at = now();
