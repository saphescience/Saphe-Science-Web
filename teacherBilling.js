import { supabase } from "./supabaseClient.js";
import { parseRateToCents, summarizeMonth } from "./billingMath.js";

const { t, locale, onLanguageChange, errorText } = window.SapheI18n;
const PAGE_SIZE = 500;

function parseDate(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function html(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function formatMoney(cents) {
  return cents === null ? "—" : new Intl.NumberFormat(locale(), { style: "currency", currency: "EUR" }).format(cents / 100);
}

function formatHours(seconds) {
  return seconds === null ? "—" : new Intl.NumberFormat(locale(), { maximumFractionDigits: 2 }).format(seconds / 3600);
}

async function readYear(teacherId, studentId, year) {
  const sessions = new Map();
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase.from("class_sessions")
      .select("id, student_id, teacher_id, subject, date, start_time, end_time, type")
      .eq("teacher_id", teacherId).eq("student_id", studentId).eq("type", "class")
      .gte("date", `${year}-01-01`).lt("date", `${year + 1}-01-01`)
      .order("date", { ascending: true }).order("start_time", { ascending: true }).order("id", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    (data || []).forEach(session => sessions.set(session.id, session));
    if ((data || []).length < PAGE_SIZE) break;
  }
  return [...sessions.values()];
}

export function createTeacherBilling({ root, teacherId, getStudents, getStudentName, hasStudentError }) {
  const find = selector => root.querySelector(selector);
  const studentSelect = find("#billing-student");
  const yearInput = find("#billing-year");
  const monthSelect = find("#billing-month");
  const payerInput = find("#billing-payer");
  const rateInput = find("#billing-rate");
  const settingsForm = find("#billing-settings");
  const saveButton = find("#billing-save");
  const status = find("#billing-status");
  const settingsStatus = find("#billing-settings-status");
  const calendar = find("#billing-calendar");
  const rows = find("#billing-rows");
  const now = new Date();
  let studentId = "";
  let year = now.getFullYear();
  let month = now.getMonth();
  let sessions = [];
  let loading = false;
  let saving = false;
  let settingsReady = false;
  let classError = null;
  let settingsError = null;
  let settingsMessage = "";
  let dirty = false;
  let generation = 0;
  let calendarKey = "";

  yearInput.value = String(year);
  const monthName = index => new Intl.DateTimeFormat(locale(), { month: "long" }).format(new Date(year, index, 1));
  const currentStudent = () => getStudents().find(student => student.id === studentId);
  const rate = () => settingsReady ? parseRateToCents(rateInput.value) : null;

  function updateStudents() {
    const previous = studentId;
    studentSelect.innerHTML = `<option value="">${html(t("ui.selectAStudent"))}</option>` + getStudents().map(student =>
      `<option value="${html(student.id)}">${html(getStudentName(student))}</option>`).join("");
    studentSelect.disabled = saving || hasStudentError();
    if (previous && !currentStudent()) {
      generation++;
      studentId = "";
      sessions = [];
      loading = false;
      settingsReady = false;
      payerInput.value = "";
      rateInput.value = "";
      settingsMessage = "";
      settingsError = null;
      classError = null;
    }
    studentSelect.value = studentId;
    render();
  }

  function renderCalendar() {
    calendar.hidden = !studentId || loading || Boolean(classError);
    if (calendar.hidden) { calendarKey = ""; calendar.replaceChildren(); return; }
    const nextKey = `${generation}:${studentId}:${year}:${month}:${locale()}`;
    if (calendarKey === nextKey) return;
    calendarKey = nextKey;
    const restoreFocus = calendar.contains(document.activeElement);
    const dates = new Map();
    sessions.forEach(session => {
      if (session.type === "class" && session.student_id === studentId) dates.set(session.date, (dates.get(session.date) || 0) + 1);
    });
    const weekdays = Array.from({ length: 7 }, (_, index) => new Date(2024, 0, index + 1));
    const weekdayLong = new Intl.DateTimeFormat(locale(), { weekday: "long" });
    const weekdayNarrow = new Intl.DateTimeFormat(locale(), { weekday: "narrow" });
    const dateFormat = new Intl.DateTimeFormat(locale(), { dateStyle: "long" });
    const weekdayHead = weekdays.map(day => `<th scope="col" title="${html(weekdayLong.format(day))}">${html(weekdayNarrow.format(day))}</th>`).join("");
    calendar.innerHTML = Array.from({ length: 12 }, (_, index) => {
      const first = new Date(year, index, 1);
      const offset = (first.getDay() + 6) % 7;
      const days = new Date(year, index + 1, 0).getDate();
      let total = 0;
      const cells = Array.from({ length: 42 }, (_, cell) => {
        const day = cell - offset + 1;
        if (day < 1 || day > days) return '<td aria-hidden="true"></td>';
        const dateKey = `${year}-${String(index + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const count = dates.get(dateKey) || 0;
        total += count;
        const dateLabel = dateFormat.format(new Date(year, index, day));
        return `<td><span class="billing-day${count ? " has-classes" : ""}" title="${html(t("billing.dayClasses", { date: dateLabel, classes: t(count === 1 ? "classCountOne" : "classCountMany", { count }) }))}">${day}${count > 1 ? `<small>${count}</small>` : ""}</span></td>`;
      });
      return `<article class="billing-month${index === month ? " is-selected" : ""}">
        <h3><button type="button" data-billing-month="${index}" aria-pressed="${index === month}">${html(monthName(index))}</button></h3>
        <table aria-label="${html(`${monthName(index)} ${year}`)}"><thead><tr>${weekdayHead}</tr></thead><tbody>${Array.from({ length: 6 }, (_, row) => `<tr>${cells.slice(row * 7, row * 7 + 7).join("")}</tr>`).join("")}</tbody></table>
        <p>${html(t(total === 1 ? "classCountOne" : "classCountMany", { count: total }))}</p>
      </article>`;
    }).join("");
    if (restoreFocus) calendar.querySelector(`[data-billing-month="${month}"]`)?.focus({ preventScroll: true });
  }

  function renderSummary() {
    const summary = summarizeMonth(sessions.filter(session => session.student_id === studentId), year, month, rate());
    const unavailable = !studentId || loading || Boolean(classError);
    find("#billing-class-count").textContent = unavailable ? "—" : String(summary.rows.length);
    find("#billing-hours").textContent = unavailable ? "—" : formatHours(summary.seconds);
    find("#billing-amount").textContent = unavailable ? "—" : formatMoney(summary.amountCents);
    find("#billing-period").textContent = new Intl.DateTimeFormat(locale(), { month: "long", year: "numeric" }).format(new Date(year, month, 1));
    find("#billing-payer-label").textContent = payerInput.value.trim() || t("billing.payerPending");
    if (unavailable) { rows.innerHTML = `<tr><td colspan="5">${html(t(!studentId ? "billing.chooseStudent" : loading ? "billing.loading" : "billing.classesError"))}</td></tr>`; return; }
    if (!summary.rows.length) { rows.innerHTML = `<tr><td colspan="5">${html(t("billing.noClasses"))}</td></tr>`; return; }
    rows.innerHTML = summary.rows.map(({ session, duration, amountCents }) => {
      const date = parseDate(session.date);
      return `<tr>
        <td>${html(date ? new Intl.DateTimeFormat(locale(), { day: "numeric", month: "short", year: "numeric" }).format(date) : t("ui.noDate"))}</td>
        <td>${html(window.SapheI18n.subjectLabel(session.subject) || session.subject || t("ui.class"))}</td>
        <td>${html(String(session.start_time).slice(0, 5))} – ${html(String(session.end_time).slice(0, 5))}</td>
        <td>${html(duration === null ? t("billing.invalidTime") : formatHours(duration))}</td>
        <td>${html(formatMoney(amountCents))}</td>
      </tr>`;
    }).join("");
    if (summary.invalid) status.textContent = t("billing.invalidClasses");
  }

  function render() {
    root.setAttribute("aria-busy", String(loading));
    studentSelect.disabled = saving || hasStudentError();
    payerInput.disabled = rateInput.disabled = !studentId || !settingsReady || saving || loading;
    saveButton.disabled = !studentId || !settingsReady || saving || loading;
    monthSelect.innerHTML = Array.from({ length: 12 }, (_, index) => `<option value="${index}">${html(monthName(index))}</option>`).join("");
    monthSelect.value = String(month);
    yearInput.disabled = saving;
    status.textContent = hasStudentError() ? t("ui.unableToLoadStudentsFromSupabase") : !studentId ? t("billing.chooseStudent") : loading ? t("billing.loading") : classError ? errorText(classError, t("billing.classesError")) : "";
    settingsStatus.textContent = !studentId ? "" : settingsError ? errorText(settingsError, t("billing.settingsError")) : saving ? t("billing.saving") : settingsMessage ? t(settingsMessage) : dirty ? t("billing.unsaved") : settingsReady && rate() === null ? t("billing.ratePending") : "";
    renderCalendar();
    renderSummary();
  }

  async function load(clearSettings = true) {
    const token = ++generation;
    if (!studentId) {
      sessions = [];
      loading = false;
      settingsReady = false;
      settingsError = classError = null;
      settingsMessage = "";
      dirty = false;
      payerInput.value = rateInput.value = "";
      render();
      return;
    }
    const requestedId = studentId;
    const requestedYear = year;
    const needsSettings = clearSettings || !settingsReady;
    loading = true;
    classError = null;
    sessions = [];
    if (needsSettings) {
      settingsReady = false;
      settingsError = null;
      settingsMessage = "";
      dirty = false;
      payerInput.value = "";
      rateInput.value = "";
    }
    render();
    const [classesResult, settingsResult] = await Promise.allSettled([
      readYear(teacherId, requestedId, requestedYear),
      needsSettings ? supabase.from("student_billing_settings").select("student_id, teacher_id, hourly_rate, payer_name, updated_at")
        .eq("student_id", requestedId).eq("teacher_id", teacherId).maybeSingle() : Promise.resolve(null),
    ]);
    if (token !== generation) return;
    loading = false;
    if (classesResult.status === "fulfilled") sessions = classesResult.value;
    else classError = classesResult.reason;
    if (needsSettings) {
      const result = settingsResult.status === "fulfilled" ? settingsResult.value : { error: settingsResult.reason };
      if (result.error) settingsError = result.error;
      else {
        settingsReady = true;
        payerInput.value = result.data?.payer_name || "";
        rateInput.value = result.data?.hourly_rate == null ? "" : String(result.data.hourly_rate);
      }
    }
    render();
  }

  studentSelect.addEventListener("change", () => { studentId = studentSelect.value; load(); });
  yearInput.addEventListener("change", () => {
    const next = Number(yearInput.value);
    if (!Number.isInteger(next) || next < 1900 || next > 2200) { yearInput.value = String(year); return; }
    year = next;
    load(false);
  });
  monthSelect.addEventListener("change", () => { month = Number(monthSelect.value); render(); });
  calendar.addEventListener("click", event => {
    const button = event.target.closest("[data-billing-month]");
    if (!button) return;
    month = Number(button.dataset.billingMonth);
    render();
  });
  [rateInput, payerInput].forEach(input => input.addEventListener("input", () => {
    dirty = true;
    settingsMessage = "";
    render();
  }));
  settingsForm.addEventListener("submit", async event => {
    event.preventDefault();
    const cents = parseRateToCents(rateInput.value);
    if (!currentStudent() || !settingsReady || loading || saving) return;
    if (cents === null) { settingsMessage = "billing.invalidRate"; render(); return; }
    const requestedId = studentId;
    const token = generation;
    saving = true;
    settingsMessage = "";
    render();
    try {
      const { data, error } = await supabase.from("student_billing_settings").upsert({
        student_id: requestedId,
        teacher_id: teacherId,
        hourly_rate: cents / 100,
        payer_name: payerInput.value.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "student_id" }).select("student_id, hourly_rate, payer_name").single();
      if (error) throw error;
      if (!data || data.student_id !== requestedId) throw new Error(t("billing.saveError"));
      if (token === generation) {
        payerInput.value = data.payer_name || "";
        rateInput.value = String(data.hourly_rate);
        dirty = false;
        settingsMessage = "billing.saved";
      }
    } catch (error) {
      console.error("Billing settings:", error);
      if (token === generation) settingsMessage = "billing.saveError";
    } finally {
      saving = false;
      render();
    }
  });
  onLanguageChange(updateStudents);
  updateStudents();
  return { updateStudents, reload: () => load(false) };
}
