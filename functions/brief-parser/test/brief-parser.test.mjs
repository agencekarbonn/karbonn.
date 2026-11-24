import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { BUDGETS, OPTIONS, SCALE, SERVICE_IDS, TIMELINE } from "../../../services-engine.js";
import { ENUMS, createHandler, sanitizeBrief } from "../src/main.js";

const geminiReply = (json, status = 200) => async (url, init) => {
  geminiReply.last = { url, init: { ...init, body: JSON.parse(init.body) } };
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(json) }] } }] }), { status });
};

describe("brief-parser", () => {
  it("reste synchronisé avec le moteur du site", () => {
    assert.deepEqual(ENUMS.services, SERVICE_IDS);
    assert.deepEqual(ENUMS.options, OPTIONS);
    assert.deepEqual(ENUMS.scale, Object.keys(SCALE));
    assert.deepEqual(ENUMS.timeline, Object.keys(TIMELINE));
    assert.deepEqual(ENUMS.budget, Object.keys(BUDGETS));
  });

  it("renvoie un brief nettoyé et n'envoie jamais la clé ailleurs que dans l'en-tête", async () => {
    const handle = createHandler({
      apiKey: "test-key",
      fetchImpl: geminiReply({ services: ["web", "ai", "rocket"], options: { web: "ecommerce", ai: "teleport" }, budget: "5000-10000", reply: "Une boutique <b>et</b> un assistant." }),
    });
    const [body, status] = await handle({ text: "Une boutique avec un chatbot", lang: "fr" });
    assert.equal(status, 200);
    assert.deepEqual(body.brief.services, ["web", "ai"]);
    assert.deepEqual(body.brief.options, { web: "ecommerce" });
    assert.equal(body.brief.budget, "5000-10000");
    assert.equal(body.brief.reply, "Une boutique  b et /b  un assistant.".replace(/\s+/g, " "));
    assert.equal(geminiReply.last.init.headers["x-goog-api-key"], "test-key");
    assert.ok(!geminiReply.last.url.includes("test-key"));
    assert.equal(geminiReply.last.init.body.generationConfig.responseMimeType, "application/json");
  });

  it("refuse les entrées vides ou trop longues", async () => {
    const handle = createHandler({ apiKey: "k", fetchImpl: geminiReply({ services: [] }) });
    assert.equal((await handle({ text: " " }))[1], 400);
    assert.equal((await handle({ text: "a".repeat(501) }))[1], 400);
  });

  it("signale l'absence de configuration et les quotas épuisés", async () => {
    assert.deepEqual((await createHandler({ apiKey: "" })({ text: "Un site" }))[0].code, "not_configured");
    const quota = createHandler({ apiKey: "k", fetchImpl: geminiReply({}, 429) });
    assert.deepEqual(await quota({ text: "Un site" }), [{ status: "error", code: "quota" }, 502]);
  });

  it("tolère une sortie illisible", async () => {
    const handle = createHandler({ apiKey: "k", fetchImpl: async () => new Response("{\"candidates\":[]}") });
    assert.equal((await handle({ text: "Un site" }))[0].code, "upstream");
    assert.deepEqual(sanitizeBrief("nope"), { services: [], options: {}, scale: undefined, timeline: undefined, budget: undefined, outOfScope: false, reply: undefined });
  });
});
