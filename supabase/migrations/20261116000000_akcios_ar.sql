-- Akciós ár: list_price_huf az áthúzott eredeti ár, sale_until az akció vége.
-- Az akció alatt a price_huf a fizetendő ár; lejárat után automatikusan a list_price_huf érvényes.
alter table public.courses add column if not exists list_price_huf integer;
alter table public.courses add column if not exists sale_until timestamptz;
