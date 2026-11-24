/* Discutons : popover + modale de demande de devis */

const QUOTE_I18N = {
  fr: {
    ariaTalk: "Discutons", talkCall: "Rendez-vous téléphonique", talkCallHint: "30 min pour faire connaissance", talkQuote: "Demander un devis", talkQuoteHint: "Réponse sous 48 h",
    qClose: "Fermer", qStep: "Étape {n} sur {total}", qStepDone: "Demande envoyée",
    qTypeTitle: "Vous êtes…", qTypeLead: "Quelques questions pour préparer une proposition sur mesure.", qIndividual: "Particulier", qIndividualDesc: "Pour un projet personnel", qPro: "Professionnel", qProDesc: "Pour votre entreprise",
    qContactTitle: "Vos coordonnées", qContactLead: "Pour que nous puissions revenir vers vous.", qLastName: "Nom", qFirstName: "Prénom", qEmail: "Adresse email", qEmailPro: "Adresse email professionnelle", qPhone: "Téléphone", qPhonePro: "Téléphone professionnel", qOptional: "(facultatif)",
    qCompanyTitle: "Votre entreprise", qCompanyLead: "Recherchez votre raison sociale : nous complétons le reste.", qCompany: "Raison sociale", qCompanyPh: "Rechercher votre entreprise…", qSiret: "Numéro SIRET", qVat: "Numéro de TVA", qAddress: "Adresse du siège social", qNoResult: "Aucune entreprise trouvée",
    qProjectTitle: "Votre projet", qProjectLead: "Dernière étape : parlez-nous de votre idée.", qProjectType: "Type de projet", qTypeWebsite: "Site vitrine", qTypeShop: "E-commerce", qTypeBranding: "Identité visuelle", qTypeApp: "Application", qTypeOther: "Autre", qBudget: "Budget", qBudget1: "- de 500 €", qBudget6: "+ de 20 000 €", qMessage: "Message", qMessagePh: "Objectifs, délais, inspirations…",
    qBack: "Retour", qNext: "Continuer", qSubmit: "Envoyer la demande", qDoneTitle: "Merci {name} !", qDoneText: "Votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.", qDoneClose: "Fermer",
    qErrRequired: "Ce champ est requis", qErrChoice: "Veuillez faire un choix", qErrEmail: "Adresse email invalide", qErrPhone: "Numéro de téléphone invalide", qErrSiret: "Le SIRET doit contenir 14 chiffres", qErrVat: "Numéro de TVA invalide",
  },
  en: {
    ariaTalk: "Let's talk", talkCall: "Phone appointment", talkCallHint: "30 min to get to know each other", talkQuote: "Request a quote", talkQuoteHint: "Reply within 48 h",
    qClose: "Close", qStep: "Step {n} of {total}", qStepDone: "Request sent",
    qTypeTitle: "You are…", qTypeLead: "A few questions to prepare a tailored proposal.", qIndividual: "Individual", qIndividualDesc: "For a personal project", qPro: "Business", qProDesc: "For your company",
    qContactTitle: "Your details", qContactLead: "So we can get back to you.", qLastName: "Last name", qFirstName: "First name", qEmail: "Email address", qEmailPro: "Work email address", qPhone: "Phone", qPhonePro: "Work phone", qOptional: "(optional)",
    qCompanyTitle: "Your company", qCompanyLead: "Search for your company name — we'll fill in the rest.", qCompany: "Company name", qCompanyPh: "Search for your company…", qSiret: "SIRET number", qVat: "VAT number", qAddress: "Registered office address", qNoResult: "No company found",
    qProjectTitle: "Your project", qProjectLead: "Last step: tell us about your idea.", qProjectType: "Project type", qTypeWebsite: "Showcase website", qTypeShop: "E-commerce", qTypeBranding: "Brand identity", qTypeApp: "App", qTypeOther: "Other", qBudget: "Budget", qBudget1: "Under €500", qBudget6: "Over €20,000", qMessage: "Message", qMessagePh: "Goals, timeline, inspiration…",
    qBack: "Back", qNext: "Continue", qSubmit: "Send request", qDoneTitle: "Thank you {name}!", qDoneText: "Your request has been sent. We'll get back to you within 48 hours.", qDoneClose: "Close",
    qErrRequired: "This field is required", qErrChoice: "Please make a choice", qErrEmail: "Invalid email address", qErrPhone: "Invalid phone number", qErrSiret: "SIRET must contain 14 digits", qErrVat: "Invalid VAT number",
  },
  de: {
    ariaTalk: "Sprechen wir", talkCall: "Telefontermin", talkCallHint: "30 Min. zum Kennenlernen", talkQuote: "Angebot anfordern", talkQuoteHint: "Antwort innerhalb von 48 Std.",
    qClose: "Schließen", qStep: "Schritt {n} von {total}", qStepDone: "Anfrage gesendet",
    qTypeTitle: "Sie sind…", qTypeLead: "Ein paar Fragen, um ein maßgeschneidertes Angebot vorzubereiten.", qIndividual: "Privatperson", qIndividualDesc: "Für ein privates Projekt", qPro: "Unternehmen", qProDesc: "Für Ihr Unternehmen",
    qContactTitle: "Ihre Kontaktdaten", qContactLead: "Damit wir uns bei Ihnen melden können.", qLastName: "Nachname", qFirstName: "Vorname", qEmail: "E-Mail-Adresse", qEmailPro: "Geschäftliche E-Mail-Adresse", qPhone: "Telefon", qPhonePro: "Geschäftliche Telefonnummer", qOptional: "(optional)",
    qCompanyTitle: "Ihr Unternehmen", qCompanyLead: "Suchen Sie Ihren Firmennamen – den Rest ergänzen wir.", qCompany: "Firmenname", qCompanyPh: "Unternehmen suchen…", qSiret: "SIRET-Nummer", qVat: "USt-IdNr.", qAddress: "Adresse des Firmensitzes", qNoResult: "Kein Unternehmen gefunden",
    qProjectTitle: "Ihr Projekt", qProjectLead: "Letzter Schritt: Erzählen Sie uns von Ihrer Idee.", qProjectType: "Projektart", qTypeWebsite: "Unternehmenswebsite", qTypeShop: "E-Commerce", qTypeBranding: "Corporate Identity", qTypeApp: "App", qTypeOther: "Sonstiges", qBudget: "Budget", qBudget1: "Unter 500 €", qBudget6: "Über 20.000 €", qMessage: "Nachricht", qMessagePh: "Ziele, Zeitrahmen, Inspirationen…",
    qBack: "Zurück", qNext: "Weiter", qSubmit: "Anfrage senden", qDoneTitle: "Danke, {name}!", qDoneText: "Ihre Anfrage wurde gesendet. Wir melden uns innerhalb von 48 Stunden.", qDoneClose: "Schließen",
    qErrRequired: "Dieses Feld ist erforderlich", qErrChoice: "Bitte treffen Sie eine Auswahl", qErrEmail: "Ungültige E-Mail-Adresse", qErrPhone: "Ungültige Telefonnummer", qErrSiret: "Die SIRET muss 14 Ziffern enthalten", qErrVat: "Ungültige USt-IdNr.",
  },
  es: {
    ariaTalk: "Hablemos", talkCall: "Cita telefónica", talkCallHint: "30 min para conocernos", talkQuote: "Solicitar presupuesto", talkQuoteHint: "Respuesta en 48 h",
    qClose: "Cerrar", qStep: "Paso {n} de {total}", qStepDone: "Solicitud enviada",
    qTypeTitle: "Usted es…", qTypeLead: "Unas preguntas para preparar una propuesta a medida.", qIndividual: "Particular", qIndividualDesc: "Para un proyecto personal", qPro: "Profesional", qProDesc: "Para su empresa",
    qContactTitle: "Sus datos", qContactLead: "Para que podamos responderle.", qLastName: "Apellido", qFirstName: "Nombre", qEmail: "Correo electrónico", qEmailPro: "Correo electrónico profesional", qPhone: "Teléfono", qPhonePro: "Teléfono profesional", qOptional: "(opcional)",
    qCompanyTitle: "Su empresa", qCompanyLead: "Busque su razón social: nosotros completamos el resto.", qCompany: "Razón social", qCompanyPh: "Buscar su empresa…", qSiret: "Número SIRET", qVat: "Número de IVA", qAddress: "Dirección de la sede social", qNoResult: "No se encontró ninguna empresa",
    qProjectTitle: "Su proyecto", qProjectLead: "Último paso: cuéntenos su idea.", qProjectType: "Tipo de proyecto", qTypeWebsite: "Web corporativa", qTypeShop: "E-commerce", qTypeBranding: "Identidad visual", qTypeApp: "Aplicación", qTypeOther: "Otro", qBudget: "Presupuesto", qBudget1: "Menos de 500 €", qBudget6: "Más de 20 000 €", qMessage: "Mensaje", qMessagePh: "Objetivos, plazos, inspiraciones…",
    qBack: "Volver", qNext: "Continuar", qSubmit: "Enviar solicitud", qDoneTitle: "¡Gracias, {name}!", qDoneText: "Su solicitud ha sido enviada. Le responderemos en 48 horas.", qDoneClose: "Cerrar",
    qErrRequired: "Este campo es obligatorio", qErrChoice: "Por favor, elija una opción", qErrEmail: "Correo electrónico no válido", qErrPhone: "Número de teléfono no válido", qErrSiret: "El SIRET debe tener 14 dígitos", qErrVat: "Número de IVA no válido",
  },
  pt: {
    ariaTalk: "Vamos conversar", talkCall: "Marcação telefónica", talkCallHint: "30 min para nos conhecermos", talkQuote: "Pedir orçamento", talkQuoteHint: "Resposta em 48 h",
    qClose: "Fechar", qStep: "Passo {n} de {total}", qStepDone: "Pedido enviado",
    qTypeTitle: "Você é…", qTypeLead: "Algumas perguntas para preparar uma proposta à medida.", qIndividual: "Particular", qIndividualDesc: "Para um projeto pessoal", qPro: "Profissional", qProDesc: "Para a sua empresa",
    qContactTitle: "Os seus dados", qContactLead: "Para que possamos entrar em contacto consigo.", qLastName: "Apelido", qFirstName: "Nome", qEmail: "Endereço de e-mail", qEmailPro: "E-mail profissional", qPhone: "Telefone", qPhonePro: "Telefone profissional", qOptional: "(opcional)",
    qCompanyTitle: "A sua empresa", qCompanyLead: "Pesquise a sua denominação social: nós completamos o resto.", qCompany: "Denominação social", qCompanyPh: "Pesquisar a sua empresa…", qSiret: "Número SIRET", qVat: "Número de IVA", qAddress: "Morada da sede social", qNoResult: "Nenhuma empresa encontrada",
    qProjectTitle: "O seu projeto", qProjectLead: "Último passo: fale-nos da sua ideia.", qProjectType: "Tipo de projeto", qTypeWebsite: "Site institucional", qTypeShop: "E-commerce", qTypeBranding: "Identidade visual", qTypeApp: "Aplicação", qTypeOther: "Outro", qBudget: "Orçamento", qBudget1: "Menos de 500 €", qBudget6: "Mais de 20 000 €", qMessage: "Mensagem", qMessagePh: "Objetivos, prazos, inspirações…",
    qBack: "Voltar", qNext: "Continuar", qSubmit: "Enviar pedido", qDoneTitle: "Obrigado, {name}!", qDoneText: "O seu pedido foi enviado. Entraremos em contacto em 48 horas.", qDoneClose: "Fechar",
    qErrRequired: "Este campo é obrigatório", qErrChoice: "Por favor, faça uma escolha", qErrEmail: "Endereço de e-mail inválido", qErrPhone: "Número de telefone inválido", qErrSiret: "O SIRET deve ter 14 dígitos", qErrVat: "Número de IVA inválido",
  },
  it: {
    ariaTalk: "Parliamone", talkCall: "Appuntamento telefonico", talkCallHint: "30 min per conoscerci", talkQuote: "Richiedi un preventivo", talkQuoteHint: "Risposta entro 48 h",
    qClose: "Chiudi", qStep: "Passo {n} di {total}", qStepDone: "Richiesta inviata",
    qTypeTitle: "Lei è…", qTypeLead: "Qualche domanda per preparare una proposta su misura.", qIndividual: "Privato", qIndividualDesc: "Per un progetto personale", qPro: "Professionista", qProDesc: "Per la sua azienda",
    qContactTitle: "I suoi dati", qContactLead: "Per poterla ricontattare.", qLastName: "Cognome", qFirstName: "Nome", qEmail: "Indirizzo email", qEmailPro: "Email aziendale", qPhone: "Telefono", qPhonePro: "Telefono aziendale", qOptional: "(facoltativo)",
    qCompanyTitle: "La sua azienda", qCompanyLead: "Cerchi la sua ragione sociale: al resto pensiamo noi.", qCompany: "Ragione sociale", qCompanyPh: "Cerca la sua azienda…", qSiret: "Numero SIRET", qVat: "Partita IVA", qAddress: "Indirizzo della sede legale", qNoResult: "Nessuna azienda trovata",
    qProjectTitle: "Il suo progetto", qProjectLead: "Ultimo passo: ci parli della sua idea.", qProjectType: "Tipo di progetto", qTypeWebsite: "Sito vetrina", qTypeShop: "E-commerce", qTypeBranding: "Identità visiva", qTypeApp: "Applicazione", qTypeOther: "Altro", qBudget: "Budget", qBudget1: "Meno di 500 €", qBudget6: "Oltre 20.000 €", qMessage: "Messaggio", qMessagePh: "Obiettivi, tempistiche, ispirazioni…",
    qBack: "Indietro", qNext: "Continua", qSubmit: "Invia richiesta", qDoneTitle: "Grazie, {name}!", qDoneText: "La sua richiesta è stata inviata. La ricontatteremo entro 48 ore.", qDoneClose: "Chiudi",
    qErrRequired: "Campo obbligatorio", qErrChoice: "Effettui una scelta", qErrEmail: "Indirizzo email non valido", qErrPhone: "Numero di telefono non valido", qErrSiret: "Il SIRET deve contenere 14 cifre", qErrVat: "Partita IVA non valida",
  },
  zh: {
    ariaTalk: "我们聊聊", talkCall: "电话预约", talkCallHint: "30 分钟相互了解", talkQuote: "申请报价", talkQuoteHint: "48 小时内回复",
    qClose: "关闭", qStep: "第 {n} 步，共 {total} 步", qStepDone: "申请已发送",
    qTypeTitle: "您是…", qTypeLead: "回答几个问题，我们为您量身定制方案。", qIndividual: "个人", qIndividualDesc: "个人项目", qPro: "企业", qProDesc: "为您的企业",
    qContactTitle: "您的联系方式", qContactLead: "以便我们与您联系。", qLastName: "姓", qFirstName: "名", qEmail: "电子邮箱", qEmailPro: "工作邮箱", qPhone: "电话", qPhonePro: "工作电话", qOptional: "（选填）",
    qCompanyTitle: "您的企业", qCompanyLead: "搜索公司名称，其余信息自动填写。", qCompany: "公司名称", qCompanyPh: "搜索您的公司…", qSiret: "SIRET 号码", qVat: "增值税号", qAddress: "注册地址", qNoResult: "未找到公司",
    qProjectTitle: "您的项目", qProjectLead: "最后一步：介绍一下您的想法。", qProjectType: "项目类型", qTypeWebsite: "企业官网", qTypeShop: "电子商务", qTypeBranding: "品牌形象", qTypeApp: "应用程序", qTypeOther: "其他", qBudget: "预算", qBudget1: "500 € 以下", qBudget6: "20 000 € 以上", qMessage: "留言", qMessagePh: "目标、时间、灵感…",
    qBack: "返回", qNext: "继续", qSubmit: "提交申请", qDoneTitle: "谢谢，{name}！", qDoneText: "您的申请已发送，我们将在 48 小时内回复您。", qDoneClose: "关闭",
    qErrRequired: "此项为必填", qErrChoice: "请选择一项", qErrEmail: "邮箱地址无效", qErrPhone: "电话号码无效", qErrSiret: "SIRET 必须为 14 位数字", qErrVat: "增值税号无效",
  },
};

/* Sur les pages sans I18N global (ex. connexion), la modale utilise son propre dictionnaire. */
const DICTS = typeof I18N !== "undefined" ? I18N : QUOTE_I18N;
if (DICTS !== QUOTE_I18N) for (const [code, strings] of Object.entries(QUOTE_I18N)) Object.assign(DICTS[code], strings);

const tr = (key, vars = {}) =>
  (DICTS[document.documentElement.lang]?.[key] ?? DICTS.fr[key] ?? key).replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");

const finePointer = window.matchMedia("(pointer: fine)");

/* ---------- Popover « Discutons » ---------- */

const talk = document.querySelector(".talk");
let talkAnchor = null;

if (talk) {
const talkItems = [...talk.querySelectorAll(".talk__item")];
const talkTriggers = document.querySelectorAll(".nav__cta, .nav__sheet-cta");

function placeTalk() {
  const rect = talkAnchor.getBoundingClientRect();
  const width = talk.offsetWidth;
  const left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12);
  talk.style.left = `${left}px`;
  talk.style.bottom = `${window.innerHeight - rect.top + 12}px`;
  talk.style.setProperty("--origin-x", `${rect.left + rect.width / 2 - left}px`);
}

function openTalk(anchor, viaKeyboard) {
  talkAnchor = anchor;
  placeTalk();
  talk.inert = false;
  talk.classList.add("is-open");
  talkTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", String(trigger === anchor)));
  if (viaKeyboard) talkItems[0].focus();
}

function closeTalk(restoreFocus = false) {
  if (!talk.classList.contains("is-open")) return;
  talk.classList.remove("is-open");
  talk.inert = true;
  talkTriggers.forEach((trigger) => trigger.setAttribute("aria-expanded", "false"));
  if (restoreFocus) talkAnchor?.focus();
}

talkTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    if (talk.classList.contains("is-open") && talkAnchor === trigger) closeTalk();
    else openTalk(trigger, event.detail === 0);
  });
});

talk.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const index = talkItems.indexOf(document.activeElement);
  const delta = event.key === "ArrowDown" ? 1 : -1;
  talkItems[(index + delta + talkItems.length) % talkItems.length].focus();
});

talk.querySelector('[data-action="call"]').addEventListener("click", () => closeTalk());
talk.querySelector('[data-action="quote"]').addEventListener("click", () => {
  closeTalk();
  openQuote();
});

document.addEventListener("pointerdown", (event) => {
  if (!event.target.closest(".talk, .nav__cta, .nav__sheet-cta")) closeTalk();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && talk.classList.contains("is-open")) closeTalk(true);
});
window.addEventListener("scroll", () => closeTalk(), { passive: true });
window.addEventListener("resize", () => closeTalk());
}

/* ---------- Modale de devis ---------- */

const quote = document.querySelector(".quote");
const form = quote.querySelector(".quote__form");
const viewport = form.querySelector(".quote__viewport");
const panels = Object.fromEntries([...form.querySelectorAll(".quote__panel")].map((panel) => [panel.dataset.step, panel]));
const stepLabel = form.querySelector(".quote__step-label");
const progress = form.querySelector(".quote__progress");
const backButton = form.querySelector(".quote__back");
const nextButton = form.querySelector(".quote__next");
const nextLabel = form.querySelector(".quote__next-label");
const doneTitle = panels.done.querySelector(".quote__title");

const FLOWS = {
  individual: ["type", "contact", "project"],
  pro: ["type", "contact", "company", "project"],
};

const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  phone: /^\+?[\d\s().-]{6,20}$/,
  siret: /^\d{14}$/,
  vat: /^[A-Z]{2}[0-9A-Z]{8,12}$/,
};

const EASE_OUT = "cubic-bezier(.22, 1, .36, 1)";

let stepIndex = 0;
let finished = false;
let transitioning = false;
let displayedPanel = panels.type;
let backdropPress = false;

const flow = () => FLOWS[form.elements.clientType.value || "individual"];
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function updateChrome() {
  const total = flow().length;
  stepLabel.textContent = finished ? tr("qStepDone") : tr("qStep", { n: stepIndex + 1, total });
  progress.style.setProperty("--progress", finished ? 1 : (stepIndex + 1) / total);
  backButton.classList.toggle("is-hidden", stepIndex === 0);
  backButton.disabled = stepIndex === 0;
  nextLabel.textContent = finished ? tr("qDoneClose") : stepIndex === total - 1 ? tr("qSubmit") : tr("qNext");
  form.classList.toggle("is-done", finished);
  quote.setAttribute("aria-labelledby", displayedPanel.querySelector(".quote__title").id);
}

async function showPanel(panel, direction) {
  if (panel === displayedPanel) return;
  const previous = displayedPanel;
  const animate = !reducedMotion.matches;
  const startHeight = viewport.offsetHeight;
  transitioning = true;

  if (animate) {
    viewport.classList.add("is-animating");
    viewport.style.height = `${startHeight}px`;
    await previous.animate(
      [{ opacity: 1, transform: "none" }, { opacity: 0, transform: `translateX(${-28 * direction}px)` }],
      { duration: 200, easing: "ease-in", fill: "forwards" },
    ).finished;
  }

  previous.hidden = true;
  previous.classList.remove("is-active");
  previous.getAnimations().forEach((animation) => animation.cancel());
  panel.hidden = false;
  panel.classList.add("is-active");
  displayedPanel = panel;
  viewport.scrollTop = 0;
  updateChrome();

  if (animate) {
    viewport.style.height = "";
    const endHeight = viewport.offsetHeight;
    const resize = viewport.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 450, easing: EASE_OUT },
    );
    panel.animate(
      [{ opacity: 0, transform: `translateX(${28 * direction}px)` }, { opacity: 1, transform: "none" }],
      { duration: 480, easing: EASE_OUT },
    );
    await resize.finished;
    viewport.classList.remove("is-animating");
  }

  transitioning = false;
}

function focusPanel() {
  if (!finePointer.matches) return;
  displayedPanel.querySelector(".field__input")?.focus({ preventScroll: true });
}

/* Validation */

function setError(field, message) {
  field.classList.toggle("has-error", Boolean(message));
  field.querySelector(".field__error").textContent = message;
  field.querySelectorAll("input, textarea").forEach((input) => {
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  });
}

function fieldError(field) {
  if (field.matches("fieldset[data-required]")) return field.querySelector("input:checked") ? "" : tr("qErrChoice");

  const input = field.querySelector(".field__input");
  const value = input.value.trim();
  if (!value) return input.required ? tr("qErrRequired") : "";

  switch (input.name) {
    case "email": return PATTERNS.email.test(value) ? "" : tr("qErrEmail");
    case "phone": return PATTERNS.phone.test(value) ? "" : tr("qErrPhone");
    case "siret": return PATTERNS.siret.test(value.replace(/\s/g, "")) ? "" : tr("qErrSiret");
    case "vat": return PATTERNS.vat.test(value.replace(/\s/g, "").toUpperCase()) ? "" : tr("qErrVat");
    default: return "";
  }
}

function validatePanel(panel) {
  let firstInvalid = null;
  panel.querySelectorAll(".field").forEach((field) => {
    const message = fieldError(field);
    setError(field, message);
    if (message && !firstInvalid) firstInvalid = field;
  });
  if (!firstInvalid) return true;

  firstInvalid.animate(
    [{ transform: "none" }, { transform: "translateX(-7px)" }, { transform: "translateX(6px)" }, { transform: "translateX(-3px)" }, { transform: "none" }],
    { duration: 420, easing: "ease-out" },
  );
  firstInvalid.querySelector(".field__input, input")?.focus({ preventScroll: true });
  firstInvalid.scrollIntoView({ block: "nearest", behavior: "smooth" });
  return false;
}

form.addEventListener("input", (event) => {
  const field = event.target.closest(".field");
  if (field?.classList.contains("has-error")) setError(field, fieldError(field));
});

form.addEventListener("change", (event) => {
  const field = event.target.closest(".field");
  if (field?.classList.contains("has-error")) setError(field, fieldError(field));
  if (event.target.name !== "clientType") return;

  const pro = event.target.value === "pro";
  form.classList.toggle("is-pro", pro);
  form.elements.phone.required = pro;
  form.elements.email.autocomplete = pro ? "work email" : "email";
  form.elements.phone.autocomplete = pro ? "work tel" : "tel";
  updateChrome();
  setTimeout(() => {
    if (stepIndex === 0 && !transitioning && quote.open) next();
  }, 320);
});

/* Navigation */

async function next() {
  if (transitioning) return;
  if (finished) return closeQuote();
  if (!validatePanel(displayedPanel)) return;

  const steps = flow();
  if (stepIndex < steps.length - 1) {
    stepIndex++;
    await showPanel(panels[steps[stepIndex]], 1);
    focusPanel();
  } else {
    await submitQuote();
  }
}

async function back() {
  if (transitioning || stepIndex === 0 || finished) return;
  stepIndex--;
  await showPanel(panels[flow()[stepIndex]], -1);
  focusPanel();
}

async function submitQuote() {
  const data = Object.fromEntries(new FormData(form));
  nextButton.classList.add("is-loading");
  await delay(900);
  nextButton.classList.remove("is-loading");
  finished = true;
  doneTitle.dataset.name = data.firstName.trim();
  doneTitle.textContent = tr("qDoneTitle", { name: doneTitle.dataset.name });
  await showPanel(panels.done, 1);
  nextButton.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  next();
});
backButton.addEventListener("click", back);

/* Ouverture / fermeture */

function resetQuote() {
  form.reset();
  form.classList.remove("is-pro", "is-done");
  form.elements.phone.required = false;
  form.querySelectorAll(".field").forEach((field) => setError(field, ""));
  Object.values(panels).forEach((panel) => {
    panel.hidden = panel !== panels.type;
    panel.classList.toggle("is-active", panel === panels.type);
  });
  displayedPanel = panels.type;
  stepIndex = 0;
  finished = false;
  companyResults = [];
  setListOpen(false);
  updateChrome();
}

function openQuote() {
  if (quote.open) return;
  if (finished) resetQuote();
  updateChrome();
  quote.showModal();
  document.documentElement.classList.add("is-locked");
  requestAnimationFrame(() => requestAnimationFrame(() => quote.classList.add("is-open")));
}

/* Ouverture préremplie (ex. depuis l'assistant de la page Services) */
function openQuoteWith({ projectType, budget, message } = {}) {
  if (quote.open) return;
  resetQuote();
  for (const [name, value] of Object.entries({ projectType, budget })) {
    const input = form.querySelector(`input[name="${name}"][value="${CSS.escape(value ?? "")}"]`);
    if (input) input.checked = true;
  }
  if (message) form.elements.message.value = message;
  openQuote();
}

function closeQuote() {
  if (!quote.open || quote.classList.contains("is-closing")) return;
  quote.classList.remove("is-open");
  quote.classList.add("is-closing");
  setTimeout(() => {
    quote.classList.remove("is-closing");
    quote.close();
    document.documentElement.classList.remove("is-locked");
    if (finished) resetQuote();
  }, reducedMotion.matches ? 0 : 380);
}

quote.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeQuote();
});
quote.addEventListener("pointerdown", (event) => {
  backdropPress = event.target === quote;
});
quote.addEventListener("click", (event) => {
  if (event.target === quote && backdropPress) closeQuote();
});
form.querySelector(".quote__close").addEventListener("click", closeQuote);

/* ---------- Autocomplétion entreprise (API Recherche d'entreprises) ---------- */

const companyInput = form.elements.company;
const combo = companyInput.closest(".combo");
const companyList = combo.querySelector(".combo__list");
let companyResults = [];
let activeOption = -1;
let searchTimer;
let searchController;
let lastQuery = "";

const formatSiret = (siret) => siret.replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/, "$1 $2 $3 $4");

function vatFromSiren(siren) {
  if (!/^\d{9}$/.test(siren)) return "";
  const key = (12 + 3 * (Number(siren) % 97)) % 97;
  return `FR${String(key).padStart(2, "0")}${siren}`;
}

const toCompany = (result) => ({
  label: result.nom_complet,
  name: result.nom_raison_sociale || result.nom_complet,
  siren: result.siren ?? "",
  siret: result.siege?.siret ?? "",
  address: result.siege?.adresse ?? "",
  city: [result.siege?.code_postal, result.siege?.libelle_commune].filter(Boolean).join(" "),
});

function setListOpen(open) {
  combo.classList.toggle("is-open", open);
  companyInput.setAttribute("aria-expanded", String(open));
  if (open) return;
  activeOption = -1;
  companyInput.removeAttribute("aria-activedescendant");
}

function appendHighlighted(element, text, query) {
  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (!query || index < 0) {
    element.textContent = text;
    return;
  }
  const mark = document.createElement("mark");
  mark.textContent = text.slice(index, index + query.length);
  element.append(text.slice(0, index), mark, text.slice(index + query.length));
}

function renderCompanies() {
  companyList.replaceChildren();

  if (!companyResults.length) {
    const empty = document.createElement("li");
    empty.className = "combo__empty";
    empty.textContent = tr("qNoResult");
    companyList.append(empty);
  }

  companyResults.forEach((company, index) => {
    const option = document.createElement("li");
    option.className = "combo__option";
    option.id = `q-company-option-${index}`;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");

    const name = document.createElement("strong");
    appendHighlighted(name, company.label, lastQuery);
    const meta = document.createElement("span");
    meta.textContent = [formatSiret(company.siret), company.city].filter(Boolean).join(" · ");

    option.append(name, meta);
    option.addEventListener("pointerdown", (event) => event.preventDefault());
    option.addEventListener("click", () => selectCompany(index));
    companyList.append(option);
  });

  setListOpen(true);
}

function setActiveOption(index) {
  const options = companyList.querySelectorAll(".combo__option");
  activeOption = index;
  options.forEach((option, i) => option.setAttribute("aria-selected", String(i === index)));
  companyInput.setAttribute("aria-activedescendant", options[index].id);
  options[index].scrollIntoView({ block: "nearest" });
}

async function searchCompanies(query) {
  searchController?.abort();
  const controller = new AbortController();
  searchController = controller;
  combo.classList.add("is-loading");

  try {
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(query)}&per_page=6&etat_administratif=A`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    companyResults = (data.results ?? []).map(toCompany);
    lastQuery = query;
    if (document.activeElement === companyInput) renderCompanies();
  } catch (error) {
    if (error.name !== "AbortError") {
      companyResults = [];
      setListOpen(false);
    }
  } finally {
    if (searchController === controller) combo.classList.remove("is-loading");
  }
}

function fillField(input, value) {
  input.value = value;
  input.classList.remove("is-autofilled");
  void input.offsetWidth;
  input.classList.add("is-autofilled");
}

function selectCompany(index) {
  const company = companyResults[index];
  companyInput.value = company.name;
  fillField(form.elements.siret, formatSiret(company.siret));
  fillField(form.elements.vat, vatFromSiren(company.siren));
  fillField(form.elements.address, company.address);
  setListOpen(false);
  panels.company.querySelectorAll(".field.has-error").forEach((field) => setError(field, fieldError(field)));
}

companyInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  const query = companyInput.value.trim();
  if (query.length < 3) {
    searchController?.abort();
    combo.classList.remove("is-loading");
    companyResults = [];
    setListOpen(false);
    return;
  }
  searchTimer = setTimeout(() => searchCompanies(query), 280);
});

companyInput.addEventListener("keydown", (event) => {
  const open = combo.classList.contains("is-open");

  if ((event.key === "ArrowDown" || event.key === "ArrowUp") && companyResults.length) {
    event.preventDefault();
    if (!open) renderCompanies();
    const count = companyResults.length;
    const delta = event.key === "ArrowDown" ? 1 : -1;
    setActiveOption(activeOption < 0 ? (delta > 0 ? 0 : count - 1) : (activeOption + delta + count) % count);
  } else if (event.key === "Enter" && open && activeOption >= 0) {
    event.preventDefault();
    selectCompany(activeOption);
  } else if (event.key === "Escape" && open) {
    event.preventDefault();
    event.stopPropagation();
    setListOpen(false);
  }
});

companyInput.addEventListener("focus", () => {
  if (companyResults.length && companyInput.value.trim().length >= 3) renderCompanies();
});
companyInput.addEventListener("blur", () => setTimeout(() => setListOpen(false), 120));

/* ---------- Langue ---------- */

document.addEventListener("langchange", () => {
  updateChrome();
  if (finished) doneTitle.textContent = tr("qDoneTitle", { name: doneTitle.dataset.name ?? "" });
  form.querySelectorAll(".field.has-error").forEach((field) => setError(field, fieldError(field)));
  if (combo.classList.contains("is-open")) renderCompanies();
});

if (typeof applyLang === "function" && typeof currentLang !== "undefined") applyLang(currentLang);
