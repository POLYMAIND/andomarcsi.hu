-- GEO / SEO mezők a kurzusokhoz:
--   teaser        – rövid, emberi hangú leírás a kártyákon és a kurzusoldal tetején
--   outcome       – „Mit tudsz majd a végére?” (kurzusoldal H2 alatt)
--   workload_min  – a kurzus videóanyagának hossza percben (schema.org courseWorkload)
alter table public.courses add column teaser text not null default '';
alter table public.courses add column outcome text not null default '';
alter table public.courses add column workload_min integer;
