/* Pied de page : horaires dynamiques, téléphone protégé, newsletter, copyright */

const FOOTER_I18N = {
  fr: {
    fAgency: "L'agence", fHours: "Horaires", fSchedule: "Du lundi au vendredi, 9h – 18h", fPhone: "Téléphone", fPhoneReveal: "Afficher le numéro", fPhoneNote: "Prix d'un appel local", fEmail: "Email",
    fLegal: "Légal", fLegalNotice: "Mentions légales", fPrivacy: "Politique de confidentialité", fCookies: "Politique de cookies", fTerms: "Conditions générales d'utilisation (CGU)", fSales: "Conditions générales de vente (CGV)",
    fFollow: "Suivez-nous", fNewsletter: "Newsletter", fNewsletterText: "Nos projets et actualités, une fois par mois.", fNewsletterPh: "votre@email.fr", fSubscribe: "S'inscrire à la newsletter", fNewsOk: "Merci ! Votre inscription est confirmée.", fNewsErr: "Merci d'indiquer une adresse email valide.",
    fRights: "Tous droits réservés.", fOpen: "Agence ouverte", fClosing: "Ferme bientôt", fClosed: "Agence fermée", fHoliday: "Fermé · jour férié",
    fClosesIn: "Ferme dans {time}", fReopensToday: "Rouvre aujourd'hui à 9h", fReopensTomorrow: "Rouvre demain à 9h", fReopensOn: "Rouvre {day} à 9h", fCall: "Appeler le {number}",
  },
  en: {
    fAgency: "The agency", fHours: "Opening hours", fSchedule: "Monday to Friday, 9 am – 6 pm", fPhone: "Phone", fPhoneReveal: "Show number", fPhoneNote: "Local call rate", fEmail: "Email",
    fLegal: "Legal", fLegalNotice: "Legal notice", fPrivacy: "Privacy policy", fCookies: "Cookie policy", fTerms: "Terms of use", fSales: "Terms of sale",
    fFollow: "Follow us", fNewsletter: "Newsletter", fNewsletterText: "Our projects and news, once a month.", fNewsletterPh: "your@email.com", fSubscribe: "Subscribe to the newsletter", fNewsOk: "Thank you! You're subscribed.", fNewsErr: "Please enter a valid email address.",
    fRights: "All rights reserved.", fOpen: "Agency open", fClosing: "Closing soon", fClosed: "Agency closed", fHoliday: "Closed · public holiday",
    fClosesIn: "Closes in {time}", fReopensToday: "Reopens today at 9 am", fReopensTomorrow: "Reopens tomorrow at 9 am", fReopensOn: "Reopens {day} at 9 am", fCall: "Call {number}",
  },
  de: {
    fAgency: "Die Agentur", fHours: "Öffnungszeiten", fSchedule: "Montag bis Freitag, 9–18 Uhr", fPhone: "Telefon", fPhoneReveal: "Nummer anzeigen", fPhoneNote: "Zum Ortstarif", fEmail: "E-Mail",
    fLegal: "Rechtliches", fLegalNotice: "Impressum", fPrivacy: "Datenschutzerklärung", fCookies: "Cookie-Richtlinie", fTerms: "Nutzungsbedingungen", fSales: "Allgemeine Geschäftsbedingungen (AGB)",
    fFollow: "Folgen Sie uns", fNewsletter: "Newsletter", fNewsletterText: "Unsere Projekte und News, einmal im Monat.", fNewsletterPh: "ihre@email.de", fSubscribe: "Newsletter abonnieren", fNewsOk: "Danke! Ihre Anmeldung ist bestätigt.", fNewsErr: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    fRights: "Alle Rechte vorbehalten.", fOpen: "Agentur geöffnet", fClosing: "Schließt bald", fClosed: "Agentur geschlossen", fHoliday: "Geschlossen · Feiertag",
    fClosesIn: "Schließt in {time}", fReopensToday: "Öffnet heute um 9 Uhr", fReopensTomorrow: "Öffnet morgen um 9 Uhr", fReopensOn: "Öffnet {day} um 9 Uhr", fCall: "{number} anrufen",
  },
  es: {
    fAgency: "La agencia", fHours: "Horario", fSchedule: "De lunes a viernes, de 9 a 18 h", fPhone: "Teléfono", fPhoneReveal: "Mostrar el número", fPhoneNote: "Precio de llamada local", fEmail: "Email",
    fLegal: "Legal", fLegalNotice: "Aviso legal", fPrivacy: "Política de privacidad", fCookies: "Política de cookies", fTerms: "Condiciones generales de uso", fSales: "Condiciones generales de venta",
    fFollow: "Síguenos", fNewsletter: "Newsletter", fNewsletterText: "Nuestros proyectos y novedades, una vez al mes.", fNewsletterPh: "tu@email.com", fSubscribe: "Suscribirse a la newsletter", fNewsOk: "¡Gracias! Tu suscripción está confirmada.", fNewsErr: "Introduce una dirección de email válida.",
    fRights: "Todos los derechos reservados.", fOpen: "Agencia abierta", fClosing: "Cierra pronto", fClosed: "Agencia cerrada", fHoliday: "Cerrado · día festivo",
    fClosesIn: "Cierra en {time}", fReopensToday: "Reabre hoy a las 9:00", fReopensTomorrow: "Reabre mañana a las 9:00", fReopensOn: "Reabre el {day} a las 9:00", fCall: "Llamar al {number}",
  },
  pt: {
    fAgency: "A agência", fHours: "Horário", fSchedule: "De segunda a sexta, das 9h às 18h", fPhone: "Telefone", fPhoneReveal: "Mostrar o número", fPhoneNote: "Preço de chamada local", fEmail: "Email",
    fLegal: "Legal", fLegalNotice: "Aviso legal", fPrivacy: "Política de privacidade", fCookies: "Política de cookies", fTerms: "Termos de utilização", fSales: "Condições gerais de venda",
    fFollow: "Siga-nos", fNewsletter: "Newsletter", fNewsletterText: "Os nossos projetos e novidades, uma vez por mês.", fNewsletterPh: "o-seu@email.pt", fSubscribe: "Subscrever a newsletter", fNewsOk: "Obrigado! A sua subscrição está confirmada.", fNewsErr: "Indique um endereço de email válido.",
    fRights: "Todos os direitos reservados.", fOpen: "Agência aberta", fClosing: "Fecha em breve", fClosed: "Agência fechada", fHoliday: "Fechado · feriado",
    fClosesIn: "Fecha dentro de {time}", fReopensToday: "Reabre hoje às 9h", fReopensTomorrow: "Reabre amanhã às 9h", fReopensOn: "Reabre {day} às 9h", fCall: "Ligar para {number}",
  },
  it: {
    fAgency: "L'agenzia", fHours: "Orari", fSchedule: "Dal lunedì al venerdì, 9:00 – 18:00", fPhone: "Telefono", fPhoneReveal: "Mostra il numero", fPhoneNote: "Costo di una chiamata locale", fEmail: "Email",
    fLegal: "Legale", fLegalNotice: "Note legali", fPrivacy: "Informativa sulla privacy", fCookies: "Cookie policy", fTerms: "Condizioni generali d'uso", fSales: "Condizioni generali di vendita",
    fFollow: "Seguici", fNewsletter: "Newsletter", fNewsletterText: "I nostri progetti e novità, una volta al mese.", fNewsletterPh: "tua@email.it", fSubscribe: "Iscriviti alla newsletter", fNewsOk: "Grazie! Iscrizione confermata.", fNewsErr: "Inserisci un indirizzo email valido.",
    fRights: "Tutti i diritti riservati.", fOpen: "Agenzia aperta", fClosing: "Chiude a breve", fClosed: "Agenzia chiusa", fHoliday: "Chiuso · giorno festivo",
    fClosesIn: "Chiude tra {time}", fReopensToday: "Riapre oggi alle 9:00", fReopensTomorrow: "Riapre domani alle 9:00", fReopensOn: "Riapre {day} alle 9:00", fCall: "Chiama il {number}",
  },
  zh: {
    fAgency: "工作室", fHours: "营业时间", fSchedule: "周一至周五 9:00 – 18:00", fPhone: "电话", fPhoneReveal: "显示号码", fPhoneNote: "按本地通话计费", fEmail: "邮箱",
    fLegal: "法律信息", fLegalNotice: "法律声明", fPrivacy: "隐私政策", fCookies: "Cookie 政策", fTerms: "使用条款", fSales: "销售条款",
    fFollow: "关注我们", fNewsletter: "新闻通讯", fNewsletterText: "每月一次，分享我们的项目与动态。", fNewsletterPh: "your@email.com", fSubscribe: "订阅新闻通讯", fNewsOk: "谢谢！订阅成功。", fNewsErr: "请输入有效的邮箱地址。",
    fRights: "版权所有。", fOpen: "营业中", fClosing: "即将关闭", fClosed: "已打烊", fHoliday: "休息 · 法定节假日",
    fClosesIn: "{time}后关闭", fReopensToday: "今天 9:00 营业", fReopensTomorrow: "明天 9:00 营业", fReopensOn: "{day} 9:00 营业", fCall: "拨打 {number}",
  },
};

for (const [code, strings] of Object.entries(FOOTER_I18N)) Object.assign(I18N[code], strings);

const footer = document.querySelector(".footer");

/* ---------- Copyright ---------- */

const FOUNDED = 2025;
const thisYear = new Date().getFullYear();
footer.querySelector(".footer__years").textContent = thisYear > FOUNDED ? `${FOUNDED} - ${thisYear}` : String(FOUNDED);

/* ---------- Titre « Karbonn_ » pleine largeur ---------- */

const footerBrand = footer.querySelector(".footer__brand");
const footerBrandInner = footer.querySelector(".footer__brand-inner");

function fitFooterBrand() {
  footerBrand.style.fontSize = "100px";
  const width = footerBrandInner.getBoundingClientRect().width;
  if (width > 0) footerBrand.style.fontSize = `${(footerBrand.clientWidth / width) * 100 * 0.98}px`;
}

document.fonts.ready.then(fitFooterBrand);
window.addEventListener("resize", fitFooterBrand);

new IntersectionObserver((entries, observer) => {
  if (!entries[0].isIntersecting) return;
  footer.classList.add("is-visible");
  observer.disconnect();
}, { threshold: 0.12 }).observe(footer);

/* ---------- Horaires (heure de Paris, jours fériés français) ---------- */

const OPENING = { days: [1, 2, 3, 4, 5], open: 9, close: 18 };
const holidayCache = new Map();

function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

const dayKey = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

function frenchHolidays(year) {
  if (holidayCache.has(year)) return holidayCache.get(year);
  const easter = easterSunday(year);
  const shift = (days) => new Date(year, easter.getMonth(), easter.getDate() + days);
  const dates = [
    new Date(year, 0, 1),
    shift(1),
    new Date(year, 4, 1),
    new Date(year, 4, 8),
    shift(39),
    shift(50),
    new Date(year, 6, 14),
    new Date(year, 7, 15),
    new Date(year, 10, 1),
    new Date(year, 10, 11),
    new Date(year, 11, 25),
  ];
  const keys = new Set(dates.map(dayKey));
  holidayCache.set(year, keys);
  return keys;
}

const isHoliday = (date) => frenchHolidays(date.getFullYear()).has(dayKey(date));
const isWorkingDay = (date) => OPENING.days.includes(date.getDay()) && !isHoliday(date);

function parisNow() {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Paris",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric",
      hourCycle: "h23",
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return new Date(+parts.year, parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
}

function agencyState(now) {
  if (isHoliday(now)) return "holiday";
  const hour = now.getHours() + now.getMinutes() / 60;
  if (!isWorkingDay(now) || hour < OPENING.open || hour >= OPENING.close) return "closed";
  return hour >= OPENING.close - 1 ? "closing" : "open";
}

const weekdayName = (date) =>
  new Intl.DateTimeFormat(currentLang === "zh" ? "zh-CN" : currentLang, { weekday: "long" }).format(date);

function agencyDetail(state, now) {
  if (state === "open" || state === "closing") {
    const close = new Date(now);
    close.setHours(OPENING.close, 0, 0, 0);
    const minutes = Math.max(0, Math.round((close - now) / 60000));
    const time = minutes >= 60 ? `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, "0")}` : `${minutes} min`;
    return tr("fClosesIn", { time });
  }
  for (let offset = 0; offset <= 14; offset++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (!isWorkingDay(day) || (offset === 0 && now.getHours() >= OPENING.open)) continue;
    if (offset === 0) return tr("fReopensToday");
    if (offset === 1) return tr("fReopensTomorrow");
    return tr("fReopensOn", { day: weekdayName(day) });
  }
  return "";
}

const STATUS_KEYS = { open: "fOpen", closing: "fClosing", closed: "fClosed", holiday: "fHoliday" };
const statusEl = footer.querySelector(".footer__status");
const statusText = footer.querySelector(".footer__status-text");
let showDetail = false;

function statusLine() {
  const now = parisNow();
  const state = agencyState(now);
  statusEl.className = `footer__status footer__status--${state === "holiday" ? "closed" : state}`;
  return showDetail ? agencyDetail(state, now) : tr(STATUS_KEYS[state]);
}

function flipStatus() {
  showDetail = !showDetail;
  if (reducedMotion.matches) {
    statusText.textContent = statusLine();
    return;
  }
  statusText.classList.add("footer__status-text--flip");
  setTimeout(() => {
    statusText.textContent = statusLine();
    statusText.classList.remove("footer__status-text--flip");
  }, 280);
}

statusText.textContent = statusLine();
setInterval(flipStatus, 3200);

/* ---------- Téléphone protégé contre les robots ----------
   Le numéro n'apparaît pas dans le HTML : il est stocké chiffré
   et n'est reconstitué qu'après un vrai clic de l'utilisateur. */

const PHONE_CODES = [113, 82, 91, 88, 65, 75, 178, 178, 163, 175, 144, 145];
const phoneButton = footer.querySelector(".footer__phone");

const decodePhone = () => PHONE_CODES.map((code, i) => String.fromCharCode(code ^ ((0x5a + i * 7) & 0xff))).join("");
const formatPhone = (number) => `${number.slice(0, 3)} ${number.slice(3, 4)} ${number.slice(4).match(/\d{2}/g).join(" ")}`;

phoneButton.addEventListener("click", (event) => {
  if (!event.isTrusted) return;
  const number = decodePhone();
  const link = document.createElement("a");
  link.className = "footer__phone-link";
  link.href = `tel:${number}`;
  link.dataset.number = formatPhone(number);
  link.setAttribute("aria-label", tr("fCall", { number: link.dataset.number }));
  link.append(phoneButton.querySelector("svg"), link.dataset.number);
  phoneButton.replaceWith(link);
  link.focus();
});

/* ---------- Newsletter ---------- */

const newsletter = footer.querySelector(".newsletter");
const newsletterInput = newsletter.querySelector(".newsletter__input");
const newsletterMessage = newsletter.querySelector(".newsletter__message");
let newsletterState = "";

function renderNewsletterMessage() {
  newsletterMessage.textContent = newsletterState ? tr(newsletterState === "ok" ? "fNewsOk" : "fNewsErr") : "";
  newsletterMessage.classList.toggle("is-error", newsletterState === "error");
}

newsletter.addEventListener("submit", (event) => {
  event.preventDefault();
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(newsletterInput.value.trim());
  newsletterState = valid ? "ok" : "error";
  renderNewsletterMessage();
  if (valid) newsletter.reset();
  else newsletterInput.focus();
});

newsletterInput.addEventListener("input", () => {
  if (newsletterState !== "error") return;
  newsletterState = "";
  renderNewsletterMessage();
});

/* ---------- Langue ---------- */

document.addEventListener("langchange", () => {
  statusText.textContent = statusLine();
  renderNewsletterMessage();
  const phoneLink = footer.querySelector(".footer__phone-link");
  if (phoneLink) phoneLink.setAttribute("aria-label", tr("fCall", { number: phoneLink.dataset.number }));
});

applyLang(currentLang);
