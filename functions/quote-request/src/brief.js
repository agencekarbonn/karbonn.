/* Lecture du brief envoyé par le navigateur et libellés dans chaque langue. */
import { createBrief, estimate, mergeBrief } from "./shared/services-engine.js";
import { SERVICES_I18N } from "./shared/services-i18n.js";

export const LANGS = Object.keys(SERVICES_I18N);
const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", pt: "pt-PT", it: "it-IT", zh: "zh-CN" };
const NAME_KEYS = { web: "svcWeb", ai: "svcAi", hosting: "svcHosting", uiux: "svcUiux", branding: "svcBranding", seo: "svcSeo" };

export const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
export const PHONE_RE = /^\+?[\d\s().-]{6,30}$/;
const MAX_NOTES = 5;
const MAX_NOTE = 500;

const clean = (value, max) => String(value).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function t(lang, key, vars = {}) {
  const text = SERVICES_I18N[lang]?.[key] ?? SERVICES_I18N.fr[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name) => vars[name] ?? "");
}

/* Valide la demande : tout ce qui vient du navigateur est filtré, et l'estimation est recalculée ici. */
export function readRequest(payload) {
  const data = payload && typeof payload === "object" ? payload : {};
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const phone = typeof data.phone === "string" ? data.phone.trim() : "";
  if (email.length > 254 || !EMAIL_RE.test(email)) return { error: "invalid_email" };
  if (phone && !PHONE_RE.test(phone)) return { error: "invalid_phone" };

  const brief = mergeBrief(createBrief(), data.brief && typeof data.brief === "object" ? data.brief : {});
  if (!brief.services.length && !brief.outOfScope) return { error: "invalid_brief" };

  const notes = (Array.isArray(data.notes) ? data.notes : [])
    .filter((note) => typeof note === "string")
    .map((note) => clean(note, MAX_NOTE))
    .filter(Boolean)
    .slice(-MAX_NOTES);

  return {
    email,
    phone,
    lang: LANGS.includes(data.lang) ? data.lang : "fr",
    brief,
    notes,
    result: estimate(brief),
    trap: typeof data.company === "string" && data.company.trim() !== "",
  };
}

export function money(value, lang) {
  return new Intl.NumberFormat(LOCALES[lang] ?? "fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function weeks(lang, { weeksLow, weeksHigh }) {
  return weeksLow === weeksHigh ? t(lang, "svcResWeek", { n: weeksLow }) : t(lang, "svcResWeeks", { min: weeksLow, max: weeksHigh });
}

/* Fourchette lisible : forfait, sinon coût mensuel seul */
export function range(lang, value) {
  if (value.low) return `${money(value.low, lang)} – ${money(value.high, lang)} ${t(lang, "svcResTax")}`;
  if (value.monthlyLow) return `${money(value.monthlyLow, lang)} – ${money(value.monthlyHigh, lang)} ${t(lang, "svcResPerMonth")}`;
  return "";
}

/* Récapitulatif structuré, identique à celui affiché sur la page */
export function recapRows(lang, brief, result) {
  const rows = brief.services.map((id) => [t(lang, NAME_KEYS[id]), brief.options[id] ? t(lang, `svcO_${id}_${brief.options[id]}`) : "—"]);
  for (const [field, key] of [["scale", "svcSumScale"], ["timeline", "svcSumTimeline"], ["budget", "svcSumBudget"]]) {
    if (brief[field]) rows.push([t(lang, key), t(lang, `svcO_${field}_${brief[field]}`)]);
  }
  if (!result.reasons.includes("scope") && result.low) rows.push([t(lang, "svcSumDelivery"), weeks(lang, result)]);
  return rows;
}

export function estimateLines(lang, result) {
  if (result.reasons.includes("scope")) return [];
  const lines = [range(lang, result)];
  if (result.low && result.monthlyLow) lines.push(t(lang, "svcResMonthly", { min: money(result.monthlyLow, lang), max: money(result.monthlyHigh, lang) }));
  return lines;
}

export function verdict(lang, result) {
  return {
    label: t(lang, result.feasible ? "svcResFeasible" : "svcResNotFeasible"),
    reasons: result.reasons.map((reason) => t(lang, `svcReason_${reason}`)),
    alternative: result.alternative
      ? t(lang, `svcAlt_${result.alternative.kind}`, { range: range(lang, result.alternative), weeks: weeks(lang, result.alternative) })
      : "",
  };
}
