import { supabase } from "./supabaseClient.js";
import { createTeacherBilling } from "./teacherBilling.js";

const { t, locale, subjectLabel, onLanguageChange, setText, setHTML, errorText } = window.SapheI18n;

const hours = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const UNAVAILABLE_VALUE = "__unavailable__";
const CLASS_MATERIALS_BUCKET = "class-materials";
const subjectNames = new Proxy({}, { get: (_, key) => subjectLabel(key) });

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
let billingPanel = null;

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
  const subjectName = isUnavailableSession ? t("busy") : subjectNames[subject] || subject || t("ui.class");
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
    slot: t("slotSummary", { subject: subjectName, date: dateLabel, start: hour, end: endHour }),
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
  throw new Error(t("ui.teacherAccessDenied"));
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
  setText(teacherUserLabel, () => teacherProfile.username || teacherProfile.email || t("ui.teacher"));
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
  return new Intl.DateTimeFormat(locale(), {
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
  return new Intl.DateTimeFormat(locale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatLongDate(date) {
  return new Intl.DateTimeFormat(locale(), {
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

  setText(currentMonth, () => monthLabel);
  setText(currentWeek, () => `${weekStart.getDate()} - ${weekEnd.getDate()}`);
}

function updateEditWeekHeader(weekDates) {
  const weekEnd = weekDates[weekDates.length - 1];
  const monthLabel =
    editWeekStart.getMonth() === weekEnd.getMonth()
      ? formatMonth(editWeekStart)
      : `${formatMonth(editWeekStart)} - ${formatMonth(weekEnd)}`;

  setText(editCurrentMonth, () => monthLabel);
  setText(editCurrentWeek, () => `${editWeekStart.getDate()} - ${weekEnd.getDate()}`);
}

function fillEditDaySelect(selectedDateISO = "") {
  const weekDates = getEditWeekDates();
  const previousValue = selectedDateISO || editDaySelect.value;

  editDaySelect.innerHTML = `<option value="">${t("ui.selectADay")}</option>`;

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
  return `${new Intl.DateTimeFormat(locale(), { weekday: "long" }).format(date)} ${date.getDate()}`;
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
  return isUnavailable(booking) ? t("busy") : getStudentName(booking);
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
  return [student?.name, student?.surname].filter(Boolean).join(" ") || student?.username || t("ui.student");
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
    setText(studentAccessStatus, () => !student
      ? t("ui.noStudentSelected")
      : hasAccess
        ? t("ui.accessCreated")
        : t("ui.noAccess"));
  }

  if (saveStudentAccess) {
    setText(saveStudentAccess, () => hasAccess ? t("ui.changePassword") : t("ui.createAccess"));
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
  const formatted = new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(hoursValue);
  return t(hoursValue === 1 ? "hourOne" : "hourMany", { count: formatted });
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

  setText(teacherStatus, () => t("ui.preparingPDF"));
  const { data, error } = await supabase.storage
    .from(CLASS_MATERIALS_BUCKET)
    .createSignedUrl(material.file_path, 600);

  if (error || !data?.signedUrl) {
    console.error("Error generando URL firmada:", error);
    setText(teacherStatus, () => t("ui.unableToOpenThePDF"));
    return;
  }

  releaseClassMaterialUrl();
  activeClassMaterialUrl = data.signedUrl;
  setText(classMaterialTitle, () => material.file_name || t("ui.classPDF"));
  classMaterialFrame.src = `${activeClassMaterialUrl}#toolbar=0&navpanes=0&scrollbar=1`;
  classMaterialModal.hidden = false;
  document.body.classList.add("modal-open");
  setText(teacherStatus, () => "");
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

  return [booking.name, booking.surname].filter(Boolean).join(" ") || t("ui.student");
}

function getRegisteredStudents() {
  return studentProfiles.map(normalizeStudentProfile).sort((first, second) =>
    getStudentDisplayName(first).localeCompare(getStudentDisplayName(second))
  );
}

function fillStudentSelect(selectedStudentKey = "") {
  const students = getRegisteredStudents();
  const normalizedSelectedKey = selectedStudentKey.trim().toLowerCase();

  editStudentSelect.innerHTML = `<option value="">${t("ui.selectAStudent")}</option>`;
  const unavailableOption = document.createElement("option");

  unavailableOption.value = UNAVAILABLE_VALUE;
  unavailableOption.textContent = t("ui.unavailableTimeSlot");
  unavailableOption.dataset.unavailable = "true";
  unavailableOption.selected = selectedStudentKey === UNAVAILABLE_VALUE;
  editStudentSelect.appendChild(unavailableOption);

  students.forEach((student) => {
    const option = document.createElement("option");
    const label = getStudentDisplayName(student);

    option.value = student.id;
    option.textContent = `${label} (${student.email || t("ui.noEmail")})`;
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
      name: t("busy"),
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
    todayList.innerHTML = `<p>${t("ui.unableToLoadClasses")}</p>`;
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

  setText(todayDate, () => formatLongDate(now));

  if (todayBookings.length === 0) {
    todayList.innerHTML = `<p>${t("ui.youHaveNoClassesScheduledForToday")}</p>`;
    return;
  }

  todayList.innerHTML = todayBookings
    .map((booking) => {
      const endHour = booking.endHour || getEndHour(booking.hour);
      return `
        <article>
          <strong>${escapeHTML(booking.hour)} - ${escapeHTML(endHour)}</strong>
          <span>${escapeHTML(getStudentName(booking))}</span>
          <span>${escapeHTML(booking.subjectName || t("ui.class"))}</span>
        </article>
      `;
    })
    .join("");
}

function renderStudents() {
  billingPanel?.updateStudents();
  if (!studentList) {
    return;
  }

  if (studentProfilesLoadError) {
    studentList.innerHTML = `<p class="student-empty">${t("ui.unableToLoadStudentsFromSupabase")}</p>`;
    return;
  }

  if (classSessionsLoadError) {
    studentList.innerHTML = `<p class="student-empty">${t("ui.unableToLoadClassesFromSupabase")}</p>`;
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
    studentList.innerHTML = `<p class="student-empty">${t("ui.thereAreNoEnrolledStudentsYet")}</p>`;
    return;
  }

  function renderMonthlyTotals(classes) {
    const totals = classes.reduce((monthMap, booking) => {
      const bookingDate = getBookingDate(booking);
      const monthKey = booking.dateISO ? booking.dateISO.slice(0, 7) : booking.day || "sin-fecha";
      const monthLabel = bookingDate ? formatMonth(bookingDate) : t("ui.noDate");
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
          <strong>${t(month.total === 1 ? "classCountOne" : "classCountMany", { count: month.total })} · ${escapeHTML(formatDurationHours(month.minutes))}</strong>
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
                    <span class="class-material-name">${escapeHTML(material.file_name || t("ui.classPDF"))}</span>
                    <button class="class-material-view" type="button" data-material-view="${escapeAttribute(material.id)}">${t("ui.viewPDF")}</button>
                    <button class="class-material-view" type="button" data-material-delete="${escapeAttribute(material.id)}">${t("ui.deletePDF")}</button>
                  </div>
                `)
                .join("")
            : `<span class="class-material-empty">${t("ui.noPDFUploaded")}</span>`;
          return `
            <li>
              <strong>${escapeHTML(booking.subjectName || t("ui.class"))}</strong>
              <span>${escapeHTML(booking.dateLabel || booking.day || t("ui.noDate"))}, ${escapeHTML(booking.hour)} - ${escapeHTML(endHour)}</span>
              <span>${escapeHTML(t("durationTaught", { duration: durationLabel }))}</span>
              <div class="class-material-slot">
                <span class="class-material-title">${t("ui.notesOrPDFExercises")}</span>
                ${materialItems}
                <div class="class-material-actions">
                  <label class="class-material-upload">
                    <input type="file" accept="application/pdf" data-material-upload="${escapeAttribute(materialKey)}" />
                    ${t("ui.uploadPDF")}
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
          <span>${escapeHTML(student.email || t("ui.noEmail"))}</span>
          <span>${student.authUserId ? t("ui.accessCreated5f3d") : t("ui.noAccessa78a")}</span>
          <span>${t(student.classes.length === 1 ? "enrolledOne" : "enrolledMany", { count: student.classes.length })}</span>
          <ul class="student-monthly-counts">${monthlyTotals}</ul>
          <ul class="student-class-list">${nextClasses}</ul>
          <button class="teacher-remove" type="button" data-student-id="${escapeAttribute(student.id)}">
            ${t("ui.editStudent")}
          </button>
        </article>
      `;
    })
    .join("");
}

function renderSchedule() {
  if (classSessionsLoadError) {
    setText(scheduleStatus, () => t("ui.unableToLoadClassesFromSupabase"));
  }

  const bookings = loadBookings();
  const weekDates = getWeekDates();

  updateWeekHeader(weekDates);
  scheduleHead.innerHTML = "";
  scheduleBody.innerHTML = "";

  [t("time"), ...days.map((day, index) => formatDayHeader(day, weekDates[index]))].forEach((label) => {
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
              ? t("unavailableAria", { date: dateLabel, start: slotBooking.hour, end: slotBooking.endHour || getEndHour(slotBooking.hour) })
              : t("teacherClassAria", { name: getStudentName(slotBooking), subject: slotBooking.subjectName || t("ui.class"), date: dateLabel, start: slotBooking.hour, end: slotBooking.endHour || getEndHour(slotBooking.hour) })
          );
          cell.appendChild(button);
        });
      } else {
        const button = document.createElement("button");

        button.type = "button";
        button.className = "slot available slot-readonly";
        button.textContent = t("available");
        button.disabled = true;
        button.setAttribute("aria-label", t("timeAria", { date: dateLabel, time: hour }));
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
    setText(editScheduleStatus, () => t("ui.unableToLoadClassesFromSupabase"));
  }

  const values = readAssignmentForm();
  const bookings = loadBookings();
  const weekDates = getEditWeekDates();

  updateEditWeekHeader(weekDates);
  fillEditDaySelect();
  editScheduleHead.innerHTML = "";
  editScheduleBody.innerHTML = "";

  [t("time"), ...days.map((day, index) => formatDayHeader(day, weekDates[index]))].forEach((label) => {
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
              ? t("unavailableAria", { date: dateLabel, start: slotBooking.hour, end: slotBooking.endHour || getEndHour(slotBooking.hour) })
              : t("teacherClassAria", { name: getStudentName(slotBooking), subject: slotBooking.subjectName || t("ui.class"), date: dateLabel, start: slotBooking.hour, end: slotBooking.endHour || getEndHour(slotBooking.hour) })
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
        button.textContent = t("available");
        button.disabled = true;
        button.setAttribute("aria-label", t("timeAria", { date: dateLabel, time: hour }));
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
  setText(editSlotTitle, () => isUnavailableSelection
    ? `${t("busy")}: ${selection.dateLabel}`
    : `${subjectNames[selection.subject]}: ${selection.dateLabel}`);
  setText(editSlotHelp, () => selection.existingBooking
    ? t("ui.youCanChangeTheExactTimeOrRemoveThisTimeSlotFromTheCalendar")
    : t("ui.chooseARegisteredStudentOrAnUnavailableTimeSlotAndSetTheExactTime"));
  editStartTime.value = selection.startHour;
  editEndTime.value = selection.endHour;
  editClassNotes.value = selection.existingBooking?.notes || "";
  removeEditSlot.hidden = !selection.existingBooking;
  setHTML(editScheduleStatus, () => `<strong>${isUnavailableSelection ? t("busy") : subjectNames[selection.subject]}: ${selection.dateLabel}</strong><span>${t("ui.timeSlotSelected")}</span>`);
}

function clearPendingEditSelection() {
  pendingEditSelection = null;

  if (editSlotEditor) {
    setText(editSlotTitle, () => t("ui.addClass"));
    setText(editSlotHelp, () => t("ui.chooseARegisteredStudentOrAnUnavailableTimeSlotAndSetTheExactTime"));
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
    setText(editScheduleStatus, () => t("ui.selectARegisteredStudentFirst"));
    return;
  }

  if (!selectedDay || !selectedDay.value) {
    setText(editScheduleStatus, () => t("ui.selectTheClassDayFirst"));
    return;
  }

  if (!startHour || !endHour || minutesFromTime(endHour) <= minutesFromTime(startHour)) {
    setText(editScheduleStatus, () => t("ui.theEndTimeMustBeLaterThanTheStartTime"));
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
    subjectName: selectedStudent.type === "unavailable" ? t("busy") : subjectNames[selection.subject],
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
    setText(editScheduleStatus, () => t("ui.firstSelectAnAssignedClassHighlightedInYellow"));
    return;
  }

  const selectedStudent = applySelectedStudentToForm();

  if (!selectedStudent) {
    setText(editScheduleStatus, () => t("ui.selectARegisteredStudentFirst"));
    return;
  }

  await toggleBooking({
    ...pendingEditSelection,
    ...selectedStudent,
    subject: selectedStudent.type === "unavailable" ? "unavailable" : pendingEditSelection.subject,
    subjectName: selectedStudent.type === "unavailable" ? t("busy") : subjectNames[pendingEditSelection.subject],
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
    setText(teacherStatus, () => t("ui.selectARegisteredStudentBeforeSchedulingAClass"));
    setText(editScheduleStatus, () => t("ui.studentDetailsAreMissing"));
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
  const selectionLabel = () => isUnavailableSelection
    ? t("busy")
    : subjectNames[selection.subject];
  const slot = () => t("slotSummary", { subject: selectionLabel(), date: selection.dateISO ? formatFullDate(parseDateKey(selection.dateISO)) : selection.dateLabel, start: selection.hour, end: selection.endHour });

  if (action === "remove" && existingIndex >= 0) {
    const bookingToRemove = bookings[existingIndex];
    const { error } = await supabase
      .from("class_sessions")
      .delete()
      .eq("id", bookingToRemove.id)
      .eq("teacher_id", teacherProfile.id);

    if (error) {
      console.error("Error eliminando clase:", error);
      setText(teacherStatus, () => t("ui.unableToRemoveTheTimeSlot"));
      setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.errorRemovingTheTimeSlot")}</span>`);
      return;
    }

    setText(teacherStatus, () => isUnavailableSelection
      ? t("ui.unavailableTimeSlotRemovedFromTheCalendar")
      : t("ui.classRemovedFromTheStudentProfile"));
    setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.timeSlotRemoved")}</span>`);
    pendingEditSelection = null;
    clearPendingEditSelection();
  } else if (existingIndex >= 0) {
    const bookingToUpdate = bookings[existingIndex];

    if (occupiedIndex >= 0) {
      const occupiedBooking = bookings[occupiedIndex];
      const occupiedStudent = () => getSlotLabel(occupiedBooking);

      setText(teacherStatus, () => t("occupied", { name: occupiedStudent() }));
      setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.thisTimeSlotAlreadyHasAStudent")}</span>`);
      return;
    }

    const { error } = await supabase
      .from("class_sessions")
      .update(getClassSessionPayload(selection))
      .eq("id", bookingToUpdate.id)
      .eq("teacher_id", teacherProfile.id);

    if (error) {
      console.error("Error actualizando clase:", error);
      setText(teacherStatus, () => t("ui.unableToUpdateTheTimeSlot"));
      setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.errorUpdatingTheTimeSlot")}</span>`);
      return;
    }

    setText(teacherStatus, () => isUnavailableSelection
      ? t("ui.unavailableTimeSlotUpdated")
      : t("ui.classUpdatedInTheStudentProfile"));
    setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.timeSlotUpdated")}</span>`);
  } else if (occupiedIndex >= 0) {
    const occupiedBooking = bookings[occupiedIndex];
    const occupiedStudent = () => getSlotLabel(occupiedBooking);
    const sameStudent =
      isUnavailableSelection ||
      (selection.studentId && occupiedBooking.studentId === selection.studentId);

    if (!sameStudent || occupiedBooking.subject !== selection.subject || isUnavailable(occupiedBooking) !== isUnavailableSelection) {
      setText(teacherStatus, () => t("occupied", { name: occupiedStudent() }));
      setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.thisTimeSlotAlreadyHasAStudent")}</span>`);
      return;
    }

    const { error } = await supabase
      .from("class_sessions")
      .update(getClassSessionPayload(selection))
      .eq("id", occupiedBooking.id)
      .eq("teacher_id", teacherProfile.id);

    if (error) {
      console.error("Error actualizando clase:", error);
      setText(teacherStatus, () => t("ui.unableToUpdateTheTimeSlot"));
      setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.errorUpdatingTheTimeSlot")}</span>`);
      return;
    }

    setText(teacherStatus, () => isUnavailableSelection
      ? t("ui.unavailableTimeSlotUpdated")
      : t("ui.classUpdatedInTheStudentProfile"));
    setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.timeSlotUpdated")}</span>`);
  } else {
    const { error } = await supabase
      .from("class_sessions")
      .insert(getClassSessionPayload(selection));

    if (error) {
      console.error("Error creando clase:", error);
      setText(teacherStatus, () => errorText(error, t("ui.unableToSaveTheTimeSlot")));
      setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${escapeHTML(errorText(error, t("ui.errorSavingTheTimeSlot")))}</span>`);
      return;
    }

    setText(teacherStatus, () => isUnavailableSelection
      ? t("ui.unavailableTimeSlotAddedToTheCalendar")
      : t("ui.classScheduledInTheStudentProfile"));
    setHTML(editScheduleStatus, () => `<strong>${slot()}</strong><span>${t("ui.timeSlotSaved")}</span>`);
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
    setText(teacherStatus, () => t("ui.unableToReloadTheStudentList"));
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
    setText(teacherStatus, () => t("ui.unableToReloadClasses"));
  } finally {
    billingPanel?.reload();
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
    setText(teacherStatus, () => t("ui.enterAtLeastAFirstNameAndUsernameToSaveTheStudent"));
    return;
  }

  setText(teacherStatus, () => isEditingStudent ? t("ui.updatingStudent") : t("ui.creatingStudent"));
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
    setText(teacherStatus, () => isEditingStudent ? t("ui.studentUpdatedSuccessfully") : t("ui.studentCreatedSuccessfully"));
  } catch (error) {
    console.error("Error guardando alumno:", error);
    setText(teacherStatus, () => errorText(error, t("ui.unableToSaveTheStudent")));
  } finally {
    saveStudentDetailsButton.disabled = false;
  }
}

async function saveStudentClassLink() {
  const student = getEditingStudent();

  if (!student) {
    setText(teacherStatus, () => t("ui.loadOrSaveAStudentBeforeSavingTheirClassLink"));
    return;
  }

  const classUrl = teacherForm.elements.classUrl.value.trim();
  saveClassLinkButton.disabled = true;
  setText(teacherStatus, () => t("ui.savingClassLink"));

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
    setText(teacherStatus, () => t("ui.classLinkSaved"));
  } catch (error) {
    console.error("Error guardando enlace de clase:", error);
    setText(teacherStatus, () => errorText(error, t("ui.unableToSaveTheClassLink")));
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
    setText(teacherStatus, () => t("ui.loadOrSaveAStudentBeforeCreatingTheirAccess"));
    return;
  }

  if (password.length < 8) {
    setText(teacherStatus, () => t("ui.thePasswordMustContainAtLeast8Characters"));
    return;
  }

  saveStudentAccess.disabled = true;
  setText(teacherStatus, () => hasAccess ? t("ui.changingPassword") : t("ui.creatingStudentAccess"));

  try {
    if (hasAccess) {
      const { error } = await supabase.functions.invoke("set-student-password", {
        body: {
          student_id: student.id,
          password,
        },
      });

      if (error) {
        throw new Error(await getFunctionErrorMessage(error, t("ui.unableToChangeThePassword")));
      }

      teacherForm.elements.studentPassword.value = "";
      setText(teacherStatus, () => t("ui.passwordUpdatedSuccessfully"));
      return;
    }

    const email = values.email.trim();
    const username = values.studentUsername.trim();

    if (!email || !username) {
      setText(teacherStatus, () => t("ui.enterAnEmailUsernameAndPasswordToCreateAccess"));
      return;
    }

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const session = sessionData?.session;

    if (sessionError || !session?.access_token) {
      setText(teacherStatus, () => t("ui.theTeacherSessionIsUnavailablePleaseSignInAgain"));
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
      throw new Error(await getFunctionErrorMessage(error, t("ui.unableToCreateAccess")));
    }

    teacherForm.elements.studentPassword.value = "";
    saveDraft();
    await reloadStudentProfiles(student.id);
    updateStudentAccessControls();
    setText(teacherStatus, () => t("ui.accessCreatedSuccessfully"));
  } catch (error) {
    console.error("Error guardando acceso:", error);
    setText(teacherStatus, () => errorText(error, t("ui.unableToSaveAccess")));
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
    setText(teacherStatus, () => t("ui.loadAStudentBeforeDeletingThem"));
    return;
  }

  const studentName = getStudentDisplayName(student);
  const confirmed = window.confirm(
    t("deleteStudentConfirm", { name: studentName })
  );

  if (!confirmed) {
    return;
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData?.session;

  if (!session?.access_token) {
    setText(teacherStatus, () => t("ui.theTeacherSessionIsUnavailablePleaseSignInAgain"));
    return;
  }

  setText(teacherStatus, () => t("ui.deletingStudent"));
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
      let deleteErrorMessage = errorText(error, t("ui.unableToDeleteTheStudent"));

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
    setText(teacherStatus, () => t("ui.studentDeletedSuccessfully"));
  } catch (error) {
    console.error("Error eliminando alumno:", error);
    setText(teacherStatus, () => errorText(error, t("ui.unableToDeleteTheStudent")));
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
      setText(teacherStatus, () => t("ui.thePDFToDeleteCouldNotBeFound"));
      return;
    }

    const { material } = materialMatch;

    setText(teacherStatus, () => t("ui.deletingPDF"));
    const { error: storageError } = await supabase.storage
      .from(CLASS_MATERIALS_BUCKET)
      .remove([material.file_path]);

    if (storageError) {
      console.error("Error eliminando PDF de Storage:", storageError);
      setText(teacherStatus, () => errorText(storageError, t("ui.unableToDeleteThePDFFile")));
      return;
    }

    const { error: deleteError } = await supabase
      .from("class_materials")
      .delete()
      .eq("id", material.id);

    if (deleteError) {
      console.error("Error eliminando metadatos del PDF:", deleteError);
      setText(teacherStatus, () => errorText(deleteError, t("ui.unableToDeleteThePDFMetadata")));
      return;
    }

    await reloadClassSessions();
    renderStudents();
    setText(teacherStatus, () => t("ui.pdfDeletedSuccessfully"));
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
  setText(teacherStatus, () => t("ui.studentLoadedYouCanUpdateTheirAcademicDetails"));
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
    setText(teacherStatus, () => t("ui.onlyPDFFilesCanBeUploaded"));
    input.value = "";
    return;
  }

  const bookings = loadBookings();
  const booking = findBookingByMaterialKey(bookings, input.dataset.materialUpload);

  if (!booking?.id) {
    setText(teacherStatus, () => t("ui.theClassForThisPDFCouldNotBeFound"));
    input.value = "";
    return;
  }

  const materialId = createMaterialId();
  const filePath = `${booking.id}/${materialId}.pdf`;
  const mimeType = file.type || "application/pdf";
  const uploadedAt = new Date().toISOString();

  setText(teacherStatus, () => t("ui.uploadingPDF"));

  const { error: uploadError } = await supabase.storage
    .from(CLASS_MATERIALS_BUCKET)
    .upload(filePath, file, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error subiendo PDF:", uploadError);
    setText(teacherStatus, () => errorText(uploadError, t("ui.unableToUploadThePDF")));
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
    setText(teacherStatus, () => errorText(insertError, t("ui.unableToSaveThePDFMetadata")));
    input.value = "";
    return;
  }

  await reloadClassSessions();
  renderStudents();
  setText(teacherStatus, () => t("ui.pdfSavedAndReadyToViewOnTheWebsite"));
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
    const selectionLabel = () => selectedStudent.type === "unavailable"
      ? t("busy")
      : subjectNames[selectedClass.subject];
    const studentLabel = () => selectedStudent.type === "unavailable"
      ? t("ui.unavailableTimeSlot")
      : [selectedStudent.name, selectedStudent.surname].filter(Boolean).join(" ") || selectedStudent.username || selectedStudent.email;

    const selectedClass = pendingEditSelection;
    setHTML(editScheduleStatus, () => `<strong>${selectionLabel()}: ${selectedClass.dateISO ? formatFullDate(parseDateKey(selectedClass.dateISO)) : selectedClass.dateLabel}</strong><span>${escapeHTML(t("selectedStudent", { name: studentLabel() }))}</span>`);
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
  setText(scheduleStatus, () => t("ui.readOnlyOverviewAllStudentsClassesAppearHere"));
  renderSchedule();
});

nextWeek.addEventListener("click", () => {
  weekStart = addWeeks(weekStart, 1);
  setText(scheduleStatus, () => t("ui.readOnlyOverviewAllStudentsClassesAppearHere"));
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
  setText(editScheduleStatus, () => t("ui.editableCalendarChooseAStudentDayAndTimeToSaveAClass"));
  renderEditableSchedule();
});

editNextWeek?.addEventListener("click", () => {
  editWeekStart = addWeeks(editWeekStart, 1);
  clearPendingEditSelection();
  setText(editScheduleStatus, () => t("ui.editableCalendarChooseAStudentDayAndTimeToSaveAClass"));
  renderEditableSchedule();
});

billingPanel = createTeacherBilling({
  root: document.querySelector("#teacher-billing"),
  teacherId: teacherProfile.id,
  getStudents: getRegisteredStudents,
  getStudentName: getStudentDisplayName,
  hasStudentError: () => Boolean(studentProfilesLoadError),
});

fillDraft();
prepareNewClassEditor();
renderTodaySummary();
renderStudents();
renderSchedule();
renderEditableSchedule();
updateStudentAccessControls();

onLanguageChange(() => {
  classSessionBookings.forEach(booking => {
    booking.subjectName = isUnavailable(booking)
      ? t("busy")
      : subjectNames[booking.subject] || booking.subject || t("ui.class");
    const date = parseDateKey(booking.dateISO);
    if (date) booking.dateLabel = formatFullDate(date);
  });
  if (pendingEditSelection?.dateISO) {
    pendingEditSelection.dateLabel = formatFullDate(parseDateKey(pendingEditSelection.dateISO));
  }
  if (teacherUserLabel) {
    setText(teacherUserLabel, () => teacherProfile.username || teacherProfile.email || t("ui.teacher"));
  }
  const selectedStudent = editStudentSelect.value;
  const selectedDay = editDaySelect.value;
  fillStudentSelect(selectedStudent);
  editStudentSelect.value = selectedStudent;
  fillEditDaySelect(selectedDay);
  editDaySelect.value = selectedDay;
  renderTodaySummary();
  renderStudents();
  renderSchedule();
  renderEditableSchedule();
  updateStudentAccessControls();
});
