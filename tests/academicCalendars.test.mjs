import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

// Optional PGlite dependency is installed outside this static website.
const { PGlite } = await import(pathToFileURL(process.argv[2]).href);
const migration = process.argv[3] ?? new URL('../supabase/migrations/20261109_academic_calendars.sql', import.meta.url);
const db = new PGlite();
const teacher = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const student = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const other = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
const classDate = '2027-06-02';

const details = {
  name: 'Prueba de Matemáticas', type: 'pau', subject: 'maths', level: 'pau', modality: 'online',
  start_date: '2027-06-01', end_date: '2027-06-05', status: 'draft', capacity: 8, available: 3,
};
const session = { date: classDate, start_time: '10:00', end_time: '12:00' };
const save = async (data = details, sessions = [session]) => (await db.query(
  'select public.save_teacher_intensive($1::jsonb, $2::jsonb) as value',
  [JSON.stringify(data), JSON.stringify(sessions)],
)).rows[0].value;
const publicRows = () => db.query('select id, name, status from public.intensives');
const sessionRows = () => db.query('select intensive_id, date::text from public.intensive_sessions');
const ownerRows = async () => (await db.query('select public.list_teacher_intensives() as value')).rows[0].value;
async function as(role, id = '') {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  await db.exec(`set role ${role}`);
}
const code = expected => error => error.code === expected;

try {
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create table auth.users (id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    create table public.profiles (id uuid primary key references auth.users(id), role text);
    create table public.class_sessions (teacher_id uuid, date date, start_time time, end_time time);
    insert into auth.users values ('${teacher}'), ('${student}'), ('${other}');
    insert into public.profiles values ('${teacher}', 'teacher'), ('${student}', 'student'), ('${other}', 'teacher');
    insert into public.class_sessions values ('${teacher}', '${classDate}', '11:00', '13:00');
    grant select, update on public.profiles to authenticated;
  `);
  await db.exec(await readFile(migration, 'utf8'));
  await db.query('insert into saphe_calendar_private.teachers values ($1), ($2)', [teacher, other]);

  await as('authenticated', teacher);
  let saved = await save();
  assert.equal(saved.conflict, true);
  assert.equal((await ownerRows())[0].status, 'draft');
  assert.equal((await ownerRows())[0].sessions.length, 1);

  await as('anon');
  assert.equal((await publicRows()).rows.length, 0);
  assert.equal((await sessionRows()).rows.length, 0);
  await assert.rejects(save(), code('42501'));
  await assert.rejects(db.query('select teacher_id from public.intensives'), code('42501'));

  await as('authenticated', teacher);
  let edit = { ...details, id: saved.id, updated_at: saved.updated_at, status: 'published' };
  await assert.rejects(save(edit, []), code('22023'));
  await assert.rejects(save(edit, [{ ...session, date: '2027-06-06' }]), code('22023'));
  await assert.rejects(save(edit, [{ ...session, end_time: '09:00' }]), code('22023'));
  await assert.rejects(save(edit, [session, session]), code('23505'));
  assert.equal((await ownerRows())[0].status, 'draft');
  assert.equal((await ownerRows())[0].sessions.length, 1);
  saved = await save(edit);
  await assert.rejects(save(edit), code('40001'));
  await as('anon');
  assert.equal((await publicRows()).rows[0].status, 'published');
  assert.equal((await sessionRows()).rows[0].date, classDate);

  await as('authenticated', student);
  await assert.rejects(save(), code('42501'));
  await db.query("update public.profiles set role = 'teacher' where id = $1", [student]);
  await assert.rejects(save(), code('42501'));
  await assert.rejects(ownerRows(), code('42501'));
  await assert.rejects(db.query("update public.intensives set status = 'draft'"), code('42501'));
  await assert.rejects(db.query('delete from public.intensive_sessions'), code('42501'));

  await as('authenticated', other);
  assert.deepEqual(await ownerRows(), []);
  edit = { ...edit, updated_at: saved.updated_at };
  await assert.rejects(save(edit), code('40001'));
  await assert.rejects(db.query('select public.delete_teacher_intensive($1,$2)', [saved.id, saved.updated_at]), code('40001'));

  await as('authenticated', teacher);
  const updatedSession = { ...session, date: '2027-06-04' };
  saved = await save(edit, [updatedSession]);
  await as('anon');
  assert.deepEqual((await sessionRows()).rows.map(row => row.date), [updatedSession.date]);
  await as('authenticated', teacher);
  saved = await save({ ...edit, updated_at: saved.updated_at, status: 'draft' }, [updatedSession]);
  await as('anon');
  assert.equal((await publicRows()).rows.length, 0);
  assert.equal((await sessionRows()).rows.length, 0);
  await as('authenticated', teacher);
  saved = await save({ ...edit, updated_at: saved.updated_at, status: 'cancelled' }, [updatedSession]);
  await as('anon');
  assert.equal((await publicRows()).rows.length, 0);
  await as('authenticated', teacher);
  await db.query('select public.delete_teacher_intensive($1,$2)', [saved.id, saved.updated_at]);
  assert.deepEqual(await ownerRows(), []);
  await db.exec('reset role');
  assert.equal((await sessionRows()).rows.length, 0);

  await db.exec(`
    insert into public.school_calendar_periods
      (region, academic_year, kind, start_date, end_date, source_url, verified_on) values
      ('MD', 2026, 'term_start', '2026-09-09', '2026-09-09', 'https://example.invalid/test-only', '2020-01-01'),
      ('MD', 2026, 'term_end', '2027-06-30', '2027-06-30', 'https://example.invalid/test-only', '2199-01-01');
  `);
  await as('anon');
  assert.equal((await db.query('select kind from public.school_calendar_periods')).rows.length, 1);
  await assert.rejects(db.query('delete from public.school_calendar_periods'), code('42501'));
  console.log('PASS: drafts, publishing, date changes, unpublishing, cancellation, deletion, atomic validation, role escalation denied, ownership, verified school periods.');
} finally {
  await db.close();
}
