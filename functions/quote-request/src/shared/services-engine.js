/*
 * Moteur de l'assistant de la page Services.
 * Entièrement déterministe : c'est lui seul qui pose les questions et calcule
 * les prix. L'IA (facultative) ne fait qu'extraire un brief depuis du texte libre.
 * Grille tarifaire PROVISOIRE, en euros HT, à ajuster.
 */

export const SERVICES = [
  { id: "web", tier: "main" },
  { id: "ai", tier: "main" },
  { id: "hosting", tier: "main" },
  { id: "uiux", tier: "main" },
  { id: "branding", tier: "secondary" },
  { id: "seo", tier: "secondary" },
];

export const SERVICE_IDS = SERVICES.map((service) => service.id);

/* once = forfait, monthly = récurrent, weeks = délai de réalisation */
export const PRICING = {
  web: {
    vitrine: { once: [2500, 5000], weeks: [3, 5] },
    ecommerce: { once: [6000, 12000], weeks: [6, 10] },
    platform: { once: [15000, 40000], weeks: [12, 24] },
  },
  ai: {
    assistant: { once: [3000, 7000], weeks: [3, 6] },
    automation: { once: [2000, 6000], weeks: [2, 5] },
    custom: { once: [10000, 30000], weeks: [8, 16] },
  },
  hosting: {
    essential: { monthly: [29, 49], weeks: [0, 1] },
    managed: { monthly: [90, 190], weeks: [0, 1] },
    critical: { monthly: [350, 700], weeks: [1, 2] },
  },
  uiux: {
    landing: { once: [1500, 3000], weeks: [2, 3] },
    site: { once: [3500, 7000], weeks: [3, 6] },
    product: { once: [7000, 15000], weeks: [6, 10] },
  },
  branding: {
    logo: { once: [1200, 2500], weeks: [2, 3] },
    full: { once: [4000, 9000], weeks: [4, 7] },
  },
  seo: {
    audit: { once: [800, 1500], weeks: [1, 2] },
    monthly: { once: [600, 1200], monthly: [450, 1200], weeks: [2, 3] },
  },
};

export const SCALED = ["web", "ai", "uiux"];
export const SCALE = { small: { price: .75, weeks: .8 }, medium: { price: 1, weeks: 1 }, large: { price: 1.6, weeks: 1.4 } };
export const TIMELINE = { urgent: { price: 1.25, maxWeeks: 5 }, standard: { price: 1, maxWeeks: Infinity }, flexible: { price: 1, maxWeeks: Infinity } };
export const BUDGETS = { "lt500": 500, "500-2000": 2000, "2000-5000": 5000, "5000-10000": 10000, "10000-20000": 20000, "gt20000": Infinity, unknown: null };
export const PACK_DISCOUNT = .92;
/* Le budget indiqué borne le bas de la fourchette : aucun dépassement toléré. */
const BUDGET_TOLERANCE = 1;

export const OPTIONS = Object.fromEntries(SERVICE_IDS.map((id) => [id, Object.keys(PRICING[id])]));

export function createBrief() {
  return { services: [], options: {}, scale: null, timeline: null, budget: null, outOfScope: false };
}

const clone = (brief) => ({ ...brief, services: [...brief.services], options: { ...brief.options } });

/* File de questions : uniquement ce qui manque encore au brief */
export function questions(brief) {
  const list = [{ id: "services", multi: true, options: SERVICE_IDS }];
  for (const id of SERVICE_IDS) {
    if (brief.services.includes(id)) list.push({ id: `option:${id}`, service: id, options: OPTIONS[id] });
  }
  if (brief.services.some((id) => SCALED.includes(id))) list.push({ id: "scale", options: Object.keys(SCALE) });
  if (brief.services.some((id) => PRICING[id][brief.options[id]]?.once)) list.push({ id: "timeline", options: Object.keys(TIMELINE) });
  list.push({ id: "budget", options: Object.keys(BUDGETS) });
  return list;
}

export function isAnswered(brief, question) {
  if (question.id === "services") return brief.services.length > 0;
  if (question.service) return Boolean(brief.options[question.service]);
  return brief[question.id] != null;
}

export function nextQuestion(brief) {
  if (brief.outOfScope) return null;
  return questions(brief).find((question) => !isAnswered(brief, question)) ?? null;
}

export function progress(brief) {
  const list = questions(brief);
  return { done: list.filter((question) => isAnswered(brief, question)).length, total: list.length };
}

export function answer(brief, question, value) {
  const next = clone(brief);
  if (question.id === "services") {
    next.services = SERVICE_IDS.filter((id) => [].concat(value).includes(id));
    for (const id of Object.keys(next.options)) if (!next.services.includes(id)) delete next.options[id];
  } else if (question.service) {
    if (OPTIONS[question.service].includes(value)) next.options[question.service] = value;
  } else if (question.options.includes(value)) {
    next[question.id] = value;
  }
  return next;
}

/* Fusionne un brief partiel (parseur local ou IA) en ignorant tout ce qui est invalide */
export function mergeBrief(brief, partial = {}) {
  const next = clone(brief);
  const services = [].concat(partial.services ?? []).filter((id) => SERVICE_IDS.includes(id));
  next.services = SERVICE_IDS.filter((id) => next.services.includes(id) || services.includes(id));
  for (const [id, value] of Object.entries(partial.options ?? {})) {
    if (OPTIONS[id]?.includes(value)) {
      next.options[id] = value;
      if (!next.services.includes(id)) next.services = SERVICE_IDS.filter((s) => next.services.includes(s) || s === id);
    }
  }
  if (partial.scale in SCALE) next.scale = partial.scale;
  if (partial.timeline in TIMELINE) next.timeline = partial.timeline;
  if (partial.budget in BUDGETS) next.budget = partial.budget;
  if (partial.outOfScope === true) next.outOfScope = true;
  return next;
}

const roundTo = (value, step) => Math.round(value / step) * step;
const roundOnce = (value) => roundTo(value, value >= 1000 ? 100 : 50);
const roundMonthly = (value) => (value >= 100 ? roundTo(value, 10) : Math.round(value));

function compute(brief, pick = (id) => brief.options[id], scaleKey = brief.scale, timelineKey = brief.timeline) {
  const items = brief.services.map((id) => ({ id, ...PRICING[id][pick(id)] })).filter((item) => item.weeks);
  const scale = SCALE[scaleKey] ?? SCALE.medium;
  const timeline = TIMELINE[timelineKey] ?? TIMELINE.standard;
  const once = [0, 0];
  const monthly = [0, 0];
  const weeks = [[], []];

  for (const item of items) {
    const scaled = SCALED.includes(item.id);
    const price = (scaled ? scale.price : 1) * timeline.price;
    const time = scaled ? scale.weeks : 1;
    if (item.once) item.once.forEach((value, i) => { once[i] += value * price; });
    if (item.monthly) item.monthly.forEach((value, i) => { monthly[i] += value; });
    item.weeks.forEach((value, i) => weeks[i].push(value * time));
  }

  if (items.filter((item) => item.once).length >= 2) once.forEach((_, i) => { once[i] *= PACK_DISCOUNT; });

  // Les chantiers avancent en parallèle : le plus long donne le rythme.
  const span = (list) => (list.length ? Math.max(...list) + .35 * (list.reduce((a, b) => a + b, 0) - Math.max(...list)) : 0);
  return {
    low: roundOnce(once[0]),
    high: roundOnce(once[1]),
    monthlyLow: roundMonthly(monthly[0]),
    monthlyHigh: roundMonthly(monthly[1]),
    weeksLow: Math.max(1, Math.round(span(weeks[0]))),
    weeksHigh: Math.max(1, Math.ceil(span(weeks[1]))),
  };
}

export function estimate(brief) {
  const result = { ...compute(brief), feasible: true, reasons: [], alternative: null };
  if (brief.outOfScope) return { ...result, feasible: false, reasons: ["scope"] };

  const timeline = TIMELINE[brief.timeline] ?? TIMELINE.standard;
  if (result.low > 0 && result.weeksLow > timeline.maxWeeks) result.reasons.push("timeline");

  const budget = BUDGETS[brief.budget];
  const cost = result.low || result.monthlyLow;
  if (budget != null && cost > budget / BUDGET_TOLERANCE) result.reasons.push("budget");

  if (!result.reasons.length) return result;
  result.feasible = false;
  const fits = (option) => budget == null || (option.low || option.monthlyLow) <= budget / BUDGET_TOLERANCE;
  // Alternative : le même projet sans urgence, sinon sa version essentielle.
  const relaxed = compute(brief, undefined, brief.scale, "standard");
  const essential = compute(brief, (id) => OPTIONS[id][0], "small", "standard");
  if (!result.reasons.includes("budget")) result.alternative = { kind: "relaxed", ...relaxed };
  else if (fits(relaxed) && brief.timeline === "urgent") result.alternative = { kind: "relaxed", ...relaxed };
  else if (fits(essential)) result.alternative = { kind: "essential", ...essential };
  return result;
}

/* Correspondance avec la modale de devis existante */
export function quotePrefill(brief, result) {
  const kind = brief.options;
  const projectType = kind.web === "ecommerce" ? "ecommerce"
    : kind.web === "platform" || kind.ai === "custom" || kind.uiux === "product" ? "app"
      : kind.web === "vitrine" ? "website"
        : brief.services.length === 1 && brief.services[0] === "branding" ? "branding"
          : "other";
  let budget = brief.budget && brief.budget !== "unknown" ? brief.budget : null;
  if (!budget) {
    const middle = (result.low + result.high) / 2 || result.monthlyHigh * 12;
    budget = Object.entries(BUDGETS).find(([, max]) => max != null && middle <= max)?.[0] ?? "gt20000";
  }
  return { projectType, budget };
}

/* Parseur local multilingue (repli gratuit, sans réseau) */
const KEYWORDS = [
  ["outOfScope", true, /\b(ios|android|app(lication)? (mobile|native|smartphone|iphone)|mobile app|native app|appli(cation)? (iphone|android)|jeu vid[ée]o|video ?games?|videojuego|videogioco|videogame|blockchain|nft|crypto(monnaie)?|hardware|mat[ée]riel [ée]lectronique|手机应用|游戏)\b|手机应用|游戏|苹果应用/i],
  ["web:ecommerce", "", /e-?commerce|e-?shop|boutique|\bshop|tienda|loja|negozio|vend(re|s|ons)? (en ligne|mes|nos)|vente en ligne|sell(ing)? online|online-?shop|panier|paiement en ligne|click.?(and|&|et).?collect|shopify|woocommerce|prestashop|商城|电商|网店/i],
  ["web:platform", "", /plateforme|platform|plataforma|piattaforma|saas|marketplace|portail|portal|espace (client|membre)s?|extranet|intranet|dashboard|tableau de bord|back.?office|application web|appli(cation)? web|web ?app|r[ée]servation|booking|prise de rendez.?vous|abonnement|membres|annuaire|forum|r[ée]seau social|social network|\bcrm\b|\berp\b|logiciel|software|outil interne|internal tool|平台|预约/i],
  ["web:vitrine", "", /portfolio|portefeuille|\bbook\b|cv en ligne|online (cv|resume)|curriculum|site (vitrine|web|internet|perso(nnel)?|pro(fessionnel)?|institutionnel)|personal (site|website)|blog|landing|one.?page|page de pr[ée]sentation|pr[ée]sence en ligne|online presence|website|webseite|homepage|sitio web|p[áa]gina web|sito( web)?|site institucional|作品集|个人网站|博客|官网/i],
  ["web:vitrine", "", /\bsites?\b|\bweb\b|internet|网站/i],
  ["ai:assistant", "", /chat ?bot|assistant|agent (ia|ai|ki|conversationnel)|asistente|assistente|\bgpt\b|openai|mistral|claude|répond(re|e) (aux|à mes) clients|聊天机器人|助手/i],
  ["ai:automation", "", /automati|automazion|workflow|zapier|make\.com|\bn8n\b|relier (mes|nos) outils|gagner du temps|t[âa]ches r[ée]p[ée]titives|自动化/i],
  ["ai:custom", "", /mod[eè]le (ia|sur mesure)|machine learning|deep learning|\bml\b|\bllm\b|\brag\b|vision|pr[ée]dicti|predicti|data science|人工智能模型/i],
  ["ai", "", /\b(ia|ai|ki)\b|intelligence artificielle|artificial intelligence|künstliche intelligenz|inteligencia artificial|intelig[êe]ncia artificial|intelligenza artificiale|人工智能/i],
  ["hosting:critical", "", /haute disponibilit|high availability|hochverfügbar|alta disponibilidad|alta disponibilidade|alta disponibilit|24\/7|高可用/i],
  ["hosting:managed", "", /infog[ée]r|maintenance|managed|wartung|manutenzione|manuten[çc][ãa]o|mises? [àa] jour|运维/i],
  ["hosting", "", /h[ée]berge(ment|ur|r)|hosting|serveur|server|\bvps\b|cloud|nom de domaine|domain name|adresse mail pro|alojamiento|hospedagem|服务器|托管|域名/i],
  ["uiux:product", "", /ux.{0,12}(app|produit|product)|design (produit|d'app|de produit)|product design|parcours utilisateur|user flow|产品设计/i],
  ["uiux", "", /\bui\b|\bux\b|maquette|mockup|wireframe|prototype|figma|design d'interface|interface|webdesign|web design|ergonomi|refonte|redesign|界面|设计稿/i],
  ["branding:logo", "", /\blogo(type)?s?\b|标志/i],
  ["branding:full", "", /identit[ée] (visuelle|de marque|graphique)|charte graphique|brand(ing| identity)|corporate identity|identidad (visual|corporativa)|identidade visual|identit[àa] visiva|univers de marque|\bnaming\b|nom de marque|品牌/i],
  ["branding", "", /\bmarque\b|\bbrand\b|graphis|flyer|carte de visite|business card|affiche|packaging/i],
  ["seo:monthly", "", /seo.{0,20}(mensuel|monthly|suivi|accompagnement|mensual|mensile|monatlich)|r[ée]f[ée]rencement.{0,20}(mensuel|suivi|r[ée]gulier)/i],
  ["seo", "", /\bseo\b|r[ée]f[ée]rencement|visibilit[ée]|visible sur google|premier sur google|first on google|be found|[êe]tre trouv[ée]|posicionamiento|posicionamento|posizionamento|sichtbarkeit|搜索引擎/i],
  ["scale:large", "", /\b(grand|large|[ée]norme|complexe?|complex|groß|grande|enterprise|ambitieux|ambitious)\b|multilingue|multilingual|plusieurs langues|beaucoup de pages|international|大型|复杂/i],
  ["scale:small", "", /\b([ée]tudiante?s?|student|estudiante|studente|studentin|perso(nnel)?|personal|simple|petite?s?|small|klein|piccol[oa]|pequeñ[oa]|pequen[oa]|basique|basic|minimal(iste)?|freelance|auto.?entrepreneur|ind[ée]pendante?)\b|one page|une page|petit budget|budget serr[ée]|low budget|pas cher|一页|简单|小型|学生/i],
  ["timeline:urgent", "", /urgent|asap|au plus vite|rapidement|\bvite\b|d[èe]s que possible|cette semaine|ce mois|this month|dringend|urgente|subito|ya mismo|o quanto antes|紧急|尽快/i],
  ["timeline:flexible", "", /pas press[ée]|flexible|no rush|sans urgence|keine eile|sin prisa|sem pressa|senza fretta|不急/i],
];

/* Tolérance aux fautes de frappe sur les mots-clés les plus courants */
const FUZZY = {
  portfolio: "web:vitrine", vitrine: "web:vitrine", website: "web:vitrine", blog: "web:vitrine",
  boutique: "web:ecommerce", ecommerce: "web:ecommerce",
  plateforme: "web:platform", platform: "web:platform", application: "web:platform", reservation: "web:platform",
  chatbot: "ai:assistant", assistant: "ai:assistant", automatisation: "ai:automation", automation: "ai:automation", intelligence: "ai",
  hebergement: "hosting", hosting: "hosting", maintenance: "hosting:managed",
  maquette: "uiux", interface: "uiux", design: "uiux",
  logo: "branding:logo", identite: "branding:full", branding: "branding:full",
  referencement: "seo", visibilite: "seo",
  etudiant: "scale:small", student: "scale:small",
};

const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

function distance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
}

function addKey(partial, key, value) {
  if (key === "outOfScope") { partial.outOfScope = value; return; }
  const [field, option] = key.split(":");
  if (field === "scale" || field === "timeline") { partial[field] ??= option; return; }
  if (!partial.services.includes(field)) partial.services.push(field);
  if (option) partial.options[field] ??= option;
}

export function parseLocal(text = "") {
  const partial = { services: [], options: {} };
  // Texte d'origine + version sans accents : « hebergement » est compris comme « hébergement ».
  const haystack = `${text} \n ${normalize(text)}`;
  for (const [key, value, pattern] of KEYWORDS) if (pattern.test(haystack)) addKey(partial, key, value);

  for (const word of normalize(text).match(/[a-z]{5,}/g) ?? []) {
    for (const [keyword, key] of Object.entries(FUZZY)) {
      const tolerance = keyword.length >= 9 ? 2 : 1;
      if (word !== keyword && distance(word, keyword) <= tolerance) addKey(partial, key, true);
    }
  }

  const amount = parseAmount(text);
  if (amount != null) partial.budget = Object.entries(BUDGETS).find(([, max]) => max != null && amount <= max)?.[0];
  return partial;
}

export const hasBrief = (partial) => Boolean(
  partial.services?.length || partial.outOfScope || partial.scale || partial.timeline || partial.budget,
);

/* Toute phrase reçoit une réponse : brief reconnu, conversation, ou proposition par défaut. */
const INTENTS = [
  ["price", /\b(prix|tarifs?|combien|co[uû]te?s?|devis|price|pricing|cost|how much|quote|preis|kosten|precio|cu[aá]nto|pre[cç]o|quanto|prezzo|costo)\b|价格|多少钱|报价/i],
  ["greeting", /^\s*(bonjour|bonsoir|salut|hello|hi|hey|coucou|yo|hallo|guten tag|hola|buenos d[ií]as|ol[aá]|bom dia|ciao|buongiorno|你好|您好)\b/i],
  ["thanks", /\b(merci|thanks?|thank you|danke|gracias|obrigad[oa]|grazie)\b|谢谢/i],
  ["help", /\b(aide|help|comment [çc]a marche|how does it work|qui [êe]tes.vous|who are you|que faites.vous|what do you do|hilfe|ayuda|ajuda|aiuto)\b|帮助|你们做什么/i],
];

export function interpretText(text = "") {
  const partial = parseLocal(text);
  if (hasBrief(partial)) return { intent: "brief", partial };
  const haystack = `${text} ${normalize(text)}`;
  const intent = INTENTS.find(([, pattern]) => pattern.test(haystack))?.[0];
  if (intent) return { intent, partial };
  // Une vraie phrase sans mot-clé connu : on propose le point de départ le plus courant.
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words >= 2 || /[\u4e00-\u9fff]{3,}/.test(text)) {
    return { intent: "guess", partial: { services: ["web"], options: { web: "vitrine" } } };
  }
  return { intent: "unknown", partial };
}

function parseAmount(text) {
  const compact = text.replace(/(\d)[\s\u202f\u00a0.](?=\d{3}\b)/g, "$1").replace(/\s+/g, " ");
  const match = compact.match(/(\d+(?:,\d+)?) ?(k|m|千|万)? ?(?:€|eur\b|euros?\b|\$|usd\b|元)|(?:€|\$) ?(\d+(?:,\d+)?) ?(k)?/i)
    ?? compact.match(/(?:budget|presupuesto|orçamento|预算)\D{0,15}(\d{3,}|\d+ ?k)/i)?.slice(0, 2).concat([undefined]);
  if (!match) return null;
  const raw = match[1] ?? match[3];
  const value = parseFloat(raw.replace(",", "."));
  const unit = (match[2] ?? match[4] ?? (/k$/i.test(raw) ? "k" : "")).toLowerCase();
  return value * ({ k: 1e3, m: 1e6, "千": 1e3, "万": 1e4 }[unit] ?? 1);
}
