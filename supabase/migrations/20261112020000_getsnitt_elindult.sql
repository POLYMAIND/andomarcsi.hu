-- A getsnitt elindult, nincs már várólista: a Reels-vágás útmutató szövegét igazítjuk. Újrafuttatható.
update public.course_guides g
set body_md = replace(g.body_md,
      'Iratkozz fel a várólistára: indításkor elsőként jutsz be, és az első storyboardod ajándék. [getsnitt.hu →]',
      'A getsnitt már elérhető, itt kipróbálhatod: [getsnitt.hu →]'),
    updated_at = now()
from public.courses c
where c.id = g.course_id and c.slug = 'ingyenes-reels-vagas-utmutato';
