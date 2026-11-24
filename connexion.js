import { APPWRITE } from "./appwrite-config.js";
import { AUTH_I18N } from "./connexion-i18n.js";

const SDK_URL = "https://cdn.jsdelivr.net/npm/appwrite@29.2.0/+esm";
const DEVICE_KEY = "karbonn.device";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EASE_OUT = "cubic-bezier(.22, 1, .36, 1)";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = window.matchMedia("(pointer: fine)");
window.reducedMotion = reducedMotion;

/* Textes de la modale de devis (quote.js), partagés avec le mécanisme data-i18n ci-dessous. */
for (const [code, strings] of Object.entries(QUOTE_I18N)) Object.assign(AUTH_I18N[code], strings);

/* ---------- Langue (même logique que le site) ---------- */

const lang = document.querySelector(".lang");
const langButton = lang.querySelector(".lang__button");
const langOptions = [...lang.querySelectorAll("[data-lang]")];
const SUPPORTED_LANGS = langOptions.map((option) => option.dataset.lang);
const LANG_BY_COUNTRY = {
  en: ["GB", "US", "AU", "IE", "NZ", "CA", "ZA", "IN"],
  fr: ["FR", "BE", "LU", "MC", "CI", "SN", "ML", "MA", "DZ", "TN"],
  de: ["DE", "AT", "CH", "LI"],
  es: ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "DO", "BO", "PY", "UY", "SV", "HN", "NI", "CR", "PA", "PR"],
  pt: ["PT", "BR", "AO", "MZ", "CV"],
  it: ["IT", "SM", "VA"],
  zh: ["CN", "HK", "TW", "SG", "MO"],
};

let currentLang = "fr";
let userPicked = false;

const t = (key, vars = {}) =>
  (AUTH_I18N[currentLang][key] ?? AUTH_I18N.fr[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");

function applyLang(code) {
  currentLang = code;
  document.documentElement.lang = code;
  document.title = t("docTitle");
  lang.querySelector(".lang__current").textContent = code.toUpperCase();
  langOptions.forEach((option) => option.setAttribute("aria-selected", String(option.dataset.lang === code)));
  langButton.setAttribute("aria-label", t("ariaLang"));
  lang.querySelector(".lang__menu").setAttribute("aria-label", t("ariaLanguages"));

  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));

  renderDynamicText();
  fitBrand();
  document.dispatchEvent(new CustomEvent("langchange", { detail: code }));
}

const setLangMenu = (open) => {
  lang.classList.toggle("is-open", open);
  langButton.setAttribute("aria-expanded", String(open));
};

langButton.addEventListener("click", () => setLangMenu(!lang.classList.contains("is-open")));
langOptions.forEach((option) =>
  option.addEventListener("click", () => {
    userPicked = true;
    localStorage.setItem("lang", option.dataset.lang);
    applyLang(option.dataset.lang);
    setLangMenu(false);
  }),
);
document.addEventListener("pointerdown", (event) => {
  if (!lang.contains(event.target)) setLangMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !lang.classList.contains("is-open")) return;
  setLangMenu(false);
  langButton.focus();
});

async function detectLangByLocation() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const data = await (await fetch("https://ipwho.is/", { signal: controller.signal })).json();
    const code = Object.entries(LANG_BY_COUNTRY).find(([, countries]) => countries.includes(data.country_code))?.[0];
    if (data.success && code && !userPicked) applyLang(code);
  } catch {
    /* repli : langue enregistrée ou du navigateur */
  } finally {
    clearTimeout(timeout);
  }
}

/* ---------- Éléments ---------- */

const card = document.querySelector(".auth__card");
const steps = Object.fromEntries([...card.querySelectorAll(".auth__step")].map((step) => [step.dataset.step, step]));
const credentialsForm = steps.credentials;
const codeForm = steps.code;
const emailInput = credentialsForm.elements.email;
const passwordInput = credentialsForm.elements.password;
const revealButton = credentialsForm.querySelector(".auth__reveal");
const codeInput = codeForm.elements.code;
const otp = codeForm.querySelector(".otp");
const otpBoxes = [...otp.querySelectorAll(".otp__boxes span")];
const resendButton = codeForm.querySelector(".auth__resend");
const doneTitle = steps.done.querySelector(".auth__title");
const doneNote = steps.done.querySelector(".auth__note");

const state = {
  step: "credentials",
  challenge: null,
  resendAt: 0,
  resendTimer: null,
  user: null,
  verified: false,
};

/* ---------- Appwrite ---------- */

class AuthError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.code = code;
    this.details = details;
  }
}

let sdkPromise = null;

function appwrite() {
  if (!APPWRITE.projectId) return Promise.reject(new AuthError("not_configured"));
  sdkPromise ??= import(SDK_URL)
    .then(({ Account, Client, ExecutionMethod, Functions }) => {
      const client = new Client().setEndpoint(APPWRITE.endpoint).setProject(APPWRITE.projectId);
      return { account: new Account(client), functions: new Functions(client), ExecutionMethod };
    })
    .catch(() => {
      sdkPromise = null;
      throw new AuthError("network");
    });
  return sdkPromise;
}

async function callGuard(action, payload) {
  const { functions, ExecutionMethod } = await appwrite();
  let execution;
  try {
    execution = await functions.createExecution({
      functionId: APPWRITE.loginFunctionId,
      body: JSON.stringify({
        action,
        lang: currentLang,
        userAgent: navigator.userAgent,
        deviceToken: localStorage.getItem(DEVICE_KEY) || undefined,
        ...payload,
      }),
      async: false,
      xpath: "/",
      method: ExecutionMethod.POST,
      headers: { "content-type": "application/json" },
    });
  } catch (cause) {
    throw new AuthError(navigator.onLine === false ? "network" : cause?.code === 429 ? "rate_limited" : "server_error");
  }

  let result = {};
  try {
    result = JSON.parse(execution.responseBody || "{}");
  } catch {
    /* réponse illisible : traitée comme une erreur serveur */
  }
  if (!result.status || result.status === "error") throw new AuthError(result.code || "server_error", result);
  return result;
}

async function completeLogin(result, verified) {
  localStorage.setItem(DEVICE_KEY, result.deviceToken);
  const { account } = await appwrite();
  try {
    await account.createSession({ userId: result.userId, secret: result.secret });
  } catch (cause) {
    if (cause?.type !== "user_session_already_exists") throw new AuthError("server_error");
    await account.deleteSession({ sessionId: "current" });
    await account.createSession({ userId: result.userId, secret: result.secret });
  }
  state.user = await account.get().catch(() => ({ name: result.name }));
  state.verified = verified;
  state.challenge = null;
  stopResendTimer();
  await showStep("done");
  steps.done.querySelector(".auth__submit").focus({ preventScroll: true });
}

/* ---------- Affichage ---------- */

async function showStep(name, { animate = true } = {}) {
  const from = steps[state.step];
  const to = steps[name];
  state.step = name;
  renderDynamicText();
  if (from === to) return;

  const motion = animate && !reducedMotion.matches;
  if (motion) {
    await from.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-12px)" }], { duration: 220, easing: "ease-in" }).finished;
  }
  from.hidden = true;
  from.classList.remove("is-active");
  to.hidden = false;
  to.classList.add("is-active");
  if (motion) {
    to.animate([{ opacity: 0, transform: "translateY(18px)" }, { opacity: 1, transform: "none" }], { duration: 560, easing: EASE_OUT });
  }
}

function renderDynamicText() {
  if (state.challenge) {
    const [before, after] = t("codeLead", { email: "\u0000" }).split("\u0000");
    const email = document.createElement("strong");
    email.textContent = state.challenge.email;
    codeForm.querySelector(".auth__code-lead").replaceChildren(before ?? "", email, after ?? "");
    codeForm.querySelector(".auth__badge").textContent = t(`r_${state.challenge.reason}`);
  }
  renderResend();

  const name = state.user?.name?.trim();
  doneTitle.textContent = name ? t("doneTitle", { name: name.split(/\s+/)[0] }) : t("doneTitleAnon");
  doneNote.hidden = !state.verified;
  steps.done.classList.toggle("is-active", state.step === "done");

  revealButton.setAttribute("aria-label", t(revealButton.getAttribute("aria-pressed") === "true" ? "hide" : "show"));
  document.querySelectorAll(".auth__alert:not([hidden])").forEach((alert) => {
    alert.textContent = t(alert.dataset.key, JSON.parse(alert.dataset.vars || "{}"));
  });
  document.querySelectorAll(".field[data-error-key]").forEach((field) => {
    field.querySelector(".field__error").textContent = t(field.dataset.errorKey);
  });
}

function showAlert(form, key, vars = {}, type = "error") {
  const alert = form.querySelector(".auth__alert");
  alert.dataset.key = key;
  alert.dataset.vars = JSON.stringify(vars);
  alert.classList.toggle("is-info", type === "info");
  alert.textContent = t(key, vars);
  alert.hidden = false;
}

const clearAlert = (form) => (form.querySelector(".auth__alert").hidden = true);

function setError(field, key) {
  field.classList.toggle("has-error", Boolean(key));
  if (key) field.dataset.errorKey = key;
  else delete field.dataset.errorKey;
  field.querySelector(".field__error").textContent = key ? t(key) : "";
  const input = field.querySelector("input");
  if (key) input?.setAttribute("aria-invalid", "true");
  else input?.removeAttribute("aria-invalid");
}

const shake = (element) =>
  !reducedMotion.matches &&
  element.animate(
    [{ transform: "none" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "none" }],
    { duration: 420, easing: "ease-out" },
  );

async function withLoading(form, task) {
  const button = form.querySelector(".auth__submit");
  if (button.classList.contains("is-loading")) return;
  button.classList.add("is-loading");
  button.setAttribute("aria-busy", "true");
  try {
    await task();
  } finally {
    button.classList.remove("is-loading");
    button.removeAttribute("aria-busy");
  }
}

const errorKey = (error) => `e_${error instanceof AuthError && AUTH_I18N.fr[`e_${error.code}`] ? error.code : "server_error"}`;

/* ---------- Étape 1 : identifiants ---------- */

revealButton.addEventListener("click", () => {
  const visible = passwordInput.type === "password";
  passwordInput.type = visible ? "text" : "password";
  revealButton.setAttribute("aria-pressed", String(visible));
  revealButton.setAttribute("aria-label", t(visible ? "hide" : "show"));
  passwordInput.focus({ preventScroll: true });
});

[emailInput, passwordInput].forEach((input) =>
  input.addEventListener("input", () => {
    const field = input.closest(".field");
    if (field.classList.contains("has-error")) setError(field, "");
  }),
);

credentialsForm.querySelector(".auth__contact").addEventListener("click", () => openQuote());

credentialsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearAlert(credentialsForm);

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const checks = [
    [emailInput.closest(".field"), EMAIL_RE.test(email) ? "" : "errEmail"],
    [passwordInput.closest(".field"), password ? "" : "errPassword"],
  ];
  checks.forEach(([field, key]) => setError(field, key));
  const invalid = checks.find(([, key]) => key)?.[0];
  if (invalid) {
    shake(invalid);
    invalid.querySelector("input").focus();
    return;
  }

  await withLoading(credentialsForm, async () => {
    try {
      const result = await callGuard("login", { email, password });
      passwordInput.value = "";
      if (result.status === "authenticated") await completeLogin(result, false);
      else await startCodeStep(result);
    } catch (error) {
      showAlert(credentialsForm, errorKey(error));
      if (error.code === "invalid_credentials") {
        passwordInput.value = "";
        passwordInput.focus();
      }
      shake(credentialsForm.querySelector(".auth__alert"));
    }
  });
});

/* ---------- Étape 2 : code ---------- */

async function startCodeStep(result) {
  state.challenge = {
    challengeId: result.challengeId,
    challengeSecret: result.challengeSecret,
    email: result.email,
    reason: result.reason,
  };
  codeInput.value = "";
  renderOtp();
  clearAlert(codeForm);
  setError(otp.closest(".field"), "");
  startResendTimer(result.resendIn ?? 60);
  await showStep("code");
  codeInput.focus({ preventScroll: true });
}

function renderOtp() {
  const digits = codeInput.value;
  otpBoxes.forEach((box, index) => {
    const digit = digits[index] ?? "";
    if (box.textContent !== digit) {
      box.textContent = digit;
      box.classList.toggle("is-filled", Boolean(digit));
    }
    box.classList.toggle("is-active", index === Math.min(digits.length, otpBoxes.length - 1));
  });
}

const moveCaretToEnd = () => requestAnimationFrame(() => codeInput.setSelectionRange(codeInput.value.length, codeInput.value.length));

codeInput.addEventListener("input", () => {
  codeInput.value = codeInput.value.replace(/\D/g, "").slice(0, 6);
  renderOtp();
  const field = otp.closest(".field");
  if (field.classList.contains("has-error")) setError(field, "");
  if (codeInput.value.length === 6) codeForm.requestSubmit();
});
codeInput.addEventListener("focus", () => {
  otp.classList.add("is-focused");
  moveCaretToEnd();
});
codeInput.addEventListener("click", moveCaretToEnd);
codeInput.addEventListener("blur", () => otp.classList.remove("is-focused"));

codeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.challenge) return;
  clearAlert(codeForm);

  const field = otp.closest(".field");
  if (codeInput.value.length !== 6) {
    setError(field, "errCode");
    shake(otp);
    codeInput.focus();
    return;
  }

  await withLoading(codeForm, async () => {
    try {
      const result = await callGuard("verify", { ...challengeKeys(), code: codeInput.value });
      await completeLogin(result, true);
    } catch (error) {
      if (["expired", "too_many_attempts", "too_many_resends"].includes(error.code)) {
        await backToCredentials();
        showAlert(credentialsForm, errorKey(error));
        return;
      }
      showAlert(codeForm, errorKey(error), { n: error.details?.attemptsLeft ?? "" });
      field.classList.add("has-error");
      codeInput.value = "";
      renderOtp();
      shake(otp);
      codeInput.focus();
    }
  });
});

const challengeKeys = () => ({ challengeId: state.challenge.challengeId, challengeSecret: state.challenge.challengeSecret });

function renderResend() {
  const remaining = Math.max(0, Math.ceil((state.resendAt - Date.now()) / 1000));
  resendButton.disabled = remaining > 0;
  resendButton.textContent = remaining > 0
    ? t("resendIn", { time: `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` })
    : t("resend");
  if (!remaining) stopResendTimer();
}

function startResendTimer(seconds) {
  stopResendTimer();
  state.resendAt = Date.now() + seconds * 1000;
  renderResend();
  state.resendTimer = setInterval(renderResend, 1000);
}

function stopResendTimer() {
  clearInterval(state.resendTimer);
  state.resendTimer = null;
}

resendButton.addEventListener("click", async () => {
  if (!state.challenge || resendButton.disabled) return;
  resendButton.disabled = true;
  clearAlert(codeForm);
  try {
    const result = await callGuard("resend", challengeKeys());
    startResendTimer(result.resendIn ?? 60);
    codeInput.value = "";
    renderOtp();
    showAlert(codeForm, "resent", {}, "info");
    codeInput.focus({ preventScroll: true });
  } catch (error) {
    if (error.code === "cooldown") startResendTimer(error.details?.resendIn ?? 30);
    else renderResend();
    if (["expired", "too_many_resends"].includes(error.code)) {
      await backToCredentials();
      showAlert(credentialsForm, errorKey(error));
    } else {
      showAlert(codeForm, errorKey(error));
    }
  }
});

async function backToCredentials() {
  state.challenge = null;
  stopResendTimer();
  codeInput.value = "";
  renderOtp();
  clearAlert(credentialsForm);
  await showStep("credentials");
  if (finePointer.matches) (emailInput.value ? passwordInput : emailInput).focus({ preventScroll: true });
}

codeForm.querySelector(".auth__switch").addEventListener("click", () => {
  emailInput.value = "";
  backToCredentials();
});

/* ---------- Étape 3 : connecté ---------- */

steps.done.querySelector(".auth__logout").addEventListener("click", async () => {
  try {
    const { account } = await appwrite();
    await account.deleteSession({ sessionId: "current" });
  } catch {
    /* session déjà expirée */
  }
  state.user = null;
  state.verified = false;
  await backToCredentials();
});

/* ---------- Titre « Karbonn_ » ajusté à la largeur du panneau ---------- */

const brand = document.querySelector(".auth__brand");
const brandInner = brand.querySelector(".auth__brand-inner");

function fitBrand() {
  brand.style.fontSize = "100px";
  const width = brandInner.getBoundingClientRect().width;
  if (width > 0) brand.style.fontSize = `${(brand.clientWidth / width) * 100 * 0.96}px`;
}

window.addEventListener("resize", fitBrand);
document.fonts?.ready.then(fitBrand);

/* ---------- Démarrage ---------- */

const year = new Date().getFullYear();
document.querySelector(".auth__years").textContent = year > 2025 ? `2025 - ${year}` : "2025";

const savedLang = localStorage.getItem("lang");
const browserLang = (navigator.language || "").slice(0, 2).toLowerCase();
applyLang(SUPPORTED_LANGS.includes(savedLang) ? savedLang : SUPPORTED_LANGS.includes(browserLang) ? browserLang : "en");
detectLangByLocation();

if (APPWRITE.projectId) {
  appwrite()
    .then(({ account }) => account.get())
    .then((user) => {
      state.user = user;
      return showStep("done", { animate: false });
    })
    .catch(() => {});
}

if (finePointer.matches) emailInput.focus({ preventScroll: true });
