-- Apply once as postgres in the Supabase SQL Editor. No existing policies are changed.
begin;

create schema saphe_calendar_private;
revoke all on schema saphe_calendar_private from public, anon, authenticated;

create table saphe_calendar_private.teachers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table saphe_calendar_private.teachers enable row level security;
revoke all on saphe_calendar_private.teachers from public, anon, authenticated;

create table public.intensives (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id),
  name text not null check (char_length(btrim(name)) between 1 and 150),
  description text not null default '' check (char_length(description) <= 3000),
  type text not null check (type in ('summer', 'christmas', 'pau', 'exams')),
  subject text not null check (subject in ('maths', 'social_maths', 'physics', 'chemistry', 'physics_chemistry', 'biology')),
  level text not null check (level in ('eso1', 'eso2', 'eso3', 'eso4', 'bach1', 'bach2', 'ib_sl', 'ib_hl', 'pau')),
  modality text not null check (modality in ('online', 'onsite')),
  start_date date not null check (start_date >= date '2000-09-01'),
  end_date date not null check (end_date < date '2200-09-01' and end_date - start_date between 0 and 366),
  status text not null check (status in ('draft', 'published', 'cancelled')),
  capacity integer check (capacity between 1 and 10000),
  available integer check (available is null or (capacity is not null and available between 0 and capacity)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.intensive_sessions (
  id uuid primary key default gen_random_uuid(),
  intensive_id uuid not null references public.intensives(id) on delete cascade,
  date date not null,
  start_time time without time zone not null check (start_time < time '24:00' and extract(second from start_time) = 0),
  end_time time without time zone not null check (end_time < time '24:00' and end_time > start_time and extract(second from end_time) = 0),
  unique (intensive_id, date, start_time, end_time)
);

create index intensives_owner_idx on public.intensives(teacher_id);
create index intensives_public_period_idx on public.intensives(start_date, end_date) where status = 'published';

create table public.school_calendar_periods (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region in ('AN','AR','AS','CB','CE','CL','CM','CN','CT','EX','GA','IB','MC','MD','ML','NC','PV','RI','VC')),
  academic_year integer not null check (academic_year between 2000 and 2199),
  kind text not null check (kind in ('teaching','non_teaching','term_start','term_end','christmas','easter','holiday','other')),
  start_date date not null,
  end_date date not null,
  label_es text not null default '',
  label_en text not null default '',
  scope_es text not null default '',
  scope_en text not null default '',
  source_url text not null check (source_url ~ '^https://[^[:space:]]+$'),
  verified_on date not null,
  check (start_date >= make_date(academic_year, 9, 1)
    and end_date < make_date(academic_year + 1, 9, 1) and end_date >= start_date)
);
create index school_calendar_region_year_idx on public.school_calendar_periods(region, academic_year, start_date);

alter table public.intensives enable row level security;
alter table public.intensive_sessions enable row level security;
alter table public.school_calendar_periods enable row level security;
revoke all on public.intensives, public.intensive_sessions, public.school_calendar_periods from public, anon, authenticated;

-- Public reads intentionally exclude teacher_id and administrative timestamps.
grant select (id, name, description, type, subject, level, modality, start_date, end_date, status, capacity, available)
  on public.intensives to anon, authenticated;
grant select (id, intensive_id, date, start_time, end_time)
  on public.intensive_sessions to anon, authenticated;
grant select on public.school_calendar_periods to anon, authenticated;

create policy "Published intensives only" on public.intensives for select to anon, authenticated
  using (status = 'published');
create policy "Published intensive sessions only" on public.intensive_sessions for select to anon, authenticated
  using (exists (
    select 1 from public.intensives i where i.id = intensive_id and i.status = 'published'
  ));
create policy "Verified school dates only" on public.school_calendar_periods for select to anon, authenticated
  using (verified_on <= (now() at time zone 'Europe/Madrid')::date);

create function saphe_calendar_private.require_teacher() returns uuid
language plpgsql stable set search_path = '' as $$
declare caller uuid := auth.uid();
begin
  if caller is null or not exists (
    select 1 from saphe_calendar_private.teachers t
    join public.profiles p on p.id = t.user_id
    where t.user_id = caller and p.role = 'teacher'
  ) then
    raise exception using errcode = '42501', message = 'INTENSIVE_TEACHER_REQUIRED';
  end if;
  return caller;
end;
$$;

create function public.list_teacher_intensives() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare caller uuid := saphe_calendar_private.require_teacher();
begin
  return coalesce((
    select jsonb_agg(
      (to_jsonb(i) - 'teacher_id') || jsonb_build_object('sessions', coalesce((
        select jsonb_agg(jsonb_build_object('date', s.date, 'start_time', s.start_time, 'end_time', s.end_time)
          order by s.date, s.start_time)
        from public.intensive_sessions s where s.intensive_id = i.id
      ), '[]'::jsonb)) order by i.start_date desc, i.id
    ) from public.intensives i where i.teacher_id = caller
  ), '[]'::jsonb);
end;
$$;

create function public.save_teacher_intensive(p_details jsonb, p_sessions jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := saphe_calendar_private.require_teacher();
  draft public.intensives := jsonb_populate_record(null::public.intensives, p_details);
  saved_id uuid;
  saved_version timestamptz;
  overlap_found boolean;
begin
  if jsonb_typeof(p_sessions) is distinct from 'array' then
    raise exception using errcode = '22023', message = 'INTENSIVE_INVALID_SESSIONS';
  end if;
  if jsonb_array_length(p_sessions) > 750
    or (draft.status = 'published' and jsonb_array_length(p_sessions) = 0)
    or exists (
      select 1 from jsonb_to_recordset(p_sessions) s(date date, start_time time, end_time time)
      where s.date is null or s.start_time is null or s.end_time is null
        or s.date < draft.start_date or s.date > draft.end_date or s.end_time <= s.start_time
    ) then
    raise exception using errcode = '22023', message = 'INTENSIVE_INVALID_SESSIONS';
  end if;

  if draft.id is null then
    insert into public.intensives
      (teacher_id, name, description, type, subject, level, modality, start_date, end_date, status, capacity, available)
    values (caller, btrim(draft.name), coalesce(draft.description, ''), draft.type, draft.subject,
      draft.level, draft.modality, draft.start_date, draft.end_date, draft.status, draft.capacity, draft.available)
    returning id, updated_at into saved_id, saved_version;
  else
    update public.intensives i set
      name = btrim(draft.name), description = coalesce(draft.description, ''), type = draft.type,
      subject = draft.subject, level = draft.level, modality = draft.modality, start_date = draft.start_date,
      end_date = draft.end_date, status = draft.status, capacity = draft.capacity, available = draft.available,
      updated_at = clock_timestamp()
    where i.id = draft.id and i.teacher_id = caller and i.updated_at = draft.updated_at
    returning i.id, i.updated_at into saved_id, saved_version;
    if not found then
      raise exception using errcode = '40001', message = 'INTENSIVE_STALE_OR_NOT_OWNED';
    end if;
  end if;

  delete from public.intensive_sessions where intensive_id = saved_id;
  insert into public.intensive_sessions (intensive_id, date, start_time, end_time)
    select saved_id, s.date, s.start_time, s.end_time
    from jsonb_to_recordset(p_sessions) s(date date, start_time time, end_time time);

  -- Informative only: conflicts neither stop saving nor block publication.
  select exists (
    select 1 from public.intensive_sessions s
    where s.intensive_id = saved_id and (
      exists (
        select 1 from public.intensive_sessions other
        join public.intensives i on i.id = other.intensive_id
        where i.teacher_id = caller and i.status <> 'cancelled' and other.id <> s.id
          and other.date = s.date and other.start_time < s.end_time and s.start_time < other.end_time
      ) or exists (
        select 1 from public.class_sessions c where c.teacher_id = caller and c.date = s.date
          and c.start_time < s.end_time and s.start_time < c.end_time
      )
    )
  ) into overlap_found;
  return jsonb_build_object('id', saved_id, 'updated_at', saved_version, 'conflict', overlap_found);
end;
$$;

create function public.delete_teacher_intensive(p_id uuid, p_updated_at timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare caller uuid := saphe_calendar_private.require_teacher();
begin
  delete from public.intensives i
  where i.id = p_id and i.teacher_id = caller and i.updated_at = p_updated_at;
  if not found then
    raise exception using errcode = '40001', message = 'INTENSIVE_STALE_OR_NOT_OWNED';
  end if;
end;
$$;

revoke all on function saphe_calendar_private.require_teacher() from public, anon, authenticated;
revoke all on function public.list_teacher_intensives(), public.save_teacher_intensive(jsonb, jsonb),
  public.delete_teacher_intensive(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.list_teacher_intensives(), public.save_teacher_intensive(jsonb, jsonb),
  public.delete_teacher_intensive(uuid, timestamptz) to authenticated;

notify pgrst, 'reload schema';
commit;
