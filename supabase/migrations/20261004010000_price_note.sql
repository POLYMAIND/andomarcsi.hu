-- Egyedi árcímke (pl. „PolyOS-tagsággal ingyenes”). Ha ki van töltve, az ár helyett ez látszik.
alter table public.courses add column price_note text not null default '';
