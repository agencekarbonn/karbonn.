import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js";

const PAD_X = 12;
const PAD_Y = 8;
const HEAD = { stiffness: 300, damping: 25 };
const TAIL = { stiffness: 900, damping: 54 };
const MAX_GAP = .55;

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec2 uSize;
  uniform float uDpr;
  uniform vec4 uHead;
  uniform vec4 uTail;
  uniform float uGoo;
  uniform vec3 uColor;

  float sdPill(vec2 p, vec2 b) {
    float r = min(b.x, b.y);
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
  }

  void main() {
    vec2 p = vec2(gl_FragCoord.x, uSize.y * uDpr - gl_FragCoord.y) / uDpr;
    float d = smin(sdPill(p - uHead.xy, uHead.zw), sdPill(p - uTail.xy, uTail.zw), uGoo);
    float alpha = clamp(0.5 - d * uDpr, 0.0, 1.0);
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`;

export function createLiquidIndicator(track, color) {
  const canvas = document.createElement("canvas");
  canvas.className = "nav__liquid";
  canvas.setAttribute("aria-hidden", "true");

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "low-power" });
  } catch {
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  track.prepend(canvas);

  const uniforms = {
    uSize: { value: new THREE.Vector2() },
    uDpr: { value: 1 },
    uHead: { value: new THREE.Vector4() },
    uTail: { value: new THREE.Vector4() },
    uGoo: { value: .001 },
    uColor: { value: new THREE.Color().setStyle(color, THREE.LinearSRGBColorSpace) },
  };

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, blending: THREE.NoBlending, depthTest: false, depthWrite: false }),
  ));

  const target = { x: 0, w: 0 };
  const head = { x: 0, w: 0, vx: 0, vw: 0 };
  const tail = { x: 0, w: 0, vx: 0, vw: 0 };
  let height = 0;
  let frame = 0;
  let last = 0;

  function draw() {
    const half = height / 2;
    const cy = PAD_Y + half;
    const gap = Math.abs(head.x - tail.x) / Math.max(head.w * MAX_GAP, 1);
    const drop = Math.min(Math.abs(head.vx) / 2200, .36);
    const headH = half * (1 - drop);
    const tailH = headH * (1 - .35 * gap);
    const headW = Math.max(head.w / 2 * (1 - drop * .9), headH);
    const tailW = Math.max(tail.w / 2 * (1 - drop * .9) * (1 - .45 * gap), tailH);

    uniforms.uHead.value.set(PAD_X + head.x, cy, headW, headH);
    uniforms.uTail.value.set(PAD_X + tail.x, cy, tailW, tailH);
    uniforms.uGoo.value = Math.max(34 * Math.min(gap * 2, 1), .001);
    renderer.render(scene, camera);
  }

  function resize() {
    const width = track.offsetWidth + PAD_X * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    height = track.offsetHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height + PAD_Y * 2, false);
    uniforms.uSize.value.set(width, height + PAD_Y * 2);
    uniforms.uDpr.value = dpr;
    draw();
  }

  function integrate(body, spring, goal, dt) {
    body.vx += (spring.stiffness * (goal.x - body.x) - spring.damping * body.vx) * dt;
    body.vw += (spring.stiffness * (goal.w - body.w) - spring.damping * body.vw) * dt;
    body.x += body.vx * dt;
    body.w += body.vw * dt;
  }

  function step(dt) {
    integrate(head, HEAD, target, dt);
    integrate(tail, TAIL, head, dt);

    const maxGap = head.w * MAX_GAP;
    const gap = tail.x - head.x;
    if (Math.abs(gap) > maxGap) {
      tail.x = head.x + Math.sign(gap) * maxGap;
      tail.vx = head.vx;
    }
  }

  function isSettled(body) {
    return Math.abs(body.x - target.x) < .05 && Math.abs(body.w - target.w) < .05
      && Math.abs(body.vx) < .5 && Math.abs(body.vw) < .5;
  }

  function snap() {
    for (const body of [head, tail]) Object.assign(body, { x: target.x, w: target.w, vx: 0, vw: 0 });
  }

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    const steps = Math.max(1, Math.ceil(dt * 240));
    last = now;

    for (let i = 0; i < steps; i++) step(dt / steps);

    if (isSettled(head) && isSettled(tail)) {
      snap();
      frame = 0;
    } else {
      frame = requestAnimationFrame(tick);
    }
    draw();
  }

  function moveTo(x, width, animate = true) {
    target.x = x + width / 2;
    target.w = width;

    if (!animate) {
      cancelAnimationFrame(frame);
      frame = 0;
      snap();
      draw();
    } else if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }

  new ResizeObserver(resize).observe(track);
  resize();

  return { moveTo };
}
