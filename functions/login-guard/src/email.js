/* Email du code de vérification, envoyé via l'API Mailgun. */
import { readFileSync } from "node:fs";

const LOGO_NAME = "karbonn-logo-white.png";
const LOGO = readFileSync(new URL("./logo-white.png", import.meta.url));


const COPY = {
  fr: {
    subject: "Votre code de connexion Karbonn.",
    badge: "SÉCURITÉ", eyebrow: "VÉRIFICATION DE SÉCURITÉ", title: "VOTRE CODE<br>DE CONNEXION.",
    greeting: (name) => `Bonjour ${name},`,
    intro: "Nous avons détecté une demande de connexion à votre espace client. Pour confirmer que c'est bien vous, saisissez le code ci-dessous.",
    codeLabel: "VOTRE CODE À USAGE UNIQUE", expires: "Valable 10 minutes", private: "Ne le partagez avec personne",
    details: "DÉTAILS DE LA CONNEXION", reason: "MOTIF", device: "APPAREIL", place: "LIEU APPROXIMATIF", date: "DATE",
    unknown: "Non disponible", ignoreTitle: "Ce n'est pas vous ?", ignore: "Ignorez cet email et ne communiquez ce code à personne : l'équipe Karbonn ne vous le demandera jamais. Écrivez-nous à",
    automatic: "Email automatique, merci de ne pas y répondre.",
    reasons: { first_login: "Première connexion détectée", new_device: "Nouvel appareil détecté", unknown_browser: "Navigateur inconnu détecté", periodic: "Vérification périodique", suspicious: "Activité inhabituelle détectée" },
  },
  en: {
    subject: "Your Karbonn. sign-in code",
    badge: "SECURITY", eyebrow: "SECURITY VERIFICATION", title: "YOUR SIGN-IN<br>CODE.",
    greeting: (name) => `Hello ${name},`,
    intro: "We detected a sign-in request to your account. To confirm it is you, enter the code below.",
    codeLabel: "YOUR ONE-TIME CODE", expires: "Valid for 10 minutes", private: "Do not share it with anyone",
    details: "SIGN-IN DETAILS", reason: "REASON", device: "DEVICE", place: "APPROXIMATE LOCATION", date: "DATE",
    unknown: "Unavailable", ignoreTitle: "Wasn't you?", ignore: "Ignore this email and never share this code: the Karbonn team will never ask for it. Write to us at",
    automatic: "Automated email, please do not reply.",
    reasons: { first_login: "First sign-in", new_device: "New device", unknown_browser: "Unknown browser", periodic: "Periodic security check", suspicious: "Unusual activity detected" },
  },
  de: {
    subject: "Ihr Karbonn.-Anmeldecode",
    badge: "SICHERHEIT", eyebrow: "SICHERHEITSÜBERPRÜFUNG", title: "IHR ANMELDE-<br>CODE.",
    greeting: (name) => `Hallo ${name},`,
    intro: "Wir haben eine Anmeldung bei Ihrem Kundenkonto festgestellt. Geben Sie zur Bestätigung den folgenden Code ein.",
    codeLabel: "IHR EINMALCODE", expires: "10 Minuten gültig", private: "Nicht an Dritte weitergeben",
    details: "ANMELDEDETAILS", reason: "GRUND", device: "GERÄT", place: "UNGEFÄHRER STANDORT", date: "DATUM",
    unknown: "Nicht verfügbar", ignoreTitle: "Sie waren es nicht?", ignore: "Ignorieren Sie diese E-Mail und geben Sie den Code niemals weiter: Karbonn wird Sie nie danach fragen. Schreiben Sie an",
    automatic: "Automatische E-Mail, bitte nicht antworten.",
    reasons: { first_login: "Erste Anmeldung", new_device: "Neues Gerät", unknown_browser: "Unbekannter Browser", periodic: "Regelmäßige Sicherheitsprüfung", suspicious: "Ungewöhnliche Aktivität erkannt" },
  },
  es: {
    subject: "Tu código de acceso a Karbonn.",
    badge: "SEGURIDAD", eyebrow: "VERIFICACIÓN DE SEGURIDAD", title: "TU CÓDIGO<br>DE ACCESO.",
    greeting: (name) => `Hola ${name},`,
    intro: "Hemos detectado un intento de acceso a tu cuenta. Para confirmar que eres tú, introduce el código siguiente.",
    codeLabel: "TU CÓDIGO DE UN SOLO USO", expires: "Válido durante 10 minutos", private: "No lo compartas con nadie",
    details: "DETALLES DE ACCESO", reason: "MOTIVO", device: "DISPOSITIVO", place: "UBICACIÓN APROXIMADA", date: "FECHA",
    unknown: "No disponible", ignoreTitle: "¿No has sido tú?", ignore: "Ignora este correo y no compartas el código: el equipo Karbonn nunca te lo pedirá. Escríbenos a",
    automatic: "Correo automático, no respondas.",
    reasons: { first_login: "Primer inicio de sesión", new_device: "Nuevo dispositivo", unknown_browser: "Navegador desconocido", periodic: "Verificación de seguridad periódica", suspicious: "Actividad inusual detectada" },
  },
  pt: {
    subject: "O seu código de acesso Karbonn.",
    badge: "SEGURANÇA", eyebrow: "VERIFICAÇÃO DE SEGURANÇA", title: "O SEU CÓDIGO<br>DE ACESSO.",
    greeting: (name) => `Olá ${name},`,
    intro: "Detetámos um pedido de acesso à sua conta. Para confirmar que é você, introduza o código abaixo.",
    codeLabel: "CÓDIGO DE UTILIZAÇÃO ÚNICA", expires: "Válido por 10 minutos", private: "Não o partilhe com ninguém",
    details: "DETALHES DO ACESSO", reason: "MOTIVO", device: "DISPOSITIVO", place: "LOCALIZAÇÃO APROXIMADA", date: "DATA",
    unknown: "Indisponível", ignoreTitle: "Não foi você?", ignore: "Ignore este email e não partilhe o código: a equipa Karbonn nunca o pedirá. Escreva-nos para",
    automatic: "Email automático, não responda.",
    reasons: { first_login: "Primeiro início de sessão", new_device: "Novo dispositivo", unknown_browser: "Navegador desconhecido", periodic: "Verificação de segurança periódica", suspicious: "Atividade invulgar detetada" },
  },
  it: {
    subject: "Il tuo codice di accesso Karbonn.",
    badge: "SICUREZZA", eyebrow: "VERIFICA DI SICUREZZA", title: "IL TUO CODICE<br>DI ACCESSO.",
    greeting: (name) => `Ciao ${name},`,
    intro: "Abbiamo rilevato una richiesta di accesso al tuo account. Per confermare che sei tu, inserisci il codice qui sotto.",
    codeLabel: "IL TUO CODICE MONOUSO", expires: "Valido per 10 minuti", private: "Non condividerlo con nessuno",
    details: "DETTAGLI DELL'ACCESSO", reason: "MOTIVO", device: "DISPOSITIVO", place: "POSIZIONE APPROSSIMATIVA", date: "DATA",
    unknown: "Non disponibile", ignoreTitle: "Non sei stato tu?", ignore: "Ignora questa email e non condividere il codice: il team Karbonn non te lo chiederà mai. Scrivici a",
    automatic: "Email automatica, non rispondere.",
    reasons: { first_login: "Primo accesso", new_device: "Nuovo dispositivo", unknown_browser: "Browser sconosciuto", periodic: "Verifica di sicurezza periodica", suspicious: "Attività insolita rilevata" },
  },
  zh: {
    subject: "您的 Karbonn. 登录验证码",
    badge: "安全", eyebrow: "安全验证", title: "您的登录<br>验证码。",
    greeting: (name) => `${name}，您好：`,
    intro: "我们检测到您的账户有登录请求。若是您本人操作，请输入以下验证码。",
    codeLabel: "一次性验证码", expires: "10 分钟内有效", private: "请勿与他人分享",
    details: "登录详情", reason: "原因", device: "设备", place: "大致位置", date: "日期",
    unknown: "不可用", ignoreTitle: "不是您本人操作？", ignore: "请忽略此邮件，切勿分享验证码：Karbonn 团队绝不会索要验证码。如需帮助，请联系",
    automatic: "此为自动发送的邮件，请勿回复。",
    reasons: { first_login: "首次登录", new_device: "新设备", unknown_browser: "未知浏览器", periodic: "定期安全验证", suspicious: "检测到异常活动" },
  },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);

const LOCALES = { fr: "fr-FR", en: "en-GB", de: "de-DE", es: "es-ES", pt: "pt-PT", it: "it-IT", zh: "zh-CN" };

const detailRow = (label, value) => `<tr>
  <td width="46%" style="padding:12px 3px 12px 0;border-top:1px solid #deded9;color:#777772;font:10px Menlo,Consolas,monospace;letter-spacing:1px;word-break:break-word;">${escapeHtml(label)}</td>
  <td width="54%" align="right" style="padding:12px 0 12px 3px;border-top:1px solid #deded9;color:#111;font:600 12px Helvetica,Arial,sans-serif;word-break:break-word;">${escapeHtml(value)}</td>
</tr>`;

export function renderCodeEmail({ code, reason, lang, deviceLabel, name = "", location = "", country = "FR", sentAt = new Date() }) {
  const t = COPY[lang] ?? COPY.fr;
  const locale = LOCALES[lang] ?? "fr-FR";
  const reasonText = t.reasons[reason] ?? t.unknown;
  const firstName = String(name).trim().split(/\s+/)[0] || (lang === "fr" ? "à vous" : "there");
  const greeting = t.greeting(firstName).replace(/\s+,/, ",");
  const date = new Date(sentAt);
  const displayDate = new Intl.DateTimeFormat(locale, {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
    timeZone: country === "FR" ? "Europe/Paris" : "UTC",
  }).format(date) + (country === "FR" ? "" : " UTC");
  const year = new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Europe/Paris" }).format(date);
  const digits = [...String(code)].map((digit) => `<td align="center" width="16%" style="padding:0 3px;">
    <div style="background:#fff;border-radius:13px;padding:12px 0;color:#111;font:600 28px Menlo,Consolas,monospace;">${escapeHtml(digit)}</div>
  </td>`).join("");

  const text = [
    t.title.replace("<br>", " "),
    "",
    greeting,
    t.intro,
    "",
    code,
    "",
    `${t.expires} · ${t.private}`,
    `${t.reason}: ${reasonText}`,
    `${t.device}: ${deviceLabel}`,
    `${t.place}: ${location || t.unknown}`,
    `${t.date}: ${displayDate}`,
    "",
    `${t.ignoreTitle} ${t.ignore} hello@karbonn.fr`,
    "",
    `© 2025 - ${year} Karbonn. ${t.automatic}`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="${escapeHtml(lang in COPY ? lang : "fr")}">
  <head><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#eae9e4;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eae9e4;padding:28px 12px;font-family:Helvetica,Arial,sans-serif;color:#111;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;width:100%;table-layout:fixed;background:#0C04FF;border-radius:25px;overflow:hidden;">
          <tr><td style="background:#0C04FF;padding:26px 34px 34px;border-radius:25px 25px 0 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td><img src="cid:${LOGO_NAME}" alt="Karbonn" width="32" height="40" style="display:block;border:0;width:32px;height:40px;"></td>
              <td align="right" valign="top"><span style="display:inline-block;border:1px solid #a3a0ff;border-radius:30px;padding:6px 12px;color:#f7f6f2;font:10px Menlo,Consolas,monospace;letter-spacing:1px;">${escapeHtml(t.badge)}</span></td>
            </tr></table>
            <p style="margin:33px 0 9px;color:#c9c7ff;font:10px Menlo,Consolas,monospace;letter-spacing:1px;">${escapeHtml(t.eyebrow)}</p>
            <h1 style="margin:0;color:#fff;font:800 36px/1.03 Helvetica,Arial,sans-serif;letter-spacing:-1.5px;">${t.title}</h1>
          </td></tr>
          <tr><td style="background:#f7f6f2;border-radius:25px;padding:32px 34px 28px;">
            <h2 style="margin:0 0 10px;font:700 17px Helvetica,Arial,sans-serif;">${escapeHtml(greeting)}</h2>
            <p style="margin:0 0 22px;color:#55554f;font:13px/1.55 Helvetica,Arial,sans-serif;">${escapeHtml(t.intro)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#cdf2ff;border-radius:18px;"><tr><td style="padding:18px 14px 14px;">
              <p style="margin:0 0 12px;color:#51626a;font:9px Menlo,Consolas,monospace;letter-spacing:1px;">${escapeHtml(t.codeLabel)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${digits}</tr></table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:14px;"><tr>
                <td style="color:#27343a;font:9px Menlo,Consolas,monospace;"><span style="color:#ff9500;">■</span> ${escapeHtml(t.expires)}</td>
                <td align="right" style="color:#51626a;font:9px Menlo,Consolas,monospace;">${escapeHtml(t.private)}</td>
              </tr></table>
            </td></tr></table>
            <p style="margin:27px 0 9px;color:#0C04FF;font:10px Menlo,Consolas,monospace;letter-spacing:1px;">${escapeHtml(t.details)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${detailRow(t.reason, reasonText)}
              ${detailRow(t.device, deviceLabel)}
              ${detailRow(t.place, location || t.unknown)}
              ${detailRow(t.date, displayDate)}
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 25px;"><tr>
              <td><p style="margin:0;font-size:14px;line-height:1.55;opacity:.75;font-family:Helvetica,Arial,sans-serif;color:#55554f;"><strong style="font-weight:700;color:#111;">${escapeHtml(t.ignoreTitle)}</strong> ${escapeHtml(t.ignore)} <a href="mailto:hello@karbonn.fr" style="color:#0C04FF;font-weight:600;text-decoration:underline;text-underline-offset:3px">hello@karbonn.fr</a>.</p></td>
            </tr></table>
            <p style="margin:0;padding-top:18px;border-top:1px solid #deded9;color:#777772;font:9px/1.7 Menlo,Consolas,monospace;">© 2025 - ${year} Karbonn.<br>${escapeHtml(t.automatic)}</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;

  return { subject: t.subject, text, html };
}

export async function approximateLocation(ip, country, lang, fetchImpl = fetch) {
  const locale = LOCALES[lang] ?? "fr-FR";
  const countryName = /^[A-Z]{2}$/.test(country || "")
    ? new Intl.DisplayNames([locale], { type: "region" }).of(country)
    : "";
  if (!ip || !/^[\da-f:.]+$/i.test(ip)) return countryName;

  try {
    const response = await fetchImpl(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: AbortSignal.timeout(1200) });
    if (!response.ok) return countryName;
    const geo = await response.json();
    if (!geo.success || (country && geo.country_code !== country)) return countryName;
    const place = [geo.city, countryName || geo.country].filter((value) => typeof value === "string" && value.length < 100);
    return place.join(", ") || countryName;
  } catch {
    return countryName;
  }
}

export function createMailgunSender(env = process.env, fetchImpl = fetch) {
  const { MAILGUN_API_KEY, MAILGUN_DOMAIN, MAILGUN_FROM, MAILGUN_REGION } = env;
  const base = String(MAILGUN_REGION).toLowerCase() === "eu" ? "https://api.eu.mailgun.net" : "https://api.mailgun.net";

  return async function sendCodeEmail({ to, code, reason, lang, deviceLabel, name, location, country, sentAt }) {
    if (!MAILGUN_API_KEY || !MAILGUN_DOMAIN || !MAILGUN_FROM) throw new Error("Mailgun is not configured");

    const { subject, text, html } = renderCodeEmail({ code, reason, lang, deviceLabel, name, location, country, sentAt });
    const body = new FormData();
    for (const [key, value] of Object.entries({ from: MAILGUN_FROM, to, subject, text, html, "o:tag": "login-otp", "o:tracking": "no" })) {
      body.append(key, value);
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
