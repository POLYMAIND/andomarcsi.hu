-- A „Célok és heti terv” a Claude alapozó vállalkozásoknak része (A céltervező lecke): nincs külön kurzusként.
-- A hozzá tartozó zsebcsomag és az ingyenes Káoszmanager átkerül a Claude alapozó alá, a külön kurzus rejtett lesz.
-- Újrafuttatható.
update public.courses c
set pocket_for = (select id from public.courses where slug = 'claude-alapozo')
where c.pocket_for = (select id from public.courses where slug = 'claude-celok-heti-terv');

update public.courses set published = false where slug = 'claude-celok-heti-terv';
