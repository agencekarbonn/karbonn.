/*
 * quote-request : reçoit la demande de devis de l'assistant Services,
 * envoie le devis résumé à l'agence puis un accusé de réception au client.
 * Aucune donnée n'est stockée.
 */
import { readRequest } from "./brief.js";
import { createMailgunSender, renderAckEmail, renderAgencyEmail } from "./email.js";
import { createSummarizer } from "./summary.js";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/* Limite simple par adresse IP (mémoire de l'instance) contre l'envoi en rafale */
export function createRateLimiter({ max = MAX_PER_WINDOW, windowMs = WINDOW_MS, now = Date.now } = {}) {
  const hits = new Map();
  return function allow(key) {
    if (!key) return true;
    const time = now();
    const recent = (hits.get(key) ?? []).filter((at) => time - at < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return false;
    }
    hits.set(key, [...recent, time]);
    if (hits.size > 5000) hits.delete(hits.keys().next().value);
    return true;
  };
}

export function createHandler({ sendMail, summarize, agencyEmail = "hello@karbonn.fr", allow = () => true, now = () => new Date() }) {
  return async function handle(payload, { ip } = {}) {
    const request = readRequest(payload);
    if (request.error) return [{ status: "error", code: request.error }, 400];
    // Robot : on répond comme si tout allait bien, sans rien envoyer.
    if (request.trap) return [{ status: "ok" }, 200];
    if (!allow(ip)) return [{ status: "error", code: "rate_limited" }, 429];

    const sentAt = now();
    const summary = await summarize(request);
    try {
      await sendMail({ to: agencyEmail, replyTo: request.email, tag: "quote-request", ...renderAgencyEmail({ ...request, summary, sentAt }) });
    } catch {
      return [{ status: "error", code: "send_failed" }, 502];
    }
    let ack = true;
    try {
      await sendMail({ to: request.email, replyTo: agencyEmail, tag: "quote-ack", ...renderAckEmail({ ...request, replyTo: agencyEmail, sentAt }) });
    } catch {
      ack = false;
    }
    return [{ status: "ok", ack }, 200];
  };
}

const allow = createRateLimiter();

export default async ({ req, res, error }) => {
  if (req.method !== "POST") return res.json({ status: "error", code: "method_not_allowed" }, 405);
  let payload = {};
  try {
    payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.bodyJson ?? req.body ?? {};
  } catch {
    return res.json({ status: "error", code: "invalid_input" }, 400);
  }
  const handle = createHandler({
    sendMail: createMailgunSender(),
    summarize: createSummarizer({ apiKey: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || undefined }),
    agencyEmail: process.env.QUOTE_TO || "hello@karbonn.fr",
    allow,
  });
  const ip = String(req.headers?.["x-forwarded-for"] ?? "").split(",")[0].trim();
  const [body, status] = await handle(payload, { ip });
  if (body.code === "send_failed") error("Mailgun send failed for quote request");
  return res.json(body, status);
};
