// 「デプロイって何？」— office + cyber space, chibi people and mascot Browser-san / Server-san.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { DURATION, VO, DUR, SCRIPT, S, E, B } from './timeline.js';

const qs = new URLSearchParams(location.search);
const W = 1080, H = 1080;
const GOTH = '"Noto Sans JP",sans-serif';
const Y = '#f4c34a', WHITE = '#ffffff';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const ss = (a, b, x) => { const u = seg(x, a, b); return u * u * (3 - 2 * u); };
const eOut = (x) => 1 - Math.pow(1 - x, 3);
const eIO = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eBack = (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const inR = (t, a, b) => t >= a && t < b;

// ---------- sections ----------
const SEC = {
  think: S('l03') - 0.12, three: S('l04') - 0.15, screen: S('l05') - 0.12, pcB: S('l06') - 0.12, go: B.click + 0.35, ask: S('l08') - 0.1, back: S('l09') - 0.1,
  paint: S('l10') - 0.1, wakari: S('l11') - 0.05, pub: S('l12') - 0.1, place: S('l13') - 0.1, dep: S('l14') - 0.1, first: S('l15') - 0.1, local: S('l16') - 0.1,
  final: S('l18') - 0.1, cyber2: B.deploy4 + 1.0, end: DURATION,
};

// ---------- renderer ----------
const out = document.getElementById('out');
const ctx = out.getContext('2d');
const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d8dee4');
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 60);

// ---------- procedural textures ----------
function hash(x, y, s) { let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const h1 = (n) => hash(n, 7, 3);
function vnoise(x, y, s, p) { const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); const m = (a) => ((a % p) + p) % p; const a = hash(m(xi), m(yi), s), b = hash(m(xi + 1), m(yi), s), c = hash(m(xi), m(yi + 1), s), d = hash(m(xi + 1), m(yi + 1), s); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
function fbm(x, y, s, p, o = 4) { let f = 0, a = 0.5; for (let i = 0; i < o; i++) { f += a * vnoise(x, y, s + i * 17, p); x *= 2; y *= 2; p *= 2; a *= 0.5; } return f; }
function makeTex(size, fill, repeat = [1, 1]) {
  const cs = [0, 1, 2].map(() => { const c = document.createElement('canvas'); c.width = c.height = size; return c; });
  const ds = cs.map((c) => c.getContext('2d').createImageData(size, size));
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const [r, g, b, ro, bu] = fill(x, y); const i = (y * size + x) * 4;
    ds[0].data[i] = r; ds[0].data[i + 1] = g; ds[0].data[i + 2] = b; ds[0].data[i + 3] = 255;
    ds[1].data[i] = ds[1].data[i + 1] = ds[1].data[i + 2] = ro * 255; ds[1].data[i + 3] = 255;
    ds[2].data[i] = ds[2].data[i + 1] = ds[2].data[i + 2] = bu * 255; ds[2].data[i + 3] = 255;
  }
  cs.forEach((c, k) => c.getContext('2d').putImageData(ds[k], 0, 0));
  const tx = cs.map((c, k) => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.anisotropy = 8; if (k === 0) t.colorSpace = THREE.SRGBColorSpace; return t; });
  return { map: tx[0], rough: tx[1], bump: tx[2] };
}
const withRepeat = (set, rx, ry) => Object.fromEntries(Object.entries(set).map(([k, t]) => { const c = t.clone(); c.repeat.set(rx, ry); c.needsUpdate = true; return [k, c]; }));
const TEX = {};
function buildTextures() {
  TEX.floor = makeTex(1024, (x, y) => {
    const row = Math.floor(y / 128), yy = y % 128;
    const off = hash(row, 3, 9) * 1024; const sx = (x + off) % 1024; const seg_ = Math.floor(sx / 512) + row * 7, xx = sx % 512;
    const tone = hash(seg_, row, 5); const grain = fbm(x / 160, y / 5, 11 + seg_, 64, 4);
    const ring = 0.5 + 0.5 * Math.sin((yy + grain * 60 + hash(seg_, 1, 2) * 40) * 0.35);
    let k = 0.78 + tone * 0.22 - ring * 0.08 - grain * 0.1; const gap = yy < 2 || xx < 2 ? 1 : 0; if (gap) k *= 0.45;
    return [196 * k, 150 * k, 104 * k, 0.5 + grain * 0.25 + gap * 0.3, gap ? 0 : 0.6 + ring * 0.1 + grain * 0.1];
  }, [3, 3]);
  TEX.plaster = makeTex(512, (x, y) => { const n = fbm(x / 64, y / 64, 3, 8, 3), f = fbm(x / 6, y / 6, 7, 85, 2); const k = 0.97 + (n - 0.5) * 0.06 + (f - 0.5) * 0.03; return [236 * k, 230 * k, 220 * k, 0.88, 0.5 + (f - 0.5) * 0.6]; });
  TEX.walnut = makeTex(512, (x, y) => { const grain = fbm(x / 120, y / 4, 21, 64, 4); const ring = 0.5 + 0.5 * Math.sin((y + grain * 70) * 0.22); const k = 0.85 - ring * 0.12 - grain * 0.12; return [128 * k, 86 * k, 58 * k, 0.38 + grain * 0.2, 0.5 + ring * 0.15]; });
  TEX.oak = makeTex(512, (x, y) => { const grain = fbm(x / 140, y / 4, 25, 64, 4); const ring = 0.5 + 0.5 * Math.sin((y + grain * 60) * 0.25); const k = 0.9 - ring * 0.08 - grain * 0.1; return [214 * k, 178 * k, 136 * k, 0.45 + grain * 0.2, 0.5 + ring * 0.12]; });
  TEX.rug = makeTex(512, (x, y) => {
    const f = fbm(x / 2, y / 2, 31, 256, 2), u = x / 512, v = y / 512; const e = Math.min(u, v, 1 - u, 1 - v); let c = [226, 214, 194];
    if (e < 0.08) c = [176, 98, 72]; else if (e < 0.1) c = [226, 214, 194]; else if (e < 0.12) c = [70, 84, 92];
    const dm = Math.abs(((u * 8) % 1) - 0.5) + Math.abs(((v * 8) % 1) - 0.5); if (e > 0.16 && dm > 0.42 && dm < 0.5) c = [190, 120, 90];
    const k = 0.88 + f * 0.2; return [c[0] * k, c[1] * k, c[2] * k, 0.95, f];
  });
  // knit / denim are near-white so material color tints them per character
  TEX.knit = makeTex(256, (x, y) => { const cx = x % 16, cy = y % 16; const v = Math.abs(cx - 8) / 8; const s = Math.sin(((cy + v * 8) / 16) * Math.PI * 2) * 0.5 + 0.5; const n = vnoise(x / 3, y / 3, 41, 86); const k = 0.84 + s * 0.16 + (n - 0.5) * 0.06; return [255 * k, 255 * k, 255 * k, 0.92, s * 0.8 + n * 0.2]; }, [6, 4]);
  TEX.denim = makeTex(256, (x, y) => { const d = Math.sin((x + y) * 1.2) * 0.5 + 0.5, n = vnoise(x / 2, y / 8, 51, 128); const k = 0.8 + d * 0.1 + n * 0.12; return [255 * k, 255 * k, 255 * k, 0.85, d * 0.6 + n * 0.4]; }, [3, 3]);
  TEX.hair = makeTex(256, (x, y) => { const n = fbm(x / 3, y / 40, 61, 85, 3); const k = 0.72 + n * 0.5; return [255 * k, 255 * k, 255 * k, 0.45 + n * 0.2, n]; }, [2, 1]);
  TEX.wool = makeTex(256, (x, y) => { const d = Math.sin((x + y) * 0.9) * 0.5 + 0.5, n = vnoise(x / 2, y / 2, 91, 128); const k = 0.86 + d * 0.06 + n * 0.1; return [255 * k, 255 * k, 255 * k, 0.85, d * 0.4 + n * 0.6]; }, [4, 4]);
  TEX.plaid = makeTex(256, (x, y) => { const lx = x % 64, ly = y % 64; let c = [44, 54, 84]; if (lx < 14 || ly < 14) c = [38, 72, 70]; if ((lx < 14) && (ly < 14)) c = [30, 50, 52]; if (lx === 30 || lx === 31 || ly === 30 || ly === 31) c = [190, 190, 196]; if (lx === 46 || ly === 46) c = [150, 40, 50]; const n = vnoise(x / 1.5, y / 1.5, 95, 171); const k = 0.9 + n * 0.15; return [c[0] * k, c[1] * k, c[2] * k, 0.85, n]; }, [3, 1]);
  TEX.linen = makeTex(256, (x, y) => { const n = vnoise(x / 1.5, y / 1.5, 71, 171) * 0.5 + fbm(x / 30, y / 4, 73, 9, 2) * 0.5; const k = 0.92 + n * 0.1; return [240 * k, 234 * k, 222 * k, 0.95, n]; }, [2, 2]);
}
function M(o = {}, tex) {
  const p = { ...o }; const bs = p.bumpScale; delete p.bumpScale;
  if (tex) { p.map = tex.map; p.roughnessMap = tex.rough; p.bumpMap = tex.bump; p.bumpScale = bs ?? 1.5; }
  return new THREE.MeshPhysicalMaterial(p);
}
function mesh(geo, mat, parent = scene, x = 0, y = 0, z = 0, cast = true) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; parent.add(m); return m; }
const box = (w, h, d, mat, x, y, z, parent = scene, cast = true) => mesh(new THREE.BoxGeometry(w, h, d), mat, parent, x, y, z, cast);
const rbox = (w, h, d, r, mat, x, y, z, parent = scene) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, parent, x, y, z);
function canvasTex(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// ---------- world: office (around the origin) + cyber space (far away at X0) ----------
const WINS = [[-3.3, -1.7], [-1.2, 0.4], [0.9, 2.5]];
const WY0 = 0.95, WY1 = 2.45, RX = 4, RZ = 4, CEIL = 3.0;
const SUN_DIR = V(1, -0.5, -0.25).normalize();
const DESK_Y = 0.735;
// desk island: row A faces -z (chairs at +z), row B faces +z
const DESKS = [
  { x: -2.2, z: -0.25, ry: 0 }, { x: -0.7, z: -0.25, ry: 0 }, { x: 0.8, z: -0.25, ry: 0 },
  { x: -2.2, z: -1.15, ry: Math.PI }, { x: -0.7, z: -1.15, ry: Math.PI }, { x: 0.8, z: -1.15, ry: Math.PI },
  { x: 2.6, z: 1.9, ry: 0 }, { x: -2.6, z: 1.9, ry: 0 },
];
const MY = 1; // your desk index
const X0 = 60; // cyber space origin
let sun, skyM, shafts = [], dust, dustBase, curtains = [], skyL, hemi, ceilFill, cyberLights = [], cyberSpot, gridTex, pathTex, portalDisc;
const monitors = []; // { mesh, tex, ctx, key }

function screenCanvas(w = 512, h = 320) { const c = document.createElement('canvas'); c.width = w; c.height = h; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return { c, g: c.getContext('2d'), t }; }
function codeScreen(g, w, h, seed) { g.fillStyle = '#1e222b'; g.fillRect(0, 0, w, h); const cols = ['#7fb8ff', '#ffd27f', '#c58cff', '#8be0a4', '#ff8f8f']; for (let i = 0; i < 14; i++) { let x = 20 + (i % 4) * 24; const y = 24 + i * 20; for (let k = 0; k < 3; k++) { const ww = 30 + hash(i, k, seed) * 120; g.fillStyle = cols[(i + k + seed) % 5]; g.fillRect(x, y, ww, 9); x += ww + 12; } } }

function buildWorld() {
  scene.background = new THREE.Color('#03040a');
  const plaster = (w, h) => M({ color: '#f4f1ea', roughness: 0.9 }, withRepeat(TEX.plaster, w / 1.5, h / 1.5));
  const carpet = makeTex(512, (x, y) => { const n = vnoise(x / 2, y / 2, 5, 256) * 0.6 + fbm(x / 40, y / 40, 9, 12, 3) * 0.4; const k = 0.8 + n * 0.25; return [118 * k, 122 * k, 130 * k, 0.95, n]; }, [6, 6]);
  const floor = mesh(new THREE.PlaneGeometry(2 * RX + 0.4, 2 * RZ + 0.4), M({ color: '#ffffff', roughness: 0.95, bumpScale: 2 }, carpet), scene, 0, 0, 0, false); floor.rotation.x = -Math.PI / 2;
  box(2 * RX + 0.4, CEIL + 0.1, 0.2, plaster(8, 3), 0, CEIL / 2, -RZ - 0.1);
  box(2 * RX + 0.4, CEIL + 0.1, 0.2, plaster(8, 3), 0, CEIL / 2, RZ + 0.1);
  box(0.2, CEIL + 0.1, 2 * RZ + 0.4, plaster(8, 3), RX + 0.1, CEIL / 2, 0);
  // left wall with three windows
  box(0.2, WY0, 2 * RZ + 0.4, plaster(8, 1), -RX - 0.1, WY0 / 2, 0);
  box(0.2, CEIL + 0.1 - WY1, 2 * RZ + 0.4, plaster(8, 0.6), -RX - 0.1, (WY1 + CEIL + 0.1) / 2, 0);
  const edges = [-RZ - 0.2, ...WINS.flat(), RZ + 0.2];
  for (let i = 0; i < edges.length; i += 2) { const a = edges[i], b = edges[i + 1]; box(0.2, WY1 - WY0, b - a, plaster(b - a, 1.5), -RX - 0.1, (WY0 + WY1) / 2, (a + b) / 2); }
  const alu = M({ color: '#c9ccd0', metalness: 0.7, roughness: 0.35 });
  for (const [z0, z1] of WINS) { const zc = (z0 + z1) / 2, zl = z1 - z0; box(0.3, 0.04, zl + 0.1, alu, -RX + 0.05, WY0, zc); box(0.14, 0.05, zl, alu, -RX, WY1, zc); box(0.08, WY1 - WY0, 0.04, alu, -RX - 0.02, (WY0 + WY1) / 2, zc); }
  // city outside
  const skyT = canvasTex(1024, 256, (sg) => { const gr = sg.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#7fb2e6'); gr.addColorStop(0.7, '#d8e8f4'); gr.addColorStop(1, '#f0eee6'); sg.fillStyle = gr; sg.fillRect(0, 0, 1024, 256); sg.filter = 'blur(3px)'; for (let i = 0; i < 18; i++) { const x = i * 58 + h1(i) * 30, hh = 60 + h1(i * 3) * 120; sg.fillStyle = ['#8a97a8', '#9aa6b5', '#7d8a9c'][i % 3]; sg.fillRect(x, 256 - hh, 40 + h1(i * 7) * 40, hh); } });
  skyM = new THREE.MeshBasicMaterial({ map: skyT }); skyM.color.setScalar(2.0);
  const sky = mesh(new THREE.PlaneGeometry(30, 10), skyM, scene, -10, 2.0, 0, false); sky.rotation.y = Math.PI / 2; sky.receiveShadow = false;
  // whiteboard + clock + plants
  box(3.2, 1.3, 0.04, M({ color: '#b8bcc2', metalness: 0.5, roughness: 0.4 }), 0.2, 1.65, -RZ + 0.03);
  const wbT = canvasTex(1280, 520, (g, w, h) => { g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2b5bd7'; g.lineWidth = 6; g.lineCap = 'round'; g.font = `700 64px ${GOTH}`; g.fillStyle = '#2b5bd7'; g.fillText('Sprint 12', 60, 100); g.fillStyle = '#d0342c'; g.fillText('release 金曜!', 60, 200); g.strokeRect(700, 60, 220, 120); g.strokeRect(1000, 60, 220, 120); g.beginPath(); g.moveTo(920, 120); g.lineTo(1000, 120); g.stroke(); g.fillStyle = '#333'; g.font = `500 40px ${GOTH}`; ['・API修正', '・UI調整', '・テスト'].forEach((s, i) => g.fillText(s, 60, 290 + i * 60)); });
  mesh(new THREE.PlaneGeometry(3.1, 1.22), M({ map: wbT, roughness: 0.4 }), scene, 0.2, 1.65, -RZ + 0.06, false);
  const leafM = M({ color: '#4f7d45', roughness: 0.55, side: THREE.DoubleSide, sheen: 0.3, sheenColor: new THREE.Color('#bfe0a0') });
  for (const [px, pz] of [[-3.4, -3.4], [3.4, -3.4], [3.4, 3.2]]) { mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.42, 28), M({ color: '#ece7de', roughness: 0.5 }), scene, px, 0.21, pz); for (let i = 0; i < 16; i++) { const a = i * 2.39, r = 0.08 + (i % 4) * 0.05; const l = mesh(new THREE.SphereGeometry(0.14, 14, 10), leafM, scene, px + Math.cos(a) * r, 0.7 + (i % 5) * 0.14, pz + Math.sin(a) * r); l.scale.set(0.45, 1, 0.1); l.rotation.set(Math.sin(a) * 0.9, a, Math.cos(a) * 0.9); } }
  // ceiling + lights panels (on)
  box(2 * RX + 0.4, 0.1, 2 * RZ + 0.4, plaster(8, 8), 0, CEIL + 0.05, 0);
  const panelM = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff6e8', emissiveIntensity: 1.6 });
  for (const x of [-2, 1]) for (const z of [-2, 0.5, 2.8]) box(1.1, 0.03, 0.55, panelM, x, CEIL - 0.02, z, scene, false);
  // desks, chairs, monitors
  const wood = M({ color: '#ffffff', roughness: 0.45, clearcoat: 0.25 }, TEX.oak);
  const metal = M({ color: '#3a3f47', metalness: 0.6, roughness: 0.4 });
  const black = M({ color: '#16181d', roughness: 0.4, metalness: 0.3 });
  const chairM = M({ color: '#2d3442', roughness: 0.8 });
  DESKS.forEach((d, i) => {
    const g = new THREE.Group(); g.position.set(d.x, 0, d.z); g.rotation.y = d.ry; scene.add(g); d.g = g;
    rbox(1.4, 0.035, 0.78, 0.01, wood, 0, DESK_Y - 0.0175, 0, g);
    for (const sx of [-0.66, 0.66]) { box(0.05, DESK_Y - 0.035, 0.7, metal, sx, (DESK_Y - 0.035) / 2, 0, g); }
    box(1.3, 0.3, 0.02, metal, 0, 0.45, -0.37, g);
    // monitor
    box(0.06, 0.24, 0.05, black, 0, DESK_Y + 0.12, -0.24, g); box(0.24, 0.015, 0.16, black, 0, DESK_Y + 0.008, -0.24, g);
    const mon = rbox(0.66, 0.4, 0.035, 0.01, black, 0, DESK_Y + 0.42, -0.26, g);
    const sc = screenCanvas(); codeScreen(sc.g, 512, 320, i);
    const scr = mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ map: sc.t, toneMapped: false }), g, 0, DESK_Y + 0.42, -0.241, false);
    scr.material.color.setScalar(0.9); monitors[i] = { mesh: scr, tex: sc.t, g: sc.g, key: '' };
    box(0.44, 0.015, 0.14, M({ color: '#d8dade', roughness: 0.5 }), 0, DESK_Y + 0.008, 0.06, g);
    mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.1, 20), M({ color: ['#e8e2d6', '#c96a5a', '#4f7cc0'][i % 3], roughness: 0.4 }), g, 0.5, DESK_Y + 0.05, -0.05);
    if (i % 2 === 0) for (let k = 0; k < 3; k++) rbox(0.22, 0.012, 0.3, 0.002, M({ color: '#f6f3ec', roughness: 0.9 }), -0.45, DESK_Y + 0.006 + k * 0.012, 0.02, g).rotation.y = k * 0.15;
    // office chair
    const ch = new THREE.Group(); ch.position.set(0, 0, 0.62); g.add(ch);
    rbox(0.46, 0.06, 0.44, 0.02, chairM, 0, 0.47, 0, ch); rbox(0.44, 0.48, 0.05, 0.03, chairM, 0, 0.78, 0.23, ch);
    mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.38, 12), metal, ch, 0, 0.25, 0);
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; const leg = box(0.28, 0.03, 0.04, metal, Math.cos(a) * 0.13, 0.06, Math.sin(a) * 0.13, ch); leg.rotation.y = -a; }
  });
  // phone on your desk
  const phoneG = new THREE.Group(); DESKS[MY].g.add(phoneG); phoneG.position.set(-0.4, DESK_Y + 0.006, 0.18); phoneG.rotation.y = 0.3;
  rbox(0.08, 0.008, 0.16, 0.006, black, 0, 0, 0, phoneG);
  const phs = screenCanvas(160, 320); phs.g.fillStyle = '#eef2f8'; phs.g.fillRect(0, 0, 160, 320); phs.g.fillStyle = '#4f7cc0'; phs.g.fillRect(0, 0, 160, 40);
  const phScr = mesh(new THREE.PlaneGeometry(0.072, 0.15), new THREE.MeshBasicMaterial({ map: phs.t, toneMapped: false }), phoneG, 0, 0.0045, 0, false); phScr.rotation.x = -Math.PI / 2; phoneG.userData.scr = phScr;
  window.PHONE = phoneG;

  // lights (office)
  sun = new THREE.DirectionalLight('#fff0dc', 5.5);
  const tgt = V(-0.8, 0, -0.6); sun.target.position.copy(tgt); sun.position.copy(tgt.clone().addScaledVector(SUN_DIR, -14)); scene.add(sun, sun.target);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 2, far: 30 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.02;
  RectAreaLightUniformsLib.init();
  skyL = new THREE.RectAreaLight('#dbe9ff', 3.0, 5.8, WY1 - WY0); skyL.position.set(-RX + 0.02, (WY0 + WY1) / 2, -0.4); skyL.lookAt(0, 1.2, -0.4); scene.add(skyL);
  hemi = new THREE.HemisphereLight('#eef2f8', '#8a7a6a', 0.55); scene.add(hemi);
  ceilFill = new THREE.PointLight('#fff4e4', 3.0, 9, 1.6); ceilFill.position.set(-0.4, 2.7, 0.6); scene.add(ceilFill);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.34;
  WINS.forEach((w) => buildShaft(w)); buildDust();
  buildCyber();
}

// cyber space: glowing grid floor, a data path from your PC's portal to Webサーバーさん, a giant screen, a globe
function buildCyber() {
  gridTex = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#04060f'; g.fillRect(0, 0, w, h); g.strokeStyle = '#2bd4ff'; g.globalAlpha = 0.55; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } });
  gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(20, 20);
  const fl = mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: '#0a0f1e', roughness: 0.35, metalness: 0.4, emissive: '#ffffff', emissiveMap: gridTex, emissiveIntensity: 0.55 }), scene, X0, 0, 0, false); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true;
  // data path
  pathTex = canvasTex(64, 512, (g, w, h) => { g.fillStyle = '#062033'; g.fillRect(0, 0, w, h); for (let i = 0; i < 8; i++) { g.fillStyle = '#5ff0ff'; g.fillRect(24, i * 64 + 8, 16, 34); } g.fillStyle = '#2bd4ff'; g.fillRect(0, 0, 4, h); g.fillRect(w - 4, 0, 4, h); });
  pathTex.wrapT = THREE.RepeatWrapping; pathTex.repeat.set(1, 6);
  const path = mesh(new THREE.PlaneGeometry(1.0, 9), new THREE.MeshBasicMaterial({ map: pathTex, toneMapped: false, transparent: true, opacity: 0.9 }), scene, X0, 0.012, 1.4, false); path.rotation.x = -Math.PI / 2;
  // portal (your PC) at the near end
  const ringM = new THREE.MeshStandardMaterial({ color: '#0b1430', emissive: '#4fd8ff', emissiveIntensity: 2.2 });
  const ring = mesh(new THREE.TorusGeometry(0.85, 0.06, 16, 64), ringM, scene, X0, 0.9, 6.2, false);
  const pc = canvasTex(512, 512, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); gr.addColorStop(0, '#e8f6ff'); gr.addColorStop(1, '#2a6db8'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = '#ffffff'; g.font = `900 64px ${GOTH}`; g.textAlign = 'center'; g.fillText('あなたのPC', w / 2, h / 2 + 20); });
  portalDisc = mesh(new THREE.CircleGeometry(0.8, 48), new THREE.MeshBasicMaterial({ map: pc, toneMapped: false, transparent: true, opacity: 0.85 }), scene, X0, 0.9, 6.21, false);
  // server platform
  const plat = mesh(new THREE.CylinderGeometry(1.6, 1.75, 0.18, 64), new THREE.MeshStandardMaterial({ color: '#141a2e', metalness: 0.6, roughness: 0.35 }), scene, X0, 0.09, -3.0);
  mesh(new THREE.TorusGeometry(1.68, 0.03, 8, 96), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#c58cff', emissiveIntensity: 2.5 }), scene, X0, 0.19, -3.0, false).rotation.x = Math.PI / 2;
  // code tray in front of the server (where code files are kept)
  const tray = new THREE.Group(); tray.position.set(X0, 0, -2.05); scene.add(tray);
  rbox(1.1, 0.06, 0.5, 0.02, new THREE.MeshStandardMaterial({ color: '#1b2238', metalness: 0.5, roughness: 0.3, emissive: '#2bd4ff', emissiveIntensity: 0.15 }), 0, 0.82, 0, tray);
  mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.8, 16), new THREE.MeshStandardMaterial({ color: '#1b2238', metalness: 0.6, roughness: 0.3 }), tray, 0, 0.4, 0);
  window.TRAY = tray;
  // giant "finished screen" + its stage, off to the side
  const gs = canvasTex(1024, 600, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#5aa0ff'); gr.addColorStop(1, '#b58cff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, 0, w, 60); g.fillStyle = '#fff'; g.font = `900 90px ${GOTH}`; g.fillText('MY SITE', 70, 230); g.fillStyle = 'rgba(255,255,255,0.7)'; [0, 1, 2].forEach((i) => g.fillRect(70, 290 + i * 40, 520 - i * 90, 18)); g.fillStyle = '#fff'; g.fillRect(70, 450, 220, 70); [0, 1].forEach((i) => g.fillRect(640 + i * 170, 160, 150, 300)); });
  const gscr = mesh(new THREE.PlaneGeometry(6, 3.5), new THREE.MeshBasicMaterial({ map: gs, toneMapped: false }), scene, X0 + 16, 3.0, -4, false);
  mesh(new THREE.PlaneGeometry(6.3, 3.8), new THREE.MeshStandardMaterial({ color: '#000', emissive: '#4fd8ff', emissiveIntensity: 1.6 }), scene, X0 + 16, 3.0, -4.02, false);
  // globe (world)
  const globe = new THREE.Group(); globe.position.set(X0 + 4.2, 2.6, -5.5); scene.add(globe); window.GLOBE = globe;
  mesh(new THREE.SphereGeometry(1.2, 48, 32), new THREE.MeshStandardMaterial({ color: '#0d2a55', metalness: 0.2, roughness: 0.5, emissive: '#1a5cc0', emissiveIntensity: 0.35 }), globe, 0, 0, 0, false);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.SphereGeometry(1.22, 16, 12)), new THREE.LineBasicMaterial({ color: '#6fe0ff', transparent: true, opacity: 0.6 })); globe.add(wire);
  // cyber lights
  const c1 = new THREE.PointLight('#4fd8ff', 30, 14, 1.6); c1.position.set(X0 - 3, 3.5, 2); scene.add(c1);
  const c2 = new THREE.PointLight('#c58cff', 26, 14, 1.6); c2.position.set(X0 + 3.5, 3.0, -1); scene.add(c2);
  const c3 = new THREE.PointLight('#4fd8ff', 20, 16, 1.6); c3.position.set(X0 + 16, 3.0, 0); scene.add(c3);
  cyberSpot = new THREE.SpotLight('#ffffff', 60, 12, 0.6, 0.5, 1.4); cyberSpot.position.set(X0 + 1.2, 6.5, 2.5); cyberSpot.target.position.set(X0, 0, -1.5); cyberSpot.castShadow = true; cyberSpot.shadow.mapSize.set(2048, 2048); scene.add(cyberSpot, cyberSpot.target);
  cyberLights = [c1, c2, c3, cyberSpot];
}
function buildShaft([z0, z1]) {
  const c = [[WY0, z0], [WY0, z1], [WY1, z1], [WY1, z0]].map(([y, z]) => V(-RX, y, z));
  const f = c.map((p) => p.clone().addScaledVector(SUN_DIR, -p.y / SUN_DIR.y));
  const pos = [], uv = [];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; [[c[i], 0], [c[j], 0], [f[j], 1], [c[i], 0], [f[j], 1], [f[i], 1]].forEach(([p, v]) => { pos.push(p.x, p.y, p.z); uv.push(0, v); }); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
  const sh = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uC: { value: new THREE.Color('#fff0d8') }, uI: { value: 0.1 } },
    vertexShader: `varying vec3 vN; varying vec3 vW; varying float vL; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix)*normal); vL = uv.y; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uT; uniform vec3 uC; uniform float uI; varying vec3 vN; varying vec3 vW; varying float vL;
      void main(){ vec3 v = normalize(cameraPosition - vW); float f = pow(1.0 - abs(dot(normalize(vN), v)), 0.6);
        float s = 0.7 + 0.3*sin(vW.z*9.0 + vW.y*5.0 + uT*0.4) * sin(vW.z*3.1 - uT*0.2);
        gl_FragColor = vec4(uC * uI * (1.0 - f*0.85) * (1.0 - vL*0.55) * s, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  }));
  sh.renderOrder = 5; scene.add(sh); shafts.push(sh);
}
function buildDust() {
  // cyber particles (reuse the "dust" slot): float around the cyber space
  const N = 600; dustBase = [];
  for (let i = 0; i < N; i++) dustBase.push([X0 - 10 + hash(i, 1, 81) * 32, 0.3 + hash(i, 2, 81) * 6, -10 + hash(i, 3, 81) * 18, hash(i, 4, 81) * 6.28]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3));
  const spr = canvasTex(32, 32, (x) => { const rg = x.createRadialGradient(16, 16, 0, 16, 16, 16); rg.addColorStop(0, 'rgba(255,255,255,1)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = rg; x.fillRect(0, 0, 32, 32); });
  dust = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.05, map: spr, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(dust);
}
// ---------- mascots: ブラウザさん (a little browser window) and Webサーバーさん (a server rack) ----------
function mascotFace(kind, eye = '#1d2433', bg = null) {
  return canvasTex(512, 384, (g, w, h) => {
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
    const E = 170; g.lineCap = 'round';
    const eyeO = (x) => { g.fillStyle = eye; g.beginPath(); g.ellipse(x, E, 34, 46, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x - 10, E - 16, 12, 0, 7); g.fill(); g.beginPath(); g.arc(x + 12, E + 14, 5, 0, 7); g.fill(); };
    const arc = (x, up) => { g.strokeStyle = eye; g.lineWidth = 14; g.beginPath(); if (up) { g.moveTo(x - 34, E + 10); g.quadraticCurveTo(x, E - 34, x + 34, E + 10); } else { g.moveTo(x - 34, E - 6); g.quadraticCurveTo(x, E + 26, x + 34, E - 6); } g.stroke(); };
    if (kind === 'happy') { arc(176, true); arc(336, true); } else if (kind === 'blink') { arc(176, false); arc(336, false); } else { eyeO(176); eyeO(336); }
    g.fillStyle = 'rgba(255,120,140,0.55)'; [96, 416].forEach((x) => { g.beginPath(); g.ellipse(x, 250, 42, 24, 0, 0, 7); g.fill(); });
    g.strokeStyle = eye; g.fillStyle = '#c4505e'; g.lineWidth = 10;
    if (kind === 'ask' || kind === 'happy') { g.beginPath(); g.moveTo(216, 262); g.quadraticCurveTo(256, 322, 296, 262); g.closePath(); g.fill(); g.stroke(); }
    else if (kind === 'wow') { g.beginPath(); g.ellipse(256, 280, 22, 28, 0, 0, 7); g.fill(); g.stroke(); }
    else { g.beginPath(); g.moveTo(226, 268); g.quadraticCurveTo(256, 292, 286, 268); g.stroke(); }
  });
}
const BFACES = {}; const SFACES = {};
function makeBrowser(color = '#3f7fe0') {
  if (!BFACES.normal) for (const k of ['normal', 'happy', 'ask', 'wow', 'blink']) BFACES[k] = mascotFace(k);
  const R = { kind: 'browser', face: 'normal' };
  const G = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
  R.root = G(scene, 0, 0, 0); R.body = G(R.root, 0, 0.13, 0);
  const white = M({ color: '#fbfbfd', roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const bar = M({ color, roughness: 0.4, clearcoat: 0.6 });
  rbox(0.42, 0.32, 0.26, 0.07, white, 0, 0.17, 0, R.body);
  rbox(0.43, 0.085, 0.27, 0.04, bar, 0, 0.34, 0, R.body);
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => mesh(new THREE.SphereGeometry(0.014, 12, 10), new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.4 }), R.body, -0.16 + i * 0.04, 0.345, 0.136, false));
  rbox(0.2, 0.026, 0.01, 0.01, M({ color: '#ffffff', roughness: 0.4 }), 0.06, 0.345, 0.136, R.body);
  R.faceMat = new THREE.MeshBasicMaterial({ map: BFACES.normal, transparent: true, toneMapped: false });
  mesh(new THREE.PlaneGeometry(0.34, 0.255), R.faceMat, R.body, 0, 0.15, 0.131, false);
  const limb = M({ color, roughness: 0.5 });
  R.arms = [-1, 1].map((s) => { const a = G(R.body, s * 0.22, 0.2, 0); mesh(new THREE.CapsuleGeometry(0.03, 0.09, 6, 10), limb, a, 0, -0.06, 0); mesh(new THREE.SphereGeometry(0.042, 14, 10), white, a, 0, -0.13, 0); a.rotation.z = s * 0.35; return { g: a, s }; });
  R.legs = [-1, 1].map((s) => { const l = G(R.root, s * 0.09, 0.13, 0); mesh(new THREE.CapsuleGeometry(0.032, 0.06, 6, 10), limb, l, 0, -0.06, 0); rbox(0.08, 0.04, 0.1, 0.018, white, 0, -0.115, 0.015, l); return { g: l, s }; });
  return R;
}
function makeServer() {
  if (!SFACES.normal) for (const k of ['normal', 'happy', 'ask', 'wow', 'blink']) SFACES[k] = mascotFace(k, '#7ff3ff', '#071425');
  const R = { kind: 'server', face: 'normal', leds: [] };
  const G = (p, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); p.add(g); return g; };
  R.root = G(scene, 0, 0, 0); R.body = G(R.root, 0, 0.16, 0);
  const shell = M({ color: '#2a3350', roughness: 0.35, metalness: 0.5, clearcoat: 0.5 });
  rbox(0.78, 1.18, 0.6, 0.06, shell, 0, 0.62, 0, R.body);
  rbox(0.6, 0.38, 0.04, 0.04, M({ color: '#0b1222', roughness: 0.3 }), 0, 0.96, 0.29, R.body);
  R.faceMat = new THREE.MeshBasicMaterial({ map: SFACES.normal, transparent: true, toneMapped: false });
  mesh(new THREE.PlaneGeometry(0.56, 0.34), R.faceMat, R.body, 0, 0.96, 0.312, false);
  for (let i = 0; i < 4; i++) { rbox(0.62, 0.1, 0.03, 0.02, M({ color: '#1a2036', roughness: 0.4 }), 0, 0.62 - i * 0.13, 0.3, R.body); for (let k = 0; k < 3; k++) { const m = new THREE.MeshStandardMaterial({ color: '#000', emissive: k === 0 ? '#3cff9a' : '#4fd8ff', emissiveIntensity: 2 }); mesh(new THREE.BoxGeometry(0.03, 0.02, 0.01), m, R.body, 0.2 + k * 0.05, 0.62 - i * 0.13, 0.318, false); R.leds.push(m); } }
  const limb = M({ color: '#3a4566', roughness: 0.4, metalness: 0.4 });
  R.arms = [-1, 1].map((s) => { const a = G(R.body, s * 0.42, 0.7, 0); mesh(new THREE.CapsuleGeometry(0.05, 0.22, 6, 10), limb, a, 0, -0.14, 0); mesh(new THREE.SphereGeometry(0.075, 14, 10), M({ color: '#dfe6f2', roughness: 0.4 }), a, 0, -0.29, 0); a.rotation.z = s * 0.25; return { g: a, s }; });
  R.legs = [-1, 1].map((s) => { const l = G(R.root, s * 0.2, 0.16, 0); rbox(0.18, 0.1, 0.26, 0.04, limb, 0, -0.1, 0.03, l); return { g: l, s }; });
  return R;
}
function mascotPose(R, t, o = {}) {
  const ph = o.ph || 0;
  R.root.position.y = o.y ?? 0; R.body.rotation.set(0, 0, Math.sin(t * 2 + ph) * 0.02); R.body.position.y = (R.kind === 'server' ? 0.16 : 0.13) + Math.sin(t * 3 + ph) * 0.006;
  R.arms.forEach((A) => A.g.rotation.set(0, 0, A.s * (R.kind === 'server' ? 0.25 : 0.35)));
  R.legs.forEach((L) => L.g.rotation.set(0, 0, 0));
  R.face = ((t + ph) % 3.1) < 0.12 ? 'blink' : (o.face || 'normal');
}
function mascotWalk(R, t, w = 1, rate = 9) {
  const p = t * rate;
  R.root.position.y += Math.abs(Math.sin(p)) * 0.05 * w;
  R.legs.forEach((L, i) => L.g.rotation.x = Math.sin(p + (i ? Math.PI : 0)) * 0.7 * w);
  R.arms.forEach((A, i) => A.g.rotation.x = Math.sin(p + (i ? 0 : Math.PI)) * 0.8 * w);
  R.body.rotation.z += Math.sin(p) * 0.06 * w;
}
function mascotFaceApply(R) { const F = R.kind === 'server' ? SFACES : BFACES; R.faceMat.map = F[R.face] || F.normal; }

// ---------- code files as paper documents ----------
const DOCS = [{ k: 'HTML', c: '#e8663d' }, { k: 'CSS', c: '#3d8be8' }, { k: 'JS', c: '#e8b92f' }];
function docTex(d, ver) { return canvasTex(300, 424, (g, w, h) => {
  g.fillStyle = '#fffdf8'; g.fillRect(0, 0, w, h); g.fillStyle = d.c; g.fillRect(0, 0, w, 78); g.fillStyle = '#fff'; g.font = `900 52px ${GOTH}`; g.textBaseline = 'middle'; g.fillText(d.k, 22, 42);
  const cols = ['#6a7280', d.c, '#9a6ad6', '#3a8a5a'];
  for (let i = 0; i < 12; i++) { let x = 22 + (i % 3) * 14; for (let k = 0; k < 2; k++) { const ww = 30 + hash(i, k, d.k.length) * 110; g.fillStyle = cols[(i + k) % 4]; g.fillRect(x, 106 + i * 24, ww, 9); x += ww + 10; } }
  if (ver === 2) { g.save(); g.translate(w - 76, h - 70); g.rotate(-0.25); g.strokeStyle = '#e0303e'; g.lineWidth = 7; g.strokeRect(-60, -28, 120, 56); g.fillStyle = '#e0303e'; g.font = `900 40px ${GOTH}`; g.textAlign = 'center'; g.fillText('NEW', 0, 2); g.restore(); }
}); }
function makeDoc(i, ver = 1, s = 1) { const g = new THREE.Group(); scene.add(g); const m = mesh(new THREE.PlaneGeometry(0.21 * s, 0.297 * s), M({ map: docTex(DOCS[i], ver), roughness: 0.8, side: THREE.DoubleSide }), g, 0, 0, 0); g.userData.m = m; return g; }

// ---------- your monitor content ----------
function browserFrame(g, w, h, url) { g.fillStyle = '#e9edf3'; g.fillRect(0, 0, w, 44); ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { g.fillStyle = c; g.beginPath(); g.arc(20 + i * 18, 22, 6, 0, 7); g.fill(); }); g.fillStyle = '#fff'; g.beginPath(); g.roundRect(80, 9, w - 100, 26, 13); g.fill(); g.fillStyle = '#4a5160'; g.font = `500 17px ${GOTH}`; g.textBaseline = 'middle'; g.fillText(url, 96, 23); }
function sitePage(g, x0, y0, w, h, p) {
  // a simple site drawn top-to-bottom as p goes 0..1
  g.save(); g.beginPath(); g.rect(x0, y0, w, h * p); g.clip();
  const gr = g.createLinearGradient(x0, y0, x0 + w, y0 + h); gr.addColorStop(0, '#5aa0ff'); gr.addColorStop(1, '#b58cff'); g.fillStyle = gr; g.fillRect(x0, y0, w, h);
  g.fillStyle = '#fff'; g.font = `900 34px ${GOTH}`; g.textBaseline = 'alphabetic'; g.fillText('MY SITE', x0 + 26, y0 + 70);
  g.fillStyle = 'rgba(255,255,255,0.75)'; [0, 1, 2].forEach((i) => g.fillRect(x0 + 26, y0 + 96 + i * 18, 200 - i * 40, 9));
  g.fillStyle = '#fff'; g.beginPath(); g.roundRect(x0 + 26, y0 + 160, 110, 34, 17); g.fill();
  [0, 1, 2].forEach((i) => { g.fillStyle = 'rgba(255,255,255,0.22)'; g.beginPath(); g.roundRect(x0 + 26 + i * ((w - 52) / 3), y0 + 214, (w - 52) / 3 - 10, h - 230, 10); g.fill(); });
  g.restore();
}
function paintMonitor(mon, kind, p = 0) {
  const key = kind + Math.round(p * 24); if (mon.key === key) return; mon.key = key;
  const g = mon.g, w = 512, h = 320; g.clearRect(0, 0, w, h);
  if (kind === 'chat' || kind === 'deploy') {
    g.fillStyle = '#16181f'; g.fillRect(0, 0, w, h); g.fillStyle = '#e0894a'; g.font = `900 20px ${GOTH}`; g.textBaseline = 'middle'; g.fillText('✦ AI', 18, 24);
    const bub = (x, y, ww, txt, me) => { g.fillStyle = me ? '#3f6fb0' : '#2a2e38'; g.beginPath(); g.roundRect(x, y, ww, 40, 14); g.fill(); g.fillStyle = '#fff'; g.font = `700 18px ${GOTH}`; g.fillText(txt, x + 14, y + 21); };
    bub(200, 54, 290, 'ボタンの色を青にして', true); bub(18, 108, 300, '変更しました。確認してください', false);
    if (kind === 'deploy') { bub(260, 162, 230, 'OK、公開して', true); if (p > 0.3) { g.fillStyle = '#2a2e38'; g.beginPath(); g.roundRect(18, 216, 360, 44, 14); g.fill(); g.fillStyle = '#7ff3a0'; g.font = `800 19px ${GOTH}`; g.fillText('本番環境にデプロイします 🚀', 32, 239); } }
    g.fillStyle = '#2a2e38'; g.beginPath(); g.roundRect(18, 276, 476, 30, 15); g.fill();
  } else if (kind === 'browser') {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); browserFrame(g, w, h, 'https://my-site.com'); if (p > 0) sitePage(g, 0, 44, w, h - 44, p);
  } else if (kind === 'local') {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); browserFrame(g, 330, h, 'localhost:3000'); sitePage(g, 0, 44, 330, h - 44, 1);
    g.fillStyle = '#16181f'; g.fillRect(330, 0, 182, h); g.fillStyle = '#e0894a'; g.font = `900 16px ${GOTH}`; g.fillText('✦ AI', 344, 22);
    ['#7fb8ff', '#ffd27f', '#8be0a4', '#c58cff'].forEach((c, i) => { g.fillStyle = c; g.fillRect(344, 50 + i * 22, 60 + (i * 37) % 90, 8); }); g.fillStyle = '#3f6fb0'; g.beginPath(); g.roundRect(344, 160, 150, 34, 12); g.fill();
  }
  mon.tex.needsUpdate = true;
}
// ---------- people ----------
// ---- chibi characters (same look as the earlier videos), rebuilt on a jointed rig ----
const SKIN = '#ffe0cc';
function paintFace(kind, iris) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 400; const g = c.getContext('2d');
  const EY = 205, line = '#3a2420';
  g.lineCap = 'round'; g.lineJoin = 'round';
  const circ = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); };
  const blush = (a = 0.6, lines = false) => { for (const x of [112, 400]) { const gr = g.createRadialGradient(x, 270, 0, x, 270, 60); gr.addColorStop(0, `rgba(255,110,130,${a})`); gr.addColorStop(1, 'rgba(255,110,130,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, 270, 62, 36, 0, 0, 7); g.fill(); if (lines) { g.strokeStyle = 'rgba(225,70,95,0.8)'; g.lineWidth = 4; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x + k * 18 - 7, 284); g.lineTo(x + k * 18 + 7, 260); g.stroke(); } } } };
  const brow = (x, s, lift = 0, tilt = 0) => { g.strokeStyle = line; g.lineWidth = 6; g.beginPath(); g.moveTo(x - 30 * s, EY - 66 - lift + tilt); g.quadraticCurveTo(x, EY - 80 - lift, x + 30 * s, EY - 68 - lift - tilt); g.stroke(); };
  const eye = (x, s, o = {}) => {
    g.save();
    if (o.half) { g.beginPath(); g.rect(x - 60, EY - 8, 120, 100); g.clip(); }
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, EY, 31, 41, 0, 0, 7); g.fill();
    if (o.shock) { g.fillStyle = '#1b1015'; circ(x, EY + 2, 7); }
    else {
      const gr = g.createLinearGradient(0, EY - 38, 0, EY + 40); gr.addColorStop(0, '#20121c'); gr.addColorStop(0.5, iris); gr.addColorStop(1, '#ffe9c9');
      g.fillStyle = gr; g.beginPath(); g.ellipse(x + (o.look || 0), EY + 3, 25, 37, 0, 0, 7); g.fill();
      g.fillStyle = '#140b10'; g.beginPath(); g.ellipse(x + (o.look || 0), EY + 1, 11, 19, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; circ(x - 9 + (o.look || 0), EY - 15, 9.5); circ(x + 10 + (o.look || 0), EY + 17, 4.5);
    }
    g.restore();
    g.strokeStyle = line; g.lineWidth = 10;
    const top = o.half ? EY - 6 : EY - 30;
    g.beginPath(); g.moveTo(x - 36 * s, top + 8); g.quadraticCurveTo(x, top - (o.half ? 6 : 22), x + 36 * s, top + 6); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(x + 34 * s, top + 6); g.lineTo(x + 44 * s, top - 2); g.stroke();
    if (o.shock) { g.lineWidth = 3; g.beginPath(); g.ellipse(x, EY, 31, 41, 0, 0.2, Math.PI - 0.2); g.stroke(); }
  };
  const closed = (x, s, up = true) => { g.strokeStyle = line; g.lineWidth = 9; g.beginPath(); if (up) { g.moveTo(x - 32, EY + 8); g.quadraticCurveTo(x, EY - 26, x + 32, EY + 8); } else { g.moveTo(x - 32, EY - 4); g.quadraticCurveTo(x, EY + 20, x + 32, EY - 4); } g.stroke(); };
  const spiral = (x) => { g.strokeStyle = line; g.lineWidth = 6; g.beginPath(); for (let a = 0; a < 15; a += 0.2) { const r = a * 2.3; g.lineTo(x + Math.cos(a) * r, EY + Math.sin(a) * r * 1.1); } g.stroke(); };
  const mouth = (type) => {
    g.strokeStyle = line; g.lineWidth = 5; g.fillStyle = '#c4505e';
    if (type === 'smile') { g.beginPath(); g.moveTo(236, 318); g.quadraticCurveTo(256, 334, 276, 318); g.stroke(); }
    if (type === 'open') { g.beginPath(); g.moveTo(228, 314); g.quadraticCurveTo(256, 356, 284, 314); g.closePath(); g.fill(); g.stroke(); }
    if (type === 'o') { g.beginPath(); g.ellipse(256, 328, 15, 20, 0, 0, 7); g.fill(); g.stroke(); }
    if (type === 'grin') { g.beginPath(); g.moveTo(224, 312); g.quadraticCurveTo(262, 346, 296, 304); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke(); }
    if (type === 'wavy') { g.beginPath(); g.moveTo(230, 322); for (let i = 1; i <= 4; i++) g.quadraticCurveTo(230 + i * 13 - 6.5, 322 + (i % 2 ? -8 : 8), 230 + i * 13, 322); g.stroke(); }
  };
  if (kind === 'normal') { brow(180, 1); brow(332, -1); eye(180, -1); eye(332, 1); mouth('smile'); }
  if (kind === 'look') { brow(180, 1); brow(332, -1); eye(180, -1, { look: 6 }); eye(332, 1, { look: 6 }); mouth('smile'); }
  if (kind === 'blush') { brow(180, 1, -4); brow(332, -1, -4); eye(180, -1, { look: -4 }); eye(332, 1, { look: -4 }); mouth('smile'); blush(0.75, true); }
  if (kind === 'shockBlush') { brow(180, 1, 14, 6); brow(332, -1, 14, 6); eye(180, -1, { shock: true }); eye(332, 1, { shock: true }); mouth('wavy'); blush(0.9, true); }
  if (kind === 'smirk') { brow(180, 1, 2, -6); brow(332, -1, 2, -6); eye(180, -1, { half: true, look: 6 }); eye(332, 1, { half: true, look: 6 }); mouth('grin'); }
  if (kind === 'wink') { brow(180, 1, 8); brow(332, -1, 8); eye(180, -1); closed(332, 1); mouth('grin'); }
  if (kind === 'embar') { brow(180, 1, 4, -6); brow(332, -1, 4, -6); closed(180, -1, false); closed(332, 1, false); mouth('wavy'); blush(0.85, true); }
  if (kind === 'closed') { brow(180, 1); brow(332, -1); closed(180, -1, false); closed(332, 1, false); mouth('smile'); }
  if (kind === 'happy') { brow(180, 1, 6); brow(332, -1, 6); closed(180, -1); closed(332, 1); mouth('open'); blush(0.7, true); }
  if (kind === 'shock') { brow(180, 1, 14, 6); brow(332, -1, 14, 6); eye(180, -1, { shock: true }); eye(332, 1, { shock: true }); mouth('o'); }
  if (kind === 'strain') { brow(180, 1, -6, 10); brow(332, -1, -6, 10); eye(180, -1, { half: true }); eye(332, 1, { half: true }); mouth('wavy'); }
  if (kind === 'dizzy') { brow(180, 1, 4, 8); brow(332, -1, 4, 8); spiral(180); spiral(332); mouth('wavy'); blush(0.4); }
  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return tx;
}
const FACE_KINDS = ['normal', 'closed', 'happy', 'strain', 'dizzy', 'shock', 'look', 'blush', 'shockBlush', 'smirk', 'wink', 'embar'];
const CHIBI = 1.15; // chibis scaled up a little so they fit the classroom furniture
function makePerson(o) {
  const P = { o, hipY: 0.62, sitY: 0.45, armA: 0.2, armB: 0.22, stride: 0.75 };
  const skin = M({ color: SKIN, roughness: 0.6, sheen: 0.3, sheenColor: new THREE.Color('#ffb0a0') });
  const hair = M({ color: o.hair, roughness: 0.55, sheen: 0.4, sheenColor: new THREE.Color('#a07a60') });
  const navy = M({ color: '#232a45', roughness: 0.85, bumpScale: 1 }, TEX.wool);
  const white = M({ color: '#f4f2ec', roughness: 0.8 });
  const gaku = M({ color: '#1e2333', roughness: 0.85, bumpScale: 1 }, TEX.wool);
  const shoe = M({ color: '#4a2e22', roughness: 0.4, clearcoat: 0.5 });
  const gold = M({ color: '#e0b54a', metalness: 0.8, roughness: 0.3 });
  const rib = M({ color: '#d8344a', roughness: 0.6 });
  const top = o.casual ? M({ color: o.top, roughness: 0.85, bumpScale: 1 }, TEX.knit) : o.girl ? white : gaku;
  const pantsM = o.casual ? M({ color: o.pants || '#3b4252', roughness: 0.85 }, TEX.denim) : gaku;
  const G = (parent, x, y, z) => { const g = new THREE.Group(); g.position.set(x, y, z); parent.add(g); return g; };
  P.root = G(scene, 0, 0, 0); P.root.scale.setScalar(CHIBI);
  P.hips = G(P.root, 0, P.hipY, 0);
  if (o.girl) {
    const g = new THREE.CylinderGeometry(0.16, 0.27, 0.32, 48, 1, true); const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), z = pos.getZ(i), y = pos.getY(i); const a = Math.atan2(z, x); const k = 1 + (0.5 - y / 0.32) * 0.05 * (Math.sin(a * 14) > 0 ? 1 : -1); pos.setX(i, x * k); pos.setZ(i, z * k); }
    g.computeVertexNormals(); mesh(g, M({ color: '#2b3150', roughness: 0.85, side: THREE.DoubleSide }), P.hips, 0, -0.02, 0);
  } else { const pv = mesh(new THREE.CapsuleGeometry(0.12, 0.04, 6, 16), pantsM, P.hips, 0, 0.0, 0); pv.scale.set(1.1, 1, 0.8); }
  P.spine = G(P.hips, 0, 0.02, 0);
  const torso = mesh(new THREE.CapsuleGeometry(0.13, 0.26, 6, 16), top, P.spine, 0, 0.18, 0); torso.scale.set(1.15, 1, 0.78);
  if (o.girl && !o.casual) {
    box(0.3, 0.17, 0.025, navy, 0, 0.34, -0.085, P.spine);
    const collar = mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 20, Math.PI), navy, P.spine, 0, 0.36, 0.0); collar.rotation.set(Math.PI / 2 + 0.5, 0, Math.PI);
    for (const s of [-1, 1]) { const c = mesh(new THREE.ConeGeometry(0.03, 0.06, 8), rib, P.spine, s * 0.03, 0.29, 0.105); c.rotation.z = s * Math.PI / 2; }
    mesh(new THREE.SphereGeometry(0.016, 8, 8), rib, P.spine, 0, 0.29, 0.11);
  } else if (!o.casual) {
    for (const y of [0.34, 0.26, 0.18, 0.1]) mesh(new THREE.SphereGeometry(0.011, 8, 8), gold, P.spine, 0, y, 0.103);
    mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.06, 16), gaku, P.spine, 0, 0.4, 0);
  }
  P.chest = G(P.spine, 0, 0.34, 0);
  P.neck = G(P.chest, 0, 0.06, 0); mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12), skin, P.neck, 0, 0.0, 0);
  P.head = G(P.neck, 0, 0.07, 0);
  const R = 0.17, hc = G(P.head, 0, 0.115, 0);
  mesh(new THREE.SphereGeometry(R, 40, 28), skin, hc).scale.set(1, 1.04, 0.98);
  P.faces = Object.fromEntries(FACE_KINDS.map((k) => [k, paintFace(k, o.iris)]));
  P.faceMat = new THREE.MeshStandardMaterial({ map: P.faces.normal, transparent: true, depthWrite: false, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 });
  const fs = mesh(new THREE.SphereGeometry(R * 1.012, 32, 20, Math.PI / 2 - 0.9, 1.8, 0.9, 1.4), P.faceMat, hc, 0, 0, 0, false); fs.scale.set(1, 1.04, 0.98); fs.renderOrder = 2;
  mesh(new THREE.SphereGeometry(R * 1.09, 32, 24), hair, hc, 0, 0.03, -0.03);
  for (let i = -3; i <= 3; i++) { const b = mesh(new THREE.SphereGeometry(0.05, 12, 10), hair, hc, i * 0.044, 0.105 - Math.abs(i) * 0.01, 0.132 - Math.abs(i) * 0.014); b.scale.set(1, 1.35, 0.5); b.rotation.z = i * 0.14; }
  if (o.style === 'long') {
    const back = mesh(new THREE.CapsuleGeometry(0.15, 0.32, 8, 16), hair, hc, 0, -0.17, -0.08); back.scale.set(1.25, 1, 0.62);
    for (const s of [-1, 1]) { const l = mesh(new THREE.CapsuleGeometry(0.034, 0.26, 6, 10), hair, hc, s * 0.158, -0.11, 0.04); l.rotation.z = s * 0.08; }
    mesh(new THREE.SphereGeometry(0.022, 10, 10), M({ color: '#ff8fb0', roughness: 0.4 }), hc, 0.12, 0.12, 0.1);
  }
  if (o.style === 'bob') { const back = mesh(new THREE.SphereGeometry(R * 1.1, 32, 20), hair, hc, 0, -0.03, -0.04); back.scale.set(1.08, 0.95, 0.95); for (const s of [-1, 1]) { const l = mesh(new THREE.CapsuleGeometry(0.045, 0.12, 6, 10), hair, hc, s * 0.155, -0.07, 0.03); l.scale.set(1, 1, 0.9); } }
  if (o.style === 'pony') { const t = mesh(new THREE.CapsuleGeometry(0.05, 0.2, 6, 12), hair, hc, 0, 0.0, -0.2); t.rotation.x = 0.6; mesh(new THREE.SphereGeometry(0.025, 10, 8), rib, hc, 0, 0.08, -0.18); }
  if (o.style === 'spiky') for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; const c = mesh(new THREE.ConeGeometry(0.045, 0.12, 8), hair, hc, Math.cos(a) * 0.1, 0.16, Math.sin(a) * 0.1 - 0.02); c.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); }
  if (o.style === 'short' || o.style === 'spiky') for (const s of [-1, 1]) { const l = mesh(new THREE.SphereGeometry(0.05, 10, 10), hair, hc, s * 0.165, -0.02, 0.0); l.scale.set(0.5, 1.4, 0.9); }
  if (o.glasses) { const gm = M({ color: '#2a2a2e', metalness: 0.6, roughness: 0.3 }); for (const s of [-1, 1]) mesh(new THREE.TorusGeometry(0.05, 0.006, 8, 24), gm, hc, s * 0.075, -0.0, R * 0.98, false); box(0.05, 0.006, 0.006, gm, 0, 0.01, R * 1.0, hc, false); }
  P.arms = [-1, 1].map((s) => {
    const sh = G(P.chest, s * 0.175, 0.02, 0); mesh(new THREE.CapsuleGeometry(0.045, 0.13, 6, 12), top, sh, 0, -0.1, 0);
    const el = G(sh, 0, -0.2, 0); mesh(new THREE.CapsuleGeometry(0.044, 0.1, 6, 12), top, el, 0, -0.08, 0);
    if (!o.girl) mesh(new THREE.TorusGeometry(0.04, 0.006, 6, 16), gold, el, 0, -0.16, 0).rotation.x = Math.PI / 2;
    const hd = G(el, 0, -0.18, 0); mesh(new THREE.SphereGeometry(0.043, 14, 12), skin, hd, 0, -0.03, 0);
    return { sh, el, hd, s };
  });
  P.legs = [-1, 1].map((s) => {
    const hp = G(P.hips, s * 0.075, 0, 0); mesh(new THREE.CapsuleGeometry(0.055, 0.2, 6, 12), o.girl ? skin : pantsM, hp, 0, -0.14, 0);
    const kn = G(hp, 0, -0.28, 0); mesh(new THREE.CapsuleGeometry(0.053, 0.17, 6, 12), o.girl ? skin : pantsM, kn, 0, -0.12, 0);
    if (o.girl) mesh(new THREE.CylinderGeometry(0.06, 0.057, 0.2, 14), navy, kn, 0, -0.17, 0);
    const an = G(kn, 0, -0.27, 0); rbox(0.1, 0.07, 0.2, 0.03, shoe, 0, -0.035, 0.03, an);
    return { hp, kn, an, s };
  });
  return P;
}

function resetPose(P, t) {
  const ph = P.o.ph || 0, br = Math.sin(t * 2.1 + ph) * 0.012;
  P.hips.position.set(0, P.hipY, 0); P.hips.rotation.set(0, 0, 0);
  P.spine.rotation.set(0.02 + br, 0, 0); P.chest.rotation.set(0, 0, 0); P.neck.rotation.set(0, 0, 0);
  P.head.rotation.set(0.03, 0, 0);
  P.arms.forEach((A) => { A.sh.rotation.set(0.04, 0, A.s * 0.07); A.el.rotation.set(-0.22, 0, 0); A.hd.rotation.set(0, A.s * 0.2, 0); });
  P.legs.forEach((L) => { L.hp.rotation.set(0, 0, 0); L.kn.rotation.set(0.03, 0, 0); L.an.rotation.set(0, 0, 0); });
  const blink = ((t + ph * 1.7) % 3.3) < 0.12; P.face = blink ? 'closed' : 'normal';
}
const place = (P, x, z, ry) => { P.root.position.set(x, 0, z); P.root.rotation.set(0, ry, 0); };
const faceTo = (from, to) => Math.atan2(to.x - from.x, to.z - from.z);
const STRIDE = 1.35;
function legCycle(P, ph, w) {
  P.hips.position.y = P.hipY - w * 0.025 * (1 - Math.abs(Math.cos(ph)));
  P.hips.rotation.set(0, w * 0.07 * Math.sin(ph), w * 0.025 * Math.cos(ph));
  P.spine.rotation.y = -w * 0.09 * Math.sin(ph); P.spine.rotation.x += 0.05 * w;
  P.legs.forEach((L, i) => { const q = ph + (i ? Math.PI : 0); const th = -0.42 * Math.sin(q) * w, kn = (0.08 + 0.85 * Math.pow(Math.max(0, Math.cos(q)), 2)) * w + 0.03; L.hp.rotation.set(th, 0, 0); L.kn.rotation.set(kn, 0, 0); L.an.rotation.set(-(th + kn) * 0.55 + 0.1 * w * Math.max(0, Math.sin(q - 0.4)), 0, 0); });
  P.arms.forEach((A) => { const q = ph + (A.s < 0 ? Math.PI : 0); A.sh.rotation.set(0.3 * Math.sin(q) * w + 0.04, 0, A.s * 0.07); A.el.rotation.set(-0.22 - 0.2 * Math.max(0, -Math.sin(q)) * w, 0, 0); });
}
// walk along a polyline of [x,z] points between t0..t1, ending facing endRy
function walk(P, t, pts, t0, t1, endRy) {
  const segs = []; let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push([L, l, i]); L += l; }
  const dist = (tt) => { const u = seg(tt, t0, t1); return (u * 0.35 + u * u * (3 - 2 * u) * 0.65) * L; };
  const d = dist(t), w = clamp((dist(t + 0.02) - d) / 0.02 / 1.0);
  let sI = segs[segs.length - 1]; for (const sg of segs) if (d <= sg[0] + sg[1]) { sI = sg; break; }
  const k = clamp((d - sI[0]) / sI[1]), a = pts[sI[2] - 1], b = pts[sI[2]];
  const x = lerp(a[0], b[0], k), z = lerp(a[1], b[1], k); let ry = Math.atan2(b[0] - a[0], b[1] - a[1]);
  if (endRy !== undefined) { let dr = endRy - ry; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); ry += dr * ss(t1 - 0.5, t1 + 0.2, t); }
  place(P, x, z, ry); legCycle(P, (d / (P.stride * CHIBI)) * Math.PI * 2, w);
  return t < t1;
}
// two-bone IK (palm to target, elbow toward pole)
const _m = new THREE.Matrix4();
function quatFromDown(down, side) { const y = down.clone().negate(); const x = side.clone(); const z = new THREE.Vector3().crossVectors(x, y); _m.makeBasis(x, y, z); return new THREE.Quaternion().setFromRotationMatrix(_m); }
function solveArm(P, arm, target, pole, w = 1) {
  if (w <= 0) return; P.root.updateMatrixWorld(true);
  const sc = P.root.scale.x, a = P.armA * sc, b = P.armB * sc; const Sp = arm.sh.getWorldPosition(new THREE.Vector3());
  const D = target.clone().sub(Sp); const d = clamp(D.length(), 0.08, a + b - 0.002); const dir = D.normalize();
  const A = Math.acos(clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1));
  const n = new THREE.Vector3().crossVectors(dir, pole).normalize(); const u = dir.clone().applyAxisAngle(n, A);
  const Ep = Sp.clone().addScaledVector(u, a); const f = target.clone().sub(Ep).normalize();
  const pq = arm.sh.parent.getWorldQuaternion(new THREE.Quaternion());
  arm.sh.quaternion.slerp(pq.clone().invert().multiply(quatFromDown(u, n)), w); arm.sh.updateMatrixWorld(true);
  const shQ = arm.sh.getWorldQuaternion(new THREE.Quaternion());
  arm.el.quaternion.slerp(shQ.invert().multiply(quatFromDown(f, n)), w);
}
function localToWorldOf(P, v) { P.root.updateMatrixWorld(true); return P.root.localToWorld(v.clone()); }
// hold an object in front with both hands: obj local x = across, y = facing reader
function holdFront(P, obj, o = {}) {
  const up = o.y ?? 1.13, fwd = o.f ?? 0.3, tilt = o.tilt ?? -1.0, half = o.half ?? 0.17, w = o.w ?? 1;
  const c = localToWorldOf(P, V(o.x ?? 0, up, fwd));
  obj.position.copy(c); obj.quaternion.copy(P.root.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, 0, 0)));
  if (o.sheet) obj.quaternion.copy(P.root.quaternion).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(o.tilt ?? -0.15, 0, 0)));
  obj.updateMatrixWorld(true);
  const fwdV = V(0, 0, 1).applyQuaternion(P.root.quaternion);
  P.arms.forEach((A) => { const tgt = obj.localToWorld(V(A.s * half, o.sheet ? 0 : -0.01, 0)); const side = V(A.s, 0, 0).applyQuaternion(P.root.quaternion); const pole = V(0, -1, 0).addScaledVector(side, 0.6).addScaledVector(fwdV, -0.25).normalize(); solveArm(P, A, tgt, pole, w); A.hd.rotation.set(0, -A.s * 0.5 * w, A.s * 0.3 * w); });
}

// seated on a chair: root at the chair, facing ry
function sit(P, x, z, ry) {
  place(P, x, z, ry);
  P.hips.position.y = P.sitY; P.spine.rotation.x += 0.06;
  P.legs.forEach((L) => { L.hp.rotation.set(-1.48, 0, L.s * -0.04); L.kn.rotation.set(1.5, 0, 0); L.an.rotation.set(-0.02, 0, 0); });
}
// open book lying on the desk, hands on its edges
function bookOnDesk(P, bk, deskX, deskZ, w = 1) {
  bk.position.set(deskX, DESK_Y + 0.008, deskZ + 0.06); bk.rotation.set(0, 0, 0); bk.updateMatrixWorld(true);
  P.arms.forEach((A) => { const tg = bk.localToWorld(V(A.s * 0.16, 0.02, 0.07)); const side = V(A.s, 0, 0).applyQuaternion(P.root.quaternion); solveArm(P, A, tg, V(0, -1, 0).addScaledVector(side, 0.8).normalize(), w); A.hd.rotation.set(0, 0, 0); });
}

// ---------- cast ----------
let you, coworkers = [], crowd = [], bro, srv, bros = [], docsTray = [], docsNew = [], docsHand = [], docsBig = [], docsDesk = [], docsCopies = [], brush, dome, bigPage;
const SERVER_POS = V(X0, 0.18, -3.15);
const TRAY_Y = 0.86, TRAY_Z = -2.05;
const PORTAL = V(X0, 0, 6.2);
const YOU_CHAIR = () => { const d = DESKS[MY]; return V(d.x, 0, d.z + 0.6); };
function buildCast() {
  you = makePerson({ hair: '#2b2420', style: 'short', iris: '#4a3a2a', casual: true, top: '#5b7fa6', pants: '#3b4252', ph: 0 });
  const looks = [
    { girl: true, hair: '#4a2c20', style: 'long', iris: '#8a4a5a', casual: true, top: '#e8d8c4' },
    { hair: '#1e1f26', style: 'short', iris: '#3a4e7a', casual: true, top: '#6a8c6a', glasses: true },
    { girl: true, hair: '#6a4430', style: 'bob', iris: '#4a7a5a', casual: true, top: '#c96a5a' },
    { hair: '#a8743e', style: 'spiky', iris: '#8a5a2a', casual: true, top: '#2f3442' },
  ];
  coworkers = looks.map((o, i) => makePerson({ ...o, ph: i * 1.3 + 0.5 }));
  for (let i = 0; i < 10; i++) crowd.push(makePerson({ girl: i % 2 === 0, hair: ['#2b1d16', '#1e1f26', '#6a4430', '#3a2416', '#a8743e'][i % 5], style: ['long', 'short', 'bob', 'spiky', 'pony'][i % 5], iris: '#4a3a2a', casual: true, top: ['#e8d8c4', '#6a8c6a', '#c96a5a', '#5b7fa6', '#d2a23c'][i % 5], ph: i * 0.7 }));
  bro = makeBrowser('#3f7fe0'); srv = makeServer();
  ['#e0573f', '#3fb36a', '#9a5ad6', '#e0a93f', '#3fb8d0', '#d64f8a'].forEach((c) => bros.push(makeBrowser(c)));
  for (let i = 0; i < 3; i++) { docsTray.push(makeDoc(i, 1, 1.4)); docsNew.push(makeDoc(i, 2, 1.4)); docsHand.push(makeDoc(i, 1, 1.4)); docsBig.push(makeDoc(i, 1, 2.6)); docsDesk.push(makeDoc(i, 1, 0.55)); }
  for (let i = 0; i < 18; i++) docsCopies.push(makeDoc(i % 3, 1, 0.7));
  brush = new THREE.Group(); scene.add(brush); mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 10), M({ color: '#c9a06a', roughness: 0.5 }), brush, 0, 0.08, 0); mesh(new THREE.ConeGeometry(0.016, 0.05, 12), M({ color: '#ff6a86', roughness: 0.4 }), brush, 0, 0.18, 0);
  // translucent dome around your desk ("only inside your PC")
  dome = mesh(new THREE.SphereGeometry(1.25, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.ShaderMaterial({ uniforms: { uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: 'uniform float uA; varying vec3 vN; varying vec3 vW; void main(){ float f = pow(1.0-abs(dot(normalize(vN), normalize(cameraPosition-vW))), 2.0); gl_FragColor = vec4(vec3(0.45,0.85,1.0)*(0.15+f*1.4), uA*(0.12+f*0.75)); }' }), scene, DESKS[MY].x, 0, DESKS[MY].z + 0.15, false);
  // the "finished page" panel for the 3-files scene
  bigPage = new THREE.Group(); scene.add(bigPage);
  const pt = screenCanvas(512, 320); sitePage(pt.g, 0, 0, 512, 320, 1); pt.t.needsUpdate = true;
  mesh(new THREE.PlaneGeometry(1.9, 1.19), new THREE.MeshBasicMaterial({ map: pt.t, toneMapped: false, transparent: true, side: THREE.DoubleSide }), bigPage, 0, 0, 0, false);
}

// ---------- helpers ----------
const hideAll = (arr) => arr.forEach((o) => (o.visible = false));
function docAt(d, p, rx = 0, ry = 0, rz = 0) { d.visible = true; d.position.copy(p); d.rotation.set(rx, ry, rz); }
function trayDocs(arr, t, k = 1) { arr.forEach((d, i) => docAt(d, V(X0 - 0.36 + i * 0.36, TRAY_Y + 0.003 + i * 0.002, TRAY_Z + 0.02), -Math.PI / 2 + 0.0, 0, (i - 1) * 0.08)); }
function carry(arr, R, t, fwd = 0.2, up = 0.32) { arr.forEach((d, i) => { const p = R.root.localToWorld(V((i - 1) * 0.05, up + i * 0.012, fwd + i * 0.01)); d.visible = true; d.position.copy(p); d.quaternion.copy(R.root.quaternion); d.rotateX(-0.2); d.rotateZ((i - 1) * 0.12); }); }
function placeM(R, x, y, z, ry, s = 1) { R.root.position.set(x, y, z); R.root.rotation.set(0, ry, 0); R.root.scale.setScalar(s); }
function typing(P, t) { P.arms.forEach((A) => { A.sh.rotation.set(-0.95, 0, -A.s * 0.12); A.el.rotation.set(-0.55 + Math.sin(t * 16 + A.s * 2) * 0.1, 0, 0); }); }
function headHold(P, t) { P.arms.forEach((A) => { A.sh.rotation.set(-2.5, 0, -A.s * 0.55); A.el.rotation.set(-1.5, 0, 0); }); P.head.rotation.z = Math.sin(t * 9) * 0.1; }
function sitAt(P, i, t) { const d = DESKS[i]; const back = d.ry === 0 ? 1 : -1; sit(P, d.x, d.z + 0.6 * back, d.ry === 0 ? Math.PI : 0); }

// ---------- animation ----------
function animate(t) {
  [you, ...coworkers, ...crowd].forEach((P) => { resetPose(P, t); P.root.visible = true; });
  [bro, srv, ...bros].forEach((R, i) => { R.root.visible = false; mascotPose(R, t, { ph: i * 0.9 }); });
  hideAll([...docsTray, ...docsNew, ...docsHand, ...docsBig, ...docsDesk, ...docsCopies]); brush.visible = false; bigPage.visible = false;
  dome.material.uniforms.uA.value = 0;
  crowd.forEach((P) => (P.root.visible = false));
  srv.root.visible = true; placeM(srv, SERVER_POS.x, SERVER_POS.y, SERVER_POS.z, 0, 1.15);
  srv.leds.forEach((m, i) => (m.emissiveIntensity = 0.6 + 2 * (Math.sin(t * 7 + i * 1.7) > 0.3 ? 1 : 0)));
  // office crowd is always seated
  sitAt(you, MY, t); [0, 3, 4, 5].forEach((d, i) => sitAt(coworkers[i], d, t));
  coworkers.forEach((P, i) => { typing(P, t + i); P.head.rotation.x = 0.15; });
  typing(you, t); you.head.rotation.x = 0.12;
  // your monitor
  const mon = monitors[MY];
  if (t < SEC.local) paintMonitor(mon, t >= SEC.pcB ? 'browser' : 'chat', t >= SEC.paint ? ss(B.gamen - 0.3, B.egaku + 0.6, t) : 0);
  else if (t < SEC.final) paintMonitor(mon, 'local');
  else paintMonitor(mon, 'deploy', seg(t, SEC.final, B.deploy4 + 0.3));

  if (t < SEC.think) {
    // overwhelmed by "デプロイ" everywhere
    const k = ss(B.mimi - 0.4, B.deploy2, t);
    if (k > 0.2) { headHold(you, t); you.face = 'dizzy'; } else { you.face = t < 1.0 ? 'look' : 'normal'; you.head.rotation.y = -0.2; }
    coworkers.forEach((P, i) => { if (t > 1.6 + i * 0.25) { P.face = 'happy'; P.head.rotation.x = -0.05; P.arms[0].sh.rotation.set(-1.2, 0, -0.4); P.arms[0].el.rotation.set(-0.4, 0, 0); } });
  } else if (t < SEC.three) {
    you.face = 'look'; you.head.rotation.set(-0.1, 0.25, 0.08); const A = you.arms[0]; A.sh.rotation.set(-1.6, 0, 0.35); A.el.rotation.set(-2.0, 0, 0);
  } else if (t < SEC.screen) {
    // 3 files: page splits into HTML / CSS / JS
    const split = [B.html, B.css, B.js];
    const pageA = 1 - ss(B.html - 0.2, B.html + 0.3, t);
    if (pageA > 0) { bigPage.visible = true; bigPage.position.set(X0, 1.65, 2.5); bigPage.rotation.set(0, Math.sin(t) * 0.08, 0); bigPage.scale.setScalar(lerp(0.6, 1, eOut(seg(t, SEC.three, SEC.three + 0.5))) * (0.7 + 0.3 * pageA)); bigPage.children[0].material.opacity = pageA; }
    docsBig.forEach((d, i) => { const k2 = eOut(seg(t, split[i] - 0.15, split[i] + 0.35)); if (k2 <= 0) return; const glow = ss(B.mittsu - 0.2, B.mittsu + 0.3, t); docAt(d, V(X0 + lerp(0, (i - 1) * 0.95, k2), 1.6 + Math.sin(t * 2 + i) * 0.04 + glow * 0.05, 2.5 + 0.1 * i), 0, (i - 1) * -0.18 * k2, (i - 1) * -0.06); d.scale.setScalar(0.5 + 0.5 * k2); });
  } else if (t < SEC.pcB) {
    crowd.forEach((P, i) => { P.root.visible = true; const r = 2.3 + (i % 3) * 0.7, a = lerp(-0.9, 0.9, (i % 5) / 4) + (i > 4 ? 0.12 : 0); place(P, X0 + 16 + Math.sin(a) * r, 0, -4 + Math.cos(a) * r + 1.6, Math.PI + a); P.head.rotation.x = -0.35; P.face = t > B.wake ? 'shock' : 'look'; if (i % 3 === 0) { P.arms[1].sh.rotation.set(-2.2, 0, 0.2); } });
  } else if (t < SEC.go) {
    // Browser-san lives in your PC: pops out of the monitor onto the desk
    const k = eOut(seg(t, B.browser - 0.1, B.browser + 0.4));
    const d = DESKS[MY]; const deskP = V(d.x + 0.28, DESK_Y, d.z - 0.12);
    if (k > 0) { bro.root.visible = true; const jump = seg(t, B.click + 0.05, SEC.go); placeM(bro, lerp(d.x, deskP.x, k) + lerp(0, -0.28, jump), DESK_Y + Math.sin(Math.PI * Math.min(1, k)) * 0.15 + Math.sin(Math.PI * jump) * 0.2, lerp(d.z - 0.3, deskP.z, k) + lerp(0, -0.16, jump), 0.45 * (1 - jump) + Math.PI * jump, 0.46 * (1 - 0.9 * eOut(jump))); bro.face = t > B.click ? 'happy' : 'wow'; }
    if (inR(t, B.click - 0.3, B.click + 0.3)) { const A = you.arms[0]; A.sh.rotation.set(-1.1, 0, -0.2); A.el.rotation.set(-0.3 - Math.max(0, Math.sin((t - B.click + 0.3) * 20)) * 0.2, 0, 0); }
    you.face = t > B.browser ? 'happy' : 'normal';
  } else if (t < SEC.ask) {
    // run from your PC (portal) along the data path to Webサーバーさん
    bro.root.visible = true; const k = eIO(seg(t, SEC.go + 0.05, SEC.ask - 0.1));
    { const zz = lerp(PORTAL.z - 0.3, -1.35, k); placeM(bro, X0 + 0.15, zz < -1.15 ? 0.18 : 0, zz, Math.PI, 1); } mascotWalk(bro, t, k < 1 ? 1 : 0, 12); bro.face = 'happy';
    srv.face = t > B.server ? 'happy' : 'normal';
  } else if (t < SEC.back) {
    bro.root.visible = true; placeM(bro, X0 + 0.15, 0.18, -1.35, Math.PI, 1); bro.face = t < B.onegai + 0.4 ? 'ask' : 'happy';
    bro.arms.forEach((A) => A.g.rotation.set(-1.2, 0, A.s * 0.2));
    const give = seg(t, B.onegai + 0.2, B.onegai + 0.8);
    srv.face = t > B.onegai - 0.2 ? 'happy' : 'normal'; if (give > 0) srv.arms.forEach((A) => A.g.rotation.set(-1.0 * Math.sin(Math.PI * give), 0, A.s * 0.25));
    docsTray.forEach((d, i) => { if (give <= 0) { trayDocs([d]); d.position.x = X0 - 0.36 + i * 0.36; return; } const from = V(X0 - 0.36 + i * 0.36, TRAY_Y, TRAY_Z), to = bro.root.localToWorld(V((i - 1) * 0.05, 0.4 + i * 0.012, 0.22)); d.visible = true; d.position.lerpVectors(from, to, eIO(give)); d.position.y += Math.sin(Math.PI * give) * 0.3; d.rotation.set(lerp(-Math.PI / 2, -0.2, give), 0, (i - 1) * 0.1); });
  } else if (t < SEC.paint) {
    bro.root.visible = true; const k = eIO(seg(t, SEC.back, SEC.paint - 0.15));
    { const zz = lerp(-1.35, PORTAL.z - 0.2, k); placeM(bro, X0 + 0.15, zz < -1.15 ? 0.18 : 0, zz, 0, 1); } mascotWalk(bro, t, 1, 12); bro.face = 'happy';
    carry(docsHand, bro, t, 0.24, 0.42); bro.arms.forEach((A) => A.g.rotation.set(-1.3, 0, A.s * 0.15));
  } else if (t < SEC.pub) {
    // paints the page on your screen
    const d = DESKS[MY]; bro.root.visible = true; placeM(bro, d.x - 0.47, DESK_Y, d.z - 0.16, 1.75, 0.46); bro.face = 'happy';
    const A = bro.arms[1]; A.g.rotation.set(-1.4 + Math.sin(t * 9) * 0.3, 0, -0.3);
    brush.visible = true; brush.position.copy(bro.root.localToWorld(V(0.14, 0.44 + Math.sin(t * 9) * 0.06, 0.2))); brush.rotation.set(0.2, 0, -0.9);
    docsDesk.forEach((dd, i) => docAt(dd, V(d.x + 0.42 + i * 0.03, DESK_Y + 0.004 + i * 0.002, d.z + 0.12 + i * 0.02), -Math.PI / 2, 0, 0.3 + i * 0.2));
    you.face = t > SEC.wakari ? 'happy' : 'look'; you.head.rotation.x = 0.05;
  } else if (t < SEC.place) {
    // publishing = many Browser-sans can get the code from the server
    trayDocs(docsTray, t);
    srv.face = 'happy';
    bros.forEach((R, i) => { R.root.visible = true; const a = lerp(-1.1, 1.1, i / 5), r = 1.9; const k = eOut(seg(t, SEC.pub + i * 0.25, SEC.pub + i * 0.25 + 0.9)); const p = V(X0 + Math.sin(a) * r * lerp(2.2, 1, k), 0, TRAY_Z + 0.2 + Math.cos(a) * r * lerp(2.2, 1, k)); placeM(R, p.x, 0, p.z, Math.atan2(X0 - p.x, TRAY_Z - p.z), 0.95); if (k < 1) mascotWalk(R, t + i, 1, 11); R.face = 'happy';
      const tg = B.sekai + 0.6 + i * 0.45; const kk = seg(t, tg, tg + 0.5);
      if (kk > 0) { for (let j = 0; j < 3; j++) { const cd = docsCopies[i * 3 + j]; const to = R.root.localToWorld(V((j - 1) * 0.04, 0.42 + j * 0.01, 0.22)); cd.visible = true; cd.position.lerpVectors(V(X0 - 0.36 + j * 0.36, TRAY_Y, TRAY_Z), to, eIO(kk)); cd.position.y += Math.sin(Math.PI * kk) * 0.35; cd.quaternion.copy(R.root.quaternion); cd.rotateX(lerp(-1.4, -0.2, kk)); } R.arms.forEach((A) => A.g.rotation.set(-1.2, 0, A.s * 0.2)); if (kk >= 1) R.root.position.y += Math.abs(Math.sin(t * 8 + i)) * 0.06; }
    });
  } else {
    // you, in cyber space, bring the code files to the server
    you.root.visible = true; resetPose(you, t);
    const standX = X0 + 0.15, standZ = -1.05;
    if (t < SEC.dep) {
      walk(you, t, [[X0 - 2.4, 0.4], [standX, standZ]], SEC.place - 0.1, B.oku - 0.3, Math.PI);
      const put = seg(t, B.oku - 0.1, B.oku + 0.5);
      if (put < 1) carry(docsHand, { root: you.root }, t, 0.32, 0.9);
      if (put > 0) { docsHand.forEach((d, i) => { const from = you.root.localToWorld(V((i - 1) * 0.05, 0.9, 0.32)); const to = V(X0 - 0.36 + i * 0.36, TRAY_Y + 0.003, TRAY_Z + 0.02); d.visible = true; d.position.lerpVectors(from, to, eIO(put)); d.rotation.set(lerp(-0.2, -Math.PI / 2, put), 0, (i - 1) * 0.08); }); }
      you.arms.forEach((A) => { A.sh.rotation.set(-1.3, 0, -A.s * 0.1); A.el.rotation.set(-0.4, 0, 0); }); you.face = 'happy'; srv.face = put > 0.5 ? 'happy' : 'normal';
    } else if (t < SEC.first) {
      place(you, standX, standZ, Math.PI);
      const swap = seg(t, B.koushin - 0.6, B.koushin + 0.2);
      docsTray.forEach((d, i) => { if (swap <= 0) { trayDocs([d]); d.position.x = X0 - 0.36 + i * 0.36; return; } d.visible = swap < 1; d.position.set(X0 - 0.36 + i * 0.36 + swap * 1.6 * (i - 1 + 0.3), TRAY_Y + swap * 1.2, TRAY_Z - swap * 0.6); d.rotation.set(-Math.PI / 2 + swap * 2, swap * 3, 0); });
      docsNew.forEach((d, i) => { if (swap <= 0) { const p = you.root.localToWorld(V((i - 1) * 0.05, 0.9, 0.32)); d.visible = true; d.position.copy(p); d.quaternion.copy(you.root.quaternion); d.rotateX(-0.2); d.rotateZ((i - 1) * 0.12); return; } const from = you.root.localToWorld(V((i - 1) * 0.05, 0.9, 0.32)), to = V(X0 - 0.36 + i * 0.36, TRAY_Y + 0.004, TRAY_Z + 0.02); d.visible = true; d.position.lerpVectors(from, to, eIO(swap)); d.rotation.set(lerp(-0.2, -Math.PI / 2, swap), 0, (i - 1) * 0.08); });
      you.arms.forEach((A) => { A.sh.rotation.set(-1.3, 0, -A.s * 0.1); A.el.rotation.set(-0.4, 0, 0); }); you.face = t > B.deploy3 + 0.6 ? 'happy' : 'normal';
      srv.face = t > B.deploy3 + 1.2 ? 'happy' : 'normal'; if (inR(t, B.deploy3 + 1.2, B.deploy3 + 1.8)) srv.arms[1].g.rotation.set(-2.2, 0, 0.6);
    } else if (t < SEC.local) {
      place(you, standX, standZ, Math.PI);
      const put = seg(t, B.todoke - 0.1, B.todoke + 0.5);
      docsHand.forEach((d, i) => { const from = you.root.localToWorld(V((i - 1) * 0.05, 0.9, 0.32)), to = V(X0 - 0.36 + i * 0.36, TRAY_Y + 0.003, TRAY_Z + 0.02); d.visible = true; d.position.lerpVectors(from, to, eIO(put)); if (put <= 0) { d.quaternion.copy(you.root.quaternion); d.rotateX(-0.2); d.rotateZ((i - 1) * 0.12); } else d.rotation.set(lerp(-0.2, -Math.PI / 2, put), 0, (i - 1) * 0.08); });
      you.arms.forEach((A) => { A.sh.rotation.set(-1.3, 0, -A.s * 0.1); A.el.rotation.set(-0.4, 0, 0); }); you.face = put > 0.5 ? 'happy' : 'normal'; srv.face = put > 0.5 ? 'happy' : 'normal';
    } else if (t < SEC.cyber2) {
      // back at your desk: localhost, only inside your PC
      sitAt(you, MY, t); typing(you, t); you.face = 'normal';
      dome.material.uniforms.uA.value = ss(B.naka - 0.6, B.naka, t) * (1 - ss(B.deploy4 + 0.3, B.deploy4 + 0.9, t));
    } else {
      // deployed: new code reaches the server and every Browser-san
      const arrive = seg(t, SEC.cyber2, SEC.cyber2 + 0.9);
      docsNew.forEach((d, i) => { d.visible = true; const from = V(X0 + (i - 1) * 0.3, 1.2, PORTAL.z - 0.4), to = V(X0 - 0.36 + i * 0.36, TRAY_Y + 0.004, TRAY_Z + 0.02); d.position.lerpVectors(from, to, eIO(arrive)); d.position.y += Math.sin(Math.PI * arrive) * 0.8; d.rotation.set(lerp(0, -Math.PI / 2, arrive), arrive * Math.PI * 2, 0); });
      srv.face = 'happy';
      bros.forEach((R, i) => { R.root.visible = true; const a = lerp(-1.1, 1.1, i / 5), r = 1.9; placeM(R, X0 + Math.sin(a) * r, 0, TRAY_Z + 0.2 + Math.cos(a) * r, Math.atan2(-Math.sin(a), -Math.cos(a)), 0.95);
        const tg = SEC.cyber2 + 1.0 + i * 0.22; const kk = seg(t, tg, tg + 0.5);
        if (kk > 0) { for (let j = 0; j < 3; j++) { const cd = docsCopies[i * 3 + j]; const to = R.root.localToWorld(V((j - 1) * 0.04, 0.42 + j * 0.01, 0.22)); cd.visible = true; cd.position.lerpVectors(V(X0 - 0.36 + j * 0.36, TRAY_Y, TRAY_Z), to, eIO(kk)); cd.position.y += Math.sin(Math.PI * kk) * 0.35; cd.quaternion.copy(R.root.quaternion); cd.rotateX(lerp(-1.4, -0.2, kk)); } R.arms.forEach((A) => A.g.rotation.set(-1.2, 0, A.s * 0.2)); R.face = 'happy'; if (kk >= 1) R.root.position.y += Math.abs(Math.sin(t * 8 + i)) * 0.07; }
      });
    }
  }
  if (t >= SEC.final && t < SEC.cyber2) { sitAt(you, MY, t); you.face = 'look'; you.head.rotation.set(-0.05, 0, 0); }
  window.GLOBE.rotation.y = t * 0.4;
  [you, ...coworkers, ...crowd].forEach((P) => { P.faceMat.map = P.faces[P.face] || P.faces.normal; });
  [bro, srv, ...bros].forEach(mascotFaceApply);
}

// ---------- cameras ----------
function shot(t) {
  const d = DESKS[MY], head = () => you.head.getWorldPosition(V(0, 0, 0));
  if (t < SEC.think) { const k = eIO(seg(t, 0.6, SEC.think)); return { p: V(lerp(-0.25, 0.9, k), lerp(1.45, 2.25, k), lerp(1.35, 2.7, k)), a: V(lerp(-0.7, -0.8, k), lerp(1.1, 1.0, k), lerp(-0.5, -0.7, k)), fov: lerp(45, 54, k), f: head };}
  if (t < SEC.three) { const k = seg(t, SEC.think, SEC.three); return { p: V(lerp(-0.12, -0.2, k), 1.38, lerp(-0.42, -0.3, k)), a: V(-0.74, 1.16, 0.37), fov: lerp(46, 42, k), f: head }; }
  if (t < SEC.screen) { const k = seg(t, SEC.three, SEC.screen); return { p: V(X0 + Math.sin(t * 0.3) * 0.2, 1.75, lerp(5.8, 5.3, k)), a: V(X0, 1.6, 2.5), fov: 44, f: () => V(X0, 1.6, 2.5) }; }
  if (t < SEC.pcB) { const k = seg(t, SEC.screen, SEC.pcB); return { p: V(X0 + 16 + lerp(-1.2, 0.6, k), lerp(1.6, 2.0, k), 6.2), a: V(X0 + 16, 2.3, -3), fov: 52, f: () => V(X0 + 16, 1.0, -1.5) }; }
  if (t < SEC.go) { const k = seg(t, SEC.pcB, SEC.go); return { p: V(d.x + lerp(0.75, 0.55, k), 1.3, d.z + lerp(0.7, 0.55, k)), a: V(d.x + 0.05, 1.0, d.z - 0.25), fov: 46, f: () => V(d.x + 0.1, 1.0, d.z - 0.2) }; }
  if (t < SEC.ask) { const k = seg(t, SEC.go, SEC.ask); return { p: V(X0 + lerp(5.6, 5.0, k), lerp(2.7, 2.4, k), lerp(3.4, 2.8, k)), a: V(X0 - 0.2, 0.6, 0.6), fov: 58, f: () => bro.root.getWorldPosition(V(0, 0.3, 0)) }; }
  if (t < SEC.back) return { p: V(X0 + 3.0, 1.15, -0.1), a: V(X0 + 0.05, 0.62, -2.1), fov: 50, f: () => V(X0 + 0.1, 0.7, -1.9) };
  if (t < SEC.paint) { const z = bro.root.position.z; return { p: V(X0 + 1.7, 1.05, z + 1.9), a: V(X0, 0.45, z - 0.2), fov: 50, f: () => bro.root.getWorldPosition(V(0, 0.3, 0)) }; }
  if (t < SEC.pub) { const k = seg(t, SEC.paint, SEC.pub); return { p: V(d.x + lerp(0.95, 1.2, k), lerp(1.2, 1.4, k), d.z + lerp(0.45, 0.8, k)), a: V(d.x + 0.15, 1.02, d.z - 0.28), fov: lerp(44, 50, k), f: () => V(d.x + 0.3, 1.0, d.z - 0.25) }; }
  if (t < SEC.place) { const k = seg(t, SEC.pub, SEC.place); return { p: V(X0 + lerp(3.6, 3.0, k), lerp(2.6, 2.2, k), lerp(2.6, 2.0, k)), a: V(X0, 0.8, -1.8), fov: 56, f: () => V(X0, 0.9, -1.6) }; }
  if (t < SEC.local) { const k = seg(t, SEC.place, SEC.local); return { p: V(X0 + 2.0 + Math.sin(k * 3) * 0.3, 1.5, lerp(1.4, 0.9, k)), a: V(X0, 0.95, -1.7), fov: 50, f: () => V(X0, 0.9, -1.5) }; }
  if (t < SEC.cyber2) { const k = seg(t, SEC.local, SEC.cyber2); return { p: V(d.x + lerp(1.6, 2.4, k), lerp(1.7, 2.3, k), d.z + lerp(2.0, 2.8, k)), a: V(d.x, 0.95, d.z - 0.1), fov: 50, f: () => V(d.x, 1.0, d.z) }; }
  const k = eIO(seg(t, SEC.cyber2, DURATION)); return { p: V(X0 + lerp(2.6, 4.2, k), lerp(2.0, 3.4, k), lerp(2.0, 4.0, k)), a: V(X0 + 0.6, 1.0, -2.2), fov: 54, f: () => V(X0, 0.9, -1.8) };
}
function applyCamera(t) {
  const s = shot(t); camera.position.copy(s.p); camera.position.x += Math.sin(t * 0.9) * 0.006; camera.position.y += Math.sin(t * 1.3 + 1) * 0.005;
  camera.lookAt(s.a); camera.fov = s.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  bokeh.uniforms.aperture.value = s.ap ?? 0.0015;
  return camera.position.distanceTo(s.f());
}
// ---------- post ----------
let composer, bokeh, gradePass;
class Toggle extends Pass { constructor(objs, vis) { super(); this.objs = objs; this.vis = vis; this.needsSwap = false; } render() { this.objs().forEach((o) => o && (o.visible = this.vis)); } }
function buildPost() {
  composer = new EffectComposer(renderer); composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const fx = () => [...shafts, dust]; composer.addPass(new Toggle(fx, false));
  const gtao = new GTAOPass(scene, camera, W, H); gtao.updateGtaoMaterial({ radius: 0.35, distanceExponent: 1.5, thickness: 1.5, scale: 1.0, samples: 16 }); gtao.blendIntensity = 0.9; composer.addPass(gtao);
  bokeh = new BokehPass(scene, camera, { focus: 3, aperture: 0.002, maxblur: 0.005 }); composer.addPass(bokeh);
  composer.addPass(new Toggle(fx, true));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.26, 0.55, 1.1));
  composer.addPass(new OutputPass()); composer.addPass(new SMAAPass(W, H));
  gradePass = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uT; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); float v = smoothstep(0.9, 0.3, length(vUv-0.5)); c.rgb *= mix(0.82, 1.0, v);
        c.rgb = mix(c.rgb, c.rgb*vec3(1.03,1.0,0.95), 0.6);
        float g = fract(sin(dot(vUv*1080.0 + fract(uT*7.13)*97.0, vec2(12.9898,78.233)))*43758.5453); c.rgb += (g-0.5)*0.02; gl_FragColor = c; }`,
  });
  composer.addPass(gradePass);
}

// ================= 2D overlay =================
function spans(list, x, y, size, o = {}) {
  const wt = o.weight || 800, s = o.scale ?? 1, a = o.alpha ?? 1; if (s <= 0.001 || a <= 0.001) return;
  ctx.save(); ctx.globalAlpha *= clamp(a); ctx.translate(x, y); ctx.scale(s, s); ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  const items = list.map((sp) => { const sz = size * (sp[2] || 1); ctx.font = `${wt} ${sz}px ${GOTH}`; return { t: sp[0], c: sp[1] || WHITE, sz, w: ctx.measureText(sp[0]).width }; });
  const tw = items.reduce((p, b) => p + b.w, 0); let cx = o.align === 'left' ? 0 : -tw / 2;
  for (const it of items) { ctx.font = `${wt} ${it.sz}px ${GOTH}`; ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = Math.max(6, it.sz * 0.24); ctx.shadowOffsetY = it.sz * 0.03; ctx.fillStyle = it.c; ctx.fillText(it.t, cx, 0); ctx.fillText(it.t, cx, 0); ctx.shadowBlur = 0; ctx.shadowColor = 'transparent'; cx += it.w; }
  ctx.restore();
}
const txt = (s, x, y, size, o = {}) => spans([[s, o.color || WHITE]], x, y, size, o);
function ft(s, x, y, size, color = '#1d2433', weight = 700, align = 'left') { ctx.font = `${weight} ${size}px ${GOTH}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
function rrect(x, y, w, h, r, fill, stroke, lw = 3) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.stroke(); } }
const pop = (t, t0, d = 0.28) => (t < t0 ? 0 : eBack(clamp((t - t0) / d)));
const slam = (t, t0, d = 0.16) => (t < t0 ? { s: 0, a: 0 } : { s: lerp(2.2, 1, eOut(clamp((t - t0) / d))), a: clamp(((t - t0) / d) * 3) });
const fade = (t, a, b) => 1 - seg(t, a, b);
const fin = (t, a, d = 0.25) => seg(t, a, a + d);
function chip(x, y, text, a = 1, s = 1, o = {}) { if (a <= 0 || s <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); const size = o.size || 34; ctx.font = `900 ${size}px ${GOTH}`; const w = ctx.measureText(text).width + size * 1.2; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; rrect(-w / 2, -size * 0.85, w, size * 1.7, size * 0.85, o.bg || 'rgba(12,14,26,0.85)'); ctx.shadowBlur = 0; ft(text, 0, 2, size, o.fg || '#fff', 900, 'center'); ctx.restore(); }
function head3(t, a, b, small, big, o = {}) {
  if (t < a || t >= b) return; const al = fade(t, b - 0.15, b); const t1 = o.t1 ?? a + 0.2; const size = o.size || 84; const y = o.y ?? 150;
  if (small) txt(small, W / 2, y - size * 0.92, 42, { weight: 800, scale: pop(t, a), alpha: al });
  const sl = slam(t, t1); const L = Array.isArray(big) ? big : [[big, Y]];
  let tw = 0; for (const sp of L) { ctx.font = `900 ${size * (sp[2] || 1)}px ${GOTH}`; tw += ctx.measureText(sp[0]).width; }
  if (sl.a > 0) { ctx.save(); ctx.globalAlpha = sl.a * al * 0.72; ctx.translate(W / 2, y); ctx.scale(sl.s, sl.s); rrect(-tw / 2 - 30, -size * 0.72, tw + 60, size * 1.44, 24, 'rgba(10,10,20,1)'); ctx.restore(); }
  spans(L, W / 2, y, size, { weight: 900, scale: sl.s, alpha: sl.a * al });
}
const proj = (v) => { const p = v.clone().project(camera); return { x: (p.x * 0.5 + 0.5) * W, y: (-p.y * 0.5 + 0.5) * H, z: p.z }; };
const headTop = (P, up = 0.36) => proj(P.head.getWorldPosition(V(0, 0, 0)).add(V(0, up, 0)));
// context gauge
function gauge(x, y, val, a, o = {}) {
  if (a <= 0) return; const w = o.w || 520, h = 46;
  ctx.save(); ctx.globalAlpha *= a;
  rrect(x - w / 2 - 20, y - 64, w + 40, 128, 26, 'rgba(12,14,26,0.82)');
  ft('コンテキスト', x - w / 2, y - 28, 30, '#fff', 900, 'left');
  const col = val < 0.45 ? '#4cd98a' : val < 0.8 ? '#f4c34a' : '#ff5a5a';
  const lab = o.label || (val > 0.97 ? '満タン！' : val < 0.3 ? 'スカスカ' : '');
  if (lab) ft(lab, x + w / 2, y - 28, 30, col, 900, 'right');
  rrect(x - w / 2, y + 2, w, h, h / 2, 'rgba(255,255,255,0.15)');
  if (val > 0.005) { ctx.save(); ctx.beginPath(); ctx.roundRect(x - w / 2, y + 2, w, h, h / 2); ctx.clip(); ctx.fillStyle = col; ctx.fillRect(x - w / 2, y + 2, w * val, h); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x - w / 2, y + 2, w * val, h * 0.4); ctx.restore(); }
  if (val > 0.97 && o.flash) { ctx.globalAlpha *= 0.5 + 0.5 * Math.sin(o.flash * 18); rrect(x - w / 2 - 4, y - 2, w + 8, h + 8, h / 2 + 4, null, '#ff5a5a', 5); }
  ctx.restore();
}
// thought bubble packed with study cards
const CARDS = [['★ 大事', '#ffe066', '#7a4b00'], ['国語 漢字', '#ffd9d2'], ['数学 公式', '#d8e6ff'], ['英単語', '#eadcff'], ['出ない所', '#e3e3e3', '#777'], ['理科 実験', '#d6f2e2'], ['授業の雑談', '#e3e3e3', '#777'], ['社会 年号', '#ffecc8'], ['出ない所', '#e3e3e3', '#777'], ['プリント', '#f3f1ea'], ['余談メモ', '#e3e3e3', '#777'], ['出ない所', '#e3e3e3', '#777'], ['例題', '#d8e6ff'], ['出ない所', '#e3e3e3', '#777']];
const GAUGE_X = 770;
function thought(t, anchor, a) {
  if (a <= 0) return; const cx = 775, cy = 480, bw = 450, bh = 360;
  const n = Math.floor(clamp((t - B.denai + 0.2) / 3.0) * CARDS.length + 0.001) + (t > B.denai - 0.2 ? 1 : 0);
  const full = ss(B.panpan - 0.2, B.panpan + 0.2, t); const shake = full * Math.sin(t * 40) * 3;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(shake, 0);
  // trail circles toward the head
  for (let i = 0; i < 3; i++) { const k = (i + 1) / 4; const x = lerp(cx - 170, anchor.x, k), y = lerp(cy + bh / 2 - 40, anchor.y, k); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(x, y, 22 - i * 6, 0, 7); ctx.fill(); }
  const s = pop(t, B.atama - 0.6, 0.35) * (1 + full * 0.06);
  ctx.translate(cx, cy); ctx.scale(s, s);
  ctx.fillStyle = full > 0.5 ? '#fff4f2' : '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24;
  ctx.beginPath(); for (let i = 0; i < 14; i++) { const ang = (i / 14) * Math.PI * 2; const px = Math.cos(ang) * bw / 2, py = Math.sin(ang) * bh / 2; ctx.moveTo(px + 52, py); ctx.arc(px, py, 52, 0, 7); } ctx.ellipse(0, 0, bw / 2, bh / 2, 0, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
  // cards pile from the bottom up; the star card ends up buried
  for (let i = 0; i < Math.min(n, CARDS.length); i++) {
    const [lab, bg, fg] = CARDS[i]; const k = eOut(seg(t, B.denai - 0.2 + (i / CARDS.length) * 3.0, B.denai + (i / CARDS.length) * 3.0));
    const col = i % 3, row = Math.floor(i / 3); const x = -150 + col * 150 + ((row % 2) ? 26 : 0) + Math.sin(i * 2.3) * 8, y = 120 - row * 58 - (1 - k) * 60;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(i * 1.7) * 0.12); ctx.globalAlpha *= k;
    rrect(-68, -24, 136, 48, 10, bg, 'rgba(0,0,0,0.12)', 2); ft(lab, 0, 2, 24, fg || '#2a2f3a', 900, 'center'); ctx.restore();
  }
  for (const [dx, dy, r, d] of [[18, -14, 0.15, 0], [-22, 10, -0.1, 0.15], [4, 4, 0.05, 0.3]]) { const k = eOut(seg(t, B.umore - 0.3 + d, B.umore + d)); if (k <= 0) continue; ctx.save(); ctx.translate(-150 + dx, 120 + dy - (1 - k) * 70); ctx.rotate(r); ctx.globalAlpha *= k; rrect(-68, -24, 136, 48, 10, '#e3e3e3', 'rgba(0,0,0,0.12)', 2); ft('出ない所', 0, 2, 24, '#777', 900, 'center'); ctx.restore(); }
  if (t > B.umore) { const k = ss(B.umore, B.umore + 0.4, t); ctx.globalAlpha *= k; ctx.strokeStyle = '#ff5a5a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(-150, 120, 54, 0, 7); ctx.stroke(); ft('埋もれた…', -150, 190, 28, '#ff5a5a', 900, 'center'); }
  ctx.restore();
}
function clockIcon(x, y, t, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(pop(t, B.jikan - 0.3), pop(t, B.jikan - 0.3)); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(0, 0, 80, 0, 7); ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#2a2f3a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, 0, 72, 0, 7); ctx.stroke(); for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; ctx.fillStyle = '#2a2f3a'; ctx.fillRect(Math.cos(an) * 58 - 3, Math.sin(an) * 58 - 3, 6, 6); } const sp = (t - B.jikan + 0.3) * 14; ctx.lineCap = 'round'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(sp / 12) * 34, -Math.cos(sp / 12) * 34); ctx.stroke(); ctx.strokeStyle = '#e04848'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(sp) * 54, -Math.cos(sp) * 54); ctx.stroke(); ctx.restore(); }
// time comparison: 5 subjects in series vs in parallel
function timeBars(t, a) {
  if (a <= 0) return; const x0 = 150, w = 780, y1 = 230, y2 = 400, bw = w / 5;
  ctx.save(); ctx.globalAlpha *= a; rrect(x0 - 40, 120, w + 80, 420, 30, 'rgba(12,14,26,0.86)');
  ft('1人だと', x0, 175, 32, '#fff', 900); ft('5人同時だと', x0, 345, 32, '#fff', 900);
  const p1 = seg(t, B.douji - 0.2, B.douji + 2.4), p2 = seg(t, B.douji - 0.2, B.douji + 0.5);
  SUBJ.forEach((sj, i) => { const k = clamp(p1 * 5 - i); if (k > 0) { rrect(x0 + i * bw + 3, y1 - 26, (bw - 6) * k, 52, 10, sj.c); if (k > 0.6) ft(sj.k, x0 + i * bw + bw / 2, y1 + 1, 26, '#fff', 900, 'center'); } });
  SUBJ.forEach((sj, i) => { const k = p2; if (k > 0) { rrect(x0 + 3, y2 - 30 + i * 24, (bw - 6) * k, 20, 7, sj.c); } });
  const g = ss(B.ikkyobun - 0.2, B.ikkyobun + 0.2, t);
  if (g > 0) { ctx.globalAlpha *= g; ctx.strokeStyle = Y; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x0 + bw, y2 - 44); ctx.lineTo(x0 + bw, y2 + 110); ctx.stroke(); ctx.setLineDash([]); spans([['かかる時間＝', '#fff'], ['1教科分', Y]], x0 + bw + 260, y2 + 40, 44, { weight: 900 }); }
  ctx.restore();
}
function noteCard(t, a) {
  if (a <= 0) return; const x = 700, y = 470, w = 420, h = 430;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); const s = pop(t, B.manben - 0.5, 0.35); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 26; rrect(-w / 2, -h / 2, w, h, 22, '#ffffff'); ctx.shadowBlur = 0;
  ft('テスト対策ノート', -w / 2 + 34, -h / 2 + 50, 32, '#1d2433', 900);
  ctx.fillStyle = '#e8e6e0'; ctx.fillRect(-w / 2 + 34, -h / 2 + 84, w - 68, 3);
  SUBJ.forEach((sj, i) => { const yy = -h / 2 + 128 + i * 60; const k = ss(B.manben - 0.2 + i * 0.22, B.manben + i * 0.22, t);
    rrect(-w / 2 + 34, yy - 20, 14, 40, 4, sj.c); ft(sj.k, -w / 2 + 64, yy + 1, 30, '#2a2f3a', 800);
    ctx.fillStyle = '#d8d6d0'; ctx.fillRect(-w / 2 + 150, yy - 3, 150, 6);
    if (k > 0) { ctx.save(); ctx.translate(w / 2 - 60, yy); ctx.scale(eBack(k), eBack(k)); ctx.fillStyle = '#2fbf6f'; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-9, 1); ctx.lineTo(-2, 8); ctx.lineTo(10, -7); ctx.stroke(); ctx.restore(); } });
  const done = ss(B.kansei - 0.1, B.kansei + 0.3, t); if (done > 0) { ctx.save(); ctx.globalAlpha *= done; ctx.translate(0, h / 2 - 8); ctx.rotate(-0.08); ctx.scale(lerp(1.6, 1, done), lerp(1.6, 1, done)); rrect(-90, -34, 180, 68, 14, null, '#e04848', 6); ft('完成！', 0, 2, 40, '#e04848', 900, 'center'); ctx.restore(); }
  ctx.restore();
}
function orchLines(t, a) {
  if (a <= 0) return; const hand = proj(you.arms[0].hd.getWorldPosition(V(0, 0, 0)));
  friends.forEach((P, i) => { const p = headTop(P, 0.12); const k = ss(B.shiki - 0.2 + i * 0.08, B.shiki + 0.2 + i * 0.08, t); if (k <= 0) return;
    ctx.save(); ctx.globalAlpha *= a * k; ctx.strokeStyle = SUBJ[i].c; ctx.lineWidth = 6; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 60; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(hand.x, hand.y); ctx.lineTo(lerp(hand.x, p.x, k), lerp(hand.y, p.y, k)); ctx.stroke(); ctx.setLineDash([]);
    const u = ((t * 0.9 + i * 0.2) % 1); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(lerp(hand.x, p.x, u * k), lerp(hand.y, p.y, u * k), 7, 0, 7); ctx.fill(); ctx.restore(); });
}

// subtitles
const KW = ['デプロイ', 'Webサーバーさん', 'ブラウザさん', 'HTML', 'CSS', 'JavaScript', 'localhost:3000', '公開', '本番環境', '世界中', 'コード'];
function wrapJa(s, max = 17) {
  const parts = s.split(/(?<=、|。|？|！|…)/); const lines = []; let cur = '';
  for (const p of parts) { if ([...(cur + p)].length > max && cur) { lines.push(cur); cur = p; } else cur += p; }
  if (cur) lines.push(cur);
  return lines.flatMap((l) => { const c = [...l]; if (c.length <= max) return [l]; const mid = c.length / 2; let best = -1, bd = 1e9;
    for (let i = 3; i < c.length - 3; i++) if ('はがをにでのもとへや」'.includes(c[i - 1]) && !'ゃゅょっー」、。'.includes(c[i]) && Math.abs(i - mid) < bd) { bd = Math.abs(i - mid); best = i; }
    if (best < 0) best = Math.ceil(mid); return [c.slice(0, best).join(''), c.slice(best).join('')]; });
}
function kwSpans(line) { const re = new RegExp(`(${KW.join('|')})`, 'g'); return line.split(re).filter(Boolean).map((p) => [p, KW.includes(p) ? Y : WHITE]); }
function drawSubs(t) {
  for (const l of SCRIPT) {
    if (l.id === 'l12' || l.id === 'l13' || l.id === 'l14') continue; // shown big in the middle instead
    const st = VO[l.id], en = st + DUR[l.id] + 0.12; if (t < st || t > en) continue;
    const all = wrapJa(l.text.replace(/[「」]/g, '')); const pages = []; for (let i = 0; i < all.length; i += 2) pages.push(all.slice(i, i + 2));
    const tot = all.join('').length, prog = (t - st) / DUR[l.id]; let acc = 0, lines = pages[pages.length - 1];
    for (const pg of pages) { const n = pg.join('').length; if (prog < (acc + n) / tot) { lines = pg; break; } acc += n; }
    const y0 = 975 - (lines.length - 1) * 31; lines.forEach((ln, i) => spans(kwSpans(ln), W / 2, y0 + i * 62, 46, { weight: 800 }));
  }
}
const band = (() => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); let gr = g.createLinearGradient(0, H - 260, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.6)'); g.fillStyle = gr; g.fillRect(0, H - 260, W, 260); gr = g.createLinearGradient(0, 0, 0, 260); gr.addColorStop(0, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, 260); return c; })();

function flash(t, t0, dur, color = '#fff', peak = 1) { if (t < t0 || t > t0 + dur) return; ctx.save(); ctx.globalAlpha = peak * (1 - (t - t0) / dur); ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }
function dim(t, a, b, k = 0.6) { const v = fin(t, a, 0.3) * fade(t, b - 0.3, b) * k; if (v > 0) { ctx.fillStyle = `rgba(6,8,16,${v})`; ctx.fillRect(0, 0, W, H); } }
// ---------- 2D kit for this video ----------
const RED = '#ff5a6a', GREEN = '#4cd98a', BLUE = '#5aa0ff';
function heartPath(x, y, s) { ctx.beginPath(); ctx.moveTo(x, y + s * 0.35); ctx.bezierCurveTo(x - s, y - s * 0.3, x - s * 0.5, y - s, x, y - s * 0.45); ctx.bezierCurveTo(x + s * 0.5, y - s, x + s, y - s * 0.3, x, y + s * 0.35); ctx.closePath(); }
function heart(x, y, s, a = 1, c = '#ff5c8a') { if (a <= 0 || s <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 12; ctx.fillStyle = c; heartPath(x, y, s); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(x - s * 0.38, y - s * 0.42, s * 0.14, s * 0.09, -0.6, 0, 7); ctx.fill(); ctx.restore(); }
function brokenHeart(x, y, s, a, split) { if (a <= 0) return; for (const d of [-1, 1]) { ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + d * split * 30, y + split * 10); ctx.rotate(d * split * 0.4); ctx.beginPath(); ctx.rect(d < 0 ? -s * 1.2 : 0, -s * 1.2, s * 1.2, s * 2.4); ctx.clip(); ctx.fillStyle = '#7a7f8c'; heartPath(0, 0, s); ctx.fill(); ctx.restore(); } }
function floatHearts(x, y, t, t0, n = 5, c) { for (let i = 0; i < n; i++) { const k = (t - t0 - i * 0.18); if (k < 0 || k > 1.6) continue; heart(x + Math.sin(i * 2.3 + k * 3) * 40 + (i - n / 2) * 18, y - k * 140, 20 + (i % 3) * 7, 1 - k / 1.6, c); } }
function sparkles(x, y, t, r = 120, a = 1) { if (a <= 0) return; for (let i = 0; i < 7; i++) { const an = i * 0.9 + t * 0.5, k = (Math.sin(t * 3 + i * 1.7) + 1) / 2; const px = x + Math.cos(an) * r * (0.7 + 0.3 * Math.sin(i)), py = y + Math.sin(an) * r * 0.8; ctx.save(); ctx.globalAlpha *= a * k; ctx.translate(px, py); ctx.fillStyle = '#fff6c0'; ctx.shadowColor = '#ffe680'; ctx.shadowBlur = 14; ctx.beginPath(); const s = 10 + 6 * k; for (let j = 0; j < 8; j++) { const aa = j * Math.PI / 4, rr = j % 2 ? s * 0.28 : s; ctx.lineTo(Math.sin(aa) * rr, -Math.cos(aa) * rr); } ctx.closePath(); ctx.fill(); ctx.restore(); } }
function bolt(x0, y0, x1, y1, t, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.lineJoin = 'round'; for (const [w, c] of [[16, 'rgba(255,220,80,0.5)'], [7, '#fff3a0']]) { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i <= 8; i++) { const u = i / 8, j = (i % 2 ? 1 : -1) * 26 * Math.sin(Math.PI * u) * (0.6 + 0.4 * Math.sin(t * 40 + i)); ctx.lineTo(lerp(x0, x1, u) + j * 0.3, lerp(y0, y1, u) + j); } ctx.stroke(); } ctx.restore(); }
function speech(x, y, ax, ay, lines, a, s, o = {}) {
  if (a <= 0 || s <= 0) return; const size = o.size || 38; lines = Array.isArray(lines) ? lines : [lines];
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `900 ${size}px ${GOTH}`;
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 1.3, h = lines.length * size * 1.35 + size * 0.9;
  ctx.translate(x, y); ctx.scale(s, s); const bg = o.bg || '#fff', fg = o.fg || '#1a1d2b';
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 6; ctx.fillStyle = bg;
  if (o.spiky) { ctx.beginPath(); const n = 22; for (let i = 0; i < n; i++) { const an = i / n * Math.PI * 2, r = i % 2 ? 1 : 1.12; ctx.lineTo(Math.cos(an) * w / 2 * r, Math.sin(an) * h / 2 * r); } ctx.closePath(); ctx.fill(); }
  else { ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(34, h / 2)); ctx.fill(); }
  const dx = (ax - x) / s, dy = (ay - y) / s, bx = clamp(dx * 0.4, -w / 2 + 40, w / 2 - 40), by = dy > 0 ? h / 2 - 4 : -h / 2 + 4;
  ctx.beginPath(); ctx.moveTo(bx - 20, by); ctx.lineTo(bx + 20, by); ctx.lineTo(lerp(bx, dx, 0.6), lerp(by, dy, 0.6)); ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent';
  lines.forEach((l, i) => ft(l, 0, (i - (lines.length - 1) / 2) * size * 1.35 + 2, size, o.colors?.[i] || fg, 900, 'center'));
  ctx.restore();
}
const hp = (P, up = 0.34) => headTop(P, up);
// generic code editor card
function editor(x, y, w, title, rows, a, o = {}) {
  if (a <= 0) return; const lh = o.lh || 56, h = 84 + rows.length * lh + (o.extra || 24);
  ctx.save(); ctx.globalAlpha *= a; const s = lerp(0.94, 1, eOut(clamp(a))); ctx.translate(x + w / 2, y + h / 2); ctx.scale(s, s); ctx.translate(-x - w / 2, -y - h / 2);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 36; rrect(x, y, w, h, 22, '#1f2430'); ctx.shadowBlur = 0;
  ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, 64, [22, 22, 0, 0]); ctx.clip(); ctx.fillStyle = '#2a3040'; ctx.fillRect(x, y, w, 64); ctx.restore();
  [RED, '#f4c34a', GREEN].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 30 + i * 26, y + 32, 8, 0, 7); ctx.fill(); });
  ft(title, x + 120, y + 33, 28, '#e8ecf4', 800);
  rows.forEach((r, i) => {
    const yy = y + 84 + i * lh + lh / 2; const al = r.a ?? 1; if (al <= 0) return;
    ctx.save(); ctx.globalAlpha *= al;
    if (r.bg) { ctx.fillStyle = r.bg; ctx.fillRect(x + 12, yy - lh / 2 + 3, w - 24, lh - 6); }
    if (r.n !== undefined) ft(String(r.n), x + 46, yy + 1, 26, '#6c7486', 700, 'right');
    ft(r.t, x + 74, yy + 1, r.size || 32, r.c || '#e8ecf4', r.w || 800);
    if (r.tag) { ctx.font = `800 22px ${GOTH}`; const tw = ctx.measureText(r.tag).width + 26; rrect(x + w - tw - 26, yy - 17, tw, 34, 17, r.tagBg || 'rgba(255,255,255,0.15)'); ft(r.tag, x + w - tw / 2 - 26, yy + 1, 22, '#fff', 800, 'center'); }
    ctx.restore();
  });
  ctx.restore(); return h;
}
// three conflict buttons; idx = highlighted one
function conflictButtons(x, y, idx, k, t) {
  const labels = ['Accept Current Change', 'Accept Incoming Change', 'Accept Both Changes'];
  const ws = labels.map((l) => { ctx.font = `800 21px ${GOTH}`; return ctx.measureText(l).width + 24; });
  const tot = ws.reduce((p, b) => p + b, 0) + 20; let cx = x - tot / 2;
  labels.forEach((l, i) => {
    const on = i === idx && k > 0; const sc = on ? 1 + 0.1 * eBack(clamp(k)) : 1;
    ctx.save(); ctx.translate(cx + ws[i] / 2, y); ctx.scale(sc, sc);
    if (on) { ctx.shadowColor = Y; ctx.shadowBlur = 30 * k; }
    rrect(-ws[i] / 2, -22, ws[i], 44, 11, on ? Y : 'rgba(255,255,255,0.12)', on ? null : 'rgba(255,255,255,0.35)', 2);
    ctx.shadowBlur = 0; ft(l, 0, 1, 21, on ? '#1d2433' : '#e8ecf4', 800, 'center'); ctx.restore();
    if (on && k > 0.2) { const px = cx + ws[i] / 2 + 30, py = y + 28 - Math.sin(Math.min(1, k * 2) * Math.PI) * 6; ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 34); ctx.lineTo(9, 26); ctx.lineTo(16, 40); ctx.lineTo(22, 37); ctx.lineTo(15, 23); ctx.lineTo(26, 23); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
    cx += ws[i] + 10;
  });
}
// original mascot standing in for "GitHub" (not the real logo or character)
function mascot(x, y, s, t, a) {
  if (a <= 0 || s <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y + Math.sin(t * 3) * 8); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#2d333b'; ctx.beginPath(); ctx.roundRect(-110, -100, 220, 200, 70); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#3d444e'; ctx.beginPath(); ctx.ellipse(0, 40, 70, 46, 0, 0, 7); ctx.fill();
  // branch-icon antenna
  ctx.strokeStyle = '#f0883e'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, -100); ctx.lineTo(-14, -160); ctx.moveTo(-14, -120); ctx.quadraticCurveTo(-14, -135, 16, -150); ctx.stroke();
  ctx.fillStyle = '#f0883e'; [[-14, -168], [20, -156]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 12, 0, 7); ctx.fill(); });
  // face
  for (const sx of [-42, 42]) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(sx, -30, 28, 34, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1b1f24'; ctx.beginPath(); ctx.ellipse(sx + 4, -24, 15, 20, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(sx - 2, -34, 6, 0, 7); ctx.fill(); }
  ctx.strokeStyle = '#ff9fb2'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-58, -82); ctx.lineTo(-28, -72); ctx.moveTo(58, -82); ctx.lineTo(28, -72); ctx.stroke();
  ctx.fillStyle = '#c4505e'; ctx.beginPath(); ctx.ellipse(0, 22, 18, 12, 0, 0, 7); ctx.fill();
  // arms pointing
  ctx.strokeStyle = '#2d333b'; ctx.lineWidth = 26; ctx.beginPath(); ctx.moveTo(-100, 20); ctx.lineTo(-150, -20 + Math.sin(t * 6) * 10); ctx.moveTo(100, 20); ctx.lineTo(150, -20 - Math.sin(t * 6) * 10); ctx.stroke();
  ctx.restore();
}

// ---------- 2D overlay for the deploy video ----------
const P3 = (x, y, z) => proj(V(x, y, z));
function ring(x, y, r, a, c = '#7ff3ff') { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = c; ctx.lineWidth = 6; ctx.shadowColor = c; ctx.shadowBlur = 18; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.restore(); }
function cursor(x, y, s, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1d2433'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 40); ctx.lineTo(11, 30); ctx.lineTo(19, 47); ctx.lineTo(26, 44); ctx.lineTo(18, 28); ctx.lineTo(31, 28); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); }
function bigX(x, y, s, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = '#ff3b4d'; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.moveTo(-140, -140); ctx.lineTo(140, 140); ctx.moveTo(140, -140); ctx.lineTo(-140, 140); ctx.stroke(); ctx.restore(); }
function cloud(x, y, w, h, a, s) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#fff'; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.beginPath(); for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; const px = Math.cos(an) * w / 2, py = Math.sin(an) * h / 2; ctx.moveTo(px + 50, py); ctx.arc(px, py, 50, 0, 7); } ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); ctx.fill(); ctx.restore(); }
function globeIcon(x, y, r, a) { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#3f7fe0'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r * 0.45, r, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x - r * 0.85, y - r * 0.5); ctx.lineTo(x + r * 0.85, y - r * 0.5); ctx.moveTo(x - r * 0.85, y + r * 0.5); ctx.lineTo(x + r * 0.85, y + r * 0.5); ctx.stroke(); ctx.restore(); }
function speedLines(t, t0, d = 0.45) { const k = seg(t, t0, t0 + d); if (k <= 0 || k >= 1) return; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; for (let i = 0; i < 40; i++) { const an = h1(i) * Math.PI * 2, r0 = 260 + h1(i + 9) * 200 + k * 300, r1 = r0 + 120 + h1(i + 3) * 200; ctx.lineWidth = 3 + h1(i + 5) * 6; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(an) * r0, H / 2 + Math.sin(an) * r0); ctx.lineTo(W / 2 + Math.cos(an) * r1, H / 2 + Math.sin(an) * r1); ctx.stroke(); } ctx.restore(); }
const CUTS = () => [SEC.think, SEC.three, SEC.screen, SEC.pcB, SEC.go, SEC.ask, SEC.back, SEC.paint, SEC.pub, SEC.place, SEC.local, SEC.cyber2];

function overlay(t) {
  ctx.drawImage(band, 0, 0);
  // ---- intro: "デプロイって何？" then deploy bubbles everywhere
  if (t < SEC.think) {
    const yh = headTop(you, 0.3);
    if (t < 1.35) speech(yh.x + 40, yh.y - 120, yh.x, yh.y - 20, 'デプロイって何？', fin(t, 0.05) * fade(t, 1.15, 1.35), pop(t, 0.05), { size: 48 });
    const anchors = [() => P3(DESKS[MY].x, 1.2, DESKS[MY].z - 0.3), ...coworkers.map((P) => () => headTop(P, 0.3)), () => { const p = new THREE.Vector3(); window.PHONE.getWorldPosition(p); return proj(p); }];
    const N = 26;
    for (let i = 0; i < N; i++) {
      const t0 = 1.15 + Math.pow(i / N, 0.75) * (SEC.think - 1.5);
      if (t < t0) continue;
      const base = i < anchors.length ? anchors[i]() : { x: 120 + h1(i * 3) * 840, y: 160 + h1(i * 7) * 620 };
      const off = i < anchors.length ? { x: 30, y: -90 } : { x: 0, y: 0 };
      const s = pop(t, t0, 0.22) * (0.75 + h1(i * 11) * 0.6);
      ctx.save(); ctx.translate(base.x + off.x + Math.sin(t * 3 + i) * 6, base.y + off.y + Math.cos(t * 2.5 + i) * 5); ctx.rotate((h1(i * 5) - 0.5) * 0.35);
      speech(0, 0, i < anchors.length ? -off.x : (h1(i) - 0.5) * 80, i < anchors.length ? -off.y + 10 : 70, 'デプロイ', 1, s, { size: 40, bg: i % 4 === 0 ? '#ffe9a8' : '#ffffff' });
      ctx.restore();
    }
    // overwhelmed swirl
    const k = ss(B.mimi, B.deploy2, t);
    if (k > 0) { ctx.save(); ctx.globalAlpha = k; ctx.strokeStyle = '#ff5a6a'; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let j = 0; j < 3; j++) { ctx.beginPath(); for (let a = 0; a < 9; a += 0.25) { const r = a * 3.2; ctx.lineTo(yh.x - 60 + j * 60 + Math.cos(a + t * 6) * r, yh.y - 40 + Math.sin(a + t * 6) * r * 0.6); } ctx.stroke(); } ctx.restore(); }
  }
  // ---- "you think deploy = publishing a site?"
  if (inR(t, SEC.think, SEC.three)) {
    const a = fin(t, SEC.think + 0.15) * fade(t, SEC.three - 0.15, SEC.three);
    cloud(710, 300, 520, 300, a, pop(t, SEC.think + 0.15, 0.35));
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(520 - i * 50, 470 + i * 40, 22 - i * 6, 0, 7); ctx.fill(); ctx.restore(); }
    if (t > B.kokai - 0.2) { ctx.save(); ctx.globalAlpha = a * fin(t, B.kokai - 0.2); globeIcon(590, 300, 52, 1); ctx.restore(); spans([['デプロイ', '#3f7fe0'], ['＝', '#1d2433']], 760, 250, 48, { weight: 900, alpha: a * fin(t, B.kokai - 0.2) }); spans([['サイト公開', '#1d2433']], 770, 320, 54, { weight: 900, alpha: a * fin(t, B.kokai), scale: pop(t, B.kokai) }); }
    if (t > B.omot - 0.2) txt('？', 960, 230 + Math.sin(t * 8) * 8, 110, { color: '#ff5a6a', weight: 900, scale: pop(t, B.omot - 0.2) });
  }
  // ---- 3 code files
  if (inR(t, SEC.three, SEC.screen)) {
    const al = fade(t, SEC.screen - 0.15, SEC.screen);
    if (t < B.html) chip(W / 2, 300, 'Webサイト', fin(t, B.web - 0.2) * al, pop(t, B.web - 0.2), { size: 40 });
    [B.html, B.css, B.js].forEach((tt, i) => { if (t < tt) return; const p = P3(X0 + (i - 1) * 0.95, 2.35, 2.5 + 0.1 * i); chip(clamp(p.x, 190, 890), p.y, ['HTML', 'CSS', 'JavaScript'][i], fin(t, tt) * al, pop(t, tt), { size: 38, bg: DOCS[i].c }); });
    if (t > B.mittsu - 0.2) chip(W / 2, 180, '3つのコードファイル', fin(t, B.mittsu - 0.2) * al, pop(t, B.mittsu - 0.2), { size: 44, bg: 'rgba(244,195,74,0.95)', fg: '#1d2433' });
  }
  // ---- not peeking at a finished screen
  if (inR(t, SEC.screen, SEC.pcB)) {
    const al = fade(t, SEC.pcB - 0.15, SEC.pcB); const p = P3(X0 + 16, 3.0, -4);
    if (t > B.kansei - 0.2) chip(p.x, p.y - 180, '完成した画面', fin(t, B.kansei - 0.2) * al, pop(t, B.kansei - 0.2), { size: 40 });
    if (t > B.wake - 0.1) bigX(p.x, p.y, 1.1 * slam(t, B.wake - 0.1).s, slam(t, B.wake - 0.1).a * al);
  }
  // ---- Browser-san in your PC / phone
  if (inR(t, SEC.pcB, SEC.go)) {
    const al = fade(t, SEC.go - 0.12, SEC.go); const d = DESKS[MY];
    const pPh = (() => { const v = new THREE.Vector3(); window.PHONE.getWorldPosition(v); return proj(v); })(), pMon = P3(d.x, DESK_Y + 0.42, d.z - 0.26);
    ring(pPh.x, pPh.y, 70 + 10 * Math.sin(t * 6), fin(t, B.sumaho - 0.2) * fade(t, B.chrome, B.chrome + 0.3) * al);
    ring(pMon.x, pMon.y, 210 + 10 * Math.sin(t * 6), fin(t, B.pc - 0.2) * fade(t, B.chrome, B.chrome + 0.3) * al);
    if (t > B.browser - 0.1 && t < B.click) { const pb = proj(bro.root.getWorldPosition(V(0, 0, 0)).add(V(0, 0.38, 0))); chip(pb.x, pb.y - 30, 'ブラウザさん', fin(t, B.browser - 0.1) * al, pop(t, B.browser - 0.1), { size: 40, bg: '#3f7fe0' }); txt('（Chromeなど）', pb.x, pb.y + 26, 28, { weight: 800, alpha: fin(t, B.browser + 0.1) * al }); }
    if (t > B.url - 0.3) { const pu = P3(d.x - 0.12, DESK_Y + 0.58, d.z - 0.24); const cl = seg(t, B.click - 0.05, B.click + 0.15); cursor(pu.x + (1 - fin(t, B.url - 0.3, 0.5)) * 160, pu.y + (1 - fin(t, B.url - 0.3, 0.5)) * 120, 1 - 0.15 * Math.sin(Math.PI * cl), al); if (cl > 0 && cl < 1) ring(pu.x, pu.y, 20 + 50 * cl, 1 - cl, '#ffffff'); }
  }
  // ---- to the server
  if (inR(t, SEC.go, SEC.ask)) { const al = fade(t, SEC.ask - 0.12, SEC.ask); if (t > B.server - 0.2) { const p = P3(SERVER_POS.x, 1.95, SERVER_POS.z); chip(p.x, p.y, 'Webサーバーさん', fin(t, B.server - 0.2) * al, pop(t, B.server - 0.2), { size: 40, bg: '#6a4ad6' }); } const pb = proj(bro.root.getWorldPosition(V(0, 0.75, 0))); chip(pb.x, pb.y, 'ブラウザさん', fin(t, SEC.go + 0.2) * al, 1, { size: 30, bg: '#3f7fe0' }); }
  if (inR(t, SEC.ask, SEC.back)) {
    const al = fade(t, SEC.back - 0.12, SEC.back);
    const pb = proj(bro.root.getWorldPosition(V(0, 0, 0)).add(V(0, 0.75, 0))), ps = P3(SERVER_POS.x, 1.9, SERVER_POS.z);
    speech(pb.x - 20, pb.y - 190, pb.x, pb.y - 20, ['このサイトの', 'コードをください！'], fin(t, S('l08') + 0.05) * al, pop(t, S('l08') + 0.05), { size: 42 });
    if (t > B.onegai) speech(ps.x - 160, ps.y - 70, ps.x, ps.y, 'はい、どうぞ', fin(t, B.onegai) * al, pop(t, B.onegai), { size: 44, bg: '#e8e2ff' });
  }
  // ---- painting your screen
  if (inR(t, SEC.paint, SEC.pub)) { const d = DESKS[MY]; const pm = P3(d.x, DESK_Y + 0.42, d.z - 0.26); sparkles(pm.x, pm.y, t, 160, fin(t, B.gamen) * fade(t, SEC.pub - 0.2, SEC.pub)); if (t > B.egaku - 0.2) chip(pm.x, pm.y - 220, 'Webページを描く', fin(t, B.egaku - 0.2) * fade(t, SEC.wakari, SEC.wakari + 0.3), pop(t, B.egaku - 0.2), { size: 38, bg: '#3f7fe0' }); }
  // ---- publishing
  if (inR(t, SEC.pub, SEC.place)) {
    const al = fade(t, SEC.place - 0.15, SEC.place);
    if (t > B.sekai - 0.2) chip(W / 2, 170, '世界中のブラウザさん', fin(t, B.sekai - 0.2) * fade(t, B.morau - 0.4, B.morau - 0.1), pop(t, B.sekai - 0.2), { size: 40, bg: '#3f7fe0' });
    head3(t, B.morau - 0.4, SEC.place, 'サイトの公開＝', [['コードをもらえる状態', Y]], { y: 160, t1: B.morau - 0.1, size: 66 });
  }
  if (inR(t, SEC.place, SEC.dep)) { const p = P3(X0, TRAY_Y + 0.25, TRAY_Z); if (t > B.oku - 0.2) chip(p.x, p.y - 60, 'コードを置いておく', fin(t, B.oku - 0.2) * fade(t, SEC.dep - 0.15, SEC.dep), pop(t, B.oku - 0.2), { size: 40, bg: 'rgba(244,195,74,0.95)', fg: '#1d2433' }); }
  // ---- deploy = replace with the new code
  if (inR(t, SEC.dep, SEC.first)) {
    const al = fade(t, SEC.first - 0.15, SEC.first);
    const py = headTop(you, 0.25), ps = P3(SERVER_POS.x, 1.9, SERVER_POS.z);
    speech(py.x + 150, py.y - 110, py.x, py.y, 'こっちにしてください！', fin(t, B.deploy3 + 0.3) * fade(t, B.koushin - 0.4, B.koushin - 0.2) * al, pop(t, B.deploy3 + 0.3), { size: 42 });
    if (t > B.deploy3 + 1.2) speech(ps.x - 120, ps.y - 60, ps.x, ps.y, 'OK', fin(t, B.deploy3 + 1.2) * fade(t, B.koushin - 0.4, B.koushin - 0.2) * al, pop(t, B.deploy3 + 1.2), { size: 56, bg: '#e8e2ff' });
    head3(t, B.koushin - 0.35, SEC.first, 'デプロイ＝', [['コードを新しく更新', Y]], { y: 160, t1: B.koushin - 0.05, size: 66 });
  }
  // ---- first time: publish + deploy as a set
  if (inR(t, SEC.first, SEC.local)) {
    const al = fade(t, SEC.local - 0.15, SEC.local); const p = P3(X0, TRAY_Y + 0.1, TRAY_Z);
    if (t > B.karappo - 0.2 && t < B.todoke + 0.3) { ctx.save(); ctx.globalAlpha = fin(t, B.karappo - 0.2) * fade(t, B.todoke, B.todoke + 0.3); ctx.setLineDash([16, 12]); ctx.strokeStyle = '#7ff3ff'; ctx.lineWidth = 5; ctx.strokeRect(p.x - 150, p.y - 40, 300, 80); ctx.restore(); chip(p.x, p.y - 90, '空っぽ', fin(t, B.karappo - 0.2) * fade(t, B.todoke, B.todoke + 0.3), pop(t, B.karappo - 0.2), { size: 40 }); }
    if (t > B.hajime - 0.2) chip(W / 2, 170, 'はじめての公開', fin(t, B.hajime - 0.2) * fade(t, B.set - 0.5, B.set - 0.2), pop(t, B.hajime - 0.2), { size: 40 });
    if (t > B.set - 0.5) { const k = eOut(seg(t, B.set - 0.5, B.set)); chip(W / 2 - lerp(260, 150, k), 180, '公開', fin(t, B.set - 0.5) * al, 1, { size: 48, bg: '#3f7fe0' }); chip(W / 2 + lerp(260, 150, k), 180, 'デプロイ', fin(t, B.set - 0.5) * al, 1, { size: 48, bg: '#6a4ad6' }); if (k >= 1) { txt('＋', W / 2, 180, 56, { weight: 900, alpha: al }); chip(W / 2, 270, 'セット', al, pop(t, B.set), { size: 46, bg: 'rgba(244,195,74,0.95)', fg: '#1d2433' }); } }
  }
  // ---- localhost = only in your PC
  if (inR(t, SEC.local, SEC.cyber2)) {
    const al = fade(t, SEC.cyber2 - 0.15, SEC.cyber2); const d = DESKS[MY]; const pm = P3(d.x, DESK_Y + 0.62, d.z - 0.26);
    if (t > B.localhost - 0.2 && t < SEC.final) chip(pm.x, pm.y - 60, 'localhost:3000', fin(t, B.localhost - 0.2) * fade(t, SEC.final - 0.2, SEC.final), pop(t, B.localhost - 0.2), { size: 38 });
    if (t > B.naka - 0.4 && t < SEC.final) { const pd = P3(d.x, 2.2, d.z + 0.15); chip(pd.x, pd.y, 'あなたのPCの中だけ', fin(t, B.naka - 0.4) * fade(t, SEC.final - 0.2, SEC.final), pop(t, B.naka - 0.4), { size: 42, bg: 'rgba(79,216,255,0.92)', fg: '#06202c' }); }
    if (t >= SEC.final) { const pmon = P3(d.x, DESK_Y + 0.5, d.z - 0.26); speech(pmon.x + 40, pmon.y - 200, pmon.x, pmon.y - 60, '本番環境にデプロイします', fin(t, B.deploy4 - 0.05) * al, pop(t, B.deploy4 - 0.05), { size: 44, bg: '#e8f8ee' }); }
  }
  if (t >= SEC.cyber2) { if (t > B.todoku - 0.3) chip(W / 2, 170, '世界中に届く！', fin(t, B.todoku - 0.3), pop(t, B.todoku - 0.3), { size: 50, bg: 'rgba(244,195,74,0.95)', fg: '#1d2433' }); sparkles(W / 2, 520, t, 260, fin(t, SEC.cyber2 + 1.2)); }
  // ---- strong scene transitions
  flash(t, SEC.think, 0.3, '#ffffff', 0.9); speedLines(t, SEC.think);
  CUTS().forEach((c) => { if (c !== SEC.think) flash(t, c, 0.16, '#ffffff', 0.35); });
  drawSubs(t);
}

// ---------- frame ----------
function renderAt(t) {
  t = Math.min(t, DURATION - 0.001);
  shafts.forEach((sh) => { sh.material.uniforms.uT.value = t; });
  animate(t); const fd = applyCamera(t);
  const cy = camera.position.x > 30;
  sun.intensity = cy ? 0 : 5.5; skyL.intensity = cy ? 0 : 3.0; hemi.intensity = cy ? 0.12 : 0.55; hemi.color.set(cy ? '#6a7cff' : '#eef2f8'); ceilFill.intensity = cy ? 0 : 3.0; shafts.forEach((sh) => (sh.visible = !cy));
  cyberLights.forEach((l) => (l.visible = cy)); scene.environmentIntensity = cy ? 0.12 : 0.34;
  gridTex.offset.y = -t * 0.08; pathTex.offset.y = -t * 1.2; portalDisc.material.opacity = 0.75 + 0.15 * Math.sin(t * 4);
  const pos = dust.geometry.attributes.position, col = dust.geometry.attributes.color;
  dustBase.forEach(([x, y, z, k], i) => { pos.setXYZ(i, x + Math.sin(t * 0.21 + k) * 0.2, y + ((t * 0.15 + k) % 1) * 0.6, z + Math.cos(t * 0.19 + k) * 0.2); const b = 0.4 + 0.6 * Math.max(0, Math.sin(t * 1.3 + k * 3)); col.setXYZ(i, b * 0.5, b * 0.9, b * 1.2); });
  pos.needsUpdate = true; col.needsUpdate = true;
  bokeh.uniforms.focus.value = fd; gradePass.uniforms.uT.value = t;
  composer.render();
  ctx.drawImage(glCanvas, 0, 0, W, H);
  overlay(t);
}

// ---------- boot ----------
async function setup() {
  const src = await (await fetch('./scene.js')).text(); const chars = [...new Set(src + SCRIPT.map((l) => l.text).join(''))].join('');
  for (const f of ['700 40px "Noto Sans JP"', '800 40px "Noto Sans JP"', '900 40px "Noto Sans JP"']) await document.fonts.load(f, chars);
  await document.fonts.ready;
  const t0 = performance.now();
  buildTextures(); buildWorld(); buildCast(); buildPost();
  console.log('setup ms', Math.round(performance.now() - t0), 'dur', DURATION);
}
window.ready = setup().then(() => true);
window.frameAt = (t, q = 0.92) => { renderAt(t); return out.toDataURL('image/jpeg', q); };
window.ready.then(() => {
  if (qs.has('render')) { document.body.classList.add('render'); return; }
  if (qs.has('t')) { renderAt(parseFloat(qs.get('t'))); return; }
  const start = performance.now(); const loop = () => { renderAt(((performance.now() - start) / 1000) % DURATION); requestAnimationFrame(loop); }; loop();
});
