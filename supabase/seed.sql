-- Mintaadatok a dizájn alapján. A YouTube-azonosítókat az admin felületen
-- lehet megadni (bármilyen YouTube link beilleszthető).
insert into public.courses (slug, title, subtitle, description, tool, level, price_huf, published, sort_order) values
  ('canva-gyorstalpalo', 'Canva gyorstalpaló', 'Az első saját poszted lépésről lépésre',
   'Felület, sablonok, színek, betűk – rövid videókban, kezdőknek.', 'Canva', 'Kezdő', 0, true, 10),
  ('claude-alapok', 'Claude alapok: beszélgess az AI-jal', 'Hogyan kérdezz jól?',
   'Szövegírás, ötletelés és összefoglalás a mindennapokban – 50 kipróbált prompttal.', 'Claude', 'Kezdő', 0, true, 20),
  ('instagram-sabloncsomag', 'Instagram sabloncsomag', '30 szerkeszthető Canva sablon',
   'Videós bemutató a sablonok testreszabásához, márkaszínekkel és saját fotókkal.', 'Canva', 'Haladó kezdő', 4990, true, 30),
  ('polyos-videosorozat', 'Polyos videósorozat', '8 rövid lecke, 10 perc alatt',
   'Az első projekted felépítése nulláról, magyarázatokkal és közös gyakorlással.', 'Polyos', 'Kezdő', 9990, true, 40),
  ('hirdeteskezeles-ai', 'Hirdetéskezelés AI eszközökkel', 'Az első kampányod lépésről lépésre',
   'Hirdetésszövegek Claude-dal, kreatívok Canvában, célzás és mérés.', 'Hirdetés', 'Kezdő', 14990, true, 50);

insert into public.lessons (course_id, title, duration_min, sort_order, is_preview)
select c.id, l.title, l.dur, l.ord, l.ord = 1
from public.courses c
cross join lateral (values
  (1, 'Bevezetés – mit fogunk megtanulni?', 4),
  (2, 'Első lépések a felületen', 9),
  (3, 'Gyakorlás: saját projekt', 12)
) as l(ord, title, dur)
where c.slug in ('canva-gyorstalpalo', 'claude-alapok', 'instagram-sabloncsomag', 'polyos-videosorozat', 'hirdeteskezeles-ai');
