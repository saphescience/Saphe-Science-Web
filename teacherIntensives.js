import { supabase } from './supabaseClient.js';
import {
  h, i18n, tr, calendar, types, subjects, levels, levelLabel, typeLabel,
  dateLabel, dateSpan, datesBetween, validRange, validTime, weekdayLabel, utc,
  timeValue, setupError,
} from './academicCalendar.js?v=1';

export function mountTeacherIntensives(root, getClassSessions) {
  if (!root) return;
  const textBindings = [];
  const labelText = (tag, key, attrs) => {
    const node = h(tag, attrs);
    textBindings.push(() => { node.textContent = tr(key); });
    return node;
  };
  const button = (key, type = 'button', value) => labelText('button', key, {
    type, value, class: 'academic-button',
  });
  const heading = labelText('h2', 'manage', { id: 'intensive-management-title' });
  root.setAttribute('aria-labelledby', heading.id);
  const create = button('new');
  const refresh = button('refresh');
  const commands = h('div', { class: 'academic-actions' }, create, refresh);
  const status = h('p', { class: 'academic-message', role: 'status' });
  const list = h('div', { class: 'academic-details' });
  const form = h('form', { hidden: '' });
  const fieldset = h('fieldset', { class: 'academic-editor' });
  const editHeading = h('legend');
  fieldset.append(editHeading);
  form.append(fieldset);
  root.append(h('div', { class: 'academic-section-head' }, heading, commands), status, list, form);
  create.disabled = true;

  const fields = {};
  const field = (key, label, tag, attrs = {}) => {
    const input = h(tag, { name: key, ...attrs });
    fields[key] = input;
    return h('label', { class: 'academic-field' }, labelText('span', label), input);
  };
  const options = (key, label, values, translate = tr) => {
    const wrapper = field(key, label, 'select', { required: '' });
    const input = fields[key];
    for (const value of ['', ...values]) {
      const option = h('option', { value });
      input.append(option);
      textBindings.push(() => { option.textContent = value ? translate(value) : tr('select'); });
    }
    return wrapper;
  };
  fieldset.append(h('div', { class: 'academic-form-grid' },
    field('name', 'name', 'input', { required: '', maxlength: 150 }),
    options('type', 'type', types, typeLabel),
    options('subject', 'subject', subjects),
    options('level', 'level', levels, levelLabel),
    options('modality', 'modality', ['online', 'onsite']),
    field('start_date', 'starts', 'input', { type: 'date', required: '' }),
    field('end_date', 'ends', 'input', { type: 'date', required: '' }),
    field('capacity', 'capacity', 'input', { type: 'number', min: 1, max: 10000, step: 1 }),
    field('available', 'available', 'input', { type: 'number', min: 0, max: 10000, step: 1 })),
  field('description', 'description', 'textarea', { maxlength: 3000, rows: 3 }));

  const from = field('session_from', 'from', 'input', { type: 'time' });
  const to = field('session_to', 'to', 'input', { type: 'time' });
  const days = h('div', { class: 'academic-weekdays' });
  const weekdayInputs = Array.from({ length: 7 }, (_, day) => {
    const input = h('input', { type: 'checkbox' });
    const caption = h('span');
    textBindings.push(() => { caption.textContent = weekdayLabel(day); input.setAttribute('aria-label', weekdayLabel(day, 'long')); });
    days.append(h('label', {}, input, caption));
    return input;
  });
  const addDays = button('addDays');
  const calendarRoot = h('div');
  const sessionsRoot = h('div', { class: 'academic-session-editor' });
  const editorNotice = h('p', { class: 'academic-message', role: 'status' });
  const warning = h('p', { class: 'academic-warning', role: 'status' });
  const save = button('save', 'submit', 'save');
  const draft = button('saveDraft', 'submit', 'draft');
  const publish = button('publish', 'submit', 'published');
  const unpublish = button('unpublish', 'submit', 'draft');
  const cancel = button('cancel', 'submit', 'cancelled');
  const remove = button('delete');
  fieldset.append(labelText('h3', 'sessions'), labelText('p', 'timezone'),
    labelText('h4', 'sessionTime'), h('div', { class: 'academic-form-grid' }, from, to),
    calendarRoot, h('div', { class: 'academic-actions' }, days, addDays), sessionsRoot, warning,
    h('div', { class: 'academic-actions' }, save, draft, publish, unpublish, cancel, remove), editorNotice);

  let rows = [];
  let sessions = [];
  let editing = null;
  let dirty = false;
  let busy = false;
  let permitted = false;
  let statusKey = 'loading';
  let editorKey = '';
  const selectedCalendar = calendar(calendarRoot, {
    yearControl: true,
    onDay: day => addSessions([day]),
    markers: day => [
      ...(validRange(fields.start_date.value, fields.end_date.value) &&
        day >= fields.start_date.value && day <= fields.end_date.value
        ? [{ period: true, label: tr('period') }] : []),
      ...(sessions.some(s => s.date === day) ? [{ code: 'summer', label: tr('sessions') }] : []),
    ],
  });

  const setEditorStatus = key => { editorKey = key; editorNotice.textContent = tr(key); };
  function setBusy(value) {
    busy = value;
    fieldset.disabled = value || !permitted;
    create.disabled = value || !permitted;
    refresh.disabled = value;
    list.querySelectorAll('button').forEach(item => { item.disabled = value; });
  }
  const overlaps = (a, b) => a.date === b.date && timeValue(a.start_time) < timeValue(b.end_time)
    && timeValue(b.start_time) < timeValue(a.end_time);
  function checkOverlap() {
    const other = rows.filter(row => row.id !== editing?.id && row.status !== 'cancelled').flatMap(row => row.sessions);
    const classes = getClassSessions().map(row => ({ date: row.dateISO, start_time: row.hour, end_time: row.endHour }));
    const conflict = sessions.some((session, index) =>
      validTime(session.start_time, session.end_time) && (
        sessions.some((candidate, i) => i !== index && overlaps(session, candidate)) ||
        other.some(candidate => overlaps(session, candidate)) || classes.some(candidate => overlaps(session, candidate))));
    warning.textContent = conflict ? tr('conflictPreview') : '';
  }
  function drawSessions() {
    sessions.sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time));
    sessionsRoot.replaceChildren(...sessions.map((session, index) => {
      const makeTime = (key, label) => {
        const input = h('input', { type: 'time', value: timeValue(session[key]), required: '', 'aria-label': `${tr(label)} · ${dateLabel(session.date)}` });
        input.addEventListener('input', () => { session[key] = input.value; dirty = true; checkOverlap(); });
        return input;
      };
      const drop = h('button', { class: 'academic-button', type: 'button',
        'aria-label': `${tr('remove')} · ${dateLabel(session.date)} · ${session.start_time}` }, '×');
      drop.addEventListener('click', () => {
        sessions.splice(index, 1);
        dirty = true;
        redraw();
        sessionsRoot.querySelectorAll('button')[Math.min(index, sessions.length - 1)]?.focus();
        if (!sessions.length) addDays.focus();
      });
      return h('div', { class: 'academic-session-row' }, h('strong', {}, dateLabel(session.date)),
        makeTime('start_time', 'from'), makeTime('end_time', 'to'), drop);
    }));
    checkOverlap();
  }
  function redraw() { selectedCalendar.draw(); drawSessions(); }
  function canSwitch() { return !busy && (!dirty || window.confirm(tr('confirmDiscard'))); }
  function open(row) {
    editing = row || null;
    form.reset();
    for (const [key, input] of Object.entries(fields)) input.value = row?.[key] ?? '';
    sessions = row?.sessions.map(session => ({ ...session, start_time: timeValue(session.start_time), end_time: timeValue(session.end_time) })) || [];
    form.hidden = false;
    dirty = false;
    if (row) selectedCalendar.go(row.start_date, false);
    syncEditor();
    redraw();
    setEditorStatus('');
    fields.name.focus();
  }
  function syncEditor() {
    editHeading.textContent = editing ? `${tr('edit')} · ${tr(editing.status)}` : tr('new');
    draft.hidden = editing?.status === 'published';
    save.hidden = !editing;
    publish.hidden = editing?.status === 'published';
    unpublish.hidden = editing?.status !== 'published';
    cancel.hidden = !editing || editing.status === 'cancelled';
    remove.hidden = !editing;
  }
  function drawList() {
    list.replaceChildren(...rows.map(row => {
      const edit = h('button', { type: 'button', class: 'academic-button', disabled: busy ? '' : null,
        'aria-label': `${tr('edit')}: ${row.name}` }, tr('edit'));
      edit.addEventListener('click', () => { if (canSwitch()) open(row); });
      return h('article', { class: 'academic-item academic-list-row' }, h('div', {},
        h('strong', {}, row.name), h('p', {}, `${dateSpan(row.start_date, row.end_date)} · ${tr(row.status)}`)), edit);
    }));
    status.textContent = tr(statusKey || (rows.length ? '' : 'listEmpty'));
  }
  async function load() {
    if (busy) return;
    setBusy(true);
    statusKey = 'loading';
    drawList();
    try {
      const { data, error } = await supabase.rpc('list_teacher_intensives');
      if (error) throw error;
      rows = data;
      permitted = true;
      statusKey = '';
    } catch (error) {
      rows = [];
      permitted = false;
      statusKey = setupError(error);
    } finally {
      setBusy(false);
      drawList();
      checkOverlap();
    }
  }
  function addSessions(dates) {
    if (busy) return;
    const start = fields.start_date.value, end = fields.end_date.value;
    const from = fields.session_from.value, to = fields.session_to.value;
    if (!validRange(start, end)) return setEditorStatus('invalidRange');
    if (!validTime(from, to)) return setEditorStatus('invalidTime');
    if (dates.some(date => date < start || date > end)) return setEditorStatus('outside');
    const candidates = dates.filter(date => !sessions.some(s => s.date === date && s.start_time === from && s.end_time === to));
    if (!candidates.length) return setEditorStatus('noNewDays');
    if (sessions.length + candidates.length > 750) return setEditorStatus('tooMany');
    sessions.push(...candidates.map(date => ({ date, start_time: from, end_time: to })));
    dirty = true;
    redraw();
    setEditorStatus('');
  }
  addDays.addEventListener('click', () => {
    if (!validRange(fields.start_date.value, fields.end_date.value)) return setEditorStatus('invalidRange');
    if (!weekdayInputs.some(input => input.checked)) return setEditorStatus('needsDays');
    addSessions(datesBetween(fields.start_date.value, fields.end_date.value)
      .filter(date => weekdayInputs[(utc(date).getUTCDay() + 6) % 7].checked));
  });
  function validate(data) {
    if (!validRange(data.start_date, data.end_date)) return 'invalidRange';
    if (!data.name || !data.type || !data.subject || !data.level || !data.modality) return 'invalid';
    if (data.available != null && (data.capacity == null || data.available > data.capacity)) return 'invalidPlaces';
    if (sessions.length > 750) return 'tooMany';
    if (data.status === 'published' && !sessions.length) return 'needsSession';
    if (sessions.some(s => s.date < data.start_date || s.date > data.end_date)) return 'outside';
    if (sessions.some(s => !validTime(s.start_time, s.end_time))) return 'invalidTime';
    if (new Set(sessions.map(s => [s.date, s.start_time, s.end_time].join('|'))).size !== sessions.length) return 'duplicates';
    return '';
  }
  const mutationError = error => error?.code === '40001' ? 'stale'
    : error?.code === '42501' ? 'denied' : 'failed';
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !permitted) return;
    const action = event.submitter?.value || 'save';
    const data = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, input.value.trim()]));
    delete data.session_from;
    delete data.session_to;
    data.capacity = data.capacity ? Number(data.capacity) : null;
    data.available = data.available !== '' ? Number(data.available) : null;
    data.id = editing?.id ?? null;
    data.updated_at = editing?.updated_at ?? null;
    data.status = action === 'save' ? editing?.status || 'draft' : action;
    const issue = validate(data);
    if (issue) return setEditorStatus(issue);
    setBusy(true);
    setEditorStatus('loading');
    try {
      const { data: result, error } = await supabase.rpc('save_teacher_intensive', { p_details: data, p_sessions: sessions });
      if (error) throw error;
      editing = { ...data, id: result.id, updated_at: result.updated_at, sessions: sessions.map(s => ({ ...s })) };
      rows = [editing, ...rows.filter(row => row.id !== editing.id)].sort((a, b) => b.start_date.localeCompare(a.start_date));
      dirty = false;
      syncEditor();
      setEditorStatus(result.conflict ? 'conflict' : 'saved');
    } catch (error) {
      setEditorStatus(mutationError(error));
    } finally {
      setBusy(false);
      drawList();
    }
  });

  remove.addEventListener('click', async () => {
    if (!editing || busy || !permitted || !window.confirm(tr('confirmDelete'))) return;
    setBusy(true);
    try {
      const { error } = await supabase.rpc('delete_teacher_intensive', {
        p_id: editing.id, p_updated_at: editing.updated_at,
      });
      if (error) throw error;
      rows = rows.filter(row => row.id !== editing.id);
      editing = null;
      dirty = false;
      form.hidden = true;
      statusKey = 'deleted';
    } catch (error) {
      setEditorStatus(mutationError(error));
    } finally {
      setBusy(false);
      drawList();
      if (form.hidden) create.focus();
    }
  });
  form.addEventListener('input', () => { dirty = true; setEditorStatus(''); });
  fields.start_date.addEventListener('change', () => {
    if (fields.start_date.value) selectedCalendar.go(fields.start_date.value, false);
    else selectedCalendar.draw();
  });
  fields.end_date.addEventListener('change', () => selectedCalendar.draw());
  create.addEventListener('click', () => { if (canSwitch()) open(null); });
  refresh.addEventListener('click', () => load());
  function translate() {
    textBindings.forEach(fn => fn());
    setEditorStatus(editorKey);
    syncEditor();
    drawList();
    redraw();
  }
  i18n.onLanguageChange(translate);
  translate();
  load();
}
