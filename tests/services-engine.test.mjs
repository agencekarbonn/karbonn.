import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  answer, createBrief, estimate, interpretText, mergeBrief, nextQuestion, parseLocal, progress, quotePrefill,
} from "../services-engine.js";

const fill = (brief, answers) => {
  let current = brief;
  for (const value of answers) current = answer(current, nextQuestion(current), value);
  return current;
};

describe("parcours guidé", () => {
  it("commence par le choix des services puis ne pose que les questions utiles", () => {
    let brief = createBrief();
    assert.equal(nextQuestion(brief).id, "services");
    brief = answer(brief, nextQuestion(brief), ["branding"]);
    assert.equal(nextQuestion(brief).id, "option:branding");
    brief = fill(brief, ["logo", "standard"]);
    assert.equal(nextQuestion(brief).id, "budget");
    brief = fill(brief, ["2000-5000"]);
    assert.equal(nextQuestion(brief), null);
    assert.deepEqual(progress(brief), { done: 4, total: 4 });
  });

  it("calcule une fourchette avec remise pack et délais parallélisés", () => {
    const brief = fill(createBrief(), [["web", "branding"], "vitrine", "logo", "medium", "standard", "gt20000"]);
    const result = estimate(brief);
    assert.equal(result.low, Math.round(((2500 + 1200) * .92) / 100) * 100);
    assert.equal(result.high, Math.round(((5000 + 2500) * .92) / 100) * 100);
    assert.equal(result.feasible, true);
    assert.ok(result.weeksLow >= 3 && result.weeksHigh <= 8);
  });

  it("sépare le récurrent (hébergement) du forfait", () => {
    const brief = fill(createBrief(), [["hosting"], "managed", "unknown"]);
    const result = estimate(brief);
    assert.deepEqual([result.low, result.monthlyLow, result.monthlyHigh], [0, 90, 190]);
    assert.equal(result.feasible, true);
  });
});

describe("faisabilité", () => {
  it("refuse un budget trop faible et propose une version essentielle", () => {
    const brief = fill(createBrief(), [["web"], "ecommerce", "large", "standard", "2000-5000"]);
    const result = estimate(brief);
    assert.equal(result.feasible, false);
    assert.deepEqual(result.reasons, ["budget"]);
    assert.equal(result.alternative.kind, "essential");
    assert.ok(result.alternative.low <= 5000);
  });

  it("signale un budget dépassé dès que le bas de la fourchette excède le maximum", () => {
    const brief = fill(createBrief(), [["web"], "ecommerce", "medium", "standard", "2000-5000"]);
    const result = estimate(brief);
    assert.equal(result.low, 6000);
    assert.equal(result.feasible, false);
    assert.deepEqual(result.reasons, ["budget"]);
  });

  it("signale un délai intenable et propose le même projet sans urgence", () => {
    const brief = fill(createBrief(), [["web"], "platform", "medium", "urgent", "gt20000"]);
    const result = estimate(brief);
    assert.deepEqual(result.reasons, ["timeline"]);
    assert.equal(result.alternative.kind, "relaxed");
    assert.ok(result.alternative.low < result.low);
  });

  it("arrête le parcours pour un projet hors périmètre", () => {
    const brief = mergeBrief(createBrief(), parseLocal("Je veux une application iOS native"));
    assert.equal(nextQuestion(brief), null);
    assert.deepEqual(estimate(brief).reasons, ["scope"]);
  });
});

describe("texte libre", () => {
  it("extrait services, options, urgence et budget en français", () => {
    const partial = parseLocal("Une boutique en ligne avec un chatbot, budget 8 000 €, c'est urgent");
    assert.deepEqual(partial.services, ["web", "ai"]);
    assert.deepEqual(partial.options, { web: "ecommerce", ai: "assistant" });
    assert.equal(partial.timeline, "urgent");
    assert.equal(partial.budget, "5000-10000");
  });

  it("comprend d'autres langues et les montants abrégés", () => {
    assert.deepEqual(parseLocal("We need a SaaS platform and SEO, around 25k€").options, { web: "platform" });
    assert.equal(parseLocal("Brauche ein Logo, Budget 1500").budget, "500-2000");
    assert.equal(parseLocal("我需要一个电商网站，预算 5万元").options.web, "ecommerce");
  });

  it("ignore les valeurs invalides venant de l'IA", () => {
    const brief = mergeBrief(createBrief(), { services: ["web", "hack"], options: { web: "space", ai: "assistant" }, budget: "free" });
    assert.deepEqual(brief.services, ["web", "ai"]);
    assert.deepEqual(brief.options, { ai: "assistant" });
    assert.equal(brief.budget, null);
  });
});

describe("toute phrase reçoit une réponse", () => {
  it("comprend un portfolio étudiant, même mal orthographié et sans accents", () => {
    for (const text of ["Création d'un portfolio étudiant", "creation d un portefolio etudiant"]) {
      const { intent, partial } = interpretText(text);
      assert.equal(intent, "brief");
      assert.deepEqual(partial.options, { web: "vitrine" });
      assert.equal(partial.scale, "small");
    }
  });

  it("reconnaît des formulations courantes", () => {
    assert.equal(interpretText("je veux vendre mes bougies").partial.options.web, "ecommerce");
    assert.equal(interpretText("plateforme de réservation pour mon salon").partial.options.web, "platform");
    assert.ok(interpretText("être visible sur Google").partial.services.includes("seo"));
  });

  it("répond à la conversation sans modifier le brief", () => {
    assert.equal(interpretText("Bonjour").intent, "greeting");
    assert.equal(interpretText("combien ça coûte ?").intent, "price");
    assert.equal(interpretText("merci").intent, "thanks");
    assert.equal(interpretText("xyz").intent, "unknown");
  });

  it("propose un site vitrine pour une phrase sans mot-clé connu", () => {
    assert.deepEqual(interpretText("un truc cool pour mon resto"), { intent: "guess", partial: { services: ["web"], options: { web: "vitrine" } } });
  });
});

describe("modale de devis", () => {
  it("préremplit le type de projet et le budget", () => {
    const brief = fill(createBrief(), [["web"], "ecommerce", "medium", "flexible", "unknown"]);
    assert.deepEqual(quotePrefill(brief, estimate(brief)), { projectType: "ecommerce", budget: "5000-10000" });
  });
});
