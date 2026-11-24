import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { readRequest } from "../src/brief.js";
import { renderAckEmail, renderAgencyEmail } from "../src/email.js";
import { createHandler, createRateLimiter } from "../src/main.js";
import { createSummarizer, localSummary } from "../src/summary.js";

const BRIEF = { services: ["web"], options: { web: "vitrine" }, scale: "small", timeline: "flexible", budget: "500-2000" };
const valid = (extra = {}) => ({ email: "Client@Example.fr", phone: "", lang: "fr", brief: BRIEF, notes: ["Création d'un portfolio étudiant"], ...extra });

function setup(overrides = {}) {
  const sent = [];
  const handle = createHandler({
    sendMail: async (mail) => { sent.push(mail); },
    summarize: async (request) => ({ text: localSummary(request), ai: false }),
    now: () => new Date("2026-03-10T10:00:00Z"),
    ...overrides,
  });
  return { sent, handle };
}

describe("code partagé", () => {
  it("utilise exactement le moteur et les traductions du site", () => {
    for (const file of ["services-engine.js", "services-i18n.js"]) {
      assert.equal(
        readFileSync(new URL(`../src/shared/${file}`, import.meta.url), "utf8"),
        readFileSync(new URL(`../../../${file}`, import.meta.url), "utf8"),
        file,
      );
    }
  });
});

describe("validation", () => {
  it("refuse un email ou un téléphone invalide et un brief vide", () => {
    assert.equal(readRequest(valid({ email: "pas-un-email" })).error, "invalid_email");
    assert.equal(readRequest(valid({ phone: "appelez-moi" })).error, "invalid_phone");
    assert.equal(readRequest(valid({ brief: { services: ["inconnu"] } })).error, "invalid_brief");
  });

  it("recalcule l'estimation côté serveur et ignore les valeurs inventées", () => {
    const request = readRequest(valid({ brief: { ...BRIEF, low: 1, options: { web: "vitrine", hack: "x" } } }));
    assert.equal(request.email, "client@example.fr");
    assert.deepEqual(request.brief.options, { web: "vitrine" });
    assert.ok(request.result.low > 1000);
  });

  it("nettoie les messages libres", () => {
    const request = readRequest(valid({ notes: ["a\u0000b", 3, "x".repeat(900), "", "c", "d", "e", "f"] }));
    assert.equal(request.notes.length, 5);
    assert.ok(request.notes.every((note) => note.length <= 500 && !/\u0000/.test(note)));
  });
});

describe("envoi", () => {
  it("envoie le devis à l'agence puis l'accusé de réception au client", async () => {
    const { sent, handle } = setup();
    const [body, status] = await handle(valid({ phone: "+33 6 12 34 56 78" }), { ip: "1.2.3.4" });
    assert.equal(status, 200);
    assert.deepEqual(body, { status: "ok", ack: true });
    assert.equal(sent.length, 2);
    assert.equal(sent[0].to, "hello@karbonn.fr");
    assert.equal(sent[0].replyTo, "client@example.fr");
    assert.match(sent[0].html, /Site vitrine/);
    assert.match(sent[0].html, /\+33 6 12 34 56 78/);
    assert.match(sent[0].html, /portfolio étudiant/);
    assert.equal(sent[1].to, "client@example.fr");
    assert.equal(sent[1].replyTo, "hello@karbonn.fr");
    assert.equal(sent[1].subject, "Nous avons bien reçu votre demande de devis");
  });

  it("écrit l'accusé de réception dans la langue du visiteur", async () => {
    const { sent, handle } = setup();
    await handle(valid({ lang: "es" }));
    assert.equal(sent[1].subject, "Hemos recibido su solicitud de presupuesto");
    assert.match(sent[1].html, /Web corporativa/);
    assert.match(sent[0].subject, /^Nouvelle demande de devis/);
  });

  it("ne renvoie rien aux robots (champ piège rempli)", async () => {
    const { sent, handle } = setup();
    const [body] = await handle(valid({ company: "spam" }));
    assert.equal(body.status, "ok");
    assert.equal(sent.length, 0);
  });

  it("signale l'échec si l'email à l'agence ne part pas", async () => {
    const { handle } = setup({ sendMail: async () => { throw new Error("down"); } });
    const [body, status] = await handle(valid());
    assert.equal(status, 502);
    assert.equal(body.code, "send_failed");
  });

  it("limite les envois en rafale par IP", () => {
    const allow = createRateLimiter({ max: 2, windowMs: 1000, now: () => 0 });
    assert.equal(allow("ip"), true);
    assert.equal(allow("ip"), true);
    assert.equal(allow("ip"), false);
    assert.equal(allow("autre"), true);
  });
});

describe("résumé", () => {
  it("se replie sur un résumé local sans clé ou si l'IA échoue", async () => {
    const request = readRequest(valid());
    assert.equal((await createSummarizer({})(request)).ai, false);
    const failing = createSummarizer({ apiKey: "k", fetchImpl: async () => ({ ok: false, status: 429 }) });
    const summary = await failing(request);
    assert.equal(summary.ai, false);
    assert.match(summary.text, /Site vitrine/);
  });

  it("utilise le texte de l'IA quand il est disponible, nettoyé", async () => {
    const text = "Le client souhaite un portfolio étudiant <script>, simple et sans urgence. Proposer un site vitrine compact.";
    const summarize = createSummarizer({
      apiKey: "k",
      fetchImpl: async () => ({ ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) }),
    });
    const summary = await summarize(readRequest(valid()));
    assert.equal(summary.ai, true);
    assert.doesNotMatch(summary.text, /<script>/);
  });
});

describe("gabarits", () => {
  it("échappe le contenu saisi par le client", () => {
    const request = readRequest(valid({ notes: ["<img src=x onerror=alert(1)>"] }));
    const { html } = renderAgencyEmail({ ...request, summary: { text: "<b>x</b>", ai: true } });
    assert.doesNotMatch(html, /<img src=x/);
    assert.doesNotMatch(html, /<b>x<\/b>/);
    assert.match(html, /RÉSUMÉ RÉDIGÉ PAR IA/);
  });

  it("n'affiche pas d'estimation pour un projet hors périmètre", () => {
    const request = readRequest(valid({ brief: { services: [], outOfScope: true } }));
    const { html } = renderAckEmail({ ...request, replyTo: "hello@karbonn.fr" });
    assert.doesNotMatch(html, /ESTIMATION INDICATIVE/);
  });
});
