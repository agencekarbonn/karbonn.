import assert from "node:assert/strict";
import { it } from "node:test";
import { OPTIONS, SCALE, TIMELINE, BUDGETS } from "../services-engine.js";
import { SERVICES_I18N } from "../services-i18n.js";

it("chaque langue a exactement les mêmes clés que le français", () => {
  const reference = Object.keys(SERVICES_I18N.fr).sort();
  for (const [lang, strings] of Object.entries(SERVICES_I18N)) {
    assert.deepEqual(Object.keys(strings).sort(), reference, lang);
  }
  assert.deepEqual(Object.keys(SERVICES_I18N).sort(), ["de", "en", "es", "fr", "it", "pt", "zh"]);
});

it("chaque question et chaque option du moteur a un libellé", () => {
  const fields = { ...OPTIONS, scale: Object.keys(SCALE), timeline: Object.keys(TIMELINE), budget: Object.keys(BUDGETS) };
  for (const [field, values] of Object.entries(fields)) {
    assert.ok(SERVICES_I18N.fr[`svcQ_${field}`], `svcQ_${field}`);
    for (const value of values) assert.ok(SERVICES_I18N.fr[`svcO_${field}_${value}`], `svcO_${field}_${value}`);
  }
});
