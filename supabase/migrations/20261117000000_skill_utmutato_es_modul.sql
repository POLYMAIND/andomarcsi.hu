-- 1) Ingyenes Skill-útmutató: leírás, online tananyag, letölthető PDF (a private/ mappából, csak e-mail után / belépve), „Elérhető”.
--    A Saját videós design skill ingyenes anyaghoz is letölthető PDF.
-- 2) Skill modul: a skill témák összes fizetős zsebcsomagja is benne van (vásárláskor ezeket is megnyitja).
-- Újrafuttatható.

-- ── 1) Skill-útmutató ──
update public.courses set
  title = 'Ingyenes: Skill-útmutató',
  subtitle = 'Mi az a skill, és hogyan írj egyet',
  teaser = 'Írd meg egyszer, használd minden héten. Mi az a skill, miben más, mint a prompt, mi az a 7 elem, ami nélkül csak kívánság – és hogyan lesz meg az első saját skilled kb. 45 perc alatt.',
  description = 'Mit találsz benne?' || E'\n' ||
    '• prompt vagy skill: mi a különbség, és miért spórol időt' || E'\n' ||
    '• a 7 elem, ami nélkül a skill csak kívánság' || E'\n' ||
    '• a leírás, a legfontosabb sor: rossz és jó példa' || E'\n' ||
    '• feltöltés a Claude-ba két perc alatt, és a három varázsmondat' || E'\n' ||
    '• előtte–utána példák és hibaelhárítás: négy tünet, négy javítás' || E'\n' ||
    '• letölthető PDF-ben is',
  coming_soon = false,
  starts_at = null,
  published = true
where slug = 'ingyenes-skill-utmutato';

insert into public.course_downloads (course_id, url, label, updated_at)
select c.id, '/api/anyag/ingyenes-skill-utmutato', 'Letöltöm PDF-ben', now()
from public.courses c where c.slug = 'ingyenes-skill-utmutato'
on conflict (course_id) do update set url = excluded.url, label = excluded.label, updated_at = now();

insert into public.course_downloads (course_id, url, label, updated_at)
select c.id, '/api/anyag/ingyenes-videos-design-skill', 'Letöltöm PDF-ben', now()
from public.courses c where c.slug = 'ingyenes-videos-design-skill'
on conflict (course_id) do update set url = excluded.url, label = excluded.label, updated_at = now();

insert into public.course_guides (course_id, body_md, updated_at)
-- A kódblokkok jelei (három backtick) ~~~ formában vannak, hogy a bemásolás ne törje el; a replace visszaalakítja.
select c.id, replace($md$
## Írd meg egyszer. Használd minden héten.

Az első saját Claude-skilled, a te hangodon, kb. 45 perc alatt. Ez az útmutató megmutatja, mi az a skill, miből áll egy jó skill, és hogyan írod meg az elsőt.

## A skill egy recept, amit a hűtőre ragasztasz.

Egy előre megírt utasításcsomag, amit Claude magától előkeres, amikor a kérésed illik rá. Technikailag egy mappa, benne egy SKILL.md szövegfájl, zipbe csomagolva. Programozni nem kell.

### Prompt vagy skill?

| | Prompt | Skill |
|---|---|---|
| Hányszor írod meg | Minden alkalommal | **Egyszer** |
| Hol él | Egy beszélgetésben | **A fiókodban, mindenhol** |
| Ki emlékszik a stílusodra | Te | **Claude** |
| Mikor indul | Ha bemásolod | **Magától, ha illik rá a kérés** |

## A 7 elem, ami nélkül a skill csak kívánság

1. **Név + leírás:** mikor induljon el?
2. **Bemenet:** mit adok neki?
3. **Lépések:** milyen sorrendben?
4. **Hangnem:** hogyan szól a márkám?
5. **Tiltólista:** mit soha?
6. **Kimenet:** milyen formában kérem?
7. **Példa + ellenőrzés:** mi a jó?

Ha mind a hét megvan, az már a te skilled.

### A leírás a legfontosabb sor

Ebből dönti el Claude, mikor vegye elő a skillt. Ide a te szavaid kellenek, nem a szép szavak.

> **Rossz:** description: Foglalások.

> **Jó:** description: Kedves válaszlevelet ír asztalfoglalási kérésekre. Használd, ha azt kérem: „válaszolj erre a foglalásra”, „írj vissza a vendégnek”.

## Két perc skillenként: így töltöd fel

1. Töltsd le a zipet. Ne csomagold ki.
2. Claude bal menü: **Customize → Skills**.
3. Jobb fent: **+ Add → Upload skill**.
4. Tallózd be a zipet. Kész.

> **Jó tudni:** Egyszerre egy zip megy fel, a csomagban lévő zipeket egymás után töltsd fel. A saját skillek a fizetős Claude-csomagokban érhetők el, és csak a te fiókodban látszanak. A feltöltött skilleket a Customize → Skills → Yours fülön találod.

## A három varázsmondat

~~~prompt Új skill
Írjunk egy skillt arra, hogy...
~~~

~~~prompt Javítás
Javítsuk a [skill neve] skillt: ...
~~~

~~~prompt Beszélgetésből
Csinálj skillt abból, amit most csináltunk.
~~~

## A három feladat

1. **Válaszd ki, mire írod (5 perc).** Három ismétlődő munka, pontozd 1–5-ig: milyen gyakran csinálod és mennyire unod.
2. **Írasd meg (20 perc).** Mondd az első varázsmondatot, és másolj be egy régi szöveget, ami „te vagy”.
3. **Teszteld egy kedden (10 perc).** Új beszélgetés, a skill nevét ne mondd ki. Elindult? Úgy szól, mint te?

> **Kész vagy, ha** a skill egy hétköznapi kérésre magától elindul, és alig kell javítanod.

## Ennyivel rövidebb a kérésed

| Skill | Előtte: minden alkalommal begépelted | Utána: ennyit írsz |
|---|---|---|
| Foglalási válasz | „Írj kedves választ erre a foglalásra, tegezve, max. pár mondat, ne legyen felkiáltójel, ne írj árat, Zsuzsa nevében, a végén a telefonszám…” | „Írj vissza Kovácséknak.” + a levél |
| Heti posztok | „Írj 3 posztot a heti menüből, legyen horog az elején, ne legyen benne »Ne hagyd ki!«, max. 2 emoji, 5 hashtag, javasolj napot…” | „Írd meg a heti posztokat.” + a jegyzet |
| Hírlevél | „Írj hírlevelet, legyen 3 tárgysor, előnézet, egy gomb, max. 250 szó, ne írd, hogy Kedves Feliratkozónk…” | „Írd meg a hírlevelet.” + a hónap hírei |
| Értékelés-válasz | „Válaszolj erre a rossz értékelésre, ne vitatkozz, ne ígérj kedvezményt, hívd privátba, legyen emberi…” | „Válaszolj erre az értékelésre.” + az értékelés |
| Ajánlatkérés-válasz | „Válaszolj erre a céges vacsorára, kérdezd meg a létszámot és a keretet, ne foglalj le véglegesen, ne írj árat, ami nincs megadva…” | „Jött egy ajánlatkérés.” + a levél |

## Ha elakadsz: négy tünet, négy javítás

| Tünet | Mit csinálj |
|---|---|
| Nem indul el magától | Írd a leírásba a saját kérő mondataidat. |
| Túl hivatalos, túl hosszú | Adj be egy régi saját szöveget mintának. |
| Kitalál árat, dátumot | Tiltólista: „Árat, dátumot, kedvezményt csak a bemenetből vegyél át.” |
| Mindig visszakérdez | Írj alapértelmezést: „Ha nem írom, legyen…” |

Háromszor ugyanazt javítod kézzel? Az a skill hibája, nem a tiéd. Mondd el a skill-írónak, és frissítsd.

---

## Nem akarod a nulláról kezdeni?

A **Skill-író zsebcsomagban** (990 Ft) benne van a skill-író skill, ami végigkérdez, és megírja veled a sajátodat, plusz 5 kész minta-skill: foglalási válasz, heti posztok, hírlevél, értékelés-válasz, ajánlatkérés-válasz. Mellé egy kitölthető SKILL-sablon és a „mi kell egy jó skillbe” keret. [Megnézem a Skill-író zsebcsomagot →](https://www.andormarcsi.hu/kurzusok/zseb-skill-iro)
$md$, '~~~', repeat(chr(96), 3)), now()
from public.courses c where c.slug = 'ingyenes-skill-utmutato'
on conflict (course_id) do update set body_md = excluded.body_md, updated_at = now();

-- ── 2) Skill modul: + a skill témák összes fizetős zsebcsomagja ──
update public.courses m set bundle_course_ids = m.bundle_course_ids || coalesce((
  select array_agg(p.id order by p.sort_order)
  from public.courses p
  where p.pocket_for = any(m.bundle_course_ids)
    and coalesce(p.price_huf, 0) > 0
    and not (p.id = any(m.bundle_course_ids))
), '{}')
where m.slug = 'skill-modul';

update public.courses set
  subtitle = 'Mind a 6 skill-anyag és a témák összes zsebcsomagja, plusz 4 bónusz'
where slug = 'skill-modul';
