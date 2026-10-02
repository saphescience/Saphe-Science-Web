import { supabase } from "./supabaseClient.js";

const PROFILE_TABLE = "profiles";

const authModal = document.querySelector("#auth-modal");
const authToggles = document.querySelectorAll("[data-auth-toggle]");

async function getProfile(userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from(PROFILE_TABLE)
    .select("id,email,username,first_name,last_name,role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

function getProfileRedirect(profile) {
  return profile?.role === "teacher" ? "profesor.html" : "perfil.html";
}

async function getCurrentProfile() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  if (!data.session?.user) {
    return null;
  }

  return getProfile(data.session.user.id);
}

async function redirectCurrentUser() {
  const profile = await getCurrentProfile();

  if (!profile) {
    return false;
  }

  window.location.href = getProfileRedirect(profile);
  return true;
}

if (authModal) {
  const closeButton = authModal.querySelector(".user-modal__close");
  const panels = authModal.querySelectorAll("[data-auth-panel]");
  const viewButtons = authModal.querySelectorAll("[data-auth-view]");
  const loginForm = authModal.querySelector("#auth-login-form");
  const signupForm = authModal.querySelector("#auth-signup-form");
  const forgotForm = authModal.querySelector("#auth-forgot-form");
  const resetForm = authModal.querySelector("#auth-reset-form");
  const loginStatus = authModal.querySelector("#auth-login-status");
  const signupStatus = authModal.querySelector("#auth-signup-status");
  const forgotStatus = authModal.querySelector("#auth-forgot-status");
  const resetStatus = authModal.querySelector("#auth-reset-status");

  function setAuthView(view) {
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== view;
    });
    loginStatus.textContent = "";
    signupStatus.textContent = "";
    forgotStatus.textContent = "";
    resetStatus.textContent = "";
    const firstInput = authModal.querySelector(`[data-auth-panel="${view}"] input`);
    firstInput?.focus();
  }

  function openAuthModal(view = "login") {
    authModal.hidden = false;
    document.body.classList.add("modal-open");
    setAuthView(view);
  }

  function closeAuthModal() {
    authModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  authToggles.forEach((toggle) => {
    toggle.addEventListener("click", async (event) => {
      event.preventDefault();

      try {
        const didRedirect = await redirectCurrentUser();

        if (!didRedirect) {
          openAuthModal("login");
        }
      } catch {
        openAuthModal("login");
      }
    });
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setAuthView(button.dataset.authView);
    });
  });

  closeButton.addEventListener("click", closeAuthModal);

  authModal.addEventListener("click", (event) => {
    if (event.target === authModal) {
      closeAuthModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !authModal.hidden) {
      closeAuthModal();
    }
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get("email").trim().toLowerCase();
    const password = formData.get("password");

    loginStatus.textContent = "Comprobando acceso...";

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      loginStatus.textContent = "Correo electrónico o contraseña incorrectos.";
      return;
    }

    try {
      const profile = await getProfile(data.user.id);
      window.location.href = getProfileRedirect(profile);
    } catch (error) {
      console.error("Error cargando perfil:", error);
      loginStatus.textContent =
        "Error: " + (error?.message || JSON.stringify(error));
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const email = formData.get("email").trim();
    const username = formData.get("username").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      signupStatus.textContent = "Las contraseñas no coinciden.";
      return;
    }

    signupStatus.textContent = "Creando cuenta...";

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username },
      },
    });

    if (error || !data.user) {
      signupStatus.textContent = error?.message || "No se ha podido crear la cuenta.";
      return;
    }

    if (!data.session) {
      signupStatus.textContent =
        "Cuenta creada. Revisa tu correo electrónico para confirmar el acceso.";
      loginForm.elements.email.value = email;
      loginForm.elements.password.value = "";
      return;
    }

    try {
      const profile = await getProfile(data.user.id);
      window.location.href = getProfileRedirect(profile);
    } catch {
      signupStatus.textContent = "Cuenta creada, pero no se ha podido cargar el perfil.";
    }
  });

  forgotForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(forgotForm);
    const email = formData.get("email").trim();
    const redirectTo = window.location.href.split("#")[0];

    forgotStatus.textContent = "Enviando correo...";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    forgotStatus.textContent = error
      ? "No se ha podido enviar el correo de recuperación."
      : "Si el correo está registrado, recibirás un enlace para modificar la contraseña.";
  });

  resetForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(resetForm);
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      resetStatus.textContent = "Las contraseñas no coinciden.";
      return;
    }

    resetStatus.textContent = "Actualizando contraseña...";

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      resetStatus.textContent = "No se ha podido actualizar la contraseña.";
      return;
    }

    setAuthView("login");
    loginStatus.textContent = "Contraseña actualizada. Ya puedes entrar.";
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event !== "PASSWORD_RECOVERY") {
      return;
    }

    openAuthModal("reset");
    resetForm.elements.email.value = session?.user?.email || "";
  });
}

document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.href = "index.html#inicio";
  });
});
