if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);
document.documentElement.classList.add("is-intro-locked");

const nav = document.querySelector(".nav");
const bar = nav.querySelector(".nav__bar");
const brand = nav.querySelector(".nav__brand");
const main = nav.querySelector(".nav__main");
const ctaWrap = nav.querySelector(".nav__cta-wrap");
const toggle = nav.querySelector(".nav__toggle");
const sheet = nav.querySelector(".nav__sheet");
const indicator = nav.querySelector(".nav__indicator");
const links = nav.querySelectorAll("[data-link]");
const desktop = window.matchMedia("(min-width: 1024px)");

const COLLAPSE_AT = 24;
const EXPAND_AT = 4;
const AUTO_CLOSE_DISTANCE = 240;

const state = {
  top: window.scrollY < COLLAPSE_AT,
  open: false,
  openedAt: 0,
};

function measure() {
  const viewport = document.documentElement.clientWidth;
  const barWidth = bar.offsetWidth;
  const inset = toggle.offsetTop;
  let heroClip = 0;
  let heroShift = 0;

  if (desktop.matches) {
    heroClip = barWidth - (ctaWrap.offsetLeft + ctaWrap.offsetWidth) - inset;
    const visibleWidth = barWidth - heroClip;
    const barLeft = viewport - parseFloat(getComputedStyle(nav).right) - barWidth;
    heroShift = (viewport - visibleWidth) / 2 - barLeft;
  }

  nav.style.setProperty("--hero-clip", `${heroClip}px`);
  nav.style.setProperty("--hero-shift", `${heroShift}px`);
  nav.style.setProperty("--collapsed-clip", `${barWidth - toggle.offsetWidth - inset * 2}px`);
  moveIndicator(undefined, false);
}

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let indicatorAnimation;
let liquid;

function moveIndicator(target = nav.querySelector(".nav__link.is-active"), animate = true) {
  const x = target.offsetLeft;
  const width = target.offsetWidth;

  if (liquid) {
    liquid.moveTo(x, width, animate && !reducedMotion.matches);
    return;
  }


  const current = getComputedStyle(indicator);
  const fromX = parseFloat(current.translate) || 0;
  const fromWidth = parseFloat(current.width) || width;
  const fromScaleY = parseFloat(current.scale.split(" ")[1] ?? current.scale) || 1;

  indicatorAnimation?.cancel();
  indicator.style.setProperty("--indicator-x", `${x}px`);
  indicator.style.setProperty("--indicator-w", `${width}px`);

  const distance = Math.abs(x + width / 2 - (fromX + fromWidth / 2));
  if (!animate || reducedMotion.matches || distance < 1) return;

  const dropWidth = Math.min(width, fromWidth) * .42;
  const dropX = (fromX + fromWidth / 2 + x + width / 2) / 2 - dropWidth / 2;
  const direction = Math.sign(x - fromX);

  indicatorAnimation = indicator.animate(
    [
      { translate: `${fromX}px 0`, width: `${fromWidth}px`, scale: `1 ${fromScaleY}` },
      { offset: .45, translate: `${dropX}px 0`, width: `${dropWidth}px`, scale: "1 .62", easing: "cubic-bezier(.3, 0, .2, 1)" },
      { offset: .78, translate: `${x + direction * width * .015}px 0`, width: `${width * 1.03}px`, scale: "1 1.05" },
      { translate: `${x}px 0`, width: `${width}px`, scale: "1 1" },
    ],
    { duration: Math.min(380 + distance * .45, 640), easing: "cubic-bezier(.55, 0, .45, 1)" },
  );
}

const I18N = {
  en: { services: "Services", home: "Home", cases: "Case Studies", about: "About", cta: "Let's Talk", menu: "Menu", close: "Close", login: "Log in", hero1: "WE", hero2: "MAKE", hero3: "IMPACT.", ariaNav: "Main navigation", ariaLang: "Choose language", ariaLanguages: "Languages", brands: "Our collaborators have worked for", ariaHome: "Home" },
  fr: { services: "Services", home: "Accueil", cases: "Études de cas", about: "À propos", cta: "Discutons", menu: "Menu", close: "Fermer", login: "Se connecter", hero1: "NOUS", hero2: "CRÉONS", hero3: "L'IMPACT.", ariaNav: "Navigation principale", ariaLang: "Choisir la langue", ariaLanguages: "Langues", brands: "Nos collaborateurs ont travaillé pour", ariaHome: "Accueil" },
  de: { services: "Leistungen", home: "Startseite", cases: "Fallstudien", about: "Über uns", cta: "Sprechen wir", menu: "Menü", close: "Schließen", login: "Anmelden", hero1: "WIR", hero2: "MACHEN", hero3: "EINDRUCK.", ariaNav: "Hauptnavigation", ariaLang: "Sprache wählen", ariaLanguages: "Sprachen", brands: "Unsere Mitarbeiter haben gearbeitet für", ariaHome: "Startseite" },
  es: { services: "Servicios", home: "Inicio", cases: "Casos de éxito", about: "Nosotros", cta: "Hablemos", menu: "Menú", close: "Cerrar", login: "Iniciar sesión", hero1: "NOSOTROS", hero2: "CREAMOS", hero3: "IMPACTO.", ariaNav: "Navegación principal", ariaLang: "Elegir idioma", ariaLanguages: "Idiomas", brands: "Nuestros colaboradores han trabajado para", ariaHome: "Inicio" },
  pt: { services: "Serviços", home: "Início", cases: "Estudos de caso", about: "Sobre nós", cta: "Vamos conversar", menu: "Menu", close: "Fechar", login: "Iniciar sessão", hero1: "NÓS", hero2: "CRIAMOS", hero3: "IMPACTO.", ariaNav: "Navegação principal", ariaLang: "Escolher idioma", ariaLanguages: "Idiomas", brands: "Os nossos colaboradores trabalharam para", ariaHome: "Início" },
  it: { services: "Servizi", home: "Home", cases: "Casi di successo", about: "Chi siamo", cta: "Parliamone", menu: "Menu", close: "Chiudi", login: "Accedi", hero1: "NOI", hero2: "CREIAMO", hero3: "IMPATTO.", ariaNav: "Navigazione principale", ariaLang: "Scegli la lingua", ariaLanguages: "Lingue", brands: "I nostri collaboratori hanno lavorato per", ariaHome: "Home" },
  zh: { services: "服务", home: "首页", cases: "案例研究", about: "关于我们", cta: "联系我们", menu: "菜单", close: "关闭", login: "登录", hero1: "我们", hero2: "创造", hero3: "影响力。", ariaNav: "主导航", ariaLang: "选择语言", ariaLanguages: "语言", brands: "我们的员工曾服务于", ariaHome: "首页" },
};

let currentLang = "en";

function render() {
  const isDesktop = desktop.matches;
  const mode = state.top ? "hero" : isDesktop && state.open ? "expanded" : "collapsed";

  nav.dataset.mode = mode;
  nav.classList.toggle("is-open", state.open);
  toggle.setAttribute("aria-expanded", String(state.open));
  toggle.setAttribute("aria-label", state.open ? I18N[currentLang].close : I18N[currentLang].menu);
  toggle.setAttribute("aria-controls", isDesktop ? "nav-main" : "nav-sheet");

  brand.inert = mode === "collapsed";
  main.inert = !isDesktop || mode === "collapsed";
  toggle.inert = isDesktop && mode === "hero";
  sheet.inert = isDesktop || !state.open;
}

function setOpen(open) {
  if (state.open === open) return;
  state.open = open;
  state.openedAt = window.scrollY;
  render();
}

function refresh() {
  nav.classList.add("is-resizing");
  measure();
  render();
  updateFooterClamp();
  nav.getBoundingClientRect();
  requestAnimationFrame(() => nav.classList.remove("is-resizing"));
}

const footerBoundary = document.querySelector(".footer");
const headerControls = [document.querySelector(".lang"), document.querySelector(".login")];

function updateFooterClamp() {
  if (!footerBoundary) return;
  // The brush starts above the footer itself; stop fixed elements before it.
  const brushHeight = desktop.matches ? 62 : 42;
  const footerTop = footerBoundary.getBoundingClientRect().top;
  const boundary = footerTop - brushHeight;
  const atFooter = footerTop <= window.innerHeight;
  nav.classList.toggle("is-footer-hidden", atFooter);
  if (atFooter && state.open) setOpen(false);
  const headerBottom = Math.max(
    ...headerControls.map((el) => parseFloat(getComputedStyle(el).top) + el.offsetHeight),
    parseFloat(getComputedStyle(logo).top) + logo.offsetHeight,
  );
  const navBottom = parseFloat(getComputedStyle(nav).bottom);
  const headerShift = Math.min(0, boundary - headerBottom - 16);
  const navShift = Math.min(0, boundary - (window.innerHeight - navBottom) - 16);

  document.documentElement.style.setProperty("--footer-header-shift", `${headerShift}px`);
  nav.style.setProperty("--footer-nav-shift", `${navShift}px`);
}

let ticking = false;
window.addEventListener("scroll", () => {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    ticking = false;
    updateFooterClamp();
    const y = window.scrollY;
    const top = state.top ? y < COLLAPSE_AT : y <= EXPAND_AT;

    if (top !== state.top) {
      state.top = top;
      state.open = false;
      render();
    } else if (state.open && Math.abs(y - state.openedAt) > AUTO_CLOSE_DISTANCE) {
      setOpen(false);
    }
  });
}, { passive: true });

toggle.addEventListener("click", () => setOpen(!state.open));

const linksGroup = nav.querySelector(".nav__links");
const barLinks = nav.querySelectorAll(".nav__link");

barLinks.forEach((link) => {
  link.addEventListener("pointerenter", () => moveIndicator(link));
});
linksGroup.addEventListener("pointerleave", () => moveIndicator());

links.forEach((link) => {
  link.addEventListener("click", () => {
    links.forEach((item) => {
      const active = item.dataset.link === link.dataset.link;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    moveIndicator();
    if (state.open) setTimeout(() => setOpen(false), 320);
    const href = link.dataset.href;
    if (href && link.dataset.link !== document.body.dataset.page) {
      if (window.karbonnLoader?.leave) {
        window.karbonnLoader.leave(href, link.textContent.trim());
        return;
      }
      document.documentElement.classList.add("is-leaving-page");
      setTimeout(() => location.assign(href), reducedMotion.matches ? 0 : 420);
    }
  });
});

window.addEventListener("pageshow", (event) => {
  if (event.persisted) document.documentElement.classList.remove("is-leaving-page");
});

document.addEventListener("pointerdown", (event) => {
  if (state.open && !event.target.closest(".nav, .talk, .quote")) setOpen(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || !state.open) return;
  setOpen(false);
  toggle.focus();
});

desktop.addEventListener("change", () => {
  state.open = false;
  refresh();
});

new ResizeObserver(refresh).observe(bar);
window.addEventListener("resize", refresh);

const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
Promise.race([fontsReady, new Promise((resolve) => setTimeout(resolve, 1200))]).then(() => {
  refresh();
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add("is-ready")));
});

/* Sélecteur de langue */
const lang = document.querySelector(".lang");
const langButton = lang.querySelector(".lang__button");
const langCurrent = lang.querySelector(".lang__current");
const langOptions = [...lang.querySelectorAll("[data-lang]")];
const SUPPORTED_LANGS = langOptions.map((option) => option.dataset.lang);

const LANG_BY_COUNTRY = {
  en: ["GB", "US", "AU", "IE", "NZ", "CA", "ZA", "IN"],
  fr: ["FR", "BE", "LU", "MC", "CI", "SN", "ML", "MA", "DZ", "TN"],
  de: ["DE", "AT", "CH", "LI"],
  es: ["ES", "MX", "AR", "CO", "CL", "PE", "VE", "EC", "GT", "CU", "DO", "BO", "PY", "UY", "SV", "HN", "NI", "CR", "PA", "PR"],
  pt: ["PT", "BR", "AO", "MZ", "CV"],
  it: ["IT", "SM", "VA"],
  zh: ["CN", "HK", "TW", "SG", "MO"],
};

function browserLang() {
  const code = (navigator.language || "").slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(code) ? code : "en";
}

function langFromCountry(country) {
  for (const [code, countries] of Object.entries(LANG_BY_COUNTRY)) {
    if (countries.includes(country)) return code;
  }
  return null;
}

async function detectLangByLocation() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch("https://ipwho.is/", { signal: controller.signal });
    const data = await response.json();
    if (data.success && !userPicked) {
      const saved = localStorage.getItem("lang");
      applyLang(
        langFromCountry(data.country_code)
        ?? (SUPPORTED_LANGS.includes(saved) ? saved : browserLang()),
      );
    }
  } catch {
    /* repli : langue navigateur déjà appliquée */
  } finally {
    clearTimeout(timeout);
  }
}

function applyLang(code) {
  currentLang = code;
  const t = I18N[code];
  langCurrent.textContent = code.toUpperCase();
  langOptions.forEach((option) => option.setAttribute("aria-selected", String(option.dataset.lang === code)));
  document.documentElement.lang = code;

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    if (t[el.dataset.i18n]) el.textContent = t[el.dataset.i18n];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    if (t[el.dataset.i18nPlaceholder]) el.placeholder = t[el.dataset.i18nPlaceholder];
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    if (t[el.dataset.i18nAria]) el.setAttribute("aria-label", t[el.dataset.i18nAria]);
  });
  langButton.setAttribute("aria-label", t.ariaLang);
  lang.querySelector(".lang__menu").setAttribute("aria-label", t.ariaLanguages);
  bar.setAttribute("aria-label", t.ariaNav);
  document.getElementById("accueil")?.setAttribute("aria-label", t.ariaHome);
  render();
  measure();
  document.dispatchEvent(new CustomEvent("langchange", { detail: code }));
}

function setLangMenu(open) {
  lang.classList.toggle("is-open", open);
  langButton.setAttribute("aria-expanded", String(open));
}

let userPicked = false;
const savedLang = localStorage.getItem("lang");
applyLang(SUPPORTED_LANGS.includes(savedLang) ? savedLang : browserLang());
detectLangByLocation();

langButton.addEventListener("click", () => setLangMenu(!lang.classList.contains("is-open")));

langOptions.forEach((option) => {
  option.addEventListener("click", () => {
    userPicked = true;
    applyLang(option.dataset.lang);
    localStorage.setItem("lang", option.dataset.lang);
    setLangMenu(false);
  });
});

document.addEventListener("pointerdown", (event) => {
  if (!lang.contains(event.target)) setLangMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lang.classList.contains("is-open")) {
    setLangMenu(false);
    langButton.focus();
  }
});

/* Intro : le hero se replie sur le logo en haut de page */
const hero = document.querySelector(".site-hero");
const logo = document.querySelector(".site-logo");
const brands = document.querySelector(".brands");

updateFooterClamp();

// L'intro démarre quand l'écran de chargement s'ouvre sur la page.
const pageReady = window.karbonnLoader?.ready ?? Promise.resolve();

if (!hero) document.documentElement.classList.remove("is-intro-locked");
else pageReady.then(() => setTimeout(() => {
  if (reducedMotion.matches) {
    hero.classList.add("is-intro-done");
    brands.classList.add("is-visible");
    updateFooterClamp();
    document.documentElement.classList.remove("is-intro-locked");
    return;
  }
  hero.classList.add("is-leaving");

  const flip = (addClass, duration) => {
    const before = logo.getBoundingClientRect();
    hero.classList.add(addClass);
    const after = logo.getBoundingClientRect();
    const dx = before.left - after.left;
    const dy = before.top - after.top;
    const scale = before.height / after.height;
    return logo.animate(
      [{ transform: `translate(${dx}px, ${dy}px) scale(${scale})`, transformOrigin: "top left" }, { transform: "none" }],
      { duration, easing: "cubic-bezier(.22, 1, .36, 1)" },
    ).finished;
  };

  setTimeout(() => {
    flip("is-centered", 800);
    setTimeout(() => {
      brands.classList.add("is-visible");
      const unlockScroll = () => {
        document.documentElement.classList.remove("is-intro-locked");
      };
      flip("is-intro-done", 800).then(unlockScroll, unlockScroll);
      updateFooterClamp();
    }, 1450);
  }, 620);
}, 2000));

import("./liquid-indicator.js")
  .then(({ createLiquidIndicator }) => {
    const accent = getComputedStyle(nav).getPropertyValue("--accent").trim();
    liquid = createLiquidIndicator(linksGroup, accent);
    if (!liquid) return;
    indicatorAnimation?.cancel();
    linksGroup.classList.add("has-liquid");
    moveIndicator(linksGroup.querySelector(".nav__link:hover") ?? undefined, false);
  })
  .catch(() => {});
