export const regions = {
  AN: 'Andalucía', AR: 'Aragón', AS: 'Principado de Asturias', CB: 'Cantabria', CE: 'Ceuta',
  CL: 'Castilla y León', CM: 'Castilla-La Mancha', CN: 'Canarias', CT: 'Cataluña',
  EX: 'Extremadura', GA: 'Galicia', IB: 'Illes Balears', MC: 'Región de Murcia',
  MD: 'Comunidad de Madrid', ML: 'Melilla', NC: 'Comunidad Foral de Navarra', PV: 'País Vasco',
  RI: 'La Rioja', VC: 'Comunitat Valenciana',
};

const pairs = {
  school: ['Calendario escolar', 'School Calendar'],
  public: ['Calendario de intensivos', 'Intensive Courses Calendar'],
  manage: ['INTENSIVOS', 'INTENSIVE COURSES'],
  region: ['Comunidad autónoma', 'Autonomous community'],
  communities: ['Comunidades autónomas', 'Autonomous communities'],
  cities: ['Ciudades autónomas', 'Autonomous cities'],
  legend: ['Leyenda', 'Legend'],
  today: ['Hoy', 'Today'],
  chooseRegion: ['Selecciona una comunidad autónoma.', 'Select an autonomous community.'],
  year: ['Inicio del curso académico', 'Academic year starts'],
  month: ['Mes', 'Month'],
  previous: ['Mes anterior', 'Previous month'],
  next: ['Mes siguiente', 'Next month'],
  refresh: ['Actualizar', 'Refresh'],
  schoolInfo: ['Calendario informativo. Pueden existir diferencias por etapa, municipio o centro. Los días sin marca no están verificados.', 'For information only. Dates can vary by stage, municipality or school. Unmarked days are not verified.'],
  schoolEmpty: ['No hay fechas oficiales verificadas para esta comunidad y curso.', 'No verified official dates for this region and academic year.'],
  schoolMonthEmpty: ['No hay periodos verificados en este mes.', 'No verified periods in this month.'],
  intensiveEmpty: ['No hay intensivos publicados para este mes.', 'No intensive courses are published for this month.'],
  noSessions: ['No hay sesiones en esta fecha.', 'No sessions on this date.'],
  chooseDay: ['Sesiones del día', 'Sessions on this day'],
  schoolDay: ['Periodos del día', 'Periods on this day'],
  loading: ['Cargando…', 'Loading…'],
  loadError: ['No se pudieron cargar los datos. Vuelve a intentarlo.', 'Could not load data. Try again.'],
  setup: ['El calendario aún no está configurado en Supabase.', 'The calendar is not set up in Supabase yet.'],
  period: ['Periodo del intensivo', 'Intensive course period'],
  dates: ['Fechas', 'Dates'],
  time: ['Horario', 'Schedule'],
  starts: ['Fecha de inicio', 'Start date'],
  ends: ['Fecha final', 'End date'],
  from: ['Hora de inicio', 'Start time'],
  to: ['Hora final', 'End time'],
  type: ['Tipo', 'Type'],
  subject: ['Asignatura', 'Subject'],
  level: ['Nivel educativo', 'Education level'],
  modality: ['Modalidad', 'Mode'],
  capacity: ['Plazas máximas', 'Maximum places'],
  available: ['Plazas disponibles', 'Available places'],
  name: ['Nombre del intensivo', 'Intensive course name'],
  description: ['Descripción', 'Description'],
  source: ['Fuente oficial', 'Official source'],
  verified: ['Verificado el', 'Verified on'],
  teaching: ['Lectivo', 'Teaching day'],
  non_teaching: ['No lectivo', 'Non-teaching day'],
  term_start: ['Inicio de curso', 'Start of school year'],
  term_end: ['Fin de curso', 'End of school year'],
  christmas: ['Vacaciones de Navidad', 'Christmas break'],
  easter: ['Vacaciones de Semana Santa', 'Easter break'],
  holiday: ['Festivo escolar', 'School holiday'],
  other: ['Otro periodo', 'Other period'],
  summer: ['Intensivo de verano', 'Summer intensive'],
  intensive_christmas: ['Intensivo de Navidad', 'Christmas intensive'],
  pau: ['Intensivo PAU', 'PAU intensive'],
  exams: ['Preparación de exámenes', 'Exam preparation'],
  maths: ['Matemáticas', 'Mathematics'],
  social_maths: ['Matemáticas Aplicadas a las Ciencias Sociales', 'Mathematics Applied to Social Sciences'],
  physics: ['Física', 'Physics'],
  chemistry: ['Química', 'Chemistry'],
  physics_chemistry: ['Física y Química', 'Physics and Chemistry'],
  biology: ['Biología', 'Biology'],
  eso1: ['1.º ESO', 'ESO Year 1'],
  eso2: ['2.º ESO', 'ESO Year 2'],
  eso3: ['3.º ESO', 'ESO Year 3'],
  eso4: ['4.º ESO', 'ESO Year 4'],
  bach1: ['1.º de Bachillerato', 'Bachillerato Year 1'],
  bach2: ['2.º de Bachillerato', 'Bachillerato Year 2'],
  ib_sl: ['IB · SL', 'IB · SL'],
  ib_hl: ['IB · HL', 'IB · HL'],
  level_pau: ['PAU', 'PAU'],
  online: ['Online', 'Online'],
  onsite: ['Presencial', 'In person'],
  draft: ['Borrador', 'Draft'],
  published: ['Publicado', 'Published'],
  cancelled: ['Cancelado', 'Cancelled'],
  new: ['Crear intensivo', 'Create Intensive Course'],
  edit: ['Editar intensivo', 'Edit intensive course'],
  save: ['Guardar cambios', 'Save changes'],
  saveDraft: ['Guardar borrador', 'Save draft'],
  publish: ['Publicar', 'Publish'],
  unpublish: ['Despublicar', 'Unpublish'],
  cancel: ['Cancelar intensivo', 'Cancel course'],
  delete: ['Eliminar', 'Delete'],
  remove: ['Quitar sesión', 'Remove session'],
  confirmDelete: ['¿Eliminar este intensivo y sus sesiones? Esta acción no se puede deshacer.', 'Delete this intensive course and its sessions? This cannot be undone.'],
  confirmDiscard: ['¿Descartar los cambios sin guardar?', 'Discard unsaved changes?'],
  select: ['Seleccionar…', 'Select…'],
  sessions: ['Sesiones', 'Sessions'],
  addDays: ['Añadir días del intervalo', 'Add weekdays in date range'],
  sessionTime: ['Horario para nuevas sesiones', 'Time for new sessions'],
  timezone: ['Hora de Madrid (Europe/Madrid)', 'Madrid time (Europe/Madrid)'],
  listEmpty: ['Todavía no hay intensivos guardados.', 'No intensive courses saved yet.'],
  denied: ['Esta cuenta no está autorizada para gestionar intensivos.', 'This account is not authorised to manage intensive courses.'],
  invalid: ['Revisa los campos obligatorios y los datos introducidos.', 'Check required fields and entered values.'],
  invalidRange: ['Indica un intervalo válido de hasta 366 días entre inicio y fin.', 'Enter a valid range of no more than 366 days between start and end.'],
  invalidTime: ['La hora final debe ser posterior a la inicial.', 'End time must be later than start time.'],
  outside: ['Todas las sesiones deben estar dentro del intervalo.', 'All sessions must be within the date range.'],
  duplicates: ['Hay sesiones duplicadas.', 'There are duplicate sessions.'],
  tooMany: ['No se pueden guardar más de 750 sesiones por intensivo.', 'Up to 750 sessions can be saved per intensive course.'],
  needsSession: ['Añade al menos una sesión antes de publicar.', 'Add at least one session before publishing.'],
  invalidPlaces: ['Indica un máximo de plazas válido y una disponibilidad entre cero y ese máximo.', 'Enter a valid maximum and availability from zero to that maximum.'],
  needsDays: ['Selecciona al menos un día de la semana.', 'Select at least one weekday.'],
  noNewDays: ['No se añadieron sesiones nuevas.', 'No new sessions were added.'],
  saved: ['Cambios guardados.', 'Changes saved.'],
  conflict: ['Guardado. Hay sesiones que coinciden con otra sesión, clase o bloqueo de tu calendario.', 'Saved. Some sessions overlap another session, class or blocked time on your calendar.'],
  conflictPreview: ['Hay sesiones que coinciden con otra sesión, clase o bloqueo de tu calendario.', 'Some sessions overlap another session, class or blocked time on your calendar.'],
  failed: ['No se guardaron los cambios. Revisa los datos e inténtalo de nuevo.', 'Changes were not saved. Check the data and try again.'],
  stale: ['El intensivo ha cambiado o ya no está disponible. Actualiza la lista antes de continuar.', 'The course has changed or is no longer available. Refresh the list before continuing.'],
  deleted: ['Intensivo eliminado.', 'Intensive course deleted.'],
};

export const i18n = window.SapheI18n;
export const tr = key => pairs[key]?.[i18n.getLanguage() === 'en' ? 1 : 0] || key;
export const types = ['summer', 'christmas', 'pau', 'exams'];
export const subjects = ['maths', 'social_maths', 'physics', 'chemistry', 'physics_chemistry', 'biology'];
export const levels = ['eso1', 'eso2', 'eso3', 'eso4', 'bach1', 'bach2', 'ib_sl', 'ib_hl', 'pau'];
export const schoolKinds = ['teaching', 'non_teaching', 'term_start', 'term_end', 'christmas', 'easter', 'holiday', 'other'];
export const typeLabel = key => tr(key === 'christmas' ? 'intensive_christmas' : key);
export const levelLabel = key => tr(key === 'pau' ? 'level_pau' : key);

export function h(tag, attrs = {}, ...children) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value != null) element.setAttribute(key, value);
  }
  element.append(...children.filter(child => child != null));
  return element;
}

const dayMs = 86400000;
export const iso = date => date.toISOString().slice(0, 10);
export const utc = key => new Date(key + 'T00:00:00Z');
export const dateKey = (year, month, day = 1) => iso(new Date(Date.UTC(year, month, day)));
export function madridToday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now);
  const part = name => parts.find(item => item.type === name).value;
  return [part('year'), part('month'), part('day')].join('-');
}
export const academicYear = date => utc(date).getUTCFullYear() - (utc(date).getUTCMonth() < 8 ? 1 : 0);
export function validDate(key) {
  const value = utc(key);
  return /^\d{4}-\d\d-\d\d$/.test(key) && !Number.isNaN(+value) && iso(value) === key;
}
export function validRange(start, end) {
  return validDate(start) && validDate(end) && start >= '2000-09-01' && end < '2200-09-01'
    && end >= start && utc(end) - utc(start) <= 366 * dayMs;
}
export function datesBetween(start, end) {
  if (!validRange(start, end)) return [];
  const list = [];
  for (let n = +utc(start); n <= +utc(end); n += dayMs) list.push(iso(new Date(n)));
  return list;
}
export const timeValue = value => (value || '').slice(0, 5);
export const validTime = (start, end) => /^([01]\d|2[0-3]):[0-5]\d$/.test(start) && /^([01]\d|2[0-3]):[0-5]\d$/.test(end) && end > start;
export const dateLabel = (date, options = { dateStyle: 'medium' }) =>
  new Intl.DateTimeFormat(i18n.locale(), { ...options, timeZone: 'UTC' }).format(utc(date));
export const dateSpan = (start, end) => start === end ? dateLabel(start) : `${dateLabel(start)} – ${dateLabel(end)}`;
export const weekdayLabel = (day, style = 'short') => dateLabel(dateKey(2024, 0, day + 1), { weekday: style });
export const monthLabel = key => dateLabel(key, { month: 'long', year: 'numeric' });
export function setupError(error) {
  return ['42P01', 'PGRST200', 'PGRST202', 'PGRST205'].includes(error?.code) ? 'setup'
    : error?.code === '42501' ? 'denied' : 'loadError';
}

export function calendar(root, { onMonth = () => {}, onDay, markers, yearControl = true, legend }) {
  let month = madridToday().slice(0, 7) + '-01';
  let selected = '';
  const toolbar = h('div', { class: 'academic-toolbar' });
  const grid = h('div', { class: 'academic-grid' });
  const prev = h('button', { type: 'button', class: 'academic-button academic-arrow' }, '‹');
  const next = h('button', { type: 'button', class: 'academic-button academic-arrow' }, '›');
  const caption = h('strong', { class: 'academic-month', 'aria-live': 'polite' });
  const yearInput = h('input', { type: 'number', min: 2000, max: 2199, step: 1 });
  const yearText = h('span');
  const yearField = h('label', { class: 'academic-field' }, yearText, yearInput);
  const monthSelect = h('select');
  const monthText = h('span');
  const monthField = h('label', { class: 'academic-field' }, monthText, monthSelect);
  toolbar.append(prev, caption, next);
  root.prepend(toolbar);
  if (yearControl) root.append(h('div', { class: 'academic-filters' }, yearField, monthField));
  if (legend) root.append(legend);
  root.append(grid);

  function bounds() {
    const d = utc(month);
    return [month, dateKey(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)];
  }
  function draw(focusDay) {
    const [start, end] = bounds();
    const year = academicYear(start);
    const d = utc(start);
    const today = madridToday();
    prev.setAttribute('aria-label', tr('previous'));
    next.setAttribute('aria-label', tr('next'));
    prev.disabled = start <= '2000-09-01';
    next.disabled = start >= '2200-08-01';
    caption.textContent = monthLabel(start);
    yearText.textContent = tr('year');
    monthText.textContent = tr('month');
    yearInput.value = year;
    monthSelect.replaceChildren(...Array.from({ length: 12 }, (_, i) => {
      const key = dateKey(year, 8 + i);
      return h('option', { value: key }, monthLabel(key));
    }));
    monthSelect.value = start;
    grid.replaceChildren(...Array.from({ length: 7 }, (_, i) =>
      h('span', { class: 'academic-weekday', title: weekdayLabel(i, 'long') }, weekdayLabel(i))));
    const offset = (d.getUTCDay() + 6) % 7;
    for (let i = 0; i < offset; i++) grid.append(h('span', { 'aria-hidden': 'true' }));
    for (const day of datesBetween(start, end)) {
      const marks = markers(day);
      const isToday = day === today;
      const cell = h('button', {
        type: 'button', class: 'academic-day' + (marks.some(mark => mark.period) ? ' has-period' : ''),
        'data-date': day, 'aria-pressed': String(selected === day),
        'aria-current': isToday ? 'date' : null,
        'aria-label': [isToday ? tr('today') : null, dateLabel(day, { dateStyle: 'full' }),
          ...new Set(marks.map(mark => mark.label))].filter(Boolean).join(', '),
      }, h('span', { class: 'academic-day__number' }, String(Number(day.slice(-2)))));
      const dots = h('span', { class: 'academic-dots', 'aria-hidden': 'true' });
      const codes = [...new Set(marks.filter(mark => !mark.period).map(mark => mark.code))];
      for (const code of codes.slice(0, 4)) dots.append(h('i', { class: 'academic-dot', 'data-code': code }));
      cell.append(dots);
      cell.addEventListener('click', () => {
        selected = day;
        onDay(day);
        draw(day);
      });
      grid.append(cell);
    }
    if (focusDay) grid.querySelector(`[data-date="${focusDay}"]`)?.focus({ preventScroll: true });
  }
  function go(key, notify = true) {
    if (!validDate(key) || key < '2000-09-01' || key >= '2200-09-01') return;
    month = key.slice(0, 7) + '-01';
    selected = '';
    draw();
    if (notify) onMonth(...bounds());
  }
  function shift(delta) {
    const d = utc(month);
    go(dateKey(d.getUTCFullYear(), d.getUTCMonth() + delta));
  }
  prev.addEventListener('click', () => shift(-1));
  next.addEventListener('click', () => shift(1));
  monthSelect.addEventListener('change', () => go(monthSelect.value));
  yearInput.addEventListener('change', () => {
    if (!yearInput.value || !yearInput.checkValidity()) { draw(); return; }
    const d = utc(month);
    go(dateKey(Number(yearInput.value) + (d.getUTCMonth() < 8 ? 1 : 0), d.getUTCMonth()));
  });
  draw();
  return { bounds, draw, go };
}
