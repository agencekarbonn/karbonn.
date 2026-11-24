/* Page Services : scène liquide + assistant de projet */

import { APPWRITE } from "./appwrite-config.js";
import {
  SERVICES, answer, createBrief, estimate, hasBrief, interpretText, mergeBrief, nextQuestion, progress,
} from "./services-engine.js";
import { SERVICES_I18N } from "./services-i18n.js";
import { createScene } from "./services-scene.js";

for (const [code, strings] of Object.entries(SERVICES_I18N)) Object.assign(I18N[code], strings);

const root = document.querySelector(".svc");
const $ = (selector) => root.querySelector(selector);
const canvas = $(".svc__canvas");
const planets = [...root.querySelectorAll(".svc__planet")];
const stepEl = $(".svc__step");
const questionEl = $(".svc__question");
const replyEl = $(".svc__reply");
const answersEl = $(".svc__answers");
const composer = $(".svc__composer");
const input = $(".svc__input");
const backButton = $(".svc__back");
const continueButton = $(".svc__continue");
const resultEl = $(".svc__result");
const badgeEl = $(".svc__badge");
const lowEl = $(".svc__amount-low");
const highEl = $(".svc__amount-high");
const termsEl = $(".svc__terms");
const verdictText = $(".svc__verdict-text");
const verdictAlt = $(".svc__verdict-alt");
const recapEl = $(".svc__recap");
const ctaButton = $(".svc__cta");
const ctaLabel = $(".svc__cta-label");
const restartButton = $(".svc__restart");

const NAME_KEYS = { web: "svcWeb", ai: "svcAi", hosting: "svcHosting", uiux: "svcUiux", branding: "svcBranding", seo: "svcSeo" };
const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", pt: "pt-PT", it: "it-IT", zh: "zh-CN" };
/* Position de chaque service autour du noyau : angle (degrés, sens trigonométrique) et rayon relatif */
const SLOTS = { web: [158, 1], ai: [116, 1.04], hosting: [64, 1.04], uiux: [22, 1], branding: [200, .84], seo: [90, .6] };

const finePointer = window.matchMedia("(pointer: fine)");
const pad = (n) => String(n).padStart(2, "0");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const locale = () => LOCALES[currentLang] ?? "fr-FR";
const has = (key) => I18N[currentLang][key] != null || I18N.fr[key] != null;

let brief = createBrief();
let history = [];
// Phrases libres saisies par le visiteur, transmises à l'équipe avec la demande.
let notes = [];
let phase = "intro";
let question = null;
let result = null;
let busy = false;
let hovered = -1;
let pulse = 0;

/* ---------- Libellés ---------- */

// Espace insécable classique : l'espace fine (U+202F) n'existe pas dans DM Sans.
const money = (value) => new Intl.NumberFormat(locale(), { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value).replace(/\u202f/g, "\u00a0");
const listOf = (items) => (Intl.ListFormat ? new Intl.ListFormat(locale(), { type: "conjunction" }).format(items) : items.join(", "));
const optionLabel = (field, value) => tr(`svcO_${field}_${value}`);

function weeksText({ weeksLow, weeksHigh }) {
  return weeksLow === weeksHigh ? tr("svcResWeek", { n: weeksLow }) : tr("svcResWeeks", { min: weeksLow, max: weeksHigh });
}

function rangeText(estimateLike) {
  return estimateLike.low
    ? `${money(estimateLike.low)} – ${money(estimateLike.high)}`
    : `${money(estimateLike.monthlyLow)} – ${money(estimateLike.monthlyHigh)} ${tr("svcResPerMonth")}`;
}

function describe(partial) {
  const parts = (partial.services ?? []).map((id) => (partial.options?.[id] ? optionLabel(id, partial.options[id]) : tr(NAME_KEYS[id])));
  for (const field of ["scale", "timeline", "budget"]) if (partial[field]) parts.push(optionLabel(field, partial[field]));
  return listOf(parts);
}

/* ---------- Texte animé mot à mot ---------- */

function words(text) {
  if (window.Intl?.Segmenter) {
    return [...new Intl.Segmenter(currentLang, { granularity: "word" }).segment(text)].map((part) => part.segment);
  }
  return text.split(/(\s+)/);
}

function setAnimatedText(element, text, animate = true) {
  element.replaceChildren();
  element.setAttribute("aria-label", text);
  words(text).forEach((word, i) => {
    if (/^\s+$/.test(word)) return element.append(word);
    const outer = document.createElement("span");
    outer.className = "svc__word";
    outer.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.textContent = word;
    inner.style.setProperty("--w", i);
    outer.append(inner);
    element.append(outer);
  });
  element.classList.toggle("is-revealing", animate && !reducedMotion.matches);
  if (animate) {
    element.classList.remove("is-revealed");
    requestAnimationFrame(() => requestAnimationFrame(() => element.classList.add("is-revealed")));
  } else {
    element.classList.add("is-revealed");
  }
}

function reply(text) {
  replyEl.textContent = text;
  replyEl.classList.remove("is-new");
  void replyEl.offsetWidth;
  replyEl.classList.add("is-new");
}

/* ---------- Rendu du dialogue ---------- */

function setPhase(next) {
  const dialog = $(".svc__dialog");
  if (next !== phase && (next === "chat" || (next === "explore" && phase !== "intro")) && !reducedMotion.matches) {
    dialog.animate([{ opacity: 0, filter: "blur(6px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 700, easing: "ease-out" });
  }
  phase = next;
  root.dataset.phase = next;
  resultEl.hidden = next !== "result";
  $(".svc__dialog").inert = next === "result";
  planets.forEach((planet) => { planet.tabIndex = next === "explore" ? 0 : -1; });
  measureLabels();
}

function syncPlanets() {
  planets.forEach((planet) => {
    const picked = brief.services.includes(planet.dataset.service);
    planet.classList.toggle("is-picked", picked);
    planet.setAttribute("aria-pressed", String(picked));
  });
  continueButton.disabled = !brief.services.length;
}

function renderExplore(animate = true) {
  requestAnimationFrame(measureLabels);
  const { total } = progress(brief);
  stepEl.textContent = `${pad(1)} / ${pad(Math.max(total, 3))}`;
  setAnimatedText(questionEl, tr("svcQ_services"), animate);
  answersEl.replaceChildren();
  if (animate || !replyEl.textContent) reply(tr("svcHint"));
  backButton.hidden = true;
  continueButton.hidden = false;
  syncPlanets();
}

function renderChat(animate = true) {
  question = nextQuestion(brief);
  if (!question) return showResult();
  const { done, total } = progress(brief);
  stepEl.textContent = `${pad(done + 1)} / ${pad(total)}`;
  const field = question.service ?? question.id;
  setAnimatedText(questionEl, tr(`svcQ_${field}`), animate);
  backButton.hidden = false;
  continueButton.hidden = true;

  const current = question.service ? brief.options[question.service] : brief[question.id];
  answersEl.replaceChildren(...question.options.map((value, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "svc__chip";
    chip.style.setProperty("--i", i);
    chip.setAttribute("aria-pressed", String(current === value));
    const label = document.createElement("span");
    label.className = "svc__chip-label";
    label.textContent = optionLabel(field, value);
    chip.append(label);
    if (has(`svcH_${field}_${value}`)) {
      const hint = document.createElement("span");
      hint.className = "svc__chip-hint";
      hint.textContent = tr(`svcH_${field}_${value}`);
      chip.append(hint);
    }
    chip.addEventListener("click", () => choose(value, chip));
    return chip;
  }));
  answersEl.classList.toggle("is-compact", question.options.length > 4);
  answersEl.classList.remove("is-in");
  requestAnimationFrame(() => requestAnimationFrame(() => answersEl.classList.add("is-in")));
}

function render(animate = true) {
  if (phase === "explore" || phase === "intro") renderExplore(animate);
  else if (phase === "chat") renderChat(animate);
  else fillResult(false);
}

async function choose(value, chip) {
  if (busy || !question) return;
  busy = true;
  chip.setAttribute("aria-pressed", "true");
  chip.classList.add("is-chosen");
  pulse = .7;
  history.push({ brief, phase });
  brief = answer(brief, question, value);
  replyEl.textContent = "";
  await delay(reducedMotion.matches ? 0 : 340);
  busy = false;
  renderChat();
  focusFirstChip();
}

function focusFirstChip() {
  if (!finePointer.matches) return;
  answersEl.querySelector("[aria-pressed='true'], .svc__chip")?.focus({ preventScroll: true });
}

function goChat() {
  if (!brief.services.length) {
    shake(continueButton);
    return;
  }
  history.push({ brief, phase: "explore" });
  setPhase("chat");
  renderChat();
  focusFirstChip();
}

function back() {
  const previous = history.pop();
  if (!previous || busy) return;
  brief = previous.brief;
  setPhase(previous.phase);
  render();
  syncPlanets();
}

function restart() {
  brief = createBrief();
  history = [];
  notes = [];
  result = null;
  input.value = "";
  setPhase("explore");
  render();
}

function shake(element) {
  element.animate(
    [{ transform: "none" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "none" }],
    { duration: 420, easing: "ease-out" },
  );
}

/* ---------- Services autour de la sphère ---------- */

planets.forEach((planet, index) => {
  planet.addEventListener("click", () => {
    if (phase !== "explore") return;
    const id = planet.dataset.service;
    const picked = brief.services.includes(id);
    brief = answer(brief, { id: "services" }, picked ? brief.services.filter((s) => s !== id) : [...brief.services, id]);
    if (!picked) {
      pulse = 1;
    }
    syncPlanets();
  });
  planet.addEventListener("pointerenter", () => {
    hovered = index;
  });
  planet.addEventListener("pointerleave", () => { if (hovered === index) hovered = -1; });
  planet.addEventListener("focus", () => { hovered = index; });
  planet.addEventListener("blur", () => { if (hovered === index) hovered = -1; });
});

continueButton.addEventListener("click", goChat);
backButton.addEventListener("click", back);
restartButton.addEventListener("click", restart);

/* ---------- Texte libre : IA gratuite si configurée, sinon parseur local ---------- */

async function interpretRemote(text) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${APPWRITE.endpoint}/functions/${APPWRITE.briefFunctionId}/executions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-appwrite-project": APPWRITE.projectId },
      body: JSON.stringify({
        body: JSON.stringify({ text, lang: currentLang }),
        async: false,
        path: "/",
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    });
    if (!response.ok) return null;
    const execution = await response.json();
    const data = JSON.parse(execution.responseBody || "{}");
    return data.status === "ok" ? data.brief : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function interpret(text) {
  const local = interpretText(text);
  const remote = APPWRITE.briefFunctionId ? await interpretRemote(text) : null;
  if (!remote || !hasBrief(remote)) return local;
  const base = local.intent === "brief" ? local.partial : {};
  return {
    intent: "brief",
    reply: remote.reply,
    partial: {
      ...base,
      ...Object.fromEntries(Object.entries(remote).filter(([key, value]) => value != null && key !== "reply")),
      services: [...new Set([...(base.services ?? []), ...remote.services])],
      options: { ...base.options, ...remote.options },
      outOfScope: Boolean(base.outOfScope || remote.outOfScope),
    },
  };
}

const INTENT_REPLIES = { greeting: "svcGreeting", thanks: "svcThanks", price: "svcPriceInfo", help: "svcHelp", unknown: "svcUnknown" };
const quoteOf = (text) => (text.length > 48 ? `${text.slice(0, 46).trim()}…` : text);

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (busy) return;
  const text = input.value.trim();
  if (!text) {
    if (phase === "explore") goChat();
    else shake(composer);
    return;
  }

  busy = true;
  root.classList.add("is-thinking");
  composer.classList.add("is-loading");
  reply(tr("svcThinking"));
  const started = performance.now();
  const { intent, partial, reply: aiReply } = await interpret(text);
  if (intent === "brief" || intent === "guess") notes = [...notes, text].slice(-5);
  await delay(Math.max(0, (reducedMotion.matches ? 0 : 700) - (performance.now() - started)));
  busy = false;
  root.classList.remove("is-thinking");
  composer.classList.remove("is-loading");

  // Conversation (bonjour, prix, aide…) : une réponse, sans toucher au brief.
  if (INTENT_REPLIES[intent]) {
    reply(tr(INTENT_REPLIES[intent]));
    input.value = "";
    if (intent === "unknown") shake(composer);
    return;
  }

  const merged = mergeBrief(brief, partial);
  const added = merged.services.filter((id) => !brief.services.includes(id));
  history.push({ brief, phase });
  brief = merged;
  input.value = "";
  pulse = 1;
  syncPlanets();

  // Proposition par défaut : on laisse le visiteur ajuster avant de continuer.
  if (intent === "guess") {
    reply(tr("svcGuess", { text: quoteOf(text) }));
    return;
  }

  reply(aiReply || tr("svcUnderstood", { list: describe(partial) || listOf(brief.services.map((id) => tr(NAME_KEYS[id]))) }));
  if (phase === "explore") {
    if (!brief.services.length && !brief.outOfScope) return;
    await delay(reducedMotion.matches ? 0 : 1100);
    if (brief.outOfScope) {
      setPhase("chat");
      return showResult();
    }
    history.push({ brief, phase: "explore" });
    setPhase("chat");
  }
  renderChat();
});

/* ---------- Résultat ---------- */

function countUp(element, value, format) {
  if (reducedMotion.matches) {
    element.textContent = format(value);
    return;
  }
  const start = performance.now();
  const duration = 1500;
  const step = (now) => {
    const k = Math.min(1, (now - start) / duration);
    const eased = 1 - 2 ** (-10 * k);
    element.textContent = format(k === 1 ? value : Math.round((value * eased) / 10) * 10);
    if (k < 1 && phase === "result") requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function fillResult(animate) {
  if (!result) return;
  const scope = result.reasons.includes("scope");
  const monthlyOnly = !result.low && result.monthlyLow;
  badgeEl.textContent = tr(result.feasible ? "svcResFeasible" : "svcResNotFeasible");
  resultEl.classList.toggle("is-unfeasible", !result.feasible);
  resultEl.classList.toggle("is-scope", scope);

  const low = monthlyOnly ? result.monthlyLow : result.low;
  const high = monthlyOnly ? result.monthlyHigh : result.high;
  if (scope) {
    lowEl.textContent = "";
    highEl.textContent = "";
  } else if (animate) {
    countUp(lowEl, low, money);
    countUp(highEl, high, (value) => `– ${money(value)}`);
  } else {
    lowEl.textContent = money(low);
    highEl.textContent = `– ${money(high)}`;
  }

  const terms = scope ? [] : [tr("svcResTax"), monthlyOnly ? tr("svcResPerMonth") : weeksText(result)];
  termsEl.replaceChildren(terms.join(" · "));
  if (!scope && !monthlyOnly && result.monthlyLow) {
    const monthly = document.createElement("span");
    monthly.className = "svc__monthly";
    monthly.textContent = tr("svcResMonthly", { min: money(result.monthlyLow), max: money(result.monthlyHigh) });
    termsEl.append(monthly);
  }

  verdictText.textContent = result.feasible ? "" : result.reasons.map((reason) => tr(`svcReason_${reason}`)).join(" ");
  verdictText.hidden = result.feasible;
  recapEl.replaceChildren(...recapRows().flatMap(([label, value]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = value;
    return [dt, dd];
  }));
  verdictAlt.textContent = result.alternative
    ? tr(`svcAlt_${result.alternative.kind}`, { range: rangeText(result.alternative), weeks: weeksText(result.alternative) })
    : "";
  verdictAlt.hidden = !result.alternative;
  ctaLabel.textContent = tr(result.feasible ? "svcResCta" : "svcResTalk");
}

/* Récapitulatif structuré : une ligne par service, puis les paramètres du projet */
function recapRows() {
  const rows = brief.services.map((id) => [tr(NAME_KEYS[id]), brief.options[id] ? optionLabel(id, brief.options[id]) : "—"]);
  for (const [field, key] of [["scale", "svcSumScale"], ["timeline", "svcSumTimeline"], ["budget", "svcSumBudget"]]) {
    if (brief[field]) rows.push([tr(key), optionLabel(field, brief[field])]);
  }
  if (!result.reasons.includes("scope") && result.low) rows.push([tr("svcSumDelivery"), weeksText(result)]);
  return rows;
}

function showResult() {
  result = estimate(brief);
  setPhase("result");
  fillResult(true);
  pulse = 1;
  if (finePointer.matches) ctaButton.focus({ preventScroll: true });
}

ctaButton.addEventListener("click", openRequest);

/* ---------- Demande de devis ---------- */

const request = document.querySelector(".svc-request");
const requestForm = request.querySelector(".svc-request__card");
const requestSteps = Object.fromEntries([...request.querySelectorAll(".svc-request__step")].map((step) => [step.dataset.step, step]));
const requestSend = request.querySelector(".svc-request__send");
const requestError = request.querySelector(".svc-request__error");
const emailInput = requestForm.elements.email;
const phoneInput = requestForm.elements.phone;
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,30}$/;
let sending = false;
let sentTo = "";

function requestRecap() {
  const scope = result.reasons.includes("scope");
  const parts = [describe({ services: brief.services, options: brief.options })];
  if (!scope) parts.push(`${rangeText(result)} ${tr("svcResTax")}`);
  return parts.filter(Boolean).join(" · ");
}

function setFieldError(input, message) {
  const field = input.closest(".field");
  field.classList.toggle("has-error", Boolean(message));
  field.querySelector(".field__error").textContent = message;
  input.setAttribute("aria-invalid", String(Boolean(message)));
}

function showRequestStep(name) {
  for (const [key, step] of Object.entries(requestSteps)) step.hidden = key !== name;
}

function openRequest() {
  if (!result) return;
  showRequestStep("form");
  request.querySelector(".svc-request__recap").textContent = requestRecap();
  requestError.textContent = "";
  [emailInput, phoneInput].forEach((input) => setFieldError(input, ""));
  request.showModal();
  requestAnimationFrame(() => request.classList.add("is-open"));
  emailInput.focus({ preventScroll: true });
}

function closeRequest() {
  if (!request.open) return;
  request.classList.remove("is-open");
  setTimeout(() => request.close(), reducedMotion.matches ? 0 : 300);
}

request.querySelector(".svc-request__close").addEventListener("click", closeRequest);
request.querySelector(".svc-request__finish").addEventListener("click", closeRequest);
request.addEventListener("cancel", (event) => { event.preventDefault(); closeRequest(); });
request.addEventListener("click", (event) => { if (event.target === request) closeRequest(); });
emailInput.addEventListener("input", () => setFieldError(emailInput, ""));
phoneInput.addEventListener("input", () => setFieldError(phoneInput, ""));

async function sendRequest(payload) {
  if (!APPWRITE.quoteFunctionId) throw new Error("not_configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`${APPWRITE.endpoint}/functions/${APPWRITE.quoteFunctionId}/executions`, {
      method: "POST",
      signal: controller.signal,
      headers: { "content-type": "application/json", "x-appwrite-project": APPWRITE.projectId },
      body: JSON.stringify({
        body: JSON.stringify(payload),
        async: false,
        path: "/",
        method: "POST",
        headers: { "content-type": "application/json" },
      }),
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
    const execution = await response.json();
    const data = JSON.parse(execution.responseBody || "{}");
    if (data.status !== "ok") throw new Error(data.code || "failed");
    return data;
  } finally {
    clearTimeout(timer);
  }
}

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (sending) return;
  const email = emailInput.value.trim();
  const phone = phoneInput.value.trim();
  const emailError = EMAIL_RE.test(email) ? "" : tr("svcReqErrEmail");
  const phoneError = !phone || PHONE_RE.test(phone) ? "" : tr("svcReqErrPhone");
  setFieldError(emailInput, emailError);
  setFieldError(phoneInput, phoneError);
  if (emailError || phoneError) {
    (emailError ? emailInput : phoneInput).focus();
    return;
  }

  sending = true;
  requestError.textContent = "";
  requestSend.classList.add("is-loading");
  requestSend.disabled = true;
  try {
    await sendRequest({ email, phone, lang: currentLang, brief, notes, company: requestForm.elements.company.value });
    sentTo = email;
    request.querySelector(".svc-request__done-text").textContent = tr("svcReqDoneText", { email });
    showRequestStep("done");
    request.querySelector("[data-step='done'] .svc-request__title").focus({ preventScroll: true });
  } catch {
    requestError.textContent = tr("svcReqErrSend");
  } finally {
    sending = false;
    requestSend.classList.remove("is-loading");
    requestSend.disabled = false;
  }
});

/* ---------- Scène : noyau, gouttes, étiquettes ---------- */

const scene = createScene(canvas, {
  accent: getComputedStyle(document.documentElement).getPropertyValue("--accent"),
  soft: getComputedStyle(document.documentElement).getPropertyValue("--accent-soft"),
  ink: "#000000",
});
root.classList.toggle("has-webgl", Boolean(scene));

const live = {
  core: { x: innerWidth / 2, y: innerHeight * .43, r: 0 },
  drops: SERVICES.map(() => ({ x: innerWidth / 2, y: innerHeight * .43, r: 0, tint: 0 })),
  mouse: { x: innerWidth / 2, y: innerHeight / 2, r: 0 },
  wave: 0, lines: 0, mood: 0,
};
const pointer = { x: innerWidth / 2, y: innerHeight / 2, inside: false };
let labelSizes = [];
let dialogHeight = 0;

function measureLabels() {
  labelSizes = planets.map((planet) => ({ w: planet.offsetWidth, h: planet.offsetHeight }));
  dialogHeight = $(".svc__dialog").offsetHeight;
}

function coreTarget() {
  const w = innerWidth;
  const h = innerHeight;
  const m = Math.min(w, h);
  const wide = w >= 900;
  if (phase === "chat") return wide ? { x: w * .28, y: h * .5, r: m * .15 } : { x: w / 2, y: 92 + m * .12, r: m * .12 };
  if (phase === "result") {
    if (wide) return { x: w * .36, y: h * .47, r: Math.min(h * .3, w * .2) };
    const r = Math.min(w * .36, h * .2);
    return { x: w / 2, y: Math.max(h * .28, 96 + r), r };
  }
  // Exploration : le noyau reste au-dessus du dialogue, quelle que soit la hauteur d'écran.
  const r = m * (wide ? .115 : .14);
  const dialogTop = h - (w >= 1024 ? 132 : 112) - dialogHeight;
  const y = Math.max(96 + r, Math.min(h * (wide ? .37 : .36), dialogTop - r - 36));
  return { x: w / 2, y, r: phase === "intro" ? 0 : r };
}

function orbitRadii(core) {
  const w = innerWidth;
  const h = innerHeight;
  // L'orbite haute ne doit pas monter jusqu'à l'en-tête (logo, langue, connexion).
  const room = Math.max(core.r * 1.6, (core.y - 70) / 1.04);
  return w >= 900 ? [Math.min(w * .34, 560), Math.min(h * .27, 260, room)] : [w * .36, Math.min(h * .2, room)];
}

function step(current, target, k, dt) {
  const a = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * k);
  for (const key of Object.keys(target)) current[key] += (target[key] - current[key]) * a;
}

let last = performance.now();
let clock = 0;

function frame(now) {
  const dt = Math.min(.05, (now - last) / 1000);
  last = now;
  if (!reducedMotion.matches) clock += dt;
  const t = clock;
  const core = coreTarget();
  const [rx, ry] = orbitRadii(core);
  const wide = innerWidth >= 900;

  step(live.core, core, 4.2, dt);
  const c = live.core;
  pulse = Math.max(0, pulse - dt * 1.4);

  SERVICES.forEach((service, i) => {
    const [deg, factor] = SLOTS[service.id];
    const drift = Math.sin(t * .35 + i * 1.3) * 4;
    const angle = ((deg + drift) * Math.PI) / 180;
    const radius = factor * (1 + Math.sin(t * .5 + i * 1.7) * .02);
    const offset = { x: Math.cos(angle) * rx * radius, y: -Math.sin(angle) * ry * radius };
    const spread = Math.max(1, (core.r + 34) / Math.max(1, Math.hypot(offset.x, offset.y)));
    const slot = { x: core.x + offset.x * spread, y: core.y + offset.y * spread };
    const picked = brief.services.includes(service.id);
    const base = service.tier === "main" ? 9 : 6;
    let target;

    if (phase === "intro") target = { ...slot, r: 0 };
    else if (phase === "explore") {
      target = picked
        ? { x: core.x + Math.cos(angle) * core.r * 1.02, y: core.y - Math.sin(angle) * core.r * 1.02, r: core.r * .34 }
        : { ...slot, r: base + (hovered === i ? 8 : 0) };
    } else if (picked) {
      const spin = angle + t * (phase === "result" ? .25 : .5);
      const distance = phase === "result" ? core.r * 1.16 : core.r * .62;
      target = { x: core.x + Math.cos(spin) * distance, y: core.y - Math.sin(spin) * distance, r: phase === "result" ? 7 : core.r * .42 };
    } else {
      target = { x: core.x + Math.cos(angle) * rx * 2.2, y: core.y - Math.sin(angle) * ry * 2.2, r: 0 };
    }
    step(live.drops[i], target, picked ? 3.4 : 5.5, dt);
    // Goutte claire (#CDF2FF) pour les services secondaires tant qu'ils orbitent.
    step(live.drops[i], { tint: service.tier === "main" || picked ? 0 : 1 }, 5.5, dt);

    // Étiquette : ancrée sur l'orbite, orientée vers l'extérieur, gardée dans l'écran.
    const size = labelSizes[i] ?? { w: 0, h: 0 };
    const cos = Math.cos(angle);
    const gap = 20;
    let x = slot.x;
    let y = slot.y;
    const side = !wide || Math.abs(cos) < .3 ? "center" : cos > 0 ? "right" : "left";
    if (planets[i].dataset.side !== side) planets[i].dataset.side = side;
    if (side === "center") {
      x -= size.w / 2;
      y += Math.sin(angle) > 0 ? -size.h - gap : gap;
      // Pas la place au-dessus (en-tête) : l'étiquette passe à droite de la goutte.
      if (y < 84) {
        x = slot.x + gap;
        y = slot.y - size.h / 2;
      }
    } else {
      x += cos > 0 ? gap : -size.w - gap;
      y -= size.h / 2;
    }
    x = Math.min(Math.max(x, 16), innerWidth - size.w - 16);
    y = Math.min(Math.max(y, 84), innerHeight - size.h - 16);
    planets[i].style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
  });

  const mouseOn = finePointer.matches && pointer.inside && !document.querySelector(".quote[open]");
  step(live.mouse, { x: pointer.x, y: pointer.y, r: mouseOn ? 7 : 0 }, 11, dt);
  step(live, {
    wave: Math.max(root.classList.contains("is-thinking") ? 1 : 0, pulse),
    lines: phase === "intro" ? 0 : phase === "chat" ? .6 : 1,
    mood: phase === "result" && result && !result.feasible ? 1 : 0,
  }, 3, dt);

  root.style.setProperty("--cx", `${c.x}px`);
  root.style.setProperty("--cy", `${c.y}px`);
  root.style.setProperty("--cr", `${Math.max(c.r, 1)}px`);
  root.style.setProperty("--wave", live.wave.toFixed(3));

  scene?.render({
    time: t,
    core: c,
    satellites: [...live.drops, live.mouse],
    goo: Math.min(46, Math.max(24, c.r * .35)),
    wave: live.wave,
    lines: live.lines,
    mood: live.mood,
  });
  requestAnimationFrame(frame);
}

window.addEventListener("pointermove", (event) => {
  pointer.x = event.clientX;
  pointer.y = event.clientY;
  pointer.inside = true;
}, { passive: true });
document.documentElement.addEventListener("pointerleave", () => { pointer.inside = false; });
window.addEventListener("resize", measureLabels);

/* ---------- Langue ---------- */

document.addEventListener("langchange", () => {
  // En phase explore, l'indice doit être retraduit : on le vide pour forcer sa réécriture.
  if (phase === "explore" || phase === "intro") replyEl.textContent = "";
  render(false);
  requestAnimationFrame(measureLabels);
  if (request.open) {
    request.querySelector(".svc-request__recap").textContent = requestRecap();
    if (sentTo) request.querySelector(".svc-request__done-text").textContent = tr("svcReqDoneText", { email: sentTo });
  }
});

/* ---------- Démarrage ---------- */

applyLang(currentLang);
render(false);
const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, delay(1200)]).then(() => {
  measureLabels();
  requestAnimationFrame(frame);
  (window.karbonnLoader?.ready ?? Promise.resolve()).then(() => setTimeout(() => {
    setPhase("explore");
    renderExplore();
  }, reducedMotion.matches ? 0 : 500));
});
