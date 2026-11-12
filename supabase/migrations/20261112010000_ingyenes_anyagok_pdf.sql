-- Ingyenes online anyagok: „Letöltöm PDF-ben” gomb az oldalsávban (csak belépve; a link a course_downloads-ban,
-- az RLS belépett, jogosult felhasználónak adja ki). Újrafuttatható.
insert into public.course_downloads (course_id, url, label, updated_at)
select c.id, v.url, 'Letöltöm PDF-ben', now()
from (values
  ('ingyenes-heti-terv', 'https://drive.google.com/file/d/1GHlPpZgdbZjGX7fKC9wqUxURcZppor50/view'),
  ('ingyenes-reels-vagas-utmutato', 'https://drive.google.com/file/d/1WdcjaWI3vmXFVc3K85M4JbEy_3avh05k/view'),
  ('ingyenes-videos-design-skill', 'https://drive.google.com/file/d/1xlyUJh9vsR3aXcxS69CrvLTSY1Z8hw-s/view')
) as v(slug, url)
join public.courses c on c.slug = v.slug
on conflict (course_id) do update set url = excluded.url, label = excluded.label, updated_at = now();

-- A Káoszmanager szövege eddig „lent” említette a letöltést; a gomb most az oldalsávban van.
update public.course_guides g set body_md = replace(g.body_md, 'A csomag lapjait töltsd le lent, és nyomtasd ki.', 'A csomag lapjait töltsd le a „Letöltöm PDF-ben” gombbal, és nyomtasd ki.'), updated_at = now()
from public.courses c where c.id = g.course_id and c.slug = 'ingyenes-heti-terv';
