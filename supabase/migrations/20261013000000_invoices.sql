-- Billingo számlák: minden sikeres (nem 0 Ft-os) Stripe fizetéshez egy számla.
-- A stripe_ref egyedi → a webhook és a sikeres-fizetés oldal közül csak az egyik állít ki számlát.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  stripe_ref text not null unique,              -- checkout session id (cs_…) vagy Stripe invoice id (in_…, előfizetés)
  kind text not null check (kind in ('checkout', 'subscription')),
  user_id uuid references public.profiles (id) on delete set null,
  email text,
  amount_huf integer not null,
  description text not null,
  status text not null default 'pending' check (status in ('pending', 'issued', 'failed')),
  billingo_document_id bigint,
  invoice_number text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
create policy "számlák: admin kezeli" on public.invoices for all using (public.is_admin()) with check (public.is_admin());
create policy "számlák: saját" on public.invoices for select using (user_id = auth.uid());

alter table public.profiles add column billingo_partner_id bigint;
