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
    if (k > 0) { bro.root.visible = true; const jump = seg(t, B.click + 0.05, SEC.go); placeM(bro, lerp(d.x, deskP.x, k) + lerp(0, -0.28, jump), DESK_Y + Math.sin(Math.PI * Math.min(1, k)) * 0.15 + Math.sin(Math.PI * jump) * 0.2, lerp(d.z - 0.3, deskP.z, k) + lerp(0, -0.16, jump), Math.PI * 0.85 * (1 - jump) + Math.PI * jump, 0.55 * (1 - 0.9 * eOut(jump))); bro.face = t > B.click ? 'happy' : 'wow'; }
    if (inR(t, B.click - 0.3, B.click + 0.3)) { const A = you.arms[0]; A.sh.rotation.set(-1.1, 0, -0.2); A.el.rotation.set(-0.3 - Math.max(0, Math.sin((t - B.click + 0.3) * 20)) * 0.2, 0, 0); }
    you.face = t > B.browser ? 'happy' : 'normal';
  } else if (t < SEC.ask) {
    // run from your PC (portal) along the data path to Webサーバーさん
    bro.root.visible = true; const k = eIO(seg(t, SEC.go + 0.05, SEC.ask - 0.1));
    placeM(bro, X0 + 0.15, 0, lerp(PORTAL.z - 0.3, -1.35, k), Math.PI, 1); mascotWalk(bro, t, k < 1 ? 1 : 0, 12); bro.face = 'happy';
    srv.face = t > B.server ? 'happy' : 'normal';
  } else if (t < SEC.back) {
    bro.root.visible = true; placeM(bro, X0 + 0.15, 0, -1.35, Math.PI, 1); bro.face = t < B.onegai + 0.4 ? 'ask' : 'happy';
    bro.arms.forEach((A) => A.g.rotation.set(-1.2, 0, A.s * 0.2));
    const give = seg(t, B.onegai + 0.2, B.onegai + 0.8);
    srv.face = t > B.onegai - 0.2 ? 'happy' : 'normal'; if (give > 0) srv.arms.forEach((A) => A.g.rotation.set(-1.0 * Math.sin(Math.PI * give), 0, A.s * 0.25));
    docsTray.forEach((d, i) => { if (give <= 0) { trayDocs([d]); d.position.x = X0 - 0.36 + i * 0.36; return; } const from = V(X0 - 0.36 + i * 0.36, TRAY_Y, TRAY_Z), to = bro.root.localToWorld(V((i - 1) * 0.05, 0.4 + i * 0.012, 0.22)); d.visible = true; d.position.lerpVectors(from, to, eIO(give)); d.position.y += Math.sin(Math.PI * give) * 0.3; d.rotation.set(lerp(-Math.PI / 2, -0.2, give), 0, (i - 1) * 0.1); });
  } else if (t < SEC.paint) {
    bro.root.visible = true; const k = eIO(seg(t, SEC.back, SEC.paint - 0.15));
    placeM(bro, X0 + 0.15, 0, lerp(-1.35, PORTAL.z - 0.2, k), 0, 1); mascotWalk(bro, t, 1, 12); bro.face = 'happy';
    carry(docsHand, bro, t, 0.24, 0.42); bro.arms.forEach((A) => A.g.rotation.set(-1.3, 0, A.s * 0.15));
  } else if (t < SEC.pub) {
    // paints the page on your screen
    const d = DESKS[MY]; bro.root.visible = true; placeM(bro, d.x + 0.42, DESK_Y, d.z - 0.2, -Math.PI * 0.75, 0.55); bro.face = 'happy';
    const A = bro.arms[1]; A.g.rotation.set(-1.4 + Math.sin(t * 9) * 0.3, 0, -0.3);
    brush.visible = true; brush.position.copy(bro.root.localToWorld(V(-0.2, 0.42 + Math.sin(t * 9) * 0.06, 0.14))); brush.rotation.set(0.6, 0, 0.8);
    docsDesk.forEach((dd, i) => docAt(dd, V(d.x + 0.5 + i * 0.03, DESK_Y + 0.004 + i * 0.002, d.z + 0.12 + i * 0.02), -Math.PI / 2, 0, 0.3 + i * 0.2));
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
      walk(you, t, [[X0 + 0.3, PORTAL.z - 0.4], [standX, standZ]], SEC.place + 0.05, B.oku - 0.2, Math.PI);
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
      dome.material.uniforms.uA.value = ss(B.naka - 0.6, B.naka, t) * 1;
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
  if (t >= SEC.final && t < SEC.cyber2) { sitAt(you, MY, t); you.face = 'shock'; you.head.rotation.set(-0.05, 0, 0); }
  window.GLOBE.rotation.y = t * 0.4;
  [you, ...coworkers, ...crowd].forEach((P) => { P.faceMat.map = P.faces[P.face] || P.faces.normal; });
  [bro, srv, ...bros].forEach(mascotFaceApply);
}

// ---------- cameras ----------
function shot(t) {
  const d = DESKS[MY], head = () => you.head.getWorldPosition(V(0, 0, 0));
  if (t < SEC.think) { const k = eIO(seg(t, 0.6, SEC.think)); return { p: V(lerp(-0.25, 0.9, k), lerp(1.45, 2.25, k), lerp(1.35, 2.7, k)), a: V(lerp(-0.7, -0.8, k), lerp(1.1, 1.0, k), lerp(-0.5, -0.7, k)), fov: lerp(45, 54, k), f: head };}
  if (t < SEC.three) { const k = seg(t, SEC.think, SEC.three); return { p: V(lerp(-0.4, -0.45, k), 1.3, lerp(-0.15, -0.05, k)), a: V(-0.72, 1.18, 0.37), fov: lerp(46, 40, k), f: head }; }
  if (t < SEC.screen) { const k = seg(t, SEC.three, SEC.screen); return { p: V(X0 + Math.sin(t * 0.3) * 0.2, 1.75, lerp(5.8, 5.3, k)), a: V(X0, 1.6, 2.5), fov: 44, f: () => V(X0, 1.6, 2.5) }; }
  if (t < SEC.pcB) { const k = seg(t, SEC.screen, SEC.pcB); return { p: V(X0 + 16 + lerp(-1.2, 0.6, k), lerp(1.6, 2.0, k), 6.2), a: V(X0 + 16, 2.3, -3), fov: 52, f: () => V(X0 + 16, 1.0, -1.5) }; }
  if (t < SEC.go) { const k = seg(t, SEC.pcB, SEC.go); return { p: V(d.x + lerp(0.75, 0.55, k), 1.3, d.z + lerp(0.7, 0.55, k)), a: V(d.x + 0.05, 1.0, d.z - 0.25), fov: 46, f: () => V(d.x + 0.1, 1.0, d.z - 0.2) }; }
  if (t < SEC.ask) { const k = seg(t, SEC.go, SEC.ask); return { p: V(X0 + lerp(4.2, 3.4, k), lerp(2.0, 1.7, k), lerp(3.6, 1.2, k)), a: V(X0, 0.7, lerp(2.5, -1.2, k)), fov: 52, f: () => bro.root.getWorldPosition(V(0, 0.3, 0)) }; }
  if (t < SEC.back) return { p: V(X0 + 1.9, 1.35, 0.35), a: V(X0, 0.95, -2.0), fov: 46, f: () => V(X0 + 0.1, 0.7, -1.6) };
  if (t < SEC.paint) { const k = seg(t, SEC.back, SEC.paint); return { p: V(X0 + 2.6, 1.3, lerp(-0.4, 3.0, k)), a: V(X0, 0.5, lerp(-1.0, 4.0, k)), fov: 50, f: () => bro.root.getWorldPosition(V(0, 0.3, 0)) }; }
  if (t < SEC.pub) { const k = seg(t, SEC.paint, SEC.pub); return { p: V(d.x + lerp(0.15, 0.5, k), lerp(1.25, 1.45, k), d.z + lerp(0.55, 1.0, k)), a: V(d.x + 0.1, 1.08, d.z - 0.3), fov: 44, f: () => V(d.x + 0.2, 1.1, d.z - 0.3) }; }
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
