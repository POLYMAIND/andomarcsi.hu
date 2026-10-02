-- Indulási dátum: a „Hamarosan” kurzus a starts_at időpontban magától élesedik
-- (az előrendelők és előfizetők ekkortól látják a videókat).
alter table public.courses add column if not exists starts_at timestamptz;

create or replace function public.course_is_live(c public.courses) returns boolean language sql stable as $$
  select c.published and (not c.coming_soon or (c.starts_at is not null and c.starts_at <= now()));
$$;

create or replace function public.has_course_access(cid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_admin()
    or (
      exists (select 1 from public.courses c where c.id = cid and public.course_is_live(c))
      and (
        exists (select 1 from public.courses c where c.id = cid and c.price_huf = 0)
        or exists (select 1 from public.enrollments e where e.course_id = cid and e.user_id = auth.uid())
        or (public.has_active_subscription() and exists (select 1 from public.courses c where c.id = cid and c.included_in_subscription))
      )
    );
$$;

alter policy "videó: csak jogosultaknak" on public.lesson_videos using (
  public.is_admin()
  or exists (
    select 1 from public.lessons l join public.courses c on c.id = l.course_id
    where l.id = lesson_id and public.course_is_live(c) and l.published_at <= now()
      and (l.is_preview or public.has_course_access(l.course_id))
  )
);

alter policy "beiratkozás: ingyenes kurzusra" on public.enrollments with check (
  user_id = auth.uid() and source = 'free' and amount_huf = 0 and stripe_session_id is null
  and exists (select 1 from public.courses c where c.id = course_id and public.course_is_live(c) and c.price_huf = 0)
);
