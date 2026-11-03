-- Run once in the Supabase SQL Editor. This adds a new teacher-only table;
-- existing students, classes, materials and their policies are not changed.
begin;

create table public.student_billing_settings (
  student_id uuid primary key references public.students(id) on delete cascade,
  teacher_id uuid not null references auth.users(id),
  hourly_rate numeric(10, 2) not null check (hourly_rate >= 0),
  payer_name text check (char_length(payer_name) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_billing_settings_teacher_id_idx
  on public.student_billing_settings(teacher_id);

alter table public.student_billing_settings enable row level security;
revoke all on public.student_billing_settings from public, anon, authenticated;
grant select, insert, update on public.student_billing_settings to authenticated;

create policy "Teacher reads own student billing settings"
on public.student_billing_settings for select to authenticated
using (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.students s
    where s.id = student_billing_settings.student_id and s.created_by = (select auth.uid())
  )
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
);

create policy "Teacher creates own student billing settings"
on public.student_billing_settings for insert to authenticated
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.students s
    where s.id = student_billing_settings.student_id and s.created_by = (select auth.uid())
  )
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
);

create policy "Teacher updates own student billing settings"
on public.student_billing_settings for update to authenticated
using (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.students s
    where s.id = student_billing_settings.student_id and s.created_by = (select auth.uid())
  )
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
)
with check (
  teacher_id = (select auth.uid())
  and exists (
    select 1 from public.students s
    where s.id = student_billing_settings.student_id and s.created_by = (select auth.uid())
  )
  and exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'teacher'
  )
);

commit;
