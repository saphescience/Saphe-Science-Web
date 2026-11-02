import { supabase } from "./supabaseClient.js";

const { t, locale, subjectLabel, onLanguageChange, setText, setHTML, errorText } = window.SapheI18n;

const hours = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];
const subjectNames = new Proxy({}, { get: (_, key) => subjectLabel(key) });

const profileForm = document.querySelector("#profile-form");
const profileStatus = document.querySelector("#profile-status");
const profileHeading = document.querySelector("#profile-heading");
const profileSignupTitle = document.querySelector("#profile-signup-title");
const profileUserLabel = document.querySelector("#profile-user-label span");
const studentNextClass = document.querySelector("#student-next-class");
const studentClassLink = document.querySelector("#student-class-link");
const bookingList = document.querySelector("#booking-list");
const scheduleHead = document.querySelector("#profile-schedule-head");
const scheduleBody = document.querySelector("#profile-schedule-body");
const scheduleStatus = document.querySelector("#profile-schedule-status");
const currentMonth = document.querySelector("#current-month");
const currentWeek = document.querySelector("#current-week");
const previousWeek = document.querySelector("#previous-week");
const nextWeek = document.querySelector("#next-week");
const classNoteModal = document.querySelector("#class-note-modal");
const classNoteClose = document.querySelector("#class-note-close");
const classNoteTitle = document.querySelector("#class-note-title");
const classNoteTime = document.querySelector("#class-note-time");
const classNoteText = document.querySelector("#class-note-text");
const classNoteMaterial = document.querySelector("#class-note-material");
const classMaterialModal = document.querySelector("#class-material-modal");
const classMaterialClose = document.querySelector("#class-material-close");
const classMaterialTitle = document.querySelector("#class-material-title");
const classMaterialFrame = document.querySelector("#class-material-frame");

const CLASS_MATERIALS_BUCKET = "class-materials";

let profile = null;
let classBookings = [];
let weekStart = getWeekStart(new Date());
let activeClassMaterialUrl = "";
let activeNoteBooking = null;

function redirectToHome() {
  window.location.replace("index.html#inicio");
}

function redirectToTeacher() {
  window.location.replace("profesor.html");
}

async function loadStudentProfile() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const user = sessionData?.session?.user;

  if (sessionError || !user) {
    return { user: null, profile: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, first_name, last_name, role, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    throw error;
  }

  return { user, profile: data };
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
  const bookingDate = parseDateKey(session.date);
  const subjectName = subjectNames[session.subject] || session.subject || t("ui.class");
  const hour = normalizeTime(session.start_time);
  const endHour = normalizeTime(session.end_time);
  const dateLabel = bookingDate ? formatFullDate(bookingDate) : "";
  const materials = materialsByClassSession.get(session.id) || [];

  return {
    id: session.id,
    studentId: session.student_id || "",
    teacherId: session.teacher_id || "",
    type: session.type,
    subject: session.subject,
    subjectName,
    day: bookingDate ? days[bookingDate.getDay() === 0 ? 6 : bookingDate.getDay() - 1] : "",
    dateISO: session.date,
    dateLabel,
    slotHour: getTimeSlotHour(hour),
    hour,
    endHour,
    notes: session.notes || "",
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
    .select("id, class_session_id, file_path, file_name, mime_type, file_size, created_at, updated_at")
    .in("class_session_id", classSessionIds)
    .order("created_at", { ascending: true });

  if (error) {
    error.source = "class_materials";
    throw error;
  }

  return (data || []).reduce((materialsMap, material) => {
    const currentMaterials = materialsMap.get(material.class_session_id) || [];
    currentMaterials.push(material);
    materialsMap.set(material.class_session_id, currentMaterials);
    return materialsMap;
  }, new Map());
}

async function loadStudentClasses(studentId) {
  const { data, error } = await supabase
    .from("class_sessions")
    .select("id, created_at, student_id, teacher_id, subject, date, start_time, end_time, notes, type, updated_at")
    .eq("student_id", studentId)
    .eq("type", "class")
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    throw error;
  }

  const sessions = data || [];
  const classSessionIds = sessions.map((booking) => booking.id);
  let materialsByClassSession = new Map();

  try {
    materialsByClassSession = await loadClassMaterials(classSessionIds);
  } catch (error) {
    console.error("Error cargando materiales de clase:", error);
    if (scheduleStatus) {
      setText(scheduleStatus, () => t("ui.yourClassesHaveLoadedButThePDFMaterialsCouldNotBeLoaded"));
    }
  }

  return sessions.map((session) => normalizeClassSession(session, materialsByClassSession));
}

async function loadAcademicStudent(userId) {
  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, first_name, last_name, username, email, auth_user_id, class_url")
    .eq("auth_user_id", userId)
    .single();

  if (studentError) {
    throw studentError;
  }

  return student;
}

const sessionProfile = await loadStudentProfile();

if (!sessionProfile.user) {
  redirectToHome();
  throw new Error(t("ui.studentIsNotSignedIn"));
}

if (sessionProfile.profile?.role === "teacher") {
  redirectToTeacher();
  throw new Error(t("ui.teachersCannotUseTheStudentProfile"));
}

if (sessionProfile.profile?.role !== "student") {
  redirectToHome();
  throw new Error(t("ui.studentProfileAccessDenied"));
}

profile = sessionProfile.profile;

let academicStudent = null;

try {
  academicStudent = await loadAcademicStudent(sessionProfile.user.id);
} catch (error) {
  console.error("Error cargando alumno académico:", error);
  classBookings = [];
  if (scheduleStatus) {
    setText(scheduleStatus, () => error?.code === "PGRST116"
      ? t("ui.yourAccountIsNotLinkedToAStudentRecordYet")
      : t("ui.unableToLoadYourLinkedStudentRecord"));
  }
}

if (academicStudent?.id) {
  try {
    classBookings = await loadStudentClasses(academicStudent.id);
  } catch (error) {
    console.error("Error cargando clases del alumno:", error);
    classBookings = [];
    if (scheduleStatus) {
      setText(scheduleStatus, () => t("ui.unableToLoadYourClasses"));
    }
  }
} else {
  classBookings = [];
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

function getProfileName() {
  return [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") || profile?.username || t("profileTitle");
}

function getVisibleBookings() {
  return classBookings;
}

function getVisibleClasses() {
  return getVisibleBookings().filter((booking) => !isUnavailable(booking));
}

function saveProfile(nextProfile) {
  profile = {
    ...profile,
    first_name: nextProfile.name || profile.first_name,
    last_name: nextProfile.surname || profile.last_name,
    email: profile.email || nextProfile.email,
  };
  updateProfileHeader();
}

function updateProfileHeader() {
  const accountLabel = getProfileName();
  setText(profileHeading, () => accountLabel);
  if (profileSignupTitle) {
    profileSignupTitle.textContent = t("signupQuestion", { name: accountLabel });
  }
  setText(profileUserLabel, () => accountLabel);
}

function fillProfileForm() {
  if (!profileForm) {
    return;
  }

  profileForm.elements.email.value = profile.email || "";
  profileForm
    .querySelectorAll('input[name="classes"]')
    .forEach((input) => {
      input.checked = Array.isArray(profile.classes)
        ? profile.classes.includes(input.value)
        : false;
    });
}

function readProfileForm() {
  const formData = new FormData(profileForm);
  return {
    name: profile.first_name || profile.username || "",
    surname: profile.last_name || "",
    email: profile.email || formData.get("email").trim(),
    classes: formData.getAll("classes"),
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

function formatDayHeader(day, date) {
  return `${new Intl.DateTimeFormat(locale(), { weekday: "long" }).format(date)} ${date.getDate()}`;
}

function formatFullDate(date) {
  return new Intl.DateTimeFormat(locale(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatFullDateWithYear(date) {
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

function updateWeekHeader(weekDates) {
  const weekEnd = weekDates[weekDates.length - 1];
  const monthLabel =
    weekStart.getMonth() === weekEnd.getMonth()
      ? formatMonth(weekStart)
      : `${formatMonth(weekStart)} - ${formatMonth(weekEnd)}`;

  setText(currentMonth, () => monthLabel);
  setText(currentWeek, () => `${weekStart.getDate()} - ${weekEnd.getDate()}`);
}

function bookingMatches(booking, day, hour, dateISO) {
  if (getBookingSlotHour(booking) !== hour) {
    return false;
  }

  return booking.dateISO ? booking.dateISO === dateISO : booking.day === day;
}

function getBookingSlotHour(booking) {
  return getTimeSlotHour(booking.hour || booking.slotHour);
}

function isUnavailable(booking) {
  return Boolean(booking && booking.type === "unavailable");
}

function getTimeSlotHour(value) {
  const valueMinutes = minutesFromTime(value);
  const matchingHour = hours
    .slice()
    .reverse()
    .find((hour) => minutesFromTime(hour) <= valueMinutes);

  return matchingHour || hours[0];
}

function minutesFromTime(value) {
  const [hour, minutes] = String(value || "").split(":").map(Number);
  return hour * 60 + minutes;
}

function getBookingDate(booking) {
  if (booking.dateISO) {
    const [year, month, day] = booking.dateISO.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const dayIndex = days.indexOf(booking.day);
  return dayIndex >= 0 ? addDays(getWeekStart(new Date()), dayIndex) : null;
}

function getBookingStartDate(booking) {
  const bookingDate = getBookingDate(booking);

  if (!bookingDate) {
    return null;
  }

  const [hour, minutes] = String(booking.hour || "00:00").split(":").map(Number);
  bookingDate.setHours(hour || 0, minutes || 0, 0, 0);
  return bookingDate;
}

function getBookingEndDate(booking) {
  const bookingDate = getBookingDate(booking);

  if (!bookingDate) {
    return null;
  }

  const [hour, minutes] = String(booking.endHour || getEndHour(booking.hour)).split(":").map(Number);
  bookingDate.setHours(hour || 0, minutes || 0, 0, 0);
  return bookingDate;
}

function findVisibleMaterialById(materialId) {
  return getVisibleClasses()
    .flatMap((booking) => booking.materials || [])
    .find((material) => material.id === materialId);
}

function getMaterialButtonHTML(material) {
  if (!material?.id) {
    return "";
  }

  return `
    <button class="class-material-view" type="button" data-material-view="${escapeAttribute(material.id)}">
      ${t("ui.viewPDF")}
    </button>
  `;
}

function releaseClassMaterialUrl() {
  if (activeClassMaterialUrl.startsWith("blob:")) {
    URL.revokeObjectURL(activeClassMaterialUrl);
  }

  activeClassMaterialUrl = "";
}

function showClassMaterialError(message) {
  if (profileStatus) {
    setText(profileStatus, () => message);
    return;
  }

  if (scheduleStatus) {
    setText(scheduleStatus, () => message);
  }
}

async function openClassMaterial(material) {
  if (!classMaterialModal || !classMaterialFrame) {
    return;
  }

  if (!material?.file_path) {
    showClassMaterialError(t("ui.thisMaterialHasNoAssociatedPDFFile"));
    return;
  }

  const { data, error } = await supabase.storage
    .from(CLASS_MATERIALS_BUCKET)
    .createSignedUrl(material.file_path, 60 * 10);

  if (error || !data?.signedUrl) {
    console.error("Error generando URL firmada del material:", error);
    showClassMaterialError(t("ui.unableToOpenThePDFForThisClass"));
    return;
  }

  releaseClassMaterialUrl();
  activeClassMaterialUrl = data.signedUrl;
  setText(classMaterialTitle, () => material.file_name || t("ui.classPDF"));
  classMaterialFrame.src = `${activeClassMaterialUrl}#toolbar=0&navpanes=0&scrollbar=1`;
  classMaterialModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeClassMaterial() {
  if (!classMaterialModal || !classMaterialFrame) {
    return;
  }

  classMaterialModal.hidden = true;
  classMaterialFrame.src = "";
  releaseClassMaterialUrl();
  document.body.classList.toggle("modal-open", Boolean(classNoteModal && !classNoteModal.hidden));
}

function getUpcomingClass() {
  const now = new Date();

  return getVisibleClasses()
    .map((booking) => ({
      booking,
      startsAt: getBookingStartDate(booking),
    }))
    .filter(({ startsAt }) => startsAt && startsAt >= now)
    .sort((first, second) => first.startsAt - second.startsAt)[0]?.booking;
}

function renderStudentNextClass() {
  if (!studentNextClass) {
    return;
  }

  const today = formatFullDateWithYear(new Date());
  const nextClass = getUpcomingClass();

  if (!nextClass) {
    studentNextClass.innerHTML = `
      <p>${escapeHTML(t("today", { date: today }))}</p>
      <p>${t("noNextClass")}</p>
    `;
    return;
  }

  const classDate = getBookingDate(nextClass);
  const classDateLabel = classDate ? formatFullDateWithYear(classDate) : nextClass.dateLabel || nextClass.day;
  const endHour = nextClass.endHour || getEndHour(nextClass.hour);
  const hasNote = Boolean(nextClass.notes && nextClass.notes.trim());
  const notesHTML = hasNote
    ? `
      <p class="student-next-class__note">
        <span>${t("ui.notes")}</span>
        <strong>${escapeHTML(nextClass.notes)}</strong>
      </p>
    `
    : "";

  studentNextClass.innerHTML = `
    <p>${escapeHTML(t("today", { date: today }))}</p>
    <p>${escapeHTML(t("nextClass", { date: classDateLabel, start: nextClass.hour, end: endHour }))}</p>
    ${notesHTML}
  `;
}

function getPastClasses() {
  const now = new Date();

  return getVisibleClasses()
    .map((booking) => ({
      booking,
      endsAt: getBookingEndDate(booking),
    }))
    .filter(({ endsAt }) => endsAt && endsAt < now)
    .sort((first, second) => second.endsAt - first.endsAt)
    .map(({ booking }) => booking);
}

function renderClassLink() {
  if (!studentClassLink) {
    return;
  }

  const classLink = (academicStudent?.class_url || "").trim();

  if (!classLink) {
    studentClassLink.hidden = true;
    studentClassLink.href = "#";
    studentClassLink.removeAttribute("target");
    studentClassLink.removeAttribute("rel");
    studentClassLink.setAttribute("aria-disabled", "true");
    return;
  }

  studentClassLink.hidden = false;
  setText(studentClassLink, () => t("ui.joinCLASS"));
  studentClassLink.href = classLink;
  studentClassLink.target = "_blank";
  studentClassLink.rel = "noopener noreferrer";
  studentClassLink.removeAttribute("aria-disabled");
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

function openClassNote(booking) {
  if (!classNoteModal) {
    return;
  }
  activeNoteBooking = booking;

  const endHour = booking.endHour || getEndHour(booking.hour);
  const hasTeacherNote = Boolean(booking.notes && booking.notes.trim());

  setText(classNoteTitle, () => booking.subjectName || t("ui.class"));
  setText(classNoteTime, () => `${booking.dateLabel || booking.day || t("ui.noDate")} · ${booking.hour} - ${endHour}`);
  setText(classNoteText, () => hasTeacherNote ? booking.notes : t("ui.thereAreNoNotesForThisClass"));
  classNoteText.classList.toggle("has-teacher-note", hasTeacherNote);

  if (classNoteMaterial) {
    const materials = booking.materials || [];

    if (materials.length) {
      classNoteMaterial.hidden = false;
      classNoteMaterial.innerHTML = `
        <span>${t("ui.pdfMaterial")}</span>
        ${materials.map((material) => `
          <div class="student-class-material">
            <strong>${escapeHTML(material.file_name || t("ui.classPDF"))}</strong>
            ${getMaterialButtonHTML(material)}
          </div>
        `).join("")}
      `;
    } else {
      classNoteMaterial.hidden = false;
      classNoteMaterial.innerHTML = `<span>${t("ui.thereAreNoMaterialsAttachedToThisClass")}</span>`;
    }
  }

  classNoteModal.hidden = false;
  document.body.classList.add("modal-open");
}

function closeClassNote() {
  if (!classNoteModal) {
    return;
  }

  classNoteModal.hidden = true;
  if (classNoteMaterial) {
    classNoteMaterial.hidden = true;
    classNoteMaterial.innerHTML = "";
  }
  document.body.classList.remove("modal-open");
}

function renderBookings() {
  const bookings = getPastClasses();
  renderStudentNextClass();
  renderClassLink();

  if (bookings.length === 0) {
    bookingList.innerHTML = `<p>${t("ui.youHaveNoCompletedClassesYet")}</p>`;
    return;
  }

  bookingList.innerHTML = bookings
    .map((booking) => {
      const endHour = booking.endHour || getEndHour(booking.hour);
      const subjectLabel = booking.subjectName || t("ui.class");
      const classDate = getBookingDate(booking);
      const classDateLabel = classDate ? formatFullDateWithYear(classDate) : booking.dateLabel || booking.day;
      const notesHTML = booking.notes && booking.notes.trim()
        ? `<div class="past-class-note"><span>${t("ui.classNotes")}</span><p>${escapeHTML(booking.notes)}</p></div>`
        : `<div class="past-class-note past-class-note--empty"><span>${t("ui.classNotes")}</span><p>${t("ui.noNotesRecorded")}</p></div>`;
      const materials = booking.materials || [];
      const materialHTML = materials.length
        ? `
          <div class="student-class-material">
            <span>${t("ui.pdfMaterial")}</span>
            ${materials.map((material) => `
              <div class="student-class-material">
                <strong>${escapeHTML(material.file_name || t("ui.classPDF"))}</strong>
                ${getMaterialButtonHTML(material)}
              </div>
            `).join("")}
          </div>
        `
        : "";
      return `
        <article>
          <strong>${escapeHTML(subjectLabel)}</strong>
          <span>${t("ui.date")} ${escapeHTML(classDateLabel)}</span>
          <span>${t("ui.startTimec2af")} ${escapeHTML(booking.hour)}</span>
          <span>${t("ui.endTime4a7a")} ${escapeHTML(endHour)}</span>
          ${notesHTML}
          ${materialHTML}
        </article>
      `;
    })
    .join("");
}

function renderSchedule() {
  const bookings = getVisibleBookings();
  const weekDates = getWeekDates();

  updateWeekHeader(weekDates);
  scheduleHead.innerHTML = "";
  scheduleBody.innerHTML = "";

  [t("time"), ...days.map((day, index) => formatDayHeader(day, weekDates[index]))].forEach((label, index) => {
    const th = document.createElement("th");

    if (index > 0 && formatDateKey(weekDates[index - 1]) === formatDateKey(new Date())) {
      th.className = "today-column-heading";
      th.innerHTML = `
        <svg class="today-hexagons" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
          <polygon points="14 1.5 25 8 25 20 14 26.5 3 20 3 8"></polygon>
        </svg>
        <span>${label}</span>
      `;
    } else {
      th.textContent = label;
    }

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
      const slotKey = `${dayIndex}-${hour}`;
      const date = weekDates[dayIndex];
      const dateISO = formatDateKey(date);
      const dateLabel = formatFullDate(date);
      const assignedClasses = bookings.filter((booking) =>
        bookingMatches(booking, day, hour, dateISO)
      );
      const hasAssignedClasses = assignedClasses.length > 0;

      if (hasAssignedClasses) {
        cell.classList.add("slot-cell-available");
      }

      if (hasAssignedClasses) {
        assignedClasses.forEach((assignedClass) => {
          const isBusy = isUnavailable(assignedClass);
          const button = document.createElement("button");

          button.type = "button";
          button.className = `slot ${isBusy ? "busy" : "reserved"} slot-readonly`;
          button.textContent = isBusy ? t("busy") : assignedClass.subjectName || t("ui.class");
          applySlotTiming(button, assignedClass);
          button.disabled = isBusy;
          button.setAttribute(
            "aria-label",
            isBusy
              ? t("unavailableAria", { date: dateLabel, start: assignedClass.hour, end: assignedClass.endHour || getEndHour(assignedClass.hour) })
              : t("assignedAria", { subject: assignedClass.subjectName || t("ui.class"), date: dateLabel, start: assignedClass.hour, end: assignedClass.endHour || getEndHour(assignedClass.hour) })
          );

          if (!isBusy) {
            button.addEventListener("click", () => {
              openClassNote(assignedClass);
            });
          }

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

profileForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const nextProfile = readProfileForm();

  saveProfile(nextProfile);
  setText(profileStatus, () => t("profileSaved"));
  renderBookings();
  renderSchedule();
});

previousWeek.addEventListener("click", () => {
  weekStart = addWeeks(weekStart, -1);
  setText(scheduleStatus, () => t("ui.readOnlyCalendarClassesScheduledByYourTeacherAreHighlighted"));
  renderSchedule();
});

nextWeek.addEventListener("click", () => {
  weekStart = addWeeks(weekStart, 1);
  setText(scheduleStatus, () => t("ui.readOnlyCalendarClassesScheduledByYourTeacherAreHighlighted"));
  renderSchedule();
});

classNoteClose?.addEventListener("click", closeClassNote);
classNoteModal?.addEventListener("click", (event) => {
  if (event.target === classNoteModal) {
    closeClassNote();
  }
});

bookingList?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-material-view]");

  if (!button) {
    return;
  }

  const material = findVisibleMaterialById(button.dataset.materialView);

  if (material) {
    openClassMaterial(material);
  }
});

classNoteMaterial?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-material-view]");

  if (!button) {
    return;
  }

  const material = findVisibleMaterialById(button.dataset.materialView);

  if (material) {
    openClassMaterial(material);
  }
});

classMaterialClose?.addEventListener("click", closeClassMaterial);
classMaterialModal?.addEventListener("click", (event) => {
  if (event.target === classMaterialModal) {
    closeClassMaterial();
  }
});

updateProfileHeader();
fillProfileForm();
renderBookings();
renderSchedule();

onLanguageChange(() => {
  classBookings.forEach(booking => {
    booking.subjectName = subjectNames[booking.subject] || booking.subject || t("ui.class");
    const date = parseDateKey(booking.dateISO);
    if (date) booking.dateLabel = formatFullDate(date);
  });
  updateProfileHeader();
  renderBookings();
  renderSchedule();
  if (activeNoteBooking && !classNoteModal.hidden) openClassNote(activeNoteBooking);
});
