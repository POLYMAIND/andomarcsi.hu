-- „Hamarosan” állapot: a kurzus látszik, de még nem vásárolható és nem nézhető.
-- Állapotok: vázlat (published = false) · hamarosan (published + coming_soon) · elérhető (published, nem coming_soon)
alter table public.courses add column coming_soon boolean not null default false;

create or replace function public.has_course_access(cid uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select public.is_admin()
    or (
      exists (select 1 from public.courses c where c.id = cid and c.published and not c.coming_soon)
      and (
        exists (select 1 from public.courses c where c.id = cid and c.price_huf = 0)
        or exists (select 1 from public.enrollments e where e.course_id = cid and e.user_id = auth.uid())
        or (
          public.has_active_subscription()
          and exists (select 1 from public.courses c where c.id = cid and c.included_in_subscription)
        )
      )
    );
$$;

drop policy "videó: csak jogosultaknak" on public.lesson_videos;
create policy "videó: csak jogosultaknak" on public.lesson_videos
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.lessons l
      join public.courses c on c.id = l.course_id
      where l.id = lesson_id
        and c.published
        and not c.coming_soon
        and l.published_at <= now()
        and (l.is_preview or public.has_course_access(l.course_id))
    )
  );

drop policy "beiratkozás: ingyenes kurzusra" on public.enrollments;
create policy "beiratkozás: ingyenes kurzusra" on public.enrollments
  for insert with check (
    user_id = auth.uid()
    and source = 'free'
    and amount_huf = 0
    and stripe_session_id is null
    and exists (select 1 from public.courses c where c.id = course_id and c.published and not c.coming_soon and c.price_huf = 0)
  );
