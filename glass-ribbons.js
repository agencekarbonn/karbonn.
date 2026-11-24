/*
 * Deux rubans de verre qui s'entremêlent (Three.js).
 * Verre physique : transmission, réfraction, dispersion, vernis, reflets d'un
 * studio photo virtuel (softbox). La forme de chaque ruban est une somme
 * d'harmoniques aléatoires qui dérivent lentement : le nœud ne se répète jamais.
 */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.187.0/build/three.module.min.js";

const TAU = Math.PI * 2;

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Studio virtuel : pièce gris moyen, longues softbox blanches et quelques drapeaux noirs.
   Ce sont ces contrastes qui dessinent les arêtes et les reflets du verre. */
function createStudio(renderer) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(.5, .52, .55);
  const panel = (w, h, intensity, position, lookAt = [0, 0, 0], tint = [1, 1, 1]) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(...tint).multiplyScalar(intensity), side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
    mesh.position.set(...position);
    mesh.lookAt(...lookAt);
    env.add(mesh);
  };
  panel(14, 2.2, 9, [0, 7, 2]);
  panel(2.4, 12, 6, [-8, 1, 3]);
  panel(2.4, 12, 5, [8, 0, -2]);
  panel(10, 1.2, 7, [0, -6, 5]);
  panel(6, 6, 2.2, [0, 2, 9], [0, 0, 0], [.94, .97, 1]);
  panel(5, 9, .02, [-6, -1, -7]);
  panel(4, 9, .02, [6, 2, 7]);
  panel(12, 3, .05, [0, -7, -4]);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const texture = pmrem.fromScene(env, .03).texture;
  pmrem.dispose();
  return texture;
}

/* Verre clair : vraie transmission (réfraction, dispersion, teinte selon l'épaisseur).
   Il réfracte le ruban bleu qui passe derrière lui. */
function clearGlass(tint) {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(tint).lerp(new THREE.Color("#ffffff"), .45),
    metalness: 0,
    roughness: .015,
    transmission: 1,
    thickness: .28,
    ior: 1.47,
    dispersion: .6,
    attenuationColor: tint,
    attenuationDistance: .32,
    clearcoat: 1,
    clearcoatRoughness: .02,
    specularIntensity: 1,
    envMapIntensity: 1.45,
  });
}

/* Verre bleu profond : dense et saturé comme un verre coloré dans la masse.
   Le cœur des faces s'éclaircit (lumière traversante), les bords restent sombres. */
function deepGlass(tint) {
  const material = new THREE.MeshPhysicalMaterial({
    // Assombrie : la lumière du studio la ramène exactement sur la teinte voulue.
    color: new THREE.Color(tint).multiplyScalar(.5),
    metalness: 0,
    roughness: .03,
    clearcoat: 1,
    clearcoatRoughness: .015,
    specularIntensity: 1,
    envMapIntensity: 1.15,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGlow = { value: new THREE.Color("#3346ff") };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform vec3 uGlow;\nvoid main() {")
      .replace(
        "#include <lights_fragment_end>",
        `#include <lights_fragment_end>
        float facing = abs(dot(normal, geometryViewDir));
        reflectedLight.indirectDiffuse += uGlow * (pow(facing, 3.0) * .12);`,
      );
  };
  return material;
}

function createRibbon({ seed, material, segments, radial, width, thickness, length }) {
  const rand = mulberry32(seed);
  const between = (a, b) => a + (b - a) * rand();
  const sign = () => (rand() < .5 ? -1 : 1);

  // Harmoniques : une grande boucle, une ondulation moyenne, un frémissement.
  const harmonics = [[1.3, .7, 1.25], [.55, 1.4, 2.1], [.14, 2.3, 3]].map(([amp, fMin, fMax], k) => ({
    amp: amp * between(.88, 1.12),
    freq: [between(fMin, fMax), between(fMin, fMax), between(fMin, fMax)],
    phase: [rand() * TAU, rand() * TAU, rand() * TAU],
    speed: [0, 1, 2].map(() => between(.1, .26) * sign() / Math.sqrt(k + 1)),
  }));
  const twist = { amp: between(.7, 1.5), freq: between(.6, 1.4), phase: rand() * TAU, speed: between(.15, .35) * sign() };
  const swell = { freq: between(1.1, 2), phase: rand() * TAU, speed: between(.2, .4) * sign() };

  const count = (segments + 1) * radial;
  const positions = new Float32Array(count * 3);
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", position);
  geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage));
  const index = [];
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = a + radial;
      const d = b + radial;
      index.push(a, c, b, b, c, d);
    }
  }
  geometry.setIndex(index);
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);

  const mesh = new THREE.Mesh(geometry, material);

  // Section transversale précalculée : bande plate aux bords arrondis.
  const profile = Array.from({ length: radial }, (_, j) => {
    const a = (j / radial) * TAU;
    const c = Math.cos(a);
    const s = Math.sin(a);
    return [Math.sign(c) * Math.abs(c) ** .8, s * (.62 + .38 * c * c)];
  });

  const centers = new Float32Array((segments + 1) * 3);
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const helper = new THREE.Vector3();
  const n = new THREE.Vector3();
  const b = new THREE.Vector3();

  function center(u, t, out, offset) {
    let x = 0, y = 0, z = 0;
    for (const h of harmonics) {
      x += h.amp * Math.sin(h.freq[0] * u + h.phase[0] + h.speed[0] * t);
      y += h.amp * Math.sin(h.freq[1] * u + h.phase[1] + h.speed[1] * t);
      z += h.amp * Math.sin(h.freq[2] * u + h.phase[2] + h.speed[2] * t);
    }
    out[offset] = x;
    out[offset + 1] = y * .82;
    out[offset + 2] = z * .9;
  }

  function update(t, reveal = 1) {
    for (let i = 0; i <= segments; i++) center((i / segments) * TAU * length, t, centers, i * 3);
    // Repère transporté le long de la courbe (pas de retournement brutal, contrairement à Frenet).
    normal.set(0, 0, 0);
    for (let i = 0; i <= segments; i++) {
      const prev = Math.max(0, i - 1) * 3;
      const next = Math.min(segments, i + 1) * 3;
      tangent.set(centers[next] - centers[prev], centers[next + 1] - centers[prev + 1], centers[next + 2] - centers[prev + 2]).normalize();
      if (i === 0) {
        helper.set(0, 1, 0);
        if (Math.abs(tangent.dot(helper)) > .9) helper.set(1, 0, 0);
        normal.crossVectors(tangent, helper).normalize();
      } else {
        normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
      }
      binormal.crossVectors(tangent, normal);

      const s = i / segments;
      // Le ruban se déroule depuis son milieu à l'apparition, puis s'affine en pointes.
      const grown = THREE.MathUtils.smoothstep(reveal * 1.12 - Math.abs(s - .5) * 2, 0, .12);
      const taper = Math.max(.002, Math.sin(Math.PI * s) ** .6) * grown;
      const angle = twist.amp * Math.sin(TAU * twist.freq * s + twist.phase + twist.speed * t);
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      n.copy(normal).multiplyScalar(ca).addScaledVector(binormal, sa);
      b.copy(binormal).multiplyScalar(ca).addScaledVector(normal, -sa);
      const w = width * taper * (.82 + .22 * Math.sin(TAU * swell.freq * s + swell.phase + swell.speed * t));
      const h = thickness * Math.max(taper, .35 * grown);
      const cx = centers[i * 3], cy = centers[i * 3 + 1], cz = centers[i * 3 + 2];
      for (let j = 0; j < radial; j++) {
        const [px, py] = profile[j];
        const k = (i * radial + j) * 3;
        positions[k] = cx + n.x * px * w + b.x * py * h;
        positions[k + 1] = cy + n.y * px * w + b.y * py * h;
        positions[k + 2] = cz + n.z * px * w + b.z * py * h;
      }
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }

  return { mesh, update, dispose: () => geometry.dispose() };
}

export function createGlassRibbons(canvas, { seed = (Math.random() * 2 ** 31) | 0, paper = "#f7f6f2", ink = "#000000", word = "", low = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.5 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(paper);
  scene.environment = createStudio(renderer);

  const camera = new THREE.PerspectiveCamera(30, 1, .05, 60);
  const group = new THREE.Group();
  scene.add(group);

  /* Fond : le mot de la page en contour géant, derrière le verre.
     Opaque, il est réfracté (et déformé) par le ruban clair : c'est lui qui trahit le vrai verre. */
  const backdropCanvas = document.createElement("canvas");
  const backdropContext = backdropCanvas.getContext("2d");
  const backdropTexture = new THREE.CanvasTexture(backdropCanvas);
  backdropTexture.colorSpace = THREE.SRGBColorSpace;
  backdropTexture.anisotropy = 4;
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: backdropTexture, toneMapped: false }));
  backdrop.position.z = -3.2;
  scene.add(backdrop);
  let currentWord = word;

  function drawBackdrop() {
    const aspect = Math.max(.4, (canvas.clientWidth || 16) / (canvas.clientHeight || 9));
    const h = low ? 768 : 1024;
    backdropCanvas.width = Math.round(h * aspect);
    backdropCanvas.height = h;
    const ctx = backdropContext;
    ctx.fillStyle = paper;
    ctx.fillRect(0, 0, backdropCanvas.width, h);
    if (currentWord) {
      let size = h * .42;
      ctx.font = `800 ${size}px "DM Sans", "Avenir Next", system-ui, sans-serif`;
      const fit = (backdropCanvas.width * .92) / ctx.measureText(currentWord).width;
      if (fit < 1) {
        size *= fit;
        ctx.font = `800 ${size}px "DM Sans", "Avenir Next", system-ui, sans-serif`;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      ctx.strokeStyle = ink;
      ctx.globalAlpha = .18;
      ctx.lineWidth = Math.max(2, h / 300);
      if ("letterSpacing" in ctx) ctx.letterSpacing = `${-size * .05}px`;
      ctx.strokeText(currentWord, backdropCanvas.width / 2, h * .5);
      ctx.globalAlpha = 1;
    }
    backdropTexture.needsUpdate = true;
  }

  const options = { segments: low ? 300 : 460, radial: low ? 22 : 30, width: .5, thickness: .14, length: 1.45 };
  const ribbons = [
    createRibbon({ ...options, seed, material: deepGlass("#0C04FF") }),
    createRibbon({ ...options, seed: seed ^ 0x5bd1e995, material: clearGlass("#CDF2FF"), width: .56 }),
  ];
  ribbons.forEach((ribbon) => group.add(ribbon.mesh));

  const state = { dive: 0, reveal: 1, spin: 0, pointerX: 0, pointerY: 0 };
  let width = 0;
  let height = 0;
  let baseDistance = 9;

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Le nœud (rayon ≈ 2) garde la même présence quel que soit le format d'écran.
    const fit = 2.35 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    baseDistance = Math.max(fit, fit / camera.aspect) * (camera.aspect < 1 ? 1.22 : 1.08);
    camera.updateProjectionMatrix();
    // Le fond remplit exactement le champ de la caméra au repos.
    const span = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * (baseDistance - backdrop.position.z) * 1.02;
    backdrop.scale.set(span * camera.aspect, span, 1);
    drawBackdrop();
  }

  function render(time) {
    if (canvas.clientWidth !== width || canvas.clientHeight !== height) resize();
    ribbons.forEach((ribbon) => ribbon.update(time, state.reveal));
    group.rotation.set(
      .25 + state.pointerY * .18 + Math.sin(time * .11) * .12,
      time * .07 + state.spin + state.pointerX * .25,
      Math.sin(time * .09) * .1,
    );
    // Plongée : la caméra traverse le verre (dive 0 → 1).
    const dive = state.dive;
    camera.position.set(0, 0, THREE.MathUtils.lerp(baseDistance, .35, dive));
    camera.fov = 30 + dive * 38;
    camera.updateProjectionMatrix();
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }

  resize();
  document.fonts?.ready.then(drawBackdrop);
  return {
    state,
    setWord(next) {
      if (next === currentWord) return;
      currentWord = next;
      drawBackdrop();
    },
    render,
    resize,
    compile: () => (renderer.compileAsync ? renderer.compileAsync(scene, camera) : Promise.resolve()),
    dispose() {
      ribbons.forEach((ribbon) => {
        ribbon.dispose();
        ribbon.mesh.material.dispose();
      });
      scene.environment?.dispose();
      backdropTexture.dispose();
      renderer.dispose();
    },
  };
}
