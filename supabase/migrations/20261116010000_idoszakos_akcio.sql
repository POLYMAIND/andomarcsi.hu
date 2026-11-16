-- Időszakos akció kurzusonként: akciós ár, kezdet (üres = azonnal), vég (üres = visszavonásig), címke.
-- Az oldal és a fizetés a kezdet és a vég között az akciós árat használja, utána magától visszaáll a rendes ár.
-- Az adminban: Kurzus szerkesztése → „Időszakos akció”. Újrafuttatható.
alter table public.courses add column if not exists sale_price_huf integer;
alter table public.courses add column if not exists sale_starts_at timestamptz;
alter table public.courses add column if not exists sale_ends_at timestamptz;
alter table public.courses add column if not exists sale_label text not null default '';

do $$ begin
  alter table public.courses add constraint courses_sale_price_check
    check (sale_price_huf is null or (sale_price_huf > 0 and (price_huf is null or sale_price_huf < price_huf)));
exception when duplicate_object then null; end $$;
