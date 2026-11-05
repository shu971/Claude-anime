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
