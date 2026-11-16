-- Kapcsolódó anyagok kurzusonként: a kurzusoldal „Amire még szükséged lehet” részében ezeket ajánljuk
-- (zsebcsomagok, ingyenes anyagok, kurzusok), a kiválasztás sorrendjében. Az adminban: Kurzus → Kapcsolódó anyagok.
-- Újrafuttatható.
alter table public.courses add column if not exists related_course_ids uuid[] not null default '{}';
