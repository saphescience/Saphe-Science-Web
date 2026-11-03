-- Run once before publishing the payment controls. Existing classes start
-- unmarked (is_paid = false); the teacher marks confirmed payments manually.
-- Existing teacher-only UPDATE / own-class SELECT policies remain in effect.
alter table public.class_sessions
  add column if not exists is_paid boolean not null default false;
