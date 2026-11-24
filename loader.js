/*
 * Écran de chargement et transitions entre les pages.
 * - Chargement : les rubans de verre se déroulent au rythme du compteur,
 *   puis la caméra plonge à travers le verre pendant qu'un iris ouvre la page.
 * - Changement de page : navigation immédiate ; la page d'arrivée s'affiche
 *   directement sous l'écran de chargement (même forme de rubans, mot de la page),
 *   et n'est révélée qu'une fois prête.
 */
const html = document.documentElement;
const api = window.karbonnLoader;
const root = document.querySelector(".loader");
const KEY = "karbonn:transition";
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const easeInOutCubic = (x) => (x < .5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const easeInQuart = (x) => x ** 4;
const easeOutCubic = (x) => 1 - (1 - x) ** 3;

if (api && root) {
  clearTimeout(api.failsafe);
  const canvas = root.querySelector(".loader__canvas");
  const numEl = root.querySelector(".loader__num");
  const barEl = root.querySelector(".loader__bar");
  const mode = html.classList.contains("is-transition-in") ? "transition" : "loading";

  let saved = null;
  try {
    saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    sessionStorage.removeItem(KEY);
  } catch { /* navigation privée : pas de continuité */ }

  const seed = saved?.seed ?? ((Math.random() * 2 ** 31) | 0);
  const word = (label) => (label && label.length <= 16 ? label : "Karbonn");
  let currentWord = word(saved?.word);
  let clock = saved?.time ?? Math.random() * 40;
  let speed = 1;
  let scene = null;
  let glState = "pending";
  let running = false;
  let last = performance.now();
  let tween = null;
  let leaving = false;
  let progress = 0;
  const started = performance.now();
  // Arrivée depuis une autre page : chargement plus court, la visite est déjà engagée.
  const MIN_DURATION = mode === "transition" ? 1700 : 2600;
  const pointer = { x: saved?.px ?? 0, y: saved?.py ?? 0 };

  const diag = () => Math.hypot(innerWidth, innerHeight) / 2 + 60;
  const setHole = (radius) => html.style.setProperty("--hole", `${radius.toFixed(1)}px`);

  let windowLoaded = document.readyState === "complete";
  window.addEventListener("load", () => { windowLoaded = true; }, { once: true });
  let fontsLoaded = !document.fonts;
  document.fonts?.ready.then(() => { fontsLoaded = true; });
  setTimeout(() => { fontsLoaded = true; windowLoaded = true; }, 5000);

  const finish = () => {
    running = false;
    html.classList.remove("is-loader-exit", "is-loading-in", "is-transition-in");
    html.classList.add("is-loader-done");
    api.resolve();
  };

  /* Animation pilotée par la boucle de rendu (une seule horloge pour tout) */
  function animate(duration, step) {
    return new Promise((resolve) => {
      tween = { start: performance.now(), duration, step, resolve };
    });
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(.05, (now - last) / 1000);
    last = now;
    // L'horloge ne tourne qu'avec la scène : la pose reprise d'une page à l'autre reste identique.
    if (scene) clock += dt * speed;

    if (tween) {
      const k = clamp01((now - tween.start) / tween.duration);
      tween.step(k, dt);
      if (k === 1) {
        const { resolve } = tween;
        tween = null;
        resolve();
      }
    } else if (!html.classList.contains("is-loader-exit")) {
      updateProgress(now, dt);
    }

    if (scene) {
      scene.state.pointerX += (pointer.x - scene.state.pointerX) * Math.min(1, dt * 2.5);
      scene.state.pointerY += (pointer.y - scene.state.pointerY) * Math.min(1, dt * 2.5);
      scene.render(clock);
    }
    if (running) requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(loop);
  }

  /* Compteur : jamais plus vite que la durée minimale, jamais 100 avant que tout soit prêt */
  function updateProgress(now, dt) {
    const ready = [windowLoaded, fontsLoaded, glState !== "pending"].filter(Boolean).length / 3;
    const timed = clamp01((now - started) / MIN_DURATION);
    const target = Math.min(timed * timed * (3 - 2 * timed), ready === 1 ? 1 : .92);
    progress = Math.max(progress, progress + (target - progress) * Math.min(1, dt * 5));
    if (target === 1 && 1 - progress < .004) progress = 1;
    numEl.textContent = String(Math.round(progress * 100));
    barEl.style.transform = `scaleX(${progress})`;
    if (scene) scene.state.reveal = easeOutCubic(clamp01(progress * 1.15));
    if (progress === 1) reveal();
  }

  /* Sortie : accélération, plongée dans le verre, ouverture de l'iris */
  async function reveal() {
    if (html.classList.contains("is-loader-exit")) return;
    html.classList.add("is-loader-exit");
    if (!scene) {
      await animate(900, (k) => setHole(diag() * easeInOutCubic(k)));
      return finish();
    }
    const duration = 1550;
    let released = false;
    await animate(duration, (k, dt) => {
      speed = 1 + 6 * easeInQuart(k);
      scene.state.spin += dt * 2.4 * k;
      scene.state.dive = easeInQuart(clamp01(k / .92));
      const open = clamp01((k - .3) / .7);
      setHole(diag() * easeInOutCubic(open));
      html.style.setProperty("--ring", String(open > 0 && open < 1 ? 1 - open * .8 : 0));
      if (!released && open > .15) {
        released = true;
        api.resolve();
      }
    });
    speed = 1;
    finish();
  }

  /* Départ vers une autre page : navigation immédiate. Rien n'est joué ici :
     c'est la page d'arrivée qui ouvre sur l'écran de chargement, avant tout affichage. */
  function leave(href, label) {
    if (leaving) return;
    leaving = true;
    try {
      const state = scene?.state;
      sessionStorage.setItem(KEY, JSON.stringify({ seed, time: clock, word: word(label), spin: state?.spin ?? 0, px: pointer.x, py: pointer.y }));
    } catch { /* navigation privée : la page s'ouvrira quand même */ }
    location.assign(href);
  }

  api.leave = leave;

  // Retour arrière depuis le cache du navigateur : la page doit être découverte.
  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    leaving = false;
    tween = null;
    finish();
  });

  // Liens internes (connexion, retour à l'accueil…) : même transition que la navigation.
  document.addEventListener("click", (event) => {
    const link = event.target.closest?.("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download")) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || !/(\.html|\/)$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.hash) return;
    event.preventDefault();
    leave(url.href, link.dataset.transition || link.textContent.trim() || link.getAttribute("aria-label"));
  });

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX / innerWidth - .5;
    pointer.y = event.clientY / innerHeight - .5;
  }, { passive: true });

  if (reduced) {
    finish();
  } else {
    setHole(-1);
    start();
    const low = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency ?? 8) <= 4;
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 6000));
    Promise.race([
      import("./glass-ribbons.js").then(async ({ createGlassRibbons }) => {
        const created = createGlassRibbons(canvas, { seed, low, word: currentWord, paper: getComputedStyle(html).getPropertyValue("--paper").trim() || "#f7f6f2" });
        if (!created) throw new Error("webgl");
        created.state.reveal = 0;
        created.state.spin = saved?.spin ?? 0;
        created.state.pointerX = pointer.x;
        created.state.pointerY = pointer.y;
        await created.compile();
        return created;
      }),
      timeout,
    ]).then((created) => {
      scene = created;
      glState = "ready";
      // Première image rendue avant d'être montrée : elle se superpose exactement à la photo.
      scene.render(clock);
      requestAnimationFrame(() => canvas.classList.add("is-visible"));
    }).catch((error) => {
      console.warn("Écran de chargement sans WebGL :", error?.message);
      glState = "failed";
    });
  }
}
