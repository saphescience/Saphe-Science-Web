const { t, subjectLabel, onLanguageChange, getLanguage } = window.SapheI18n;

const hours = ["15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];
const busySlots = new Set(["0-15:00", "1-17:00", "2-16:00", "3-19:00", "4-20:00"]);
const scheduleHead = document.querySelector("#schedule-head");
const scheduleBody = document.querySelector("#schedule-body");
const scheduleStatus = document.querySelector("#schedule-status");
const subjectTabs = document.querySelectorAll(".subject-tab");
const navLinks = document.querySelectorAll(".nav a");
const bookingModal = document.querySelector("#booking-modal");
const bookingForm = document.querySelector("#booking-form");
const bookingSlot = document.querySelector("#booking-slot");
const bookingClose = document.querySelector(".booking-modal__close");
const userToggle = document.querySelector("#user-toggle");

let language = getLanguage();
let subject = "mathEs";
let selectedSlotText = "";
let userProfile = loadUserProfile();

function renderLocalizedHome() {
  language = getLanguage();
  updateUserButton();
  if (scheduleStatus) scheduleStatus.textContent = t('schedulePrompt');
  renderSchedule();
}

function loadUserProfile() {
  try {
    return JSON.parse(localStorage.getItem("sapheScienceUserProfile")) || {};
  } catch {
    return {};
  }
}

function loadCurrentAccount() {
  try {
    return JSON.parse(localStorage.getItem("sapheScienceCurrentAccount")) || {};
  } catch {
    return {};
  }
}

function isTeacherAccount(account) {
  return (
    (account.email || "").trim().toLowerCase() === "saphescience@gmail.com" ||
    account.username === "Pr0f3sor" ||
    account.role === "teacher"
  );
}

function saveUserProfile(profile) {
  userProfile = profile;
  localStorage.setItem("sapheScienceUserProfile", JSON.stringify(profile));
  updateUserButton();
}

function saveBooking(booking) {
  const bookings = JSON.parse(localStorage.getItem("sapheScienceBookings") || "[]");
  bookings.push(booking);
  localStorage.setItem("sapheScienceBookings", JSON.stringify(bookings));
}

function updateUserButton() {
  const currentAccount = loadCurrentAccount();

  userToggle.querySelector("span").textContent = currentAccount.username || t("userButton");
  userToggle.href = isTeacherAccount(currentAccount) ? "profesor.html" : "perfil.html";
}

function renderSchedule() {
  if (!scheduleHead || !scheduleBody) {
    return;
  }

  scheduleHead.innerHTML = "";
  scheduleBody.innerHTML = "";

  [t("time"), ...t("days")].forEach((label) => {
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

    t("days").forEach((day, dayIndex) => {
      const cell = document.createElement("td");
      const slotKey = `${dayIndex}-${hour}`;
      const button = document.createElement("button");
      const isBusy = busySlots.has(slotKey);

      button.type = "button";
      button.className = `slot ${isBusy ? "busy" : "available"}`;
      button.textContent = isBusy ? t("busy") : t("available");
      button.disabled = isBusy;
      button.setAttribute(
        "aria-label",
        `${day} ${hour}, ${isBusy ? t("busy") : t("available")}`
      );

      if (!isBusy) {
        button.addEventListener("click", () => {
          const slotText = t("selectedSlot", { subject: subjectLabel(subject), day, hour });

          document
            .querySelectorAll(".slot.is-selected")
            .forEach((selected) => selected.classList.remove("is-selected"));

          button.classList.add("is-selected");
          if (scheduleStatus) {
            scheduleStatus.innerHTML = `
              <strong>${slotText}</strong>
              <span>${t("selectedHelp")}</span>
            `;
          }
          openBookingModal(slotText);
        });
      }

      cell.appendChild(button);
      row.appendChild(cell);
    });

    scheduleBody.appendChild(row);
  });
}

function openBookingModal(slotText) {
  if (!bookingModal || !bookingForm || !bookingSlot) {
    return;
  }

  selectedSlotText = slotText;
  bookingSlot.textContent = slotText;
  bookingModal.hidden = false;
  document.body.classList.add("modal-open");
  bookingForm.reset();
  bookingForm.elements.name.value = userProfile.name || "";
  bookingForm.elements.surname.value = userProfile.surname || "";
  bookingForm.elements.email.value = userProfile.email || "";
  bookingForm.elements.name.focus();
}

function closeBookingModal() {
  if (!bookingModal) {
    return;
  }

  bookingModal.hidden = true;
  document.body.classList.remove("modal-open");
}

bookingClose?.addEventListener("click", closeBookingModal);

bookingModal?.addEventListener("click", (event) => {
  if (event.target === bookingModal) {
    closeBookingModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && bookingModal && !bookingModal.hidden) {
    closeBookingModal();
  }
});

bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(bookingForm);
  const name = formData.get("name").trim();
  const surname = formData.get("surname").trim();
  const email = formData.get("email").trim();

  saveUserProfile({
    ...userProfile,
    name,
    surname,
    email,
  });
  saveBooking({
    name,
    surname,
    email,
    slot: selectedSlotText,
    createdAt: new Date().toISOString(),
  });
  if (scheduleStatus) {
    scheduleStatus.innerHTML = `
      <strong>${selectedSlotText}</strong>
      <span>${t("bookingSaved")}</span>
    `;
  }
  closeBookingModal();
});

subjectTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    subject = tab.dataset.subject;
    subjectTabs.forEach((button) => {
      button.classList.toggle("is-active", button === tab);
    });
    if (scheduleStatus) {
      scheduleStatus.textContent = t("schedulePrompt");
    }
  });
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.forEach((current) => current.classList.remove("is-active"));
    link.classList.add("is-active");
  });
});

onLanguageChange(renderLocalizedHome);
renderLocalizedHome();
