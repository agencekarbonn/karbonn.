/* Emails de demande de devis (agence + accusé de réception client), envoyés via Mailgun. */
import { readFileSync } from "node:fs";
import { estimateLines, recapRows, t, verdict } from "./brief.js";

const LOGO_NAME = "karbonn-logo-white.png";
const LOGO = readFileSync(new URL("./logo-white.png", import.meta.url));

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const multiline = (value) => escapeHtml(value).replace(/\n/g, "<br>");

const MONO = "Menlo,Consolas,monospace";
const SANS = "Helvetica,Arial,sans-serif";

const label = (text, top = 27) => `<p style="margin:${top}px 0 9px;color:#0C04FF;font:10px ${MONO};letter-spacing:1px;">${escapeHtml(text)}</p>`;

const rowsTable = (rows) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(([name, value]) => `<tr>
  <td width="46%" style="padding:12px 3px 12px 0;border-top:1px solid #deded9;color:#777772;font:10px ${MONO};letter-spacing:1px;text-transform:uppercase;word-break:break-word;">${escapeHtml(name)}</td>
  <td width="54%" align="right" style="padding:12px 0 12px 3px;border-top:1px solid #deded9;color:#111;font:600 13px ${SANS};word-break:break-word;">${value}</td>
</tr>`).join("")}</table>`;

const softBox = (inner) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#cdf2ff;border-radius:18px;"><tr><td style="padding:18px 18px 16px;">${inner}</td></tr></table>`;

function frame({ lang, badge, eyebrow, title, body, footer }) {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
  <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#eae9e4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eae9e4;padding:28px 12px;font-family:${SANS};color:#111;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;table-layout:fixed;background:#0C04FF;border-radius:25px;overflow:hidden;">
          <tr><td style="background:#0C04FF;padding:26px 34px 34px;border-radius:25px 25px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><img src="cid:${LOGO_NAME}" alt="Karbonn" width="32" height="40" style="display:block;border:0;width:32px;height:40px;"></td>
              <td align="right" valign="top"><span style="display:inline-block;border:1px solid #a3a0ff;border-radius:30px;padding:6px 12px;color:#f7f6f2;font:10px ${MONO};letter-spacing:1px;">${escapeHtml(badge)}</span></td>
            </tr></table>
            <p style="margin:33px 0 9px;color:#c9c7ff;font:10px ${MONO};letter-spacing:1px;">${escapeHtml(eyebrow)}</p>
            <h1 style="margin:0;color:#fff;font:800 36px/1.03 ${SANS};letter-spacing:-1.5px;text-transform:uppercase;">${multiline(title)}</h1>
          </td></tr>
          <tr><td style="background:#f7f6f2;border-radius:25px;padding:32px 34px 28px;">
            ${body}
            <p style="margin:25px 0 0;padding-top:18px;border-top:1px solid #deded9;color:#777772;font:9px/1.7 ${MONO};">${footer}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

const yearOf = (date) => new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Paris" }).format(date);
const parisDate = (date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Paris" }).format(date);
const LANG_NAMES = { fr: "Français", en: "Anglais", de: "Allemand", es: "Espagnol", pt: "Portugais", it: "Italien", zh: "Chinois" };

/* Email interne, toujours en français, avec le résumé et toutes les informations utiles */
export function renderAgencyEmail({ email, phone, lang, brief, result, notes, summary, sentAt = new Date() }) {
  const date = new Date(sentAt);
  const rows = recapRows("fr", brief, result);
  const estimate = estimateLines("fr", result);
  const v = verdict("fr", result);
  const services = brief.services.map((id) => (brief.options[id] ? t("fr", `svcO_${id}_${brief.options[id]}`) : t("fr", `svc${id[0].toUpperCase()}${id.slice(1)}`)));
  const subject = `Nouvelle demande de devis · ${services.join(" + ") || "Hors périmètre"}${estimate[0] ? ` · ${estimate[0]}` : ""}`;
  const contactRows = [
    ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:#0C04FF;">${escapeHtml(email)}</a>`],
    ["Téléphone", phone ? `<a href="tel:${escapeHtml(phone.replace(/[^\d+]/g, ""))}" style="color:#0C04FF;">${escapeHtml(phone)}</a>` : "Non renseigné"],
    ["Langue", escapeHtml(LANG_NAMES[lang] ?? lang)],
    ["Reçue le", escapeHtml(parisDate(date))],
  ];

  const body = [
    label(summary.ai ? "RÉSUMÉ RÉDIGÉ PAR IA" : "RÉSUMÉ AUTOMATIQUE", 0),
    softBox(`<p style="margin:0;color:#111;font:14px/1.6 ${SANS};">${multiline(summary.text)}</p>`),
    label("CONTACT"),
    rowsTable(contactRows),
    label("PROJET"),
    rowsTable(rows.map(([name, value]) => [name, escapeHtml(value)])),
    label("ESTIMATION"),
    rowsTable([
      ["Verdict", escapeHtml(v.label)],
      ...estimate.map((line, i) => [i ? "Récurrent" : "Fourchette", escapeHtml(line)]),
    ]),
    v.reasons.length || v.alternative
      ? `<p style="margin:12px 0 0;color:#55554f;font:13px/1.55 ${SANS};">${escapeHtml([...v.reasons, v.alternative].filter(Boolean).join(" "))}</p>`
      : "",
    notes.length
      ? label("MESSAGES DU CLIENT") + notes.map((note) => `<p style="margin:0 0 8px;padding-left:12px;border-left:2px solid #0C04FF;color:#111;font:italic 14px/1.55 ${SANS};">${escapeHtml(note)}</p>`).join("")
      : "",
    `<p style="margin:22px 0 0;color:#55554f;font:13px/1.55 ${SANS};">Répondez directement à cet email pour écrire au client.</p>`,
  ].join("\n");

  const text = [
    "NOUVELLE DEMANDE DE DEVIS",
    "",
    `${summary.ai ? "Résumé (IA)" : "Résumé"} :`,
    summary.text,
    "",
    `Email : ${email}`,
    `Téléphone : ${phone || "Non renseigné"}`,
    `Langue : ${LANG_NAMES[lang] ?? lang}`,
    `Reçue le : ${parisDate(date)}`,
    "",
    ...rows.map(([name, value]) => `${name} : ${value}`),
    "",
    `Verdict : ${v.label}`,
    ...estimate,
    ...v.reasons,
    v.alternative,
    ...(notes.length ? ["", "Messages du client :", ...notes.map((note) => `« ${note} »`)] : []),
  ].filter((line) => line != null).join("\n");

  const html = frame({
    lang: "fr",
    badge: "DEVIS",
    eyebrow: "NOUVELLE DEMANDE",
    title: "Demande\nde devis.",
    body,
    footer: `Envoyé depuis l’assistant de la page Services · ${escapeHtml(parisDate(date))}`,
  });
  return { subject, text, html };
}

/* Accusé de réception, dans la langue du visiteur */
export function renderAckEmail({ lang, brief, result, replyTo, sentAt = new Date() }) {
  const year = yearOf(new Date(sentAt));
  const rows = recapRows(lang, brief, result);
  const estimate = estimateLines(lang, result);
  const reply = `<a href="mailto:${escapeHtml(replyTo)}" style="color:#0C04FF;font-weight:600;text-decoration:underline;text-underline-offset:3px">${escapeHtml(replyTo)}</a>`;

  const body = [
    `<h2 style="margin:0 0 10px;font:700 17px ${SANS};">${escapeHtml(t(lang, "mailAckGreeting"))}</h2>`,
    `<p style="margin:0;color:#55554f;font:13px/1.55 ${SANS};">${escapeHtml(t(lang, "mailAckIntro"))}</p>`,
    estimate.length
      ? label(t(lang, "mailAckEstimate")) + softBox(
        `<p style="margin:0;color:#111;font:800 26px/1.15 ${SANS};letter-spacing:-.8px;">${escapeHtml(estimate[0])}</p>`
        + (estimate[1] ? `<p style="margin:6px 0 0;color:#27343a;font:12px ${MONO};">${escapeHtml(estimate[1])}</p>` : "")
        + `<p style="margin:12px 0 0;color:#51626a;font:10px/1.5 ${MONO};">${escapeHtml(t(lang, "mailAckNote"))}</p>`,
      )
      : "",
    label(t(lang, "mailAckRecap")),
    rowsTable(rows.map(([name, value]) => [name, escapeHtml(value)])),
    `<p style="margin:22px 0 0;font-size:14px;line-height:1.55;font-family:${SANS};color:#55554f;">${escapeHtml(t(lang, "mailAckReply"))} ${reply}.</p>`,
  ].join("\n");

  const text = [
    t(lang, "mailAckTitle").replace(/\n/g, " "),
    "",
    t(lang, "mailAckGreeting"),
    t(lang, "mailAckIntro"),
    ...(estimate.length ? ["", `${t(lang, "mailAckEstimate")} : ${estimate.join(" · ")}`, t(lang, "mailAckNote")] : []),
    "",
    t(lang, "mailAckRecap"),
    ...rows.map(([name, value]) => `${name} : ${value}`),
    "",
    `${t(lang, "mailAckReply")} ${replyTo}`,
    "",
    `© 2025 - ${year} Karbonn.`,
  ].join("\n");

  const html = frame({
    lang,
    badge: t(lang, "mailAckBadge"),
    eyebrow: t(lang, "mailAckEyebrow"),
    title: t(lang, "mailAckTitle"),
    body,
    footer: `© 2025 - ${year} Karbonn.`,
  });
  return { subject: t(lang, "mailAckSubject"), text, html };
}

export function createMailgunSender(env = process.env, fetchImpl = fetch) {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_REGION } = env;
  const base = String(MAILGUN_REGION).toLowerCase() === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";

  return async function sendMail({ to, replyTo, subject, text, html, tag }) {
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM) throw new Error("Mailgun is not configured");
    const body = new FormData();
    for (const [key, value] of Object.entries({ from: MAILGUN_FROM, to, subject, text, html, "h:Reply-To": replyTo, "o:tag": tag, "o:tracking": "no" })) {
      if (value) body.append(key, value);
    }
    body.append("inline", new Blob([LOGO], { type: "image/png" }), LOGO_NAME);
    const response = await fetchImpl(`${base}/v3/${encodeURIComponent(MAILGUN_DOMAIN)}/messages`, {
      method: "POST",
      headers: { Authorization: `Basic ${Buffer.from(`api:${MAILGUN_API_KEY}`).toString("base64")}` },
      body,
    });
    if (!response.ok) throw new Error(`Mailgun responded with HTTP ${response.status}`);
  };
}
