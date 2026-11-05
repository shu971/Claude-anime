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
    [B.html, B.css, B.js].forEach((tt, i) => { if (t < tt) return; const p = P3(X0 + (i - 1) * 0.95, 2.35, 2.5 + 0.1 * i); chip(p.x, p.y, ['HTML', 'CSS', 'JavaScript'][i], fin(t, tt) * al, pop(t, tt), { size: 38, bg: DOCS[i].c }); });
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
    const pb = proj(bro.root.getWorldPosition(V(0, 0.6, 0))), ps = P3(SERVER_POS.x, 1.9, SERVER_POS.z);
    speech(pb.x + 120, pb.y - 120, pb.x, pb.y, ['このサイトの', 'コードをください！'], fin(t, S('l08') + 0.05) * al, pop(t, S('l08') + 0.05), { size: 42 });
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
    if (t > B.set - 0.5) { const k = eOut(seg(t, B.set - 0.5, B.set)); chip(W / 2 - lerp(260, 150, k), 180, '公開', fin(t, B.set - 0.5) * al, 1, { size: 48, bg: '#3f7fe0' }); chip(W / 2 + lerp(260, 150, k), 180, 'デプロイ', fin(t, B.set - 0.5) * al, 1, { size: 48, bg: '#6a4ad6' }); if (k >= 1) { txt('＋', W / 2, 180, 56, { weight: 900, alpha: al }); chip(W / 2, 280, 'セット', al, pop(t, B.set), { size: 46, bg: 'rgba(244,195,74,0.95)', fg: '#1d2433' }); } }
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
