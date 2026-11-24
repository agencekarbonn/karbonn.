/*
 * Matière liquide de la page Services (WebGL brut, sans dépendance).
 * Un noyau + des gouttes (une par service) fusionnées par smooth-min,
 * avec des lignes de niveau qui dessinent une topographie autour.
 */

const MAX_DROPS = 8;

const vertexShader = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragmentShader = `
  precision highp float;
  uniform vec2 uRes;
  uniform float uDpr;
  uniform float uTime;
  uniform vec3 uCore;
  uniform vec3 uDrops[${MAX_DROPS}];
  uniform float uTint[${MAX_DROPS}];
  uniform float uGoo;
  uniform float uWave;
  uniform float uLines;
  uniform float uMood;
  uniform vec3 uColor;
  uniform vec3 uSoft;
  uniform vec3 uInk;

  float smin(float a, float b, float k) {
    float h = max(k - abs(a - b), 0.0) / k;
    return min(a, b) - h * h * k * 0.25;
  }

  float field(vec2 p) {
    vec2 q = p - uCore.xy;
    float a = atan(q.y, q.x);
    float wobble = 1.0
      + 0.030 * sin(3.0 * a + uTime * 0.9)
      + 0.022 * sin(5.0 * a - uTime * 1.3)
      + uWave * 0.045 * sin(9.0 * a - uTime * 7.0);
    float d = length(q) - uCore.z * wobble;
    for (int i = 0; i < ${MAX_DROPS}; i++) {
      vec3 drop = uDrops[i];
      if (drop.z > 1.5) d = smin(d, length(p - drop.xy) - drop.z, uGoo);
    }
    return d;
  }

  void main() {
    vec2 p = vec2(gl_FragCoord.x, uRes.y * uDpr - gl_FragCoord.y) / uDpr;
    float d = field(p);

    // Lignes de niveau : à l'intérieur en bleu clair, à l'extérieur à l'encre.
    float spacing = 16.0;
    float level = d / spacing - uTime * 0.12;
    float iso = abs(fract(level) - 0.5) * spacing;
    float line = 1.0 - smoothstep(0.35, 0.35 + 1.1 / uDpr, iso);

    float inside = clamp(0.5 - d * uDpr, 0.0, 1.0);
    float reach = uCore.z * 2.4 + 140.0;
    float outside = (1.0 - inside) * line * uLines * 0.085 * smoothstep(reach, 0.0, d) * step(4.0, d);

    // Volume : léger dôme éclairé en haut à gauche.
    vec2 e = vec2(1.5, 0.0);
    vec2 grad = vec2(field(p + e.xy) - field(p - e.xy), field(p + e.yx) - field(p - e.yx));
    float depth = clamp(-d / max(uCore.z, 1.0), 0.0, 1.0);
    vec3 normal = normalize(vec3(grad * (1.0 - depth), sqrt(depth) * 2.2 + 0.05));
    float light = pow(max(dot(normal, normalize(vec3(-0.45, -0.6, 0.66))), 0.0), 18.0);
    float rim = smoothstep(18.0, 0.0, -d);

    vec3 body = uColor * (1.0 - rim * 0.18);
    body = mix(body, uSoft, light * 0.38 * (1.0 - uMood * 0.75) * step(0.02, depth));
    body = mix(body, mix(uColor, uSoft, 0.45), line * uLines * 0.22 * smoothstep(0.0, 24.0, -d));

    // Gouttes secondaires : teinte claire sur leur propre disque.
    float softMask = 0.0;
    for (int i = 0; i < ${MAX_DROPS}; i++) {
      vec3 drop = uDrops[i];
      if (drop.z > 1.5 && uTint[i] > 0.01) {
        float dd = length(p - drop.xy) - drop.z;
        softMask = max(softMask, uTint[i] * clamp(0.5 - dd * uDpr, 0.0, 1.0));
      }
    }

    vec3 color = mix(body * inside, uSoft * inside * (1.0 - rim * 0.08), softMask) + uInk * outside;
    float alpha = inside + outside;
    gl_FragColor = vec4(color, alpha);
  }
`;

const hexToRgb = (hex) => {
  const value = parseInt(hex.replace("#", "").trim(), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => channel / 255);
};

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}

export function createScene(canvas, palette) {
  const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch {
    return null;
  }

  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = (name) => gl.getUniformLocation(program, name);
  const u = Object.fromEntries(
    ["uRes", "uDpr", "uTime", "uCore", "uDrops", "uTint", "uGoo", "uWave", "uLines", "uMood", "uColor", "uSoft", "uInk"].map((name) => [name, uniform(name)]),
  );
  const accent = hexToRgb(palette.accent);
  const ink = hexToRgb(palette.ink);
  gl.uniform3fv(u.uSoft, hexToRgb(palette.soft));
  gl.uniform3fv(u.uInk, ink);

  const drops = new Float32Array(MAX_DROPS * 3);
  const tints = new Float32Array(MAX_DROPS);
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    // Limite le nombre de pixels calculés sur les très grands écrans.
    dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(3_200_000 / Math.max(1, width * height)));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render({ time, core, satellites, goo, wave, lines, mood }) {
    if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
    drops.fill(0);
    tints.fill(0);
    satellites.slice(0, MAX_DROPS).forEach((drop, i) => {
      drops.set([drop.x, drop.y, drop.r], i * 3);
      tints[i] = drop.tint || 0;
    });
    gl.uniform2f(u.uRes, width, height);
    gl.uniform1f(u.uDpr, dpr);
    gl.uniform1f(u.uTime, time);
    gl.uniform3f(u.uCore, core.x, core.y, core.r);
    gl.uniform3fv(u.uDrops, drops);
    gl.uniform1fv(u.uTint, tints);
    gl.uniform1f(u.uGoo, goo);
    gl.uniform1f(u.uWave, wave);
    gl.uniform1f(u.uLines, lines);
    gl.uniform1f(u.uMood, mood);
    gl.uniform3fv(u.uColor, accent.map((channel, i) => channel + (ink[i] - channel) * mood));
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { render, resize };
}
