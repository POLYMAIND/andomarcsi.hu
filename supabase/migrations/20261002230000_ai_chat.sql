-- AI segítő: napi kérdéskeret felhasználónként (a szerver számolja, service role-lal).
create table if not exists public.ai_chat_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default (now() at time zone 'Europe/Budapest')::date,
  count integer not null default 0,
  primary key (user_id, day)
);
alter table public.ai_chat_usage enable row level security;
create policy "ai csevegő: saját keret" on public.ai_chat_usage for select using (user_id = auth.uid() or public.is_admin());

-- Atomikus növelés; -1, ha elfogyott a napi keret.
create or replace function public.bump_ai_chat(uid uuid, max_per_day integer) returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  insert into public.ai_chat_usage (user_id, day, count)
  values (uid, (now() at time zone 'Europe/Budapest')::date, 1)
  on conflict (user_id, day) do update set count = ai_chat_usage.count + 1
  where ai_chat_usage.count < max_per_day
  returning count into n;
  return coalesce(n, -1);
end;
$$;
revoke execute on function public.bump_ai_chat(uuid, integer) from public, anon, authenticated;
grant execute on function public.bump_ai_chat(uuid, integer) to service_role;
