import { supabase } from "./supabaseClient.js";

const hours = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const UNAVAILABLE_VALUE = "__unavailable__";
const CLASS_MATERIALS_BUCKET = "class-materials";
const subjectNames = {
  mathEs: "Matematicas en castellano",
  mathEn: "Calculus in English",
  physicsEs: "Fisica en castellano",
  physicsEn: "Physics in English",
};

const teacherForm = document.querySelector("#teacher-form");
const teacherStatus = document.querySelector("#teacher-status");
const studentList = document.querySelector("#teacher-student-list");
const scheduleHead = document.querySelector("#teacher-schedule-head");
const scheduleBody = document.querySelector("#teacher-schedule-body");
const scheduleStatus = document.querySelector("#teacher-schedule-status");
const currentMonth = document.querySelector("#teacher-current-month");
const currentWeek = document.querySelector("#teacher-current-week");
const previousWeek = document.querySelector("#teacher-previous-week");
const nextWeek = document.querySelector("#teacher-next-week");
const editScheduleHead = document.querySelector("#edit-schedule-head");
const editScheduleBody = document.querySelector("#edit-schedule-body");
const editScheduleStatus = document.querySelector("#edit-schedule-status");
const editCurrentMonth = document.querySelector("#edit-current-month");
const editCurrentWeek = document.querySelector("#edit-current-week");
const editPreviousWeek = document.querySelector("#edit-previous-week");
const editNextWeek = document.querySelector("#edit-next-week");
const editSubjectButtons = document.querySelectorAll("[data-edit-subject]");
const editSlotEditor = document.querySelector("#edit-slot-editor");
const editSlotTitle = document.querySelector("#edit-slot-title");
const editSlotHelp = document.querySelector("#edit-slot-help");
const editStudentSelect = document.querySelector("#edit-student-select");
const editDaySelect = document.querySelector("#edit-day-select");
const editStartTime = document.querySelector("#edit-start-time");
const editEndTime = document.querySelector("#edit-end-time");
const editClassNotes = document.querySelector("#edit-class-notes");
const saveEditSlot = document.querySelector("#save-edit-slot");
const removeEditSlot = document.querySelector("#remove-edit-slot");
const todayDate = document.querySelector("#teacher-today-date");
const todayList = document.querySelector("#teacher-today-list");
const saveStudentDetailsButton = document.querySelector("#save-student-details");
const deleteStudentButton = document.querySelector("#delete-student");
const saveClassLinkButton = document.querySelector("#save-class-link");
const saveStudentAccess = document.querySelector("#save-student-access");
const studentAccessStatus = document.querySelector("#student-access-status");
const teacherUserLabel = document.querySelector("#teacher-user-label span");
const classMaterialModal = document.querySelector("#class-material-modal");
const classMaterialClose = document.querySelector("#class-material-close");
const classMaterialTitle = document.querySelector("#class-material-title");
const classMaterialFrame = document.querySelector("#class-material-frame");

let weekStart = getWeekStart(new Date());
let editWeekStart = getWeekStart(new Date());
let editSubject = "mathEs";
let pendingEditSelection = null;
let isApplyingPanelStudent = false;
let activeClassMaterialUrl = "";
let teacherProfile = null;
let studentProfiles = [];
let studentProfilesLoadError = null;
let classSessionBookings = [];
let classSessionsLoadError = null;
let editingStudentId = "";

function redirectToHome() {
  window.location.replace("index.html#inicio");
}

async function loadTeacherProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (sessionError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, username, first_name, last_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "teacher") {
    return null;
  }

  return profile;
}

async function loadStudentProfiles() {
  const { data, error } = await supabase
    .from("students")
    .select("id, email, username, first_name, last_name, auth_user_id, class_url, created_by, created_at, updated_at")
    .eq("created_by", teacherProfile.id)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true })
    .order("username", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

function normalizeTime(value) {
  return String(value || "").slice(0, 5);
}

function parseDateKey(dateISO) {
  const [year, month, day] = String(dateISO || "").split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

function normalizeClassSession(session, materialsByClassSession = new Map()) {
  const student = findStudentById(session.student_id);
  const bookingDate = parseDateKey(session.date);
  const materials = materialsByClassSession.get(session.id) || [];
  const isUnavailableSession = session.type === "unavailable";
  const subject = isUnavailableSession ? "unavailable" : session.subject;
  const subjectName = isUnavailableSession ? "No disponible" : subjectNames[subject] || subject || "Clase";
  const hour = normalizeTime(session.start_time);
  const endHour = normalizeTime(session.end_time);
  const dateLabel = bookingDate ? formatFullDate(bookingDate) : "";

  return {
    id: session.id,
    name: student?.name || "",
    surname: student?.surname || "",
    email: student?.email || "",
    studentId: session.student_id || "",
    username: student?.username || "",
    type: session.type,
    classes: isUnavailableSession ? [] : [subjectName],
    subject,
    subjectName,
    day: bookingDate ? days[bookingDate.getDay() === 0 ? 6 : bookingDate.getDay() - 1] : "",
    dateISO: session.date,
    dateLabel,
    slotHour: getTimeSlotHour(hour),
    hour,
    endHour,
    notes: session.notes || "",
    slot: `${subjectName}: ${dateLabel} de ${hour} a ${endHour}.`,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
    materials,
  };
}

async function loadClassMaterials(classSessionIds) {
  if (!classSessionIds.length) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("class_materials")
    .select("id, class_session_id, uploaded_by, file_path, file_name, mime_type, file_size, created_at, updated_at")
    .in("class_session_id", classSessionIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).reduce((materialsMap, material) => {
    const currentMaterials = materialsMap.get(material.class_session_id) || [];
    currentMaterials.push(material);
    materialsMap.set(material.class_session_id, currentMaterials);
    return materialsMap;
  }, new Map());
}

async function loadClassSessions() {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("id, created_at, student_id, teacher_id, subject, date, start_time, end_time, notes, type, updated_at")
    .eq("teacher_id", teacherProfile.id)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  const classSessions = data || [];
  const materialsByClassSession = await loadClassMaterials(classSessions.map((session) => session.id));

  return classSessions.map((session) => normalizeClassSession(session, materialsByClassSession));
}

teacherProfile = await loadTeacherProfile();

if (!teacherProfile) {
  redirectToHome();
  throw new Error("Acceso de profesor no autorizado.");
}

try {
  studentProfiles = await loadStudentProfiles();
} catch (error) {
  studentProfilesLoadError = error;
  console.error("Error cargando alumnos:", error);
}

try {
  classSessionBookings = await loadClassSessions();
} catch (error) {
  classSessionsLoadError = error;
  console.error("Error cargando clases:", error);
}

document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html#inicio";
  });
});

function loadBookings() {
  return classSessionBookings;
}

if (teacherUserLabel) {
  teacherUserLabel.textContent = teacherProfile.username || teacherProfile.email || "Profesor";
}

function escapeHTML(value) {
  return String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function escapeAttribute(value) {
  return escapeHTML(value).replace(/`/g, "&#96;");
}

function saveDraft() {
  const data = new FormData(teacherForm);
  const draft = {
    name: data.get("name").trim(),
    surname: data.get("surname").trim(),
    email: data.get("email").trim(),
    studentUsername: data.get("studentUsername").trim(),
    subject: editSubject,
  };

  localStorage.setItem("sapheScienceTeacherDraft", JSON.stringify(draft));
  return draft;
}

function loadDraft() {
  try {
    return JSON.parse(localStorage.getItem("sapheScienceTeacherDraft")) || {};
  } catch {
    return {};
  }
}

function fillDraft() {
  const draft = loadDraft();
  teacherForm.elements.name.value = draft.name || "";
  teacherForm.elements.surname.value = draft.surname || "";
  teacherForm.elements.email.value = draft.email || "";
  teacherForm.elements.studentUsername.value = draft.studentUsername || "";
  teacherForm.elements.studentPassword.value = "";
  teacherForm.elements.classUrl.value = "";
  setEditSubject(draft.subject || "mathEs");
}

function readAssignmentForm() {
  const data = new FormData(teacherForm);
  return {
    name: data.get("name").trim(),
    surname: data.get("surname").trim(),
    email: data.get("email").trim(),
    studentUsername: data.get("studentUsername").trim(),
    studentPassword: data.get("studentPassword").trim(),
    subject: editSubject,
  };
}

function getEndHour(hour) {
  const [startHour, minutes] = hour.split(":").map(Number);
  return `${String(startHour + 1).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getWeekStart(date) {
  const nextDate = new Date(date);
  const day = nextDate.getDay();
  const distanceFromMonday = day === 0 ? 6 : day - 1;
  nextDate.setDate(nextDate.getDate() - distanceFromMonday);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function addDays(date, amount) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

function addWeeks(date, amount) {
  return addDays(date, amount * 7);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonth(date) {
  return new Intl.DateTimeFormat("es-ES", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function getBookingDate(booking) {
  if (booking.dateISO) {
    const [year, month, day] = booking.dateISO.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const dayIndex = days.indexOf(booking.day);
  return dayIndex >= 0 ? addDays(getWeekStart(new Date()), dayIndex) : null;
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getWeekDates() {
  return days.map((_, index) => addDays(weekStart, index));
}

function getEditWeekDates() {
  return days.map((_, index) => addDays(editWeekStart, index));
}

function updateWeekHeader(weekDates) {
  const weekEnd = weekDates[weekDates.length - 1];
  const monthLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? formatMonth(weekStart)
      : `${formatMonth(weekStart)} - ${formatMonth(weekEnd)}`;

  currentMonth.textContent = monthLabel;
  currentWeek.textContent = `${weekStart.getDate()} - ${weekEnd.getDate()}`;
}

function updateEditWeekHeader(weekDates) {
  const weekEnd = weekDates[weekDates.length - 1];
  const monthLabel =
    editWeekStart.getMonth() === weekEnd.getMonth()
      ? formatMonth(editWeekStart)
      : `${formatMonth(editWeekStart)} - ${formatMonth(weekEnd)}`;

  editCurrentMonth.textContent = monthLabel;
  editCurrentWeek.textContent = `${editWeekStart.getDate()} - ${weekEnd.getDate()}`;
}

function fillEditDaySelect(selectedDateISO = "") {
  const weekDates = getEditWeekDates();
  const previousValue = selectedDateISO || editDaySelect.value;

  editDaySelect.innerHTML = '<option value="">Selecciona día</option>';

  days.forEach((day, index) => {
    const date = weekDates[index];
    const dateISO = formatDateKey(date);
    const option = document.createElement("option");

    option.value = dateISO;
    option.textContent = formatDayHeader(day, date);
    option.dataset.day = day;
    option.dataset.dateLabel = formatFullDate(date);
    option.selected = dateISO === previousValue;
    editDaySelect.appendChild(option);
  });

  if (!editDaySelect.value && editDaySelect.options.length > 1) {
    editDaySelect.options[1].selected = true;
  }
}

function prepareNewClassEditor() {
  fillStudentSelect(teacherForm.elements.email.value || "");
  fillEditDaySelect();
  editStartTime.value = editStartTime.value || "16:00";
  editEndTime.value = editEndTime.value || "17:00";
  clearPendingEditSelection();
}

function setEditSubject(nextSubject) {
  editSubject = nextSubject;
  editSubjectButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.editSubject === editSubject);
  });
}

function formatDayHeader(day, date) {
  return `${day} ${date.getDate()}`;
}

function bookingMatches(booking, nextSubject, day, hour, dateISO) {
  if (isUnavailable(booking)) {
    return false;
  }

  if (booking.subject !== nextSubject || getBookingSlotHour(booking) !== hour) {
    return false;
  }

  return booking.dateISO ? booking.dateISO === dateISO : booking.day === day;
}

function slotMatches(booking, day, hour, dateISO) {
  if (getBookingSlotHour(booking) !== hour) {
    return false;
  }

  return booking.dateISO ? booking.dateISO === dateISO : booking.day === day;
}

function getBookingSlotHour(booking) {
  return getTimeSlotHour(booking.hour || booking.slotHour);
}

function getTimeSlotHour(value) {
  const valueMinutes = minutesFromTime(value);
  const matchingHour = hours
    .slice()
    .reverse()
    .find((hour) => minutesFromTime(hour) <= valueMinutes);

  return matchingHour || hours[0];
}

function isUnavailable(booking) {
  return Boolean(booking && booking.type === "unavailable");
}

function getSlotLabel(booking) {
  return isUnavailable(booking) ? "No disponible" : getStudentName(booking);
}

function normalizeStudentProfile(profile) {
  const name = profile.first_name || profile.username || "";
  const surname = profile.last_name || "";

  return {
    id: profile.id,
    name,
    surname,
    email: profile.email || "",
    username: profile.username || "",
    authUserId: profile.auth_user_id || "",
    classUrl: profile.class_url || "",
  };
}

function getStudentDisplayName(student) {
  return [student?.name, student?.surname].filter(Boolean).join(" ") || student?.username || "Alumno";
}

function findStudentById(studentId) {
  if (!studentId) {
    return null;
  }

  return getRegisteredStudents().find((student) => student.id === studentId) || null;
}

function getEditingStudent() {
  return findStudentById(editingStudentId);
}

function updateStudentAccessControls() {
  const student = getEditingStudent();
  const hasAccess = Boolean(student?.authUserId);

  if (studentAccessStatus) {
    studentAccessStatus.textContent = !student
      ? "Sin alumno seleccionado."
      : hasAccess
        ? "Acceso creado."
        : "Sin acceso.";
  }

  if (saveStudentAccess) {
    saveStudentAccess.textContent = hasAccess ? "Cambiar contraseña" : "Crear acceso";
    saveStudentAccess.disabled = !student;
  }

  if (deleteStudentButton) {
    deleteStudentButton.disabled = !student;
  }

  if (saveClassLinkButton) {
    saveClassLinkButton.disabled = !student;
  }
}

function findStudentByEmail(email) {
  const normalizedEmail = (email || "").trim().toLowerCase();

  if (!normalizedEmail) {
    return null;
  }

  return getRegisteredStudents().find(
    (student) => student.email.trim().toLowerCase() === normalizedEmail
  ) || null;
}

function minutesFromTime(value) {
  const [hour, minutes] = String(value || "").split(":").map(Number);
  return hour * 60 + minutes;
}

function getBookingDurationMinutes(booking) {
  const startMinutes = minutesFromTime(booking.hour);
  const endMinutes = minutesFromTime(booking.endHour || getEndHour(booking.hour));
  return Math.max(0, endMinutes - startMinutes);
}

function formatDurationHours(minutes) {
  const hoursValue = minutes / 60;
  const formatted = Number.isInteger(hoursValue)
    ? String(hoursValue)
    : hoursValue.toFixed(2).replace(".", ",").replace(/0+$/, "").replace(/,$/, "");

  return `${formatted} hora${hoursValue === 1 ? "" : "s"}`;
}

function getBookingMaterialKey(booking) {
  if (booking.id) {
    return booking.id;
  }

  if (booking.createdAt) {
    return booking.createdAt;
  }

  return [
    (booking.email || "").trim().toLowerCase(),
    booking.dateISO || booking.day || "",
    booking.hour || "",
    booking.endHour || "",
    booking.subject || "",
  ].join("|");
}

function findBookingByMaterialKey(bookings, materialKey) {
  return bookings.find((booking) => getBookingMaterialKey(booking) === materialKey);
}

function findClassMaterialById(bookings, materialId) {
  for (const booking of bookings) {
    const material = (booking.materials || []).find((currentMaterial) => currentMaterial.id === materialId);

    if (material) {
      return { booking, material };
    }
  }

  return null;
}

function createMaterialId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function releaseClassMaterialUrl() {
  if (activeClassMaterialUrl.startsWith("blob:")) {
    URL.revokeObjectURL(activeClassMaterialUrl);
  }

  activeClassMaterialUrl = "";
}

async function openClassMaterial(material) {
  if (!classMaterialModal || !classMaterialFrame || !material?.file_path) {
    return;
  }

  teacherStatus.textContent = "Preparando PDF...";
  const { data, error } = await supabase.storage
    .from(CLASS_MATERIALS_BUCKET)
    .createSignedUrl(material.file_path, 600);

  if (error || !data?.signedUrl) {
    console.error("Error generando URL firmada:", error);
    teacherStatus.textContent = "No se ha podido abrir el PDF.";
    return;
  }

  releaseClassMaterialUrl();
  activeClassMaterialUrl = data.signedUrl;
  classMaterialTitle.textContent = material.file_name || "PDF de la clase";
  classMaterialFrame.src = `${activeClassMaterialUrl}#toolbar=0&navpanes=0&scrollbar=1`;
  classMaterialModal.hidden = false;
  document.body.classList.add("modal-open");
  teacherStatus.textContent = "";
}

function closeClassMaterial() {
  if (!classMaterialModal || !classMaterialFrame) {
    return;
  }

  classMaterialModal.hidden = true;
  classMaterialFrame.src = "";
  releaseClassMaterialUrl();
  document.body.classList.remove("modal-open");
}

function isSameBooking(firstBooking, secondBooking) {
  if (!firstBooking || !secondBooking) {
    return false;
  }

  if (firstBooking.createdAt && secondBooking.createdAt) {
    return firstBooking.createdAt === secondBooking.createdAt;
  }

  const firstEmail = (firstBooking.email || "").trim().toLowerCase();
  const secondEmail = (secondBooking.email || "").trim().toLowerCase();

  return (
    firstEmail === secondEmail &&
    firstBooking.subject === secondBooking.subject &&
    firstBooking.dateISO === secondBooking.dateISO &&
    firstBooking.day === secondBooking.day &&
    firstBooking.hour === secondBooking.hour &&
    firstBooking.endHour === secondBooking.endHour
  );
}

function applySlotTiming(button, booking) {
  const slotHour = getBookingSlotHour(booking);
  const startMinutes = minutesFromTime(booking.hour);
  const endMinutes = minutesFromTime(booking.endHour || getEndHour(booking.hour));
  const slotMinutes = minutesFromTime(slotHour);
  const offset = Math.max(0, Math.min(60, startMinutes - slotMinutes));
  const duration = Math.max(15, endMinutes - startMinutes);

  button.classList.add("timed-slot");
  button.style.setProperty("--slot-top", `${(offset / 60) * 100}%`);
  button.style.setProperty("--slot-height", `${(duration / 60) * 100}%`);
}

function sameBookingDate(booking, day, dateISO) {
  return booking.dateISO ? booking.dateISO === dateISO : booking.day === day;
}

function bookingOverlaps(booking, selection) {
  if (!sameBookingDate(booking, selection.day, selection.dateISO)) {
    return false;
  }

  const bookingStart = minutesFromTime(booking.hour);
  const bookingEnd = minutesFromTime(booking.endHour || getEndHour(booking.hour));
  const selectionStart = minutesFromTime(selection.hour);
  const selectionEnd = minutesFromTime(selection.endHour);

  return bookingStart < selectionEnd && selectionStart < bookingEnd;
}

function getStudentName(booking) {
  const student = findStudentById(booking.studentId) || findStudentByEmail(booking.email);

  if (student) {
    return getStudentDisplayName(student);
  }

  return [booking.name, booking.surname].filter(Boolean).join(" ") || "Alumno";
}

function getRegisteredStudents() {
  return studentProfiles.map(normalizeStudentProfile).sort((first, second) =>
    getStudentDisplayName(first).localeCompare(getStudentDisplayName(second))
  );
}

function fillStudentSelect(selectedStudentKey = "") {
  const students = getRegisteredStudents();
  const normalizedSelectedKey = selectedStudentKey.trim().toLowerCase();

  editStudentSelect.innerHTML = '<option value="">Selecciona alumno</option>';
  const unavailableOption = document.createElement("option");

  unavailableOption.value = UNAVAILABLE_VALUE;
  unavailableOption.textContent = "Hueco no disponible";
  unavailableOption.dataset.unavailable = "true";
  unavailableOption.selected = selectedStudentKey === UNAVAILABLE_VALUE;
  editStudentSelect.appendChild(unavailableOption);

  students.forEach((student) => {
    const option = document.createElement("option");
    const label = getStudentDisplayName(student);

    option.value = student.id;
    option.textContent = `${label} (${student.email || "Sin correo"})`;
    option.dataset.name = student.name || "";
    option.dataset.surname = student.surname || "";
    option.dataset.email = student.email || "";
    option.dataset.username = student.username || "";
    option.dataset.classUrl = student.classUrl || "";
    option.selected =
      student.id === selectedStudentKey ||
      student.email.trim().toLowerCase() === normalizedSelectedKey;
    editStudentSelect.appendChild(option);
  });
}

function applySelectedStudentToForm() {
  const option = editStudentSelect.selectedOptions[0];

  if (!option || !option.value) {
    return null;
  }

  if (option.value === UNAVAILABLE_VALUE) {
    return {
      name: "No disponible",
      surname: "",
      email: "",
      type: "unavailable",
    };
  }

  const student = {
    studentId: option.value,
    name: option.dataset.name || option.dataset.username || "",
    surname: option.dataset.surname || "",
    email: option.dataset.email || "",
    username: option.dataset.username || "",
    classUrl: option.dataset.classUrl || "",
  };

  isApplyingPanelStudent = true;
  editingStudentId = student.studentId;
  teacherForm.elements.name.value = student.name;
  teacherForm.elements.surname.value = student.surname;
  teacherForm.elements.email.value = student.email;
  teacherForm.elements.studentUsername.value = student.username;
  teacherForm.elements.studentPassword.value = "";
  teacherForm.elements.classUrl.value = student.classUrl;
  updateStudentAccessControls();
  isApplyingPanelStudent = false;
  saveDraft();

  return {
    ...readAssignmentForm(),
    ...student,
  };
}

function renderTodaySummary() {
  if (!todayDate || !todayList) {
    return;
  }

  if (classSessionsLoadError) {
    todayList.innerHTML = "<p>No se han podido cargar las clases.</p>";
    return;
  }

  const now = new Date();
  const todayKey = formatDateKey(now);
  const todayDay = days[now.getDay() === 0 ? 6 : now.getDay() - 1];
  const todayBookings = loadBookings()
    .filter((booking) => !isUnavailable(booking))
    .filter((booking) =>
      booking.dateISO ? booking.dateISO === todayKey : booking.day === todayDay
    )
    .sort((first, second) => String(first.hour).localeCompare(String(second.hour)));

  todayDate.textContent = formatLongDate(now);

  if (todayBookings.length === 0) {
    todayList.innerHTML = "<p>No tienes clases asignadas para hoy.</p>";
    return;
  }

  todayList.innerHTML = todayBookings
    .map((booking) => {
      const endHour = booking.endHour || getEndHour(booking.hour);
      return `
        <article>
          <strong>${escapeHTML(booking.hour)} - ${escapeHTML(endHour)}</strong>
          <span>${escapeHTML(getStudentName(booking))}</span>
          <span>${escapeHTML(booking.subjectName || "Clase")}</span>
        </article>
      `;
    })
    .join("");
}

function renderStudents() {
  if (!studentList) {
    return;
  }

  if (studentProfilesLoadError) {
    studentList.innerHTML = "<p class=\"student-empty\">No se han podido cargar los alumnos desde Supabase.</p>";
    return;
  }

  if (classSessionsLoadError) {
    studentList.innerHTML = "<p class=\"student-empty\">No se han podido cargar las clases desde Supabase.</p>";
    return;
  }

  const bookings = loadBookings().filter((booking) => !isUnavailable(booking));
  const students = getRegisteredStudents().map((student) => {
    const normalizedEmail = student.email.trim().toLowerCase();
    const classes = bookings.filter((booking) => {
      const bookingEmail = (booking.email || "").trim().toLowerCase();

      return booking.studentId === student.id || (normalizedEmail && bookingEmail === normalizedEmail);
    });

    return {
      ...student,
      classes,
    };
  });

  if (students.length === 0) {
    studentList.innerHTML = "<p class=\"student-empty\">Todavía no hay alumnos inscritos.</p>";
    return;
  }

  function renderMonthlyTotals(classes) {
    const totals = classes.reduce((monthMap, booking) => {
      const bookingDate = getBookingDate(booking);
      const monthKey = booking.dateISO ? booking.dateISO.slice(0, 7) : booking.day || "sin-fecha";
      const monthLabel = bookingDate ? formatMonth(bookingDate) : "Sin fecha";
      const current = monthMap.get(monthKey) || { label: monthLabel, total: 0, minutes: 0 };

      current.total += 1;
      current.minutes += getBookingDurationMinutes(booking);
      monthMap.set(monthKey, current);
      return monthMap;
    }, new Map());

    return Array.from(totals.entries())
      .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
      .map(([, month]) => `
        <li>
          <span>${escapeHTML(month.label)}</span>
          <strong>${month.total} clase${month.total === 1 ? "" : "s"} · ${escapeHTML(formatDurationHours(month.minutes))}</strong>
        </li>
      `)
      .join("");
  }

  studentList.innerHTML = students
    .map((student) => {
      const studentName = getStudentDisplayName(student);
      const monthlyTotals = renderMonthlyTotals(student.classes);
      const nextClasses = student.classes
        .slice()
        .sort((first, second) => `${first.dateISO || ""}${first.hour}`.localeCompare(`${second.dateISO || ""}${second.hour}`))
        .map((booking) => {
          const endHour = booking.endHour || getEndHour(booking.hour);
          const durationLabel = formatDurationHours(getBookingDurationMinutes(booking));
          const materialKey = getBookingMaterialKey(booking);
          const materialItems = booking.materials?.length
            ? booking.materials
                .map((material) => `
                  <div class="class-material-actions">
                    <span class="class-material-name">${escapeHTML(material.file_name || "PDF de la clase")}</span>
                    <button class="class-material-view" type="button" data-material-view="${escapeAttribute(material.id)}">Ver PDF</button>
                    <button class="class-material-view" type="button" data-material-delete="${escapeAttribute(material.id)}">Eliminar PDF</button>
                  </div>
                `)
                .join("")
            : `<span class="class-material-empty">Sin PDF subido</span>`;
          return `
            <li>
              <strong>${escapeHTML(booking.subjectName || "Clase")}</strong>
              <span>${escapeHTML(booking.dateLabel || booking.day || "Sin fecha")}, ${escapeHTML(booking.hour)} - ${escapeHTML(endHour)}</span>
              <span>${escapeHTML(durationLabel)} dadas</span>
              <div class="class-material-slot">
                <span class="class-material-title">Notas o ejercicios PDF</span>
                ${materialItems}
                <div class="class-material-actions">
                  <label class="class-material-upload">
                    <input type="file" accept="application/pdf" data-material-upload="${escapeAttribute(materialKey)}" />
                    Subir PDF
                  </label>
                </div>
              </div>
            </li>
          `;
        })
        .join("");

      return `
        <article class="student-file-card">
          <strong>${escapeHTML(studentName)}</strong>
          <span>${escapeHTML(student.email || "Sin correo")}</span>
          <span>${student.authUserId ? "Acceso creado" : "Sin acceso"}</span>
          <span>${student.classes.length} clase${student.classes.length === 1 ? "" : "s"} inscrita${student.classes.length === 1 ? "" : "s"}</span>
          <ul class="student-monthly-counts">${monthlyTotals}</ul>
          <ul class="student-class-list">${nextClasses}</ul>
          <button class="teacher-remove" type="button" data-student-id="${escapeAttribute(student.id)}">
            Editar alumno
          </button>
        </article>
      `;
    })
    .join("");
}

function renderSchedule() {
  if (classSessionsLoadError) {
    scheduleStatus.textContent = "No se han podido cargar las clases desde Supabase.";
  }

  const bookings = loadBookings();
  const weekDates = getWeekDates();

  updateWeekHeader(weekDates);
  scheduleHead.innerHTML = "";
  scheduleBody.innerHTML = "";

  ["Hora", ...days.map((day, index) => formatDayHeader(day, weekDates[index]))].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    scheduleHead.appendChild(th);
  });

  hours.forEach((hour) => {
    const row = document.createElement("tr");
    const timeCell = document.createElement("th");
    timeCell.scope = "row";
    timeCell.textContent = hour;
    row.appendChild(timeCell);

    days.forEach((day, dayIndex) => {
      const cell = document.createElement("td");
      const date = weekDates[dayIndex];
      const dateISO = formatDateKey(date);
      const dateLabel = formatFullDate(date);
      const slotBookings = bookings.filter((booking) =>
        slotMatches(booking, day, hour, dateISO)
      );
      const isAssigned = slotBookings.length > 0;

      if (isAssigned) {
        cell.classList.add("slot-cell-available");
      }

      if (isAssigned) {
        slotBookings.forEach((slotBooking) => {
          const button = document.createElement("button");

          button.type = "button";
          button.className = `slot ${isUnavailable(slotBooking) ? "busy" : "reserved"} slot-readonly`;
          button.textContent = getSlotLabel(slotBooking);
          button.disabled = true;
          applySlotTiming(button, slotBooking);
          button.setAttribute(
            "aria-label",
            isUnavailable(slotBooking)
              ? `No disponible el ${dateLabel} de ${slotBooking.hour} a ${slotBooking.endHour || getEndHour(slotBooking.hour)}`
              : `${getStudentName(slotBooking)}: ${slotBooking.subjectName || "Clase"} el ${dateLabel} de ${slotBooking.hour} a ${slotBooking.endHour || getEndHour(slotBooking.hour)}`
          );
          cell.appendChild(button);
        });
      } else {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "slot available slot-readonly";
        button.textContent = "Libre";
        button.disabled = true;
        button.setAttribute("aria-label", `${dateLabel} a las ${hour}`);
        cell.appendChild(button);
      }
      row.appendChild(cell);
    });

    scheduleBody.appendChild(row);
  });
}

function renderEditableSchedule() {
  if (!editScheduleHead || !editScheduleBody) {
    return;
  }

  if (classSessionsLoadError) {
    editScheduleStatus.textContent = "No se han podido cargar las clases desde Supabase.";
  }

  const values = readAssignmentForm();
  const bookings = loadBookings();
  const weekDates = getEditWeekDates();

  updateEditWeekHeader(weekDates);
  fillEditDaySelect();
  editScheduleHead.innerHTML = "";
  editScheduleBody.innerHTML = "";

  ["Hora", ...days.map((day, index) => formatDayHeader(day, weekDates[index]))].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    editScheduleHead.appendChild(th);
  });

  hours.forEach((hour) => {
    const row = document.createElement("tr");
    const timeCell = document.createElement("th");
    timeCell.scope = "row";
    timeCell.textContent = hour;
    row.appendChild(timeCell);

    days.forEach((day, dayIndex) => {
      const cell = document.createElement("td");
      const date = weekDates[dayIndex];
      const dateISO = formatDateKey(date);
      const dateLabel = formatFullDate(date);
      const slotBookings = bookings.filter((booking) =>
        slotMatches(booking, day, hour, dateISO)
      );
      const isAssigned = slotBookings.length > 0;

      if (isAssigned) {
        cell.classList.add("slot-cell-available");
      }

      if (isAssigned) {
        slotBookings.forEach((slotBooking) => {
          const button = document.createElement("button");

          button.type = "button";
          button.className = `slot ${isUnavailable(slotBooking) ? "busy" : "reserved"}`;
          button.textContent = getSlotLabel(slotBooking);
          applySlotTiming(button, slotBooking);
          button.setAttribute(
            "aria-label",
            isUnavailable(slotBooking)
              ? `No disponible el ${dateLabel} de ${slotBooking.hour} a ${slotBooking.endHour || getEndHour(slotBooking.hour)}`
              : `${getStudentName(slotBooking)}: ${slotBooking.subjectName || "Clase"} el ${dateLabel} de ${slotBooking.hour} a ${slotBooking.endHour || getEndHour(slotBooking.hour)}`
          );
          button.addEventListener("click", () => {
            selectEditableSlot({
              ...values,
              subject: slotBooking.subject || editSubject,
              day,
              dateISO,
              dateLabel,
              slotHour: hour,
              startHour: slotBooking.hour,
              endHour: slotBooking.endHour || getEndHour(slotBooking.hour),
              existingBooking: slotBooking,
            });
          });
          cell.appendChild(button);
        });
      } else {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "slot available";
        button.textContent = "Libre";
        button.disabled = true;
        button.setAttribute("aria-label", `${dateLabel} a las ${hour}`);
        cell.appendChild(button);
      }

      row.appendChild(cell);
    });

    editScheduleBody.appendChild(row);
  });
}

function selectEditableSlot(selection) {
  pendingEditSelection = selection;
  const isUnavailableSelection = selection.existingBooking
    ? isUnavailable(selection.existingBooking)
    : selection.type === "unavailable";

  editSlotEditor.hidden = false;
  if (!isUnavailableSelection) {
    setEditSubject(selection.subject);
  }
  fillStudentSelect(isUnavailableSelection ? UNAVAILABLE_VALUE : selection.existingBooking?.studentId || selection.studentId || selection.existingBooking?.email || selection.email || "");
  fillEditDaySelect(selection.dateISO);
  editSlotTitle.textContent = isUnavailableSelection
    ? `No disponible: ${selection.dateLabel}`
    : `${subjectNames[selection.subject]}: ${selection.dateLabel}`;
  editSlotHelp.textContent = selection.existingBooking
    ? "Puedes actualizar la hora exacta o retirar este tramo del calendario."
    : "Elige un alumno registrado o un hueco no disponible y ajusta el horario exacto.";
  editStartTime.value = selection.startHour;
  editEndTime.value = selection.endHour;
  editClassNotes.value = selection.existingBooking?.notes || "";
  removeEditSlot.hidden = !selection.existingBooking;
  editScheduleStatus.innerHTML = `<strong>${isUnavailableSelection ? "No disponible" : subjectNames[selection.subject]}: ${selection.dateLabel}</strong><span>Tramo seleccionado.</span>`;
}

function clearPendingEditSelection() {
  pendingEditSelection = null;

  if (editSlotEditor) {
    editSlotTitle.textContent = "Añadir clase";
    editSlotHelp.textContent = "Elige un alumno registrado o un hueco no disponible y ajusta el horario exacto.";
    editClassNotes.value = "";
    removeEditSlot.hidden = true;
  }
}

async function savePendingEditSelection() {
  const selectedStudent = applySelectedStudentToForm();
  const startHour = editStartTime.value;
  const endHour = editEndTime.value;
  const notes = editClassNotes.value.trim();
  const selectedDay = editDaySelect.selectedOptions[0];

  if (!selectedStudent) {
    editScheduleStatus.textContent = "Selecciona primero el alumno registrado.";
    return;
  }

  if (!selectedDay || !selectedDay.value) {
    editScheduleStatus.textContent = "Selecciona primero el día de la clase.";
    return;
  }

  if (!startHour || !endHour || minutesFromTime(endHour) <= minutesFromTime(startHour)) {
    editScheduleStatus.textContent =
      "La hora de fin tiene que ser posterior a la hora de inicio.";
    return;
  }

  const selection = pendingEditSelection || {
    subject: editSubject,
    existingBooking: null,
  };

  await toggleBooking({
    ...selection,
    ...selectedStudent,
    subject: selectedStudent.type === "unavailable" ? "unavailable" : selection.subject,
    subjectName: selectedStudent.type === "unavailable" ? "No disponible" : subjectNames[selection.subject],
    type: selectedStudent.type || "class",
    day: selectedDay.dataset.day,
    dateISO: selectedDay.value,
    dateLabel: selectedDay.dataset.dateLabel,
    slotHour: getTimeSlotHour(startHour),
    hour: startHour,
    endHour,
    notes,
  });
}

async function removePendingEditSelection() {
  if (!pendingEditSelection) {
    editScheduleStatus.textContent = "Selecciona primero una clase asignada en amarillo.";
    return;
  }

  const selectedStudent = applySelectedStudentToForm();

  if (!selectedStudent) {
    editScheduleStatus.textContent = "Selecciona primero el alumno registrado.";
    return;
  }

  await toggleBooking({
    ...pendingEditSelection,
    ...selectedStudent,
    subject: selectedStudent.type === "unavailable" ? "unavailable" : pendingEditSelection.subject,
    subjectName: selectedStudent.type === "unavailable" ? "No disponible" : subjectNames[pendingEditSelection.subject],
    type: selectedStudent.type || "class",
    slotHour: getTimeSlotHour(editStartTime.value || pendingEditSelection.startHour),
    hour: editStartTime.value || pendingEditSelection.startHour,
    endHour: editEndTime.value || pendingEditSelection.endHour,
    notes: editClassNotes.value.trim(),
  }, "remove");
}

async function toggleBooking(selection, action = "save") {
  const isUnavailableSelection = selection.type === "unavailable";

  if (!isUnavailableSelection && !selection.studentId) {
    teacherStatus.textContent = "Selecciona un alumno registrado antes de asignar una clase.";
    editScheduleStatus.textContent = "Faltan los datos del alumno.";
    return;
  }

  const bookings = loadBookings();
  const originalBooking = selection.existingBooking;
  const originalIndex = bookings.findIndex((booking) =>
    isSameBooking(booking, originalBooking)
  );
  const existingIndex = originalIndex >= 0 ? originalIndex : bookings.findIndex((booking) => {
    if (isUnavailableSelection !== isUnavailable(booking)) {
      return false;
    }

    const sameStudent =
      isUnavailableSelection ||
      (selection.studentId && booking.studentId === selection.studentId);

    return (
      sameStudent &&
      bookingMatches(
        booking,
        selection.subject,
        selection.day,
        selection.slotHour,
        selection.dateISO
      )
    );
  });
  const occupiedIndex = bookings.findIndex((booking, index) =>
    index !== existingIndex && bookingOverlaps(booking, selection)
  );
  const selectionLabel = isUnavailableSelection
    ? "No disponible"
    : subjectNames[selection.subject];
  const slot = `${selectionLabel}: ${selection.dateLabel} de ${selection.hour} a ${selection.endHour}.`;

  if (action === "remove" && existingIndex >= 0) {
    const bookingToRemove = bookings[existingIndex];
    const { error } = await supabase
      .from("class_sessions")
      .delete()
      .eq("id", bookingToRemove.id)
      .eq("teacher_id", teacherProfile.id);

    if (error) {
      console.error("Error eliminando clase:", error);
      teacherStatus.textContent = "No se ha podido retirar el tramo.";
      editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Error al retirar el tramo.</span>`;
      return;
    }

    teacherStatus.textContent = isUnavailableSelection
      ? "Hueco no disponible retirado del calendario."
      : "Clase retirada del perfil del alumno.";
    editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Tramo retirado.</span>`;
    pendingEditSelection = null;
    clearPendingEditSelection();
  } else if (existingIndex >= 0) {
    const bookingToUpdate = bookings[existingIndex];

    if (occupiedIndex >= 0) {
      const occupiedBooking = bookings[occupiedIndex];
      const occupiedStudent = getSlotLabel(occupiedBooking);

      teacherStatus.textContent = `Ese hueco ya está asignado a ${occupiedStudent}.`;
      editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Ese hueco ya tiene alumno.</span>`;
      return;
    }

    const { error } = await supabase
      .from("class_sessions")
      .update(getClassSessionPayload(selection))
      .eq("id", bookingToUpdate.id)
      .eq("teacher_id", teacherProfile.id);

    if (error) {
      console.error("Error actualizando clase:", error);
      teacherStatus.textContent = "No se ha podido actualizar el tramo.";
      editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Error al actualizar el tramo.</span>`;
      return;
    }

    teacherStatus.textContent = isUnavailableSelection
      ? "Hueco no disponible actualizado."
      : "Clase actualizada en el perfil del alumno.";
    editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Tramo actualizado.</span>`;
  } else if (occupiedIndex >= 0) {
    const occupiedBooking = bookings[occupiedIndex];
    const occupiedStudent = getSlotLabel(occupiedBooking);
    const sameStudent =
      isUnavailableSelection ||
      (selection.studentId && occupiedBooking.studentId === selection.studentId);

    if (!sameStudent || occupiedBooking.subject !== selection.subject || isUnavailable(occupiedBooking) !== isUnavailableSelection) {
      teacherStatus.textContent = `Ese hueco ya está asignado a ${occupiedStudent}.`;
      editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Ese hueco ya tiene alumno.</span>`;
      return;
    }

    const { error } = await supabase
      .from("class_sessions")
      .update(getClassSessionPayload(selection))
      .eq("id", occupiedBooking.id)
      .eq("teacher_id", teacherProfile.id);

    if (error) {
      console.error("Error actualizando clase:", error);
      teacherStatus.textContent = "No se ha podido actualizar el tramo.";
      editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Error al actualizar el tramo.</span>`;
      return;
    }

    teacherStatus.textContent = isUnavailableSelection
      ? "Hueco no disponible actualizado."
      : "Clase actualizada en el perfil del alumno.";
    editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Tramo actualizado.</span>`;
  } else {
    const { error } = await supabase
      .from("class_sessions")
      .insert(getClassSessionPayload(selection));

    if (error) {
      console.error("Error creando clase:", error);
      const insertErrorMessage = [error.message, error.details, error.hint, error.code]
        .filter(Boolean)
        .join(" ");
      teacherStatus.textContent = insertErrorMessage || "No se ha podido guardar el tramo.";
      editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>${escapeHTML(insertErrorMessage || "Error al guardar el tramo.")}</span>`;
      return;
    }

    teacherStatus.textContent = isUnavailableSelection
      ? "Hueco no disponible añadido al calendario."
      : "Clase asignada al perfil del alumno.";
    editScheduleStatus.innerHTML = `<strong>${slot}</strong><span>Tramo guardado.</span>`;
  }

  saveDraft();
  await reloadClassSessions();
  renderTodaySummary();
  renderStudents();
  renderSchedule();
  renderEditableSchedule();
}

async function getFunctionErrorMessage(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (error.context && typeof error.context.json === "function") {
    try {
      const body = await error.context.json();
      return body?.message || body?.error || fallback;
    } catch {
      return error.message || fallback;
    }
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

async function reloadStudentProfiles(selectedStudentKey = "") {
  studentProfilesLoadError = null;

  try {
    studentProfiles = await loadStudentProfiles();
  } catch (error) {
    studentProfilesLoadError = error;
    console.error("Error cargando alumnos:", error);
    teacherStatus.textContent = "No se ha podido recargar la lista de alumnos.";
    return;
  }

  renderStudents();
  fillStudentSelect(selectedStudentKey);
  updateStudentAccessControls();
}

async function reloadClassSessions() {
  classSessionsLoadError = null;

  try {
    classSessionBookings = await loadClassSessions();
  } catch (error) {
    classSessionsLoadError = error;
    console.error("Error cargando clases:", error);
    teacherStatus.textContent = "No se han podido recargar las clases.";
  }
}

function getClassSessionPayload(selection) {
  const isUnavailableSelection = selection.type === "unavailable";

  return {
    teacher_id: teacherProfile.id,
    student_id: isUnavailableSelection ? null : selection.studentId,
    subject: isUnavailableSelection ? "unavailable" : selection.subject,
    date: selection.dateISO,
    start_time: selection.hour,
    end_time: selection.endHour,
    notes: isUnavailableSelection ? "" : selection.notes || "",
    type: selection.type,
    updated_at: new Date().toISOString(),
  };
}

async function saveStudentDetails() {
  const values = readAssignmentForm();
  const isEditingStudent = Boolean(editingStudentId);
  const studentPayload = {
    first_name: values.name,
    last_name: values.surname || "",
    username: values.studentUsername || [values.name, values.surname].filter(Boolean).join(" "),
    email: values.email || null,
    updated_at: new Date().toISOString(),
  };

  if (!values.name || !studentPayload.username) {
    teacherStatus.textContent =
      "Añade al menos nombre y usuario para guardar el alumno.";
    return;
  }

  teacherStatus.textContent = isEditingStudent ? "Actualizando alumno..." : "Creando alumno...";
  saveStudentDetailsButton.disabled = true;

  try {
    let savedStudent = null;

    if (isEditingStudent) {
      const { data, error } = await supabase
        .from("students")
        .update(studentPayload)
        .eq("id", editingStudentId)
        .eq("created_by", teacherProfile.id)
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      savedStudent = data;
    } else {
      const { data, error } = await supabase
        .from("students")
        .insert({
          ...studentPayload,
          auth_user_id: null,
          created_by: teacherProfile.id,
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      savedStudent = data;
    }

    teacherForm.elements.studentPassword.value = "";
    saveDraft();
    await reloadStudentProfiles(savedStudent?.id || values.email);
    editingStudentId = isEditingStudent ? savedStudent?.id || editingStudentId : "";
    updateStudentAccessControls();
    teacherStatus.textContent = isEditingStudent ? "Alumno actualizado correctamente." : "Alumno creado correctamente.";
  } catch (error) {
    console.error("Error guardando alumno:", error);
    teacherStatus.textContent = error.message || "No se ha podido guardar el alumno.";
  } finally {
    saveStudentDetailsButton.disabled = false;
  }
}

async function saveStudentClassLink() {
  const student = getEditingStudent();

  if (!student) {
    teacherStatus.textContent = "Carga o guarda primero un alumno para guardar su enlace de clase.";
    return;
  }

  const classUrl = teacherForm.elements.classUrl.value.trim();
  saveClassLinkButton.disabled = true;
  teacherStatus.textContent = "Guardando enlace de clase...";

  try {
    const { error } = await supabase
      .from("students")
      .update({
        class_url: classUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingStudentId)
      .eq("created_by", teacherProfile.id);

    if (error) {
      throw error;
    }

    await reloadStudentProfiles(editingStudentId);
    teacherForm.elements.classUrl.value = classUrl;
    updateStudentAccessControls();
    teacherStatus.textContent = "Enlace de clase guardado.";
  } catch (error) {
    console.error("Error guardando enlace de clase:", error);
    teacherStatus.textContent = error.message || "No se ha podido guardar el enlace de clase.";
  } finally {
    updateStudentAccessControls();
  }
}

async function saveStudentAccessCredentials() {
  const student = getEditingStudent();
  const values = readAssignmentForm();
  const password = values.studentPassword;
  const hasAccess = Boolean(student?.authUserId);

  if (!student) {
    teacherStatus.textContent = "Carga o guarda primero un alumno para crear su acceso.";
    return;
  }

  if (password.length < 8) {
    teacherStatus.textContent = "La contraseña debe tener al menos 8 caracteres.";
    return;
  }

  saveStudentAccess.disabled = true;
  teacherStatus.textContent = hasAccess ? "Cambiando contraseña..." : "Creando acceso del alumno...";

  try {
    if (hasAccess) {
      const { error } = await supabase.functions.invoke("set-student-password", {
        body: {
          student_id: student.id,
          password,
        },
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error, "No se ha podido cambiar la contraseña."));
      }

      teacherForm.elements.studentPassword.value = "";
      teacherStatus.textContent = "Contraseña actualizada correctamente.";
      return;
    }

    const email = values.email.trim();
    const username = values.studentUsername.trim();

    if (!email || !username) {
      teacherStatus.textContent = "Añade correo, usuario y contraseña para crear el acceso.";
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session?.access_token) {
      teacherStatus.textContent =
        "La sesión del profesor no está disponible. Vuelve a iniciar sesión.";
      return;
    }

    console.log("Profesor autenticado:", session.user.id);
    console.log("Hay access token:", Boolean(session.access_token));
    console.log("Creando acceso para student_id:", student.id);

    const { data, error } = await supabase.functions.invoke("create-student", {
      body: {
        student_id: student.id,
        email,
        username,
        password,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    console.log("create-student data:", data);
    console.log("create-student error:", error);

    if (error) {
      throw new Error(await getFunctionErrorMessage(error, "No se ha podido crear el acceso."));
    }

    teacherForm.elements.studentPassword.value = "";
    saveDraft();
    await reloadStudentProfiles(student.id);
    updateStudentAccessControls();
    teacherStatus.textContent = "Acceso creado correctamente.";
  } catch (error) {
    console.error("Error guardando acceso:", error);
    teacherStatus.textContent = error.message || "No se ha podido guardar el acceso.";
  } finally {
    updateStudentAccessControls();
  }
}

function clearStudentForm() {
  teacherForm.elements.name.value = "";
  teacherForm.elements.surname.value = "";
  teacherForm.elements.email.value = "";
  teacherForm.elements.studentUsername.value = "";
  teacherForm.elements.studentPassword.value = "";
  teacherForm.elements.classUrl.value = "";
  editingStudentId = "";
  saveDraft();
  updateStudentAccessControls();
  clearPendingEditSelection();
}

async function deleteSelectedStudent() {
  const student = getEditingStudent();

  if (!student) {
    teacherStatus.textContent = "Carga primero un alumno para eliminarlo.";
    return;
  }

  const studentName = getStudentDisplayName(student);
  const confirmed = window.confirm(
    `¿Seguro que quieres eliminar a ${studentName}? Se eliminarán sus clases, notas y materiales asociados. Esta acción no se puede deshacer.`
  );

  if (!confirmed) {
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session?.access_token) {
    teacherStatus.textContent =
      "La sesión del profesor no está disponible. Vuelve a iniciar sesión.";
    return;
  }

  teacherStatus.textContent = "Eliminando alumno...";
  deleteStudentButton.disabled = true;

  try {
    console.log("delete-student student_id:", student.id);
    const { data, error } = await supabase.functions.invoke("delete-student", {
      body: {
        student_id: student.id,
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });
    console.log("delete-student data:", data);
    console.log("delete-student error:", error);

    if (error) {
      let deleteErrorMessage = error.message || "No se ha podido eliminar el alumno.";

      if (error.context) {
        try {
          const response = typeof error.context.clone === "function"
            ? error.context.clone()
            : error.context;
          const contentType = response.headers?.get?.("content-type") || "";

          if (contentType.includes("application/json") && typeof response.json === "function") {
            const body = await response.json();
            deleteErrorMessage = body?.message || body?.error || JSON.stringify(body);
          } else if (typeof response.text === "function") {
            const text = await response.text();
            deleteErrorMessage = text || deleteErrorMessage;
          }
        } catch (contextError) {
          console.error("Error leyendo respuesta de delete-student:", contextError);
        }
      }

      throw new Error(deleteErrorMessage);
    }

    clearStudentForm();
    await reloadStudentProfiles();
    await reloadClassSessions();
    renderTodaySummary();
    renderStudents();
    renderSchedule();
    renderEditableSchedule();
    teacherStatus.textContent = "Alumno eliminado correctamente.";
  } catch (error) {
    console.error("Error eliminando alumno:", error);
    teacherStatus.textContent = error.message || "No se ha podido eliminar el alumno.";
    updateStudentAccessControls();
  }
}

studentList?.addEventListener("click", async (event) => {
  const materialButton = event.target.closest("[data-material-view]");

  if (materialButton) {
    const bookings = loadBookings();
    const materialMatch = findClassMaterialById(bookings, materialButton.dataset.materialView);

    if (materialMatch?.material) {
      await openClassMaterial(materialMatch.material);
    }

    return;
  }

  const materialDeleteButton = event.target.closest("[data-material-delete]");

  if (materialDeleteButton) {
    const bookings = loadBookings();
    const materialMatch = findClassMaterialById(bookings, materialDeleteButton.dataset.materialDelete);

    if (!materialMatch?.material) {
      teacherStatus.textContent = "No se ha encontrado el PDF para eliminarlo.";
      return;
    }

    const { material } = materialMatch;

    teacherStatus.textContent = "Eliminando PDF...";
    const { error: storageError } = await supabase.storage
      .from(CLASS_MATERIALS_BUCKET)
      .remove([material.file_path]);

    if (storageError) {
      console.error("Error eliminando PDF de Storage:", storageError);
      teacherStatus.textContent = storageError.message || "No se ha podido eliminar el archivo PDF.";
      return;
    }

    const { error: deleteError } = await supabase
      .from("class_materials")
      .delete()
      .eq("id", material.id);

    if (deleteError) {
      console.error("Error eliminando metadatos del PDF:", deleteError);
      teacherStatus.textContent = deleteError.message || "No se ha podido eliminar la información del PDF.";
      return;
    }

    await reloadClassSessions();
    renderStudents();
    teacherStatus.textContent = "PDF eliminado correctamente.";
    return;
  }

  const button = event.target.closest("[data-student-id]");

  if (!button) {
    return;
  }

  const student = findStudentById(button.dataset.studentId);

  if (!student) {
    return;
  }

  editingStudentId = student.id;
  const booking = loadBookings().find(
    (currentBooking) =>
      currentBooking.studentId === student.id ||
      (currentBooking.email || "").trim().toLowerCase() === student.email.trim().toLowerCase()
  );

  teacherForm.elements.name.value = student.name || "";
  teacherForm.elements.surname.value = student.surname || "";
  teacherForm.elements.email.value = student.email || "";
  teacherForm.elements.studentUsername.value = student.username || "";
  teacherForm.elements.studentPassword.value = "";
  teacherForm.elements.classUrl.value = student.classUrl || "";
  updateStudentAccessControls();
  setEditSubject(booking?.subject || "mathEs");
  saveDraft();
  teacherStatus.textContent = "Alumno cargado. Puedes actualizar sus datos académicos.";
  renderSchedule();
  renderEditableSchedule();
  document.querySelector("#editar-clases")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

studentList?.addEventListener("change", async (event) => {
  const input = event.target.closest("[data-material-upload]");

  if (!input) {
    return;
  }

  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (file.type !== "application/pdf") {
    teacherStatus.textContent = "Solo puedes subir archivos PDF.";
    input.value = "";
    return;
  }

  const bookings = loadBookings();
  const booking = findBookingByMaterialKey(bookings, input.dataset.materialUpload);

  if (!booking?.id) {
    teacherStatus.textContent = "No se ha encontrado la clase para guardar el PDF.";
    input.value = "";
    return;
  }

  const materialId = createMaterialId();
  const filePath = `${booking.id}/${materialId}.pdf`;
  const mimeType = file.type || "application/pdf";
  const uploadedAt = new Date().toISOString();

  teacherStatus.textContent = "Subiendo PDF...";

  const { error: uploadError } = await supabase.storage
    .from(CLASS_MATERIALS_BUCKET)
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error subiendo PDF:", uploadError);
    teacherStatus.textContent = uploadError.message || "No se ha podido subir el PDF.";
    input.value = "";
    return;
  }

  const materialPayload = {
    id: materialId,
    class_session_id: booking.id,
    uploaded_by: teacherProfile.id,
    file_path: filePath,
    file_name: file.name,
    mime_type: mimeType,
    file_size: file.size,
    created_at: uploadedAt,
    updated_at: uploadedAt,
  };
  const { error: insertError } = await supabase
    .from("class_materials")
    .insert(materialPayload);

  if (insertError) {
    console.error("Error guardando metadatos del PDF:", insertError);
    await supabase.storage.from(CLASS_MATERIALS_BUCKET).remove([filePath]);
    teacherStatus.textContent = insertError.message || "No se ha podido guardar la información del PDF.";
    input.value = "";
    return;
  }

  await reloadClassSessions();
  renderStudents();
  teacherStatus.textContent = "PDF guardado para visualizarlo desde la web.";
  input.value = "";
});

classMaterialClose?.addEventListener("click", closeClassMaterial);
classMaterialModal?.addEventListener("click", (event) => {
  if (event.target === classMaterialModal) {
    closeClassMaterial();
  }
});

saveStudentDetailsButton?.addEventListener("click", saveStudentDetails);
deleteStudentButton?.addEventListener("click", deleteSelectedStudent);
saveClassLinkButton?.addEventListener("click", saveStudentClassLink);
saveStudentAccess?.addEventListener("click", saveStudentAccessCredentials);
saveEditSlot?.addEventListener("click", savePendingEditSelection);
removeEditSlot?.addEventListener("click", removePendingEditSelection);
editStudentSelect?.addEventListener("change", () => {
  const selectedStudent = applySelectedStudentToForm();

  if (selectedStudent && pendingEditSelection) {
    const selectionLabel = selectedStudent.type === "unavailable"
      ? "No disponible"
      : subjectNames[pendingEditSelection.subject];
    const studentLabel = selectedStudent.type === "unavailable"
      ? "Hueco no disponible"
      : [selectedStudent.name, selectedStudent.surname].filter(Boolean).join(" ") || selectedStudent.username || selectedStudent.email;

    editScheduleStatus.innerHTML = `<strong>${selectionLabel}: ${pendingEditSelection.dateLabel}</strong><span>Seleccionado: ${escapeHTML(studentLabel)}.</span>`;
  }
});

teacherForm.addEventListener("input", () => {
  saveDraft();
  if (!isApplyingPanelStudent) {
    clearPendingEditSelection();
  }
  renderEditableSchedule();
});

previousWeek.addEventListener("click", () => {
  weekStart = addWeeks(weekStart, -1);
  scheduleStatus.textContent =
    "Calendario general de lectura: aquí aparecen todas las clases de todos los alumnos.";
  renderSchedule();
});

nextWeek.addEventListener("click", () => {
  weekStart = addWeeks(weekStart, 1);
  scheduleStatus.textContent =
    "Calendario general de lectura: aquí aparecen todas las clases de todos los alumnos.";
  renderSchedule();
});

editSubjectButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setEditSubject(button.dataset.editSubject);
    saveDraft();
    clearPendingEditSelection();
    renderEditableSchedule();
  });
});

editPreviousWeek?.addEventListener("click", () => {
  editWeekStart = addWeeks(editWeekStart, -1);
  clearPendingEditSelection();
  editScheduleStatus.textContent =
    "Calendario editable: elige alumno, día y horario para guardar una clase.";
  renderEditableSchedule();
});

editNextWeek?.addEventListener("click", () => {
  editWeekStart = addWeeks(editWeekStart, 1);
  clearPendingEditSelection();
  editScheduleStatus.textContent =
    "Calendario editable: elige alumno, día y horario para guardar una clase.";
  renderEditableSchedule();
});

fillDraft();
prepareNewClassEditor();
renderTodaySummary();
renderStudents();
renderSchedule();
renderEditableSchedule();
updateStudentAccessControls();
