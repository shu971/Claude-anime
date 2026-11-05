// コンテキストエンジニアリング：喋り動画に重ねる映像（透明の上に描く）
// frameAt(t) が時刻 t のコマを描いて PNG の dataURL を返す。すべて t だけで決まる。

const W = 1080, H = 1920, DUR = 57.98;
const cv = document.getElementById('c');
const g = cv.getContext('2d');

// ---------- データ ----------
const [TIM, READ, SCRIPT] = await Promise.all(
  ['timing.json', 'script_read.json', 'script.json'].map((f) => fetch(f).then((r) => r.json())));
const LINES = SCRIPT.map((l, i) => ({ id: l.id, text: l.text, read: READ[i].text }));
const L = Object.fromEntries(LINES.map((l) => [l.id, l]));
const S = (id) => TIM.start[id];
const E = (id) => TIM.end[id];
// 語の読み始めの時刻（読み上げ用の台本の中を探す）
function at(id, word, k = 0) {
  const r = L[id].read; let i = -1;
  for (let n = 0; n <= k; n++) i = r.indexOf(word, i + 1);
  if (i < 0) throw new Error(`at(${id}, ${word}) が見つからない`);
  return TIM.chars[id][i];
}

// ---------- 道具 ----------
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, u) => a + (b - a) * u;
const seg = (t, a, b) => clamp((t - a) / (b - a));
const eOut = (u) => 1 - Math.pow(1 - u, 3);
const eIO = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
// 閉形式のばね（0→1）。少しだけ行き過ぎて止まる
function spring(t, k = 260, d = 22) {
  if (t <= 0) return 0;
  const w0 = Math.sqrt(k), z = d / (2 * w0);
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + (z * w0 / wd) * Math.sin(wd * t)); }
  return 1 - Math.exp(-w0 * t) * (1 + w0 * t);
}
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed);
  x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

const C = { bg: '#050607', fg: '#f2f2f0', dim: '#8a8d93', axis: '#f4c34a', acc: '#4f8cff', red: '#ff5a5a' };
const F = (w, px, it = false) => `${it ? 'italic ' : ''}${w} ${px}px "Noto Sans JP"`;

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function text(s, x, y, { font = F(800, 40), color = C.fg, align = 'center', alpha = 1, base = 'alphabetic' } = {}) {
  if (alpha <= 0) return; g.save(); g.globalAlpha *= alpha; g.font = font; g.fillStyle = color; g.textAlign = align; g.textBaseline = base;
  g.fillText(s, x, y); g.restore();
}
// 色分けした文字列 [[文字, 色], ...] を中央揃えで
function spans(parts, x, y, font, alpha = 1) {
  g.save(); g.font = font; const ws = parts.map((p) => g.measureText(p[0]).width); const tw = ws.reduce((a, b) => a + b, 0);
  let cx = x - tw / 2; g.globalAlpha *= alpha; g.textAlign = 'left';
  parts.forEach((p, i) => { g.fillStyle = p[1]; g.fillText(p[0], cx, y); cx += ws[i]; }); g.restore(); return tw;
}
// 枠付きラベル（ポンと出る）
function box(s, x, y, { u = 1, font = F(800, 40, true), color = C.acc, fill = C.bg, pad = 22, h = 70, lw = 3, alpha = 1 } = {}) {
  if (u <= 0 || alpha <= 0) return; g.save(); g.font = font; const w = g.measureText(s).width + pad * 2;
  g.translate(x, y); g.scale(u, u); g.globalAlpha *= alpha;
  rr(-w / 2, -h / 2, w, h, 14); g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = color; g.stroke();
  g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, 0, 3); g.restore();
}
// 数式：英字は KaTeX_Math（斜体）、数字と記号は KaTeX_Main。parts = [[文字列, 色], ...]、中央揃え・縦も中央
function mathWidth(parts, px) {
  let w = 0;
  for (const [s] of parts) for (const ch of s) { g.font = /[A-Za-z]/.test(ch) ? `italic 400 ${px}px KaTeX_Math` : `400 ${px}px KaTeX_Main`; w += g.measureText(ch).width; }
  return w;
}
function math(parts, x, y, px, alpha = 1) {
  if (alpha <= 0) return 0;
  if (typeof parts === 'string') parts = [[parts, C.fg]];
  g.save(); g.globalAlpha *= alpha; g.textAlign = 'left'; g.textBaseline = 'middle';
  const w = mathWidth(parts, px); let cx = x - w / 2;
  for (const [s, col] of parts) for (const ch of s) {
    g.font = /[A-Za-z]/.test(ch) ? `italic 400 ${px}px KaTeX_Math` : `400 ${px}px KaTeX_Main`;
    g.fillStyle = col; g.fillText(ch, cx, y); cx += g.measureText(ch).width;
  }
  g.restore(); return w;
}
// 数式の枠付きラベル
function mathBox(s, x, y, { u = 1, px = 40, color = C.acc, fill = C.bg, h = 70, alpha = 1, frame = 1 } = {}) {
  if (u <= 0 || alpha <= 0) return;
  const w = mathWidth([[s, color]], px) + 44;
  g.save(); g.translate(x, y); g.scale(u, u); g.globalAlpha *= alpha;
  if (frame > 0) { g.save(); g.globalAlpha *= frame; rr(-w / 2, -h / 2, w, h, 14); g.fillStyle = fill; g.fill(); g.lineWidth = 3; g.strokeStyle = color; g.stroke(); g.restore(); }
  math([[s, color]], 0, 2, px); g.restore();
}
const mix = (a, b, u) => { const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b);
  return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], u))).join(',')})`; };
function dot(x, y, r, color, alpha = 1) { if (alpha <= 0 || r <= 0) return; g.save(); g.globalAlpha *= alpha; g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = color; g.fill(); g.restore(); }
function line(x1, y1, x2, y2, color, lw = 3, alpha = 1, dash = null) {
  if (alpha <= 0) return; g.save(); g.globalAlpha *= alpha; g.strokeStyle = color; g.lineWidth = lw; if (dash) g.setLineDash(dash);
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore();
}
function arrowHead(x, y, dx, dy, color, s = 16) {
  const a = Math.atan2(dy, dx); g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = color;
  g.beginPath(); g.moveTo(s, 0); g.lineTo(0, -s / 2); g.lineTo(0, s / 2); g.fill(); g.restore();
}

// ---------- 効果音の予定（mix.py が読む） ----------
const CUES = [];
const cue = (t, id, vol = 1) => CUES.push({ t: +t.toFixed(3), id, vol });

// ---------- 場面の時刻 ----------
const PANEL = { x: 110, y: 1060, w: 860, h: 470, r: 36 };
const T = {
  c1in: S('l05') - 0.05, c1out: S('l12') - 0.32,
  c2in: S('l13') - 0.02, c2out: S('l19') - 0.32,
  c3in: at('l22', 'コンテキスト') - 0.35,
};
const FLOOD = 0.4, SHRINK = 0.35;
// 全面を覆う度合い 0（パネル）〜1（全面）
function coverAmt(t) {
  const one = (a, b) => (t < a ? 0 : t < a + FLOOD ? eIO(seg(t, a, a + FLOOD)) : t < b ? 1 : t < b + SHRINK ? 1 - eIO(seg(t, b, b + SHRINK)) : 0);
  return Math.max(one(T.c1in, T.c1out), one(T.c2in, T.c2out), one(T.c3in, 1e9));
}
// 全面の中身の出入り
const coverIn = (t, a, b) => Math.min(seg(t, a + FLOOD * 0.7, a + FLOOD + 0.2), 1 - seg(t, b - 0.2, b + 0.05));
// パネルの中身の出入り（全面中は消える）
const panelIn = (t, a, b) => Math.min(seg(t, a, a + 0.25), 1 - seg(t, b - 0.2, b));

cue(T.c1in, 'whoosh', 0.55); cue(T.c1out, 'swoosh', 0.35);
cue(T.c2in, 'whoosh', 0.55); cue(T.c2out, 'swoosh', 0.35);
cue(T.c3in, 'whoosh', 0.6);

// ---------- 黒パネル／全面の地 ----------
function drawGround(t) {
  const a = coverAmt(t);
  const pop = spring(t - 0.1, 300, 26);
  const p = { x: lerp(PANEL.x, 0, a), y: lerp(PANEL.y, 0, a), w: lerp(PANEL.w, W, a), h: lerp(PANEL.h, H, a), r: lerp(PANEL.r, 0, a) };
  g.save();
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2; g.translate(cx, cy); g.scale(pop, pop); g.translate(-cx, -cy);
  // 冒頭は白いカード（式だけ）→「決まりませんよね」で黒いパネルに変わる
  const wa = 1 - eIO(seg(t, t1.g, t1.g + 0.45));
  const rC = Math.round(lerp(5, 247, wa)), gC = Math.round(lerp(6, 246, wa)), bC = Math.round(lerp(7, 242, wa));
  rr(p.x, p.y, p.w, p.h, p.r); g.fillStyle = `rgba(${rC},${gC},${bC},${lerp(0.94, 1, clamp(Math.max(a * 3, wa)))})`; g.fill();
  if (a < 0.98 && wa < 1) { g.lineWidth = 2; g.strokeStyle = `rgba(255,255,255,${0.13 * (1 - a) * (1 - wa)})`; g.stroke(); }
  g.restore();
  return a;
}
cue(0.1, 'pop', 0.6);

// ---------- 場面1・2：2a − 3b = 5 の直線 ----------
const G1 = { ox: PANEL.x + 330, oy: PANEL.y + 200, s: 62, a0: -4.6, a1: 8, b0: -4.2, b1: 2.55 };
const X1 = (a) => G1.ox + a * G1.s, Y1 = (b) => G1.oy - b * G1.s, LN = (a) => (2 * a - 5) / 3;
// 「この方程式、aの値わかりますか？」の間は式だけ。「決まりませんよね」でグラフへ
const T1G = S('l02') - 0.15;
const t1 = { eq: 0.22, g: T1G, ax: T1G + 0.15, ln: T1G + 0.3, q: T1G + 0.5, many: T1G + 0.45,
  bl: at('l03', 'b'), hit: at('l04', 'a'), lab: at('l04', '決まり') };
cue(t1.eq, 'pop', 0.7); cue(t1.g, 'swish', 0.4); cue(t1.many, 'tick', 0.45);
cue(t1.bl, 'swish', 0.4); cue(t1.hit, 'click', 0.8); cue(t1.lab, 'chime', 0.6);

function scene12(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  g.save(); rr(PANEL.x, PANEL.y, PANEL.w, PANEL.h, PANEL.r); g.clip();
  // 軸
  const ax = eOut(seg(t, t1.ax, t1.ax + 0.5));
  if (ax > 0) {
    line(G1.ox - (G1.ox - X1(G1.a0)) * ax, G1.oy, G1.ox + (X1(G1.a1) - G1.ox) * ax, G1.oy, C.axis, 3);
    line(G1.ox, G1.oy + (Y1(G1.b0) - G1.oy) * ax, G1.ox, G1.oy - (G1.oy - Y1(G1.b1)) * ax, C.axis, 3);
    g.save(); g.globalAlpha *= ax;
    arrowHead(X1(G1.a1), G1.oy, 1, 0, C.axis); arrowHead(G1.ox, Y1(G1.b1), 0, -1, C.axis);
    for (let a = -4; a <= 7; a++) if (a) line(X1(a), G1.oy - 7, X1(a), G1.oy + 7, C.axis, 2);
    for (let b = -4; b <= 2; b++) if (b) line(G1.ox - 7, Y1(b), G1.ox + 7, Y1(b), C.axis, 2);
    text('a', X1(G1.a1) - 4, G1.oy + 44, { font: F(500, 34, true), color: C.axis });
    text('b', G1.ox + 26, Y1(G1.b1) + 8, { font: F(500, 34, true), color: C.axis });
    g.restore();
  }
  // 直線（左下から右上へ引かれる）
  const lu = eOut(seg(t, t1.ln, t1.ln + 0.6));
  if (lu > 0) { const aE = lerp(-4.4, 7.8, lu); line(X1(-4.4), Y1(LN(-4.4)), X1(aE), Y1(LN(aE)), C.acc, 5); }
  // 直線上の候補の点（決まらない）
  const fade = 1 - seg(t, t1.hit, t1.hit + 0.4);
  for (let i = 0; i < 12; i++) {
    const a = -3.6 + i * 0.95; const u = spring(t - t1.many - i * 0.05, 300, 24);
    dot(X1(a), Y1(LN(a)), 6 * u, C.dim, fade * clamp(u));
  }
  // 動く点：行ったり来たり → b=−1 で交点へ
  if (t > t1.q) {
    const roam = 1.6 + 3.2 * Math.sin((t - t1.q) * 2.2);
    const toHit = eIO(seg(t, t1.hit - 0.35, t1.hit));
    const a = lerp(roam, 1, toHit);
    const r = 9 + 4 * spring(t - t1.hit, 400, 18) * (t > t1.hit ? 1 : 0);
    dot(X1(a), Y1(LN(a)), r, '#fff', seg(t, t1.q, t1.q + 0.2));
    if (toHit < 1) text('?', X1(a) + 22, Y1(LN(a)) - 16, { font: F(900, 40), color: '#fff', alpha: (1 - toHit) * seg(t, t1.q, t1.q + 0.2) });
  }
  // b = −1 の点線
  const bu = eOut(seg(t, t1.bl, t1.bl + 0.5));
  if (bu > 0) {
    line(X1(-4.4), Y1(-1), lerp(X1(-4.4), X1(7.8), bu), Y1(-1), '#fff', 3, 1, [14, 10]);
    math([['b = −1', '#fff']], X1(-4.3) + 62, Y1(-1) - 26, 34, bu);
  }
  if (t > t1.hit) line(X1(1), Y1(-1), X1(1), G1.oy, '#fff', 2, seg(t, t1.hit, t1.hit + 0.3), [6, 6]);
  const lb = spring(t - t1.lab, 320, 22);
  mathBox('a = 1', X1(1) + 100, Y1(-1) + 42, { u: lb, color: '#fff', px: 36, h: 56 });
  g.restore();
  // 式：最初はカードいっぱいに大きく（白地に黒）→ 縮んで右上のラベルに収まる
  const mu = eIO(seg(t, t1.g, t1.g + 0.45));
  const pop = spring(t - t1.eq, 260, 22);
  const ex = lerp(PANEL.x + PANEL.w / 2, PANEL.x + PANEL.w - 185, mu), ey = lerp(PANEL.y + PANEL.h / 2, PANEL.y + 69, mu);
  const px = lerp(150, 40, mu);
  const col = mix('#111214', C.acc, mu);
  g.save(); g.translate(ex, ey); const k = lerp(lerp(0.8, 1, clamp(pop)), 1, mu); g.scale(k, k);
  g.globalAlpha *= clamp(pop * 1.5);
  if (mu > 0.6) { const w = mathWidth([['2a − 3b = 5', col]], 40) + 44; g.save(); g.globalAlpha *= seg(mu, 0.6, 1);
    rr(-w / 2, -35, w, 70, 14); g.fillStyle = C.bg; g.fill(); g.lineWidth = 3; g.strokeStyle = C.acc; g.stroke(); g.restore(); }
  math([['2a − 3b = 5', col]], 0, 0, px);
  g.restore();
  g.restore();
}

// ---------- 場面3：10元1次方程式（全面） ----------
const KEYS = 'ABCDEFGHIJ'.split('');
const VALS = { B: 3, C: -2, D: 4, E: 0, F: 2, G: 1, H: -3, I: 2, J: 4 }; // 3A+2B−C+4D+E−2F+G+5H−I+2J=9 → A=−1
const G3 = { x0: 120, dx: 93, top: 700, bot: 1240, s: 50 }; G3.mid = (G3.top + G3.bot) / 2;
// 「では、これならどうでしょう。」の間は式だけ大きく。「決まりませんね」で目盛りへ
const T3G = at('l06', '決まり') - 0.15;
const t3 = {
  eq: S('l05') + 0.35, g: T3G, axes: T3G + 0.2, aq: T3G + 0.45,
  q1: S('l07') + 0.15, q2: at('l08', 'A'), no: at('l09', 'わかる'),
  vals: at('l10', 'B'), valsEnd: at('l10', 'わかれば'), solve: at('l11', 'A'), done: at('l11', '求め'),
};
cue(t3.eq, 'pop', 0.7); cue(t3.g, 'swish', 0.4); cue(t3.aq, 'tick', 0.5);
cue(t3.q1, 'pop', 0.7); cue(t3.no, 'error', 0.7);
KEYS.slice(1).forEach((k, i) => cue(lerp(t3.vals, t3.valsEnd, i / 8), 'tick', 0.55));
cue(t3.solve, 'click', 0.8); cue(t3.done, 'chime', 0.7);

function scene3(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  // 式：最初は白いカードに大きく → 縮んで上の見出しになる
  const eu = spring(t - t3.eq, 240, 22);
  const mu = eIO(seg(t, t3.g, t3.g + 0.5));
  const card = { x: lerp(70, 160, mu), y: lerp(560, 330, mu), w: lerp(940, 760, mu), h: lerp(620, 210, mu) };
  g.save(); g.globalAlpha *= clamp(eu * 1.5);
  const ck = lerp(lerp(0.85, 1, clamp(eu)), 1, mu); g.translate(540, card.y + card.h / 2); g.scale(ck, ck); g.translate(-540, -(card.y + card.h / 2));
  if (mu < 1) { g.save(); g.globalAlpha *= 1 - mu; rr(card.x, card.y, card.w, card.h, 36); g.fillStyle = '#f7f6f2'; g.fill(); g.restore(); }
  box('10元1次方程式', 540, lerp(480, 285, mu), { color: C.axis, font: F(800, lerp(40, 32, mu)), h: lerp(66, 56, mu) });
  const ink = mix('#111214', C.fg, mu), aCol = C.acc;
  const EQ = [[['3', ink], ['A', aCol], [' + 2B − C + 4D', ink]], [['+ E − 2F + G + 5H', ink]], [['− I + 2J = 9', ink]]];
  const px = lerp(96, 54, mu), gap = lerp(150, 64, mu), cy0 = card.y + card.h / 2 - gap;
  EQ.forEach((ln, i) => math(ln, 540, cy0 + i * gap, px));
  g.restore();
  // 10本の目盛り
  KEYS.forEach((k, i) => {
    const x = G3.x0 + i * G3.dx; const known = k !== 'A';
    const u = eOut(seg(t, t3.axes + i * 0.05, t3.axes + i * 0.05 + 0.45));
    if (u <= 0) return;
    const col = known ? C.axis : '#fff';
    line(x, G3.mid - (G3.mid - G3.top) * u, x, G3.mid + (G3.bot - G3.mid) * u, col, known ? 3 : 4, known ? 0.85 : 1);
    for (let s = -5; s <= 5; s++) line(x - 6, G3.mid - s * G3.s, x + 6, G3.mid - s * G3.s, C.axis, 2, 0.55 * u);
    text(k, x, G3.bot + 60, { font: F(700, 40, true), color: col, alpha: u });
    if (known) {
      const tv = lerp(t3.vals, t3.valsEnd, (i - 1) / 8); const v = spring(t - tv, 320, 22);
      if (t > tv) {
        const y = lerp(G3.top - 30, G3.mid - VALS[k] * G3.s, clamp(v * 1.05));
        dot(x, y, 11 * clamp(v + 0.2), C.axis);
        text(String(VALS[k]).replace('-', '−'), x, G3.top - 28, { font: F(700, 30), color: C.axis, alpha: seg(t, tv, tv + 0.2) });
      }
    }
  });
  // A：候補の幅（決まらない）→ 1点に
  const xa = G3.x0;
  if (t > t3.aq) {
    const shrink = eIO(seg(t, t3.solve, t3.solve + 0.5));
    const half = lerp(2.4 * G3.s, 14, shrink);
    const cy = lerp(G3.mid - (0.2 * Math.sin((t - t3.aq) * 1.7)) * G3.s, G3.mid + 1 * G3.s, shrink);
    const ia = seg(t, t3.aq, t3.aq + 0.25);
    g.save(); g.globalAlpha *= ia; rr(xa - 15, cy - half, 30, half * 2, 15); g.lineWidth = 4; g.strokeStyle = C.acc; g.stroke(); g.restore();
    const wob = (1 - shrink) * 1.6 * Math.sin((t - t3.aq) * 3.1) * G3.s;
    dot(xa, cy + wob, 13, C.acc, ia);
    if (t < t3.solve + 0.2) text('?', xa, G3.top - 28, { font: F(900, 34), color: C.acc, alpha: ia * (1 - seg(t, t3.solve, t3.solve + 0.2)) });
    const lu = spring(t - t3.done, 320, 22);
    mathBox('A = −1', 540, G3.bot + 140, { u: lu, px: 46, h: 76 });
    if (t > t3.done) text('−1', xa, G3.top - 28, { font: F(800, 30), color: C.acc, alpha: seg(t, t3.done, t3.done + 0.2) });
  }
  // 吹き出し：「プロの数学者です」→ 揺れて消える
  if (t > t3.q1 && t < t3.no + 0.8) {
    const u = spring(t - t3.q1, 300, 22);
    const shake = t > t3.no ? Math.sin((t - t3.no) * 60) * 14 * (1 - seg(t, t3.no, t3.no + 0.4)) : 0;
    const out = seg(t, t3.no + 0.35, t3.no + 0.7);
    g.save(); g.translate(540 + shake, 900); g.scale(u * (1 - 0.15 * out), u * (1 - 0.15 * out)); g.globalAlpha *= 1 - out;
    rr(-380, -110, 760, 220, 28); g.fillStyle = 'rgba(5,6,7,0.96)'; g.fill(); g.lineWidth = 3;
    g.strokeStyle = t > t3.no ? C.red : '#fff'; g.stroke();
    g.beginPath(); g.moveTo(-40, 110); g.lineTo(0, 160); g.lineTo(30, 110); g.closePath(); g.fillStyle = 'rgba(5,6,7,0.96)'; g.fill();
    text('「あなたはプロの数学者です。', 0, -22, { font: F(800, 44) });
    text('Aの値を求めてください」', 0, 50, { font: F(800, 44), alpha: seg(t, t3.q2 - 0.1, t3.q2 + 0.15) });
    if (t > t3.no) text('×', 330, -70, { font: F(900, 70), color: C.red, alpha: seg(t, t3.no, t3.no + 0.1) });
    g.restore();
  }
  g.restore();
}

// ---------- 場面4：AIの質問も同じ（パネル） ----------
const t4 = { q: S('l12') + 0.1, eq: at('l12', '同じ') };
cue(t4.q, 'pop', 0.6); cue(t4.eq, 'click', 0.6);
function scene4(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const cy = PANEL.y + 235;
  const u = spring(t - t4.q, 300, 22);
  g.save(); g.translate(PANEL.x + 220, cy); g.scale(u, u);
  rr(-160, -70, 320, 140, 26); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke();
  g.beginPath(); g.moveTo(-90, 70); g.lineTo(-110, 110); g.lineTo(-50, 70); g.strokeStyle = '#fff'; g.stroke();
  text('AIへの質問', 0, 14, { font: F(800, 40) });
  g.restore();
  text('＝', PANEL.x + 430, cy + 22, { font: F(900, 70), color: C.axis, alpha: clamp(spring(t - t4.eq, 400, 20)) });
  mathBox('2a − 3b = 5', PANEL.x + 645, cy, { u: spring(t - t4.eq - 0.1, 300, 22) });
  g.restore();
}

// ---------- 場面5：ニューラルネット → ベクトル空間の点 → 情報で絞る（全面） ----------
const Q = 'SNSを伸ばす方法を教えて';
const t5 = {
  box: S('l13') + 0.35, type0: at('l13', 'SNS'), type1: at('l13', 'と聞いても'), net: at('l13', 'と聞いても') + 0.05,
  burst: at('l13', 'と聞いても') + 0.85,
  u1: at('l14', '発信内容'), u2: at('l14', '視聴者'), u3: at('l14', '過去'),
  mich: at('l15', '未知数'), gen: at('l16', '一般論'),
  stop0: S('l17'), c1: at('l17', 'アカウント'), c2: at('l17', '過去'), c3: at('l17', '目標'),
  pick: at('l18', 'あなた'), card: at('l18', '提案'),
};
cue(t5.box, 'pop', 0.6);
for (let i = 0; i < Q.length; i++) if (i % 2 === 0) cue(lerp(t5.type0, t5.type1, i / Q.length), 'key', 0.35);
cue(t5.net, 'swish', 0.4); cue(t5.burst, 'pop', 0.7);
cue(t5.u1, 'tick', 0.5); cue(t5.u2, 'tick', 0.5); cue(t5.u3, 'tick', 0.5);
cue(t5.gen, 'error', 0.6);
cue(t5.c1, 'click', 0.7); cue(t5.c2, 'click', 0.7); cue(t5.c3, 'click', 0.7);
cue(t5.pick, 'click', 0.8); cue(t5.card, 'chime', 0.7);

const NET = [5, 7, 7, 5].map((n, r) => Array.from({ length: n }, (_, i) => ({ x: 540 + (i - (n - 1) / 2) * 120, y: 470 + r * 68 })));
const CLOUD = (() => {
  const r = rng(11), pts = [];
  while (pts.length < 300) {
    const x = r() * 2 - 1, y = r() * 2 - 1, z = r() * 2 - 1;
    if (x * x + y * y + z * z <= 1) pts.push({ x, y, z, d: r() });
  }
  return pts;
})();
const CC = { x: 540, y: 1000, s: 290 };
const RINGS = [
  { x: 405, y: 880, r: 225, label: 'アカウント情報', lx: 150, ly: 640, t: 'c1' },
  { x: 675, y: 880, r: 225, label: '過去の投稿結果', lx: 690, ly: 640, t: 'c2' },
  { x: 540, y: 1100, r: 225, label: '目標', lx: 790, ly: 1250, t: 'c3' },
];
const TARGET = { x: 540, y: 950 };
// 回転の角度：一定の速さで回り、「逆に」から止まる
function spin(t) {
  const v = 0.42, a0 = t5.burst, ts = t5.stop0, D = Math.max(0.3, t5.c1 - t5.stop0);
  if (t < a0) return 0;
  if (t < ts) return v * (t - a0);
  const u = clamp((t - ts) / D);
  return v * (ts - a0) + v * D * (u - u * u / 2);
}
function project(p, th) {
  const tilt = 0.42; const c = Math.cos(th), s = Math.sin(th);
  let x = p.x * c + p.z * s, z = -p.x * s + p.z * c, y = p.y;
  const y2 = y * Math.cos(tilt) - z * Math.sin(tilt); const z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
  const k = 1 / (1 + 0.35 * z2);
  return { x: CC.x + x * CC.s * k, y: CC.y + y2 * CC.s * k, z: z2, k };
}
function scene5(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const late = seg(t, t5.stop0, t5.stop0 + 0.4); // 後半（情報で絞る）
  // 入力欄に質問を打つ
  const bu = spring(t - t5.box, 300, 24);
  if (bu > 0) {
    g.save(); g.globalAlpha *= clamp(bu) * (1 - 0.6 * late); g.translate(540, 330); g.scale(lerp(0.9, 1, bu), lerp(0.9, 1, bu));
    rr(-420, -48, 840, 96, 48); g.fillStyle = '#111317'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffffff44'; g.stroke();
    const n = Math.floor(Q.length * seg(t, t5.type0, t5.type1));
    const s = Q.slice(0, n); g.font = F(700, 38); g.fillStyle = C.fg; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillText(s, -380, 2); const cw = g.measureText(s).width;
    if (t < t5.type1 + 0.3 && Math.floor(t * 2.5) % 2 === 0) g.fillRect(-376 + cw, -22, 3, 44);
    dot(372, 0, 26, C.acc, 1); arrowHead(362, 0, 1, 0, '#fff', 20);
    g.restore();
  }
  // ニューラルネット：線と点、信号が上から下へ流れる
  const nu = seg(t, t5.box + 0.2, t5.box + 0.6) * (1 - late);
  if (nu > 0) {
    for (let r = 0; r < NET.length - 1; r++) for (const a of NET[r]) for (const b of NET[r + 1]) line(a.x, a.y, b.x, b.y, '#ffffff', 1, 0.12 * nu);
    const pu = seg(t, t5.net, t5.net + 0.8);
    if (pu > 0 && pu < 1) {
      const rr0 = Math.min(2, Math.floor(pu * 3)), f = pu * 3 - rr0;
      NET[rr0].forEach((a, i) => NET[rr0 + 1].forEach((b, j) => { if ((i + j + rr0) % 3 === 0) dot(lerp(a.x, b.x, f), lerp(a.y, b.y, f), 4, C.acc, 0.9 * nu); }));
    }
    NET.forEach((row, r) => row.forEach((p) => {
      const lit = pu > 0 ? clamp(1 - Math.abs(pu * 3 - r) * 1.2) : 0;
      dot(p.x, p.y, 9, lit > 0.05 ? C.acc : '#fff', nu * (0.55 + 0.45 * lit));
    }));
  }
  // ベクトル空間の軸と点
  const th = spin(t);
  const cu = seg(t, t5.burst - 0.05, t5.burst + 0.15);
  if (cu > 0) {
    const axA = cu * (1 - seg(t, t5.stop0, t5.c1));
    if (axA > 0) {
      [[1.25, 0, 0], [0, -1.25, 0], [0, 0, 1.25]].forEach(([x, y, z], i) => {
        const a = project({ x: -x, y: -y, z: -z }, th), b = project({ x, y, z }, th);
        line(a.x, a.y, b.x, b.y, C.axis, 2, 0.75 * axA); g.save(); g.globalAlpha *= axA * 0.75; arrowHead(b.x, b.y, b.x - a.x, b.y - a.y, C.axis, 14); g.restore();
      });
    }
    const pr = CLOUD.map((p) => ({ ...project(p, th), d: p.d })).sort((a, b) => b.z - a.z);
    for (const p of pr) {
      const sp = spring(t - t5.burst - p.d * 0.5, 160, 20);
      if (sp <= 0) continue;
      const x = lerp(540, p.x, sp), y = lerp(NET[3][2].y, p.y, sp);
      let a = (0.35 + 0.45 * (1 - (p.z + 1) / 2));
      let col = '#ffffff';
      // 情報の円：外の点を消していく
      let inAll = true;
      RINGS.forEach((R) => {
        const ru = seg(t, t5[R.t], t5[R.t] + 0.5);
        const inside = (p.x - R.x) ** 2 + (p.y - R.y) ** 2 < R.r ** 2;
        if (!inside) { a *= 1 - 0.85 * ru; inAll = false; }
      });
      if (inAll && t > t5.c3) a = lerp(a, 0.95, seg(t, t5.c3, t5.c3 + 0.5));
      dot(x, y, 3.2 + 2.4 * p.k * (inAll && t > t5.c3 ? 1.3 : 1), col, a * clamp(sp));
    }
  }
  // 未知数のラベル
  [['発信内容？', 220, 760, t5.u1], ['視聴者？', 860, 820, t5.u2], ['過去の投稿結果？', 280, 1215, t5.u3]].forEach(([s, x, y, tt]) => {
    const u = spring(t - tt, 300, 22); if (u <= 0) return;
    const fl = t > t5.mich ? 0.5 + 0.5 * Math.cos((t - t5.mich) * 9) : 1;
    box(s, x, y + 6 * Math.sin(t * 1.3 + x), { u, color: C.axis, font: F(800, 34), h: 58, fill: 'rgba(5,6,7,0.85)', alpha: (1 - late) * lerp(1, fl, seg(t, t5.mich, t5.mich + 0.1) * (1 - seg(t, t5.mich + 0.9, t5.mich + 1.1))) });
  });
  // 一般論の答え（灰色）
  const gu = spring(t - t5.gen, 280, 22);
  if (gu > 0) {
    g.save(); g.globalAlpha *= clamp(gu) * (1 - late); g.translate(540, 1345); g.scale(lerp(0.9, 1, gu), lerp(0.9, 1, gu));
    rr(-400, -45, 800, 90, 22); g.fillStyle = '#16181c'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#ffffff33'; g.stroke();
    text('一般論', -300, 12, { font: F(800, 36), color: C.dim });
    text('毎日投稿しましょう／ハッシュタグを活用', 70, 12, { font: F(500, 30), color: C.dim });
    g.restore();
  }
  // 情報の円
  RINGS.forEach((R) => {
    const u = eOut(seg(t, t5[R.t], t5[R.t] + 0.45)); if (u <= 0) return;
    g.save(); g.globalAlpha *= u; g.beginPath(); g.arc(R.x, R.y, R.r * lerp(0.6, 1, u), 0, 7); g.lineWidth = 3; g.strokeStyle = C.axis; g.stroke(); g.restore();
    text(R.label, R.lx, R.ly, { font: F(800, 36), color: C.axis, alpha: u, align: 'left' });
  });
  // 1点に絞られる → あなたに合った提案
  const pu2 = spring(t - t5.pick, 320, 20);
  if (pu2 > 0) {
    g.save(); g.globalAlpha *= clamp(pu2); g.beginPath(); g.arc(TARGET.x, TARGET.y, 24 * pu2, 0, 7); g.lineWidth = 5; g.strokeStyle = C.acc; g.stroke(); g.restore();
    dot(TARGET.x, TARGET.y, 10 * clamp(pu2), C.acc);
  }
  box('あなたに合った提案', 540, 1345, { u: spring(t - t5.card, 300, 22), font: F(800, 40) });
  g.restore();
}

// ---------- 場面6：役割より前提情報（パネル） ----------
const t6 = { gu: at('l19', '具体的'), role: at('l19', '役割'), strike: at('l19', 'よりも'), sub: at('l20', '答え'), main: at('l20', '前提'), big: at('l20', '大事') };
cue(t6.gu, 'pop', 0.5); cue(t6.role, 'tick', 0.5); cue(t6.strike, 'swish', 0.5); cue(t6.main, 'pop', 0.8); cue(t6.big, 'chime', 0.5);
function scene6(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const cx = PANEL.x + PANEL.w / 2;
  box('具体的な答えを引き出すには', cx, PANEL.y + 70, { u: spring(t - t6.gu, 300, 22), color: C.dim, font: F(700, 32), h: 56 });
  const ru = spring(t - t6.role, 300, 22);
  if (ru > 0) {
    g.save(); g.globalAlpha *= clamp(ru); g.translate(cx, PANEL.y + 175); g.scale(ru, ru);
    text('役割を与える', 0, 0, { font: F(900, 64), color: t > t6.strike ? C.dim : C.fg, base: 'middle' });
    const su = eOut(seg(t, t6.strike, t6.strike + 0.3));
    if (su > 0) line(-215, 4, -215 + 430 * su, 4, C.red, 8);
    g.restore();
  }
  text('答えを絞り込むための', cx, PANEL.y + 290, { font: F(700, 34), color: C.dim, alpha: seg(t, t6.sub, t6.sub + 0.25) });
  const mu = spring(t - t6.main, 260, 20);
  if (mu > 0) {
    g.save(); g.globalAlpha *= clamp(mu); g.translate(cx, PANEL.y + 385); const k = lerp(1.6, 1, clamp(mu)); g.scale(k, k);
    spans([['前提情報を', C.fg], ['渡す', C.acc]], 0, 30, F(900, 84));
    g.restore();
  }
  g.restore();
}

// ---------- 場面7：必要な情報を設計する（パネル）→ タイトル（全面） ----------
const t7 = { ai: at('l21', 'AI'), work: at('l21', '仕事'), chips: at('l21', '必要な'), into: at('l21', '設計'), title: at('l22', 'コンテキスト') };
cue(t7.ai, 'pop', 0.6);
['アカウント情報', '過去の投稿結果', '目標'].forEach((_, i) => cue(t7.chips + i * 0.22, 'tick', 0.5));
cue(t7.into, 'click', 0.6); cue(t7.title + 0.1, 'chime', 0.8);
function scene7(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const names = ['アカウント情報', '過去の投稿結果', '目標'];
  const into = eIO(seg(t, t7.into, t7.into + 0.6));
  const ax = PANEL.x + 700, ay = PANEL.y + 235;
  names.forEach((s, i) => {
    const u = spring(t - t7.chips - i * 0.22, 300, 22);
    const x = lerp(PANEL.x + 230, ax, into), y = lerp(PANEL.y + 110 + i * 125, ay, into);
    box(s, x, y, { u: u * (1 - 0.6 * into), color: C.axis, font: F(800, 36), h: 64, alpha: 1 - seg(t, t7.into + 0.45, t7.into + 0.6) });
  });
  const au = spring(t - t7.ai, 300, 22);
  // 「適切に仕事を進める」：AIの箱の下にチェック
  const wu = spring(t - t7.work, 300, 22);
  if (wu > 0) box('✓ 適切に仕事を進める', ax, ay + 160, { u: wu, color: C.dim, font: F(700, 28), h: 50, alpha: 1 - seg(t, t7.chips, t7.chips + 0.3) });
  if (au > 0) {
    g.save(); g.translate(ax, ay); g.scale(au * (1 + 0.08 * Math.sin(Math.PI * into)), au * (1 + 0.08 * Math.sin(Math.PI * into)));
    rr(-95, -95, 190, 190, 36); g.lineWidth = 4; g.strokeStyle = into > 0.9 ? C.acc : '#fff'; g.stroke();
    text('AI', 0, 22, { font: F(900, 70), color: into > 0.9 ? C.acc : '#fff' });
    g.restore();
    const ar = seg(t, t7.chips, t7.chips + 0.3) * (1 - into);
    line(PANEL.x + 440, ay, ax - 120, ay, '#fff', 3, ar); g.save(); g.globalAlpha *= ar; arrowHead(ax - 120, ay, 1, 0, '#fff'); g.restore();
  }
  g.restore();
}
function sceneTitle(t, al) {
  if (al <= 0) return;
  g.save(); g.globalAlpha = al;
  const u = spring(t - t7.title, 220, 20);
  g.save(); g.translate(540, 860); const k = lerp(1.3, 1, clamp(u)); g.scale(k, k); g.globalAlpha *= clamp(u);
  text('コンテキスト', 0, -60, { font: F(900, 120) });
  text('エンジニアリング', 0, 90, { font: F(900, 120), color: C.acc });
  g.restore();
  const lu = eOut(seg(t, t7.title + 0.35, t7.title + 0.8));
  line(540 - 330 * lu, 1010, 540 + 330 * lu, 1010, C.axis, 4);
  text('答えを絞り込む情報を、設計する', 540, 1100, { font: F(700, 44), color: C.dim, alpha: seg(t, t7.title + 0.6, t7.title + 0.9) });
  g.restore();
}

// ---------- 字幕 ----------
const MAXF = 18; // 顔を出している間は1行・最大18文字
function wrapJa(s, max) {
  const parts = []; let cur = '';
  const tokens = s.match(/[^、。？！」]*[、。？！」]?/g).filter(Boolean);
  for (const tk of tokens) {
    if ((cur + tk).length <= max) cur += tk;
    else { if (cur) parts.push(cur); cur = tk; }
    while (cur.length > max) {
      let cut = -1;
      for (let i = Math.min(max, cur.length - 2); i > 4; i--) if ('をがはにもとでの'.includes(cur[i - 1])) { cut = i; break; }
      if (cut < 0) cut = max;
      parts.push(cur.slice(0, cut)); cur = cur.slice(cut);
    }
  }
  if (cur) parts.push(cur);
  return parts;
}
const SUBS = (() => {
  const out = [];
  LINES.forEach((l, li) => {
    const next = LINES[li + 1] ? S(LINES[li + 1].id) - 0.05 : DUR;
    const end = Math.min(next, E(l.id) + 0.5);
    const pages = wrapJa(l.text, MAXF); let pos = 0;
    pages.forEach((p, k) => {
      const ri = Math.min(l.read.length - 1, Math.round(pos * l.read.length / l.text.length));
      const s0 = k === 0 ? S(l.id) : TIM.chars[l.id][ri];
      out.push({ id: l.id, text: p, s: s0, e: end, full: l.text });
      pos += p.length;
    });
    for (let k = 0; k < pages.length - 1; k++) out[out.length - pages.length + k].e = out[out.length - pages.length + k + 1].s;
  });
  return out;
})();
const KW = ['b＝−1', 'a＝1', '9つの値', '一般論', '前提情報', 'コンテキストエンジニアリング', '未知数', 'プロの数学者', '提案'];
function colorize(s) {
  const marks = new Array(s.length).fill(false);
  KW.forEach((k) => { let i = s.indexOf(k); while (i >= 0) { for (let j = 0; j < k.length; j++) marks[i + j] = true; i = s.indexOf(k, i + 1); } });
  const parts = []; for (let i = 0; i < s.length; i++) { const c = marks[i] ? C.axis : '#fff'; if (parts.length && parts[parts.length - 1][1] === c) parts[parts.length - 1][0] += s[i]; else parts.push([s[i], c]); }
  return parts;
}
function drawSubs(t, cover) {
  const cur = SUBS.filter((p) => t >= p.s && t < p.e);
  if (!cur.length) return;
  const p = cur[cur.length - 1];
  if (cover > 0.5) {
    // 全面のときは下に2行まで（文全体）
    const lines = split2(p.full);
    const fs = Math.min(1, ...lines.map((x) => 21 / Math.max(21, x.length)));
    lines.forEach((ln, i) => subLine(ln, 1480 + (i - (lines.length - 1)) * 64 + (lines.length === 1 ? 0 : 32), 46 * fs));
  } else {
    subLine(p.text, 1008, 46);
  }
}
// 全面のとき：文全体を2行までに。区切りのよい所（、や助詞の後）で真ん中に近い位置を選ぶ
function split2(s) {
  if (s.length <= 21) return [s];
  let best = -1, score = 1e9;
  const hira = (c) => c >= 'ぁ' && c <= 'ゖ';
  for (let i = 4; i < s.length - 3; i++) {
    const c = s[i - 1];
    // 句読点の後は強く優先。助詞の後は、次の文字がひらがなでない時だけ（「当ては|まる」を避ける）
    const good = '、。」'.includes(c) ? 0 : ('をがはにもとでの'.includes(c) && !hira(s[i])) ? 4 : 99;
    const longest = Math.max(i, s.length - i);
    const sc = good + longest * 0.8 + (longest > 24 ? 50 : 0);
    if (good < 99 && sc < score) { score = sc; best = i; }
  }
  if (best < 0) best = Math.ceil(s.length / 2);
  return [s.slice(0, best), s.slice(best)];
}
function subLine(s, y, px) {
  g.save(); g.font = F(800, px); g.lineJoin = 'round';
  const parts = colorize(s); const ws = parts.map((q) => g.measureText(q[0]).width); const tw = ws.reduce((a, b) => a + b, 0);
  let x = 540 - tw / 2; g.textAlign = 'left';
  parts.forEach((q, i) => {
    g.lineWidth = 9; g.strokeStyle = 'rgba(0,0,0,0.85)'; g.strokeText(q[0], x, y);
    g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 14; g.fillStyle = q[1]; g.fillText(q[0], x, y); g.shadowBlur = 0;
    x += ws[i];
  });
  g.restore();
}

// ---------- 1コマ ----------
function renderAt(t) {
  g.clearRect(0, 0, W, H);
  const cover = drawGround(t);
  // パネルの中身（顔を出している間）
  scene12(t, (1 - seg(t, T.c1in - 0.15, T.c1in)) * seg(t, 0.15, 0.4));
  scene4(t, panelIn(t, T.c1out + SHRINK, T.c2in));
  scene6(t, panelIn(t, T.c2out + SHRINK - 0.05, S('l21')));
  scene7(t, panelIn(t, S('l21') - 0.05, T.c3in));
  // 全面の中身
  scene3(t, coverIn(t, T.c1in, T.c1out));
  scene5(t, coverIn(t, T.c2in, T.c2out));
  sceneTitle(t, seg(t, T.c3in + FLOOD * 0.6, T.c3in + FLOOD + 0.1));
  drawSubs(t, cover);
}

await document.fonts.load(F(900, 40)); await document.fonts.load(F(800, 40)); await document.fonts.load(F(700, 40));
await document.fonts.load(F(500, 40)); await document.fonts.load(F(800, 40, true));
await document.fonts.load('400 40px KaTeX_Main'); await document.fonts.load('italic 400 40px KaTeX_Math');
await document.fonts.ready;
window.CUES = CUES.sort((a, b) => a.t - b.t);
window.SUBS = SUBS;
window.DUR = DUR;
window.frameAt = (t) => { renderAt(t); return cv.toDataURL('image/png'); };
window.drawAt = (t) => renderAt(t);
if (location.search.includes('preview')) {
  document.body.classList.add('preview');
  const t = parseFloat(new URLSearchParams(location.search).get('t') || '0'); renderAt(t);
}
window.ready = true;
