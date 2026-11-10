import { supabase } from './supabaseClient.js';
import {
  calendar, dateLabel, dateSpan, academicYear, regions, types, schoolKinds,
  h, i18n, tr, typeLabel, levelLabel, timeValue, setupError,
} from './academicCalendar.js?v=2';

const intensiveRoot = document.querySelector('#public-intensives');
const language = () => i18n.getLanguage();
const includes = (item, date) => item.start_date <= date && item.end_date >= date;
const time = session => `${timeValue(session.start_time)}–${timeValue(session.end_time)}`;
const sessionList = sessions => h('ul', { class: 'academic-sessions' }, ...sessions.map(session =>
  h('li', {}, `${dateLabel(session.date)} · ${time(session)}`)));
const sortedSessions = sessions => [...sessions].sort((a, b) =>
  (a.date + a.start_time).localeCompare(b.date + b.start_time));

function shell(root, title) {
  const heading = h('h2', { id: `${root.id}-heading` });
  const refresh = h('button', { class: 'academic-button', type: 'button' });
  const notice = h('p', { class: 'academic-message', role: 'status' });
  const body = h('div');
  const legend = h('ul', { class: 'academic-legend' });
  const legendTitle = h('p', { class: 'academic-key-title' });
  const key = h('div', { class: 'academic-key' }, legendTitle, legend);
  const details = h('div', { class: 'academic-details' });
  root.setAttribute('aria-labelledby', heading.id);
  root.append(h('div', { class: 'academic-section-head' }, heading, refresh), body, notice, details);
  return {
    body, legend, key, notice, details, refresh,
    translate() {
      heading.textContent = tr(title);
      refresh.textContent = tr('refresh');
      legendTitle.textContent = tr('legend');
    },
  };
}

function legend(root, entries) {
  root.replaceChildren(...entries.map(([code, label]) =>
    h('li', {}, h('i', { class: 'academic-dot', 'data-code': code, 'aria-hidden': 'true' }), label)));
}

async function readAll(makeQuery) {
  const rows = [];
  for (let offset = 0; ; offset += 250) {
    const { data, error } = await makeQuery().range(offset, offset + 249);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 250) return rows;
  }
}

const intensive = shell(intensiveRoot, 'public');
const schoolNotice = h('p', { class: 'academic-message', role: 'status' });
const schoolDetails = h('div', { class: 'academic-details' });
const schoolTitle = h('h4');
const schoolLegend = h('ul', { class: 'academic-legend' });
const schoolKey = h('div', { class: 'academic-school-key', hidden: '' }, schoolTitle, schoolLegend);
intensive.key.append(schoolKey);
intensiveRoot.append(schoolNotice, schoolDetails);
const communities = h('optgroup');
const cities = h('optgroup');
const region = h('select', {}, h('option', { value: '' }), communities, cities);
const cityCodes = new Set(['CE', 'ML']);
for (const [value, name] of Object.entries(regions).sort(([, a], [, b]) => a.localeCompare(b, 'es'))) {
  (cityCodes.has(value) ? cities : communities).append(h('option', { value }, name));
}
const regionLabel = h('span');
const info = h('p', { class: 'academic-note' });
intensive.body.append(h('label', { class: 'academic-field academic-region' }, regionLabel, region), info);
let schoolRows = [];
let schoolStatus = '';
let schoolRequest = 0;
let schoolCacheKey = '';
const schoolCode = kind => kind === 'christmas' ? 'school-christmas' : kind;

function showSchool() {
  regionLabel.textContent = `${tr('school')} · ${tr('region')}`;
  communities.label = tr('communities');
  cities.label = tr('cities');
  region.options[0].textContent = tr('select');
  info.textContent = tr('schoolInfo');
  info.hidden = !region.value;
  schoolKey.hidden = !region.value;
  schoolTitle.textContent = tr('school');
  legend(schoolLegend, schoolKinds.map(kind => [schoolCode(kind), tr(kind)]));
  const [from, to] = intensiveCalendar.bounds();
  const monthRows = schoolRows.filter(row => row.start_date <= to && row.end_date >= from);
  const rows = selectedDay ? monthRows.filter(row => includes(row, selectedDay)) : monthRows;
  schoolNotice.textContent = region.value && (schoolStatus || !monthRows.length)
    ? `${tr('school')}: ${tr(schoolStatus || 'schoolMonthEmpty')}` : '';
  schoolDetails.replaceChildren();
  if (rows.length) schoolDetails.append(h('h3', {}, selectedDay
    ? `${tr('schoolDay')} · ${dateLabel(selectedDay)}` : tr('school')));
  for (const row of rows) {
    const suffix = language();
    schoolDetails.append(h('article', { class: 'academic-item' },
      h('h4', {}, row[`label_${suffix}`] || tr(row.kind)),
      h('p', {}, dateSpan(row.start_date, row.end_date)),
      row[`scope_${suffix}`] ? h('p', {}, row[`scope_${suffix}`]) : null,
      h('p', {}, h('a', { href: row.source_url, target: '_blank', rel: 'noopener noreferrer' }, tr('source')),
        ` · ${tr('verified')} ${dateLabel(row.verified_on)}`)));
  }
}

async function loadSchool(force = false) {
  const id = ++schoolRequest;
  const year = academicYear(intensiveCalendar.bounds()[0]);
  const code = region.value;
  const key = `${code}/${year}`;
  if (!force && key === schoolCacheKey) { showSchool(); return; }
  schoolRows = [];
  schoolCacheKey = '';
  schoolStatus = code ? 'loading' : '';
  intensiveCalendar.draw();
  showSchool();
  if (!code) return;
  try {
    const rows = await readAll(() => supabase.from('school_calendar_periods')
      .select('id,kind,start_date,end_date,label_es,label_en,scope_es,scope_en,source_url,verified_on')
      .eq('region', code).eq('academic_year', year).order('start_date').order('id'));
    if (id !== schoolRequest) return;
    schoolRows = rows;
    schoolCacheKey = key;
    schoolStatus = rows.length ? '' : 'schoolEmpty';
  } catch (error) {
    if (id !== schoolRequest) return;
    schoolStatus = setupError(error);
  }
  intensiveCalendar.draw();
  showSchool();
}

let intensiveRows = [];
let selectedDay = '';
let intensiveStatus = 'loading';
let intensiveRequest = 0;
const intensiveCalendar = calendar(intensive.body, {
  legend: intensive.key,
  onMonth: () => { selectedDay = ''; loadIntensives(); loadSchool(); },
  onDay: day => { selectedDay = day; showIntensives(true); showSchool(); },
  markers: day => [
    ...intensiveRows.flatMap(row => includes(row, day) ? [
      { period: true, label: tr('period') },
      ...row.intensive_sessions.filter(session => session.date === day)
        .map(() => ({ code: row.type, label: row.name })),
    ] : []),
    ...schoolRows.filter(row => includes(row, day))
      .map(row => ({ code: schoolCode(row.kind), label: tr(row.kind) })),
  ],
});

function showIntensives(keepOpen = false) {
  const open = new Set(keepOpen ? [...intensive.details.querySelectorAll('details[open]')].map(item => item.dataset.id) : []);
  intensive.translate();
  legend(intensive.legend, [['today', tr('today')], ...types.map(type => [type, typeLabel(type)]), ['period', tr('period')]]);
  intensive.notice.textContent = tr(intensiveStatus || (intensiveRows.length ? '' : 'intensiveEmpty'));
  intensive.details.replaceChildren();
  if (selectedDay && !intensiveStatus) {
    const sessions = intensiveRows.flatMap(row => row.intensive_sessions
      .filter(session => session.date === selectedDay).map(session => ({ ...session, name: row.name })))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    intensive.details.append(h('h3', {}, `${tr('chooseDay')} · ${dateLabel(selectedDay)}`),
      sessions.length ? h('ul', {}, ...sessions.map(session => h('li', {}, `${time(session)} · ${session.name}`)))
        : h('p', {}, tr('noSessions')));
  }
  for (const row of intensiveRows) {
    const details = h('details', { class: 'academic-item', 'data-id': row.id });
    details.open = open.has(row.id);
    details.append(h('summary', {}, h('strong', {}, row.name), h('span', {}, dateSpan(row.start_date, row.end_date))),
      h('p', {}, [typeLabel(row.type), tr(row.subject), levelLabel(row.level), tr(row.modality)].join(' · ')));
    if (row.description) details.append(h('p', { class: 'academic-description' }, row.description));
    if (row.capacity != null) details.append(h('p', {}, `${tr('capacity')}: ${row.capacity}` +
      (row.available != null ? ` · ${tr('available')}: ${row.available}` : '')));
    details.append(h('h4', {}, `${tr('sessions')} · ${tr('timezone')}`), sessionList(sortedSessions(row.intensive_sessions)));
    intensive.details.append(details);
  }
}

async function loadIntensives() {
  const id = ++intensiveRequest;
  const [from, to] = intensiveCalendar.bounds();
  intensiveRows = [];
  intensiveStatus = 'loading';
  intensiveCalendar.draw();
  showIntensives();
  try {
    const rows = await readAll(() => supabase.from('intensives')
      .select('id,name,description,type,subject,level,modality,start_date,end_date,capacity,available,intensive_sessions(id,date,start_time,end_time)')
      .eq('status', 'published').lte('start_date', to).gte('end_date', from).order('start_date').order('id'));
    if (id !== intensiveRequest) return;
    intensiveRows = rows;
    intensiveStatus = '';
  } catch (error) {
    if (id !== intensiveRequest) return;
    intensiveStatus = setupError(error);
  }
  intensiveCalendar.draw();
  showIntensives();
}

region.addEventListener('change', () => loadSchool());
intensive.refresh.addEventListener('click', () => { loadIntensives(); loadSchool(true); });
window.addEventListener('pageshow', event => { if (event.persisted) loadIntensives(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadIntensives(); });
i18n.onLanguageChange(() => {
  showSchool();
  intensiveCalendar.draw(); showIntensives(true);
});
showSchool();
loadIntensives();
