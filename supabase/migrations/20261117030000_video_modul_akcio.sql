-- Videó modul: 49 900 Ft áthúzva, 24 900 Ft (Bevezető ár, lejárat nélkül). Újrafuttatható.
update public.courses set
  price_huf = 49900,
  sale_price_huf = 24900,
  sale_starts_at = null,
  sale_ends_at = null,
  sale_label = 'Bevezető ár'
where slug = 'video-modul';
