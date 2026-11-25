/* CTA « Discutons » : encre blanche simulée (fluide GPU, Three.js) injectée par le pointeur. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js";

const SIM_HEIGHT = 40;
const DYE_HEIGHT = 160;
const PRESSURE_ITERATIONS = 18;
const IDLE_STOP = 1600;

const baseVertex = /* glsl */ `
  uniform vec2 texelSize;
  varying vec2 vUv, vL, vR, vT, vB;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const head = "precision highp float;\nvarying vec2 vUv, vL, vR, vT, vB;\n";

const shaders = {
  splat: `${head}
    uniform sampler2D uTarget;
    uniform float aspect;
    uniform vec3 color;
    uniform vec2 point;
    uniform float radius;
    void main() {
      vec2 p = vUv - point;
      p.x *= aspect;
      gl_FragColor = vec4(texture2D(uTarget, vUv).xyz + exp(-dot(p, p) / radius) * color, 1.0);
    }`,
  advect: `${head}
    uniform sampler2D uVelocity, uSource;
    uniform vec2 velTexel;
    uniform float dt, dissipation;
    void main() {
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * velTexel;
      gl_FragColor = texture2D(uSource, coord) / (1.0 + dissipation * dt);
    }`,
  curl: `${head}
    uniform sampler2D uVelocity;
    void main() {
      float c = texture2D(uVelocity, vR).y - texture2D(uVelocity, vL).y - texture2D(uVelocity, vT).x + texture2D(uVelocity, vB).x;
      gl_FragColor = vec4(0.5 * c, 0.0, 0.0, 1.0);
    }`,
  vorticity: `${head}
    uniform sampler2D uVelocity, uCurl;
    uniform float curl, dt;
    void main() {
      float L = texture2D(uCurl, vL).x, R = texture2D(uCurl, vR).x, T = texture2D(uCurl, vT).x, B = texture2D(uCurl, vB).x;
      float C = texture2D(uCurl, vUv).x;
      vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
      force = force / (length(force) + 0.0001) * curl * C;
      force.y *= -1.0;
      vec2 vel = texture2D(uVelocity, vUv).xy + force * dt;
      gl_FragColor = vec4(clamp(vel, -1000.0, 1000.0), 0.0, 1.0);
    }`,
  divergence: `${head}
    uniform sampler2D uVelocity;
    void main() {
      vec2 C = texture2D(uVelocity, vUv).xy;
      float L = vL.x < 0.0 ? -C.x : texture2D(uVelocity, vL).x;
      float R = vR.x > 1.0 ? -C.x : texture2D(uVelocity, vR).x;
      float T = vT.y > 1.0 ? -C.y : texture2D(uVelocity, vT).y;
      float B = vB.y < 0.0 ? -C.y : texture2D(uVelocity, vB).y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }`,
  scale: `${head}
    uniform sampler2D uTexture;
    uniform float value;
    void main() { gl_FragColor = value * texture2D(uTexture, vUv); }`,
  pressure: `${head}
    uniform sampler2D uPressure, uDivergence;
    void main() {
      float p = texture2D(uPressure, vL).x + texture2D(uPressure, vR).x + texture2D(uPressure, vT).x + texture2D(uPressure, vB).x;
      gl_FragColor = vec4((p - texture2D(uDivergence, vUv).x) * 0.25, 0.0, 0.0, 1.0);
    }`,
  gradient: `${head}
    uniform sampler2D uPressure, uVelocity;
    void main() {
      vec2 g = vec2(texture2D(uPressure, vR).x - texture2D(uPressure, vL).x, texture2D(uPressure, vT).x - texture2D(uPressure, vB).x);
      gl_FragColor = vec4(texture2D(uVelocity, vUv).xy - g, 0.0, 1.0);
    }`,
  display: `${head}
    uniform sampler2D uDye, uText;
    uniform vec3 uRed, uWhite, uInk, uWaveInk;
    uniform vec2 uRes;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      float d = texture2D(uDye, vUv).r;
      float m = smoothstep(0.14, 0.52, d);
      // Bord de l'encre : léger voile rouge plus profond et grain, pour un rendu « matière ».
      float rim = smoothstep(0.02, 0.14, d) * (1.0 - m);
      vec3 bg = mix(uRed, uWhite, m) * (1.0 - 0.1 * rim);
      bg += (hash(vUv * uRes) - 0.5) * 0.04 * m * (1.0 - m) * 4.0;
      float text = texture2D(uText, vUv).a;
      gl_FragColor = vec4(mix(bg, mix(uInk, uWaveInk, m), text), 1.0);
    }`,
};

export function initCtaWave(buttons) {
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const hover = matchMedia("(hover: hover) and (pointer: fine)");
  if (motion.matches || !hover.matches || !buttons.length) return;

  const canvas = document.createElement("canvas");
  canvas.className = "nav__cta-wave";
  canvas.setAttribute("aria-hidden", "true");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "low-power" });
  } catch {
    return;
  }
  renderer.autoClear = false;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  scene.add(quad);

  const materials = Object.fromEntries(Object.entries(shaders).map(([name, fragmentShader]) => [name, new THREE.ShaderMaterial({
    vertexShader: baseVertex,
    fragmentShader,
    uniforms: {
      texelSize: { value: new THREE.Vector2() },
      velTexel: { value: new THREE.Vector2() },
      uTarget: { value: null }, uVelocity: { value: null }, uSource: { value: null }, uCurl: { value: null },
      uTexture: { value: null }, uPressure: { value: null }, uDivergence: { value: null }, uDye: { value: null }, uText: { value: null },
      aspect: { value: 1 }, color: { value: new THREE.Vector3() }, point: { value: new THREE.Vector2() }, radius: { value: 0.01 },
      dt: { value: 0.016 }, dissipation: { value: 1 }, curl: { value: 30 }, value: { value: 0.8 },
      uRed: { value: new THREE.Color() }, uWhite: { value: new THREE.Color(1, 1, 1) }, uRes: { value: new THREE.Vector2() },
      uInk: { value: new THREE.Color() }, uWaveInk: { value: new THREE.Color() },
    },
    depthTest: false,
    depthWrite: false,
  })]));

  const textCanvas = document.createElement("canvas");
  const textTexture = new THREE.CanvasTexture(textCanvas);
  textTexture.minFilter = THREE.LinearFilter;
  textTexture.generateMipmaps = false;

  const target = (w, h) => new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType, format: THREE.RGBAFormat, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false,
    wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping,
  });
  const double = (w, h) => {
    const fbo = { read: target(w, h), write: target(w, h), swap() { [this.read, this.write] = [this.write, this.read]; } };
    return fbo;
  };

  let fbos = null;
  let simSize = new THREE.Vector2();
  let dyeSize = new THREE.Vector2();

  function allocate(aspect) {
    const sw = Math.max(8, Math.round(SIM_HEIGHT * aspect));
    const dw = Math.max(16, Math.round(DYE_HEIGHT * aspect));
    if (fbos && simSize.x === sw && dyeSize.x === dw) return;
    if (fbos) Object.values(fbos).forEach((f) => (f.read ? [f.read, f.write] : [f]).forEach((t) => t.dispose()));
    simSize.set(sw, SIM_HEIGHT);
    dyeSize.set(dw, DYE_HEIGHT);
    fbos = {
      velocity: double(sw, SIM_HEIGHT),
      pressure: double(sw, SIM_HEIGHT),
      dye: double(dw, DYE_HEIGHT),
      divergence: target(sw, SIM_HEIGHT),
      curl: target(sw, SIM_HEIGHT),
    };
  }

  function pass(name, output, set = {}) {
    const material = materials[name];
    for (const [key, value] of Object.entries(set)) {
      const uniform = material.uniforms[key];
      if (value?.isVector2 || value?.isVector3) uniform.value.copy(value);
      else uniform.value = value;
    }
    quad.material = material;
    renderer.setRenderTarget(output);
    renderer.render(scene, camera);
  }

  const simTexel = () => new THREE.Vector2(1 / simSize.x, 1 / simSize.y);
  const dyeTexel = () => new THREE.Vector2(1 / dyeSize.x, 1 / dyeSize.y);

  function clearAll() {
    for (const f of [fbos.velocity, fbos.pressure, fbos.dye]) {
      for (const t of [f.read, f.write]) {
        renderer.setRenderTarget(t);
        renderer.setClearColor(0x000000, 1);
        renderer.clear();
      }
    }
  }

  let aspect = 1;
  let curlStrength = 30;

  function splat(x, y, dx, dy, amount, radius) {
    pass("splat", fbos.velocity.write, { texelSize: simTexel(), uTarget: fbos.velocity.read.texture, aspect, point: new THREE.Vector2(x, y), color: new THREE.Vector3(dx, dy, 0), radius });
    fbos.velocity.swap();
    pass("splat", fbos.dye.write, { texelSize: dyeTexel(), uTarget: fbos.dye.read.texture, aspect, point: new THREE.Vector2(x, y), color: new THREE.Vector3(amount, 0, 0), radius });
    fbos.dye.swap();
  }

  function step(dt) {
    const st = simTexel();
    pass("curl", fbos.curl, { texelSize: st, uVelocity: fbos.velocity.read.texture });
    pass("vorticity", fbos.velocity.write, { texelSize: st, uVelocity: fbos.velocity.read.texture, uCurl: fbos.curl.texture, curl: curlStrength, dt });
    fbos.velocity.swap();
    pass("divergence", fbos.divergence, { texelSize: st, uVelocity: fbos.velocity.read.texture });
    pass("scale", fbos.pressure.write, { texelSize: st, uTexture: fbos.pressure.read.texture, value: 0.8 });
    fbos.pressure.swap();
    for (let i = 0; i < PRESSURE_ITERATIONS; i++) {
      pass("pressure", fbos.pressure.write, { texelSize: st, uPressure: fbos.pressure.read.texture, uDivergence: fbos.divergence.texture });
      fbos.pressure.swap();
    }
    pass("gradient", fbos.velocity.write, { texelSize: st, uPressure: fbos.pressure.read.texture, uVelocity: fbos.velocity.read.texture });
    fbos.velocity.swap();
    pass("advect", fbos.velocity.write, { texelSize: st, velTexel: st, uVelocity: fbos.velocity.read.texture, uSource: fbos.velocity.read.texture, dt, dissipation: 0.9 });
    fbos.velocity.swap();
    pass("advect", fbos.dye.write, { texelSize: dyeTexel(), velTexel: st, uVelocity: fbos.velocity.read.texture, uSource: fbos.dye.read.texture, dt, dissipation: 2.6 });
    fbos.dye.swap();
  }

  function paintText(button, rect, dpr) {
    const label = button.querySelector(".nav__cta-text");
    const style = getComputedStyle(label);
    const box = label.getBoundingClientRect();
    textCanvas.width = Math.round(rect.width * dpr);
    textCanvas.height = Math.round(rect.height * dpr);
    const ctx = textCanvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    if ("letterSpacing" in ctx) ctx.letterSpacing = style.letterSpacing;
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    const text = label.textContent.trim();
    const metrics = ctx.measureText(text);
    const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * 0.8;
    const descent = metrics.fontBoundingBoxDescent ?? parseFloat(style.fontSize) * 0.2;
    ctx.fillText(text, box.left - rect.left, box.top - rect.top + (box.height - ascent - descent) / 2 + ascent);
    textTexture.needsUpdate = true;
  }

  let active = null;
  let rect = null;
  let frame = 0;
  let lastFrame = 0;
  let lastInput = 0;
  let pointer = null;
  let globalMove = null;
  let speed = 0;

  // Vitesse du pointeur sur tout le document : l'élan à l'entrée du bouton règle la puissance de la première giclée.
  window.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    const now = performance.now();
    if (globalMove && now - globalMove.time < 120) {
      const instant = Math.hypot(event.clientX - globalMove.x, event.clientY - globalMove.y) / Math.max(1, now - globalMove.time);
      speed = speed * 0.4 + instant * 0.6;
    } else speed = 0;
    globalMove = { x: event.clientX, y: event.clientY, time: now };
  }, { passive: true, capture: true });

  const rotate = (x, y, angle) => [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];

  function inject(clientX, clientY, dxPx, dyPx) {
    const x = (clientX - rect.left) / rect.width;
    const y = 1 - (clientY - rect.top) / rect.height;
    const power = Math.min(1, Math.max(0.15, (speed - 0.1) / 2.2));
    const [dx, dy] = rotate(dxPx / rect.width * aspect, -dyPx / rect.height, (Math.random() - 0.5) * 0.6);
    const force = 2600 + 4200 * power;
    const radius = (0.012 + 0.03 * power) * (0.75 + Math.random() * 0.5);
    splat(x, y, dx * force, dy * force, 0.55 + 0.6 * power, radius);
    // Gouttes satellites aléatoires : la forme ne se répète jamais.
    if (Math.random() < 0.18 + 0.35 * power) {
      const ox = x + (Math.random() - 0.5) * 0.35 / aspect;
      const oy = y + (Math.random() - 0.5) * 0.5;
      splat(ox, oy, dx * force * 0.6, dy * force * 0.6, 0.35 + 0.4 * power, radius * (0.3 + Math.random() * 0.4));
    }
    lastInput = performance.now();
  }

  let fadeTimer = 0;

  // Fondu enchaîné : le canvas s'efface pendant que le libellé HTML réapparaît (même couleur).
  function stop(fade = false) {
    cancelAnimationFrame(frame);
    frame = 0;
    clearTimeout(fadeTimer);
    active?.classList.remove("is-waving");
    active = null;
    if (!fade) return canvas.remove();
    canvas.classList.add("is-fading");
    fadeTimer = setTimeout(() => canvas.remove(), 450);
  }

  function loop(now) {
    const dt = Math.min(Math.max((now - lastFrame) / 1000, 1 / 120), 1 / 30);
    lastFrame = now;
    step(dt);
    pass("display", null, { texelSize: dyeTexel(), uDye: fbos.dye.read.texture, uText: textTexture });
    if (now - lastInput > IDLE_STOP) return stop(true);
    frame = requestAnimationFrame(loop);
  }

  function activate(button) {
    if (active === button) return;
    stop();
    rect = button.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    aspect = rect.width / rect.height;
    allocate(aspect);
    clearAll();
    renderer.setPixelRatio(dpr);
    renderer.setSize(rect.width, rect.height, false);
    const display = materials.display.uniforms;
    display.uRed.value.setStyle(getComputedStyle(button).backgroundColor, THREE.LinearSRGBColorSpace);
    display.uInk.value.setStyle(getComputedStyle(button.querySelector(".nav__cta-text")).color, THREE.LinearSRGBColorSpace);
    display.uWaveInk.value.setStyle(getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#0C04FF", THREE.LinearSRGBColorSpace);
    materials.display.uniforms.uRes.value.set(rect.width * dpr, rect.height * dpr);
    paintText(button, rect, dpr);
    curlStrength = 18 + Math.random() * 26;
    active = button;
    canvas.classList.remove("is-fading");
    button.prepend(canvas);
    button.classList.add("is-waving");
    lastFrame = performance.now();
    frame = requestAnimationFrame(loop);
  }

  buttons.forEach((button) => {
    button.classList.add("has-wave");
    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType !== "mouse" || motion.matches) return;
      activate(button);
      // Première giclée : direction et force de l'arrivée de la souris.
      const from = globalMove && performance.now() - globalMove.time < 120 ? globalMove : null;
      const dx = from ? event.clientX - from.x : rect.width / 2 - (event.clientX - rect.left);
      const dy = from ? event.clientY - from.y : rect.height / 2 - (event.clientY - rect.top);
      const len = Math.hypot(dx, dy) || 1;
      const reach = 18 + Math.min(speed, 3) * 14;
      inject(event.clientX, event.clientY, dx / len * reach, dy / len * reach);
      pointer = { x: event.clientX, y: event.clientY };
    });
    button.addEventListener("pointermove", (event) => {
      if (event.pointerType !== "mouse" || active !== button) return;
      if (pointer) {
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (Math.abs(dx) + Math.abs(dy) > 0.5) inject(event.clientX, event.clientY, dx, dy);
      }
      pointer = { x: event.clientX, y: event.clientY };
    });
    button.addEventListener("pointerleave", () => {
      pointer = null;
    });
  });

  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    stop();
    buttons.forEach((button) => button.classList.remove("has-wave"));
  });

  window.addEventListener("resize", () => active && stop());
}
