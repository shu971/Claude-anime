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
