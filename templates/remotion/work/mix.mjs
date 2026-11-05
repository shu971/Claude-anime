// Beat-synced SFX for the Remotion video, timed from src/config.ts (narration time). Writes public/sfx.wav (+ public/preview_mix.wav).
import fs from 'node:fs';
import { STEPS, RAPID, FINAL, MOTION, AUDIO } from '../src/config.ts';
const DURATION = AUDIO.narrationLength + AUDIO.tail;
const SR = 48000, N = Math.ceil(DURATION * SR);
const sfx = new Float32Array(N);
let seed = 53; const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
const idx = (t) => Math.floor(t * SR);
function add(t0, dur, fn) { const s = idx(t0), n = idx(dur); for (let i = 0; i < n && s + i < N; i++) if (s + i >= 0) sfx[s + i] += fn(i / SR); }
const bp = (f, q) => { let low = 0, band = 0; return (x, fc = f) => { const F = 2 * Math.sin(Math.PI * Math.min(fc, SR / 6) / SR); low += F * band; const high = x - low - band / q; band += F * high; return band; }; };
const lp1 = (a) => { let y = 0; return (x) => (y += a * (x - y)); };
// baseball / scene sounds
function batCrack(t, g = 0.9) { const modes = [[820, 0.012], [1430, 0.009], [2350, 0.006], [3600, 0.004], [520, 0.02]]; add(t, 0.35, (x) => { let v = rnd() * Math.exp(-x * 260) * 1.2; for (const [f, d] of modes) v += Math.sin(2 * Math.PI * f * x + f) * Math.exp(-x / d) * 0.55; v += Math.sin(2 * Math.PI * 110 * x) * Math.exp(-x * 30) * 0.5; return g * v; }); for (const [d, a] of [[0.11, 0.18], [0.23, 0.1], [0.37, 0.05]]) add(t + d, 0.1, (x) => g * a * rnd() * Math.exp(-x * 120)); }
function phoneRing(t, dur = 1.0) { add(t, dur, (x) => { const on = (x % 0.5) < 0.38 ? 1 : 0; const f = Math.floor(x * 24) % 2 ? 1320 : 1760; return 0.06 * on * Math.sign(Math.sin(2 * Math.PI * f * x)) * Math.min(1, (dur - x) * 10); }); }
function powerDown(t, g = 0.35) { let ph = 0; add(t, 1.0, (x) => { ph += 2 * Math.PI * (180 * Math.exp(-x * 2.5) + 30) / SR; return g * (Math.sin(ph) + 0.3 * Math.sign(Math.sin(ph))) * Math.exp(-x * 2); }); }
function build(t, g = 0.3) { add(t, 0.09, (x) => g * (Math.sin(2 * Math.PI * 640 * x) + Math.sin(2 * Math.PI * 990 * x) * 0.5) * Math.exp(-x * 50)); }
function mitt(t, g = 0.4) { const l = lp1(0.2); add(t, 0.12, (x) => g * (l(rnd()) * 3 + Math.sin(2 * Math.PI * 180 * x)) * Math.exp(-x * 40)); }
// "mouth pop": short pitch-dropping sine + a lip click, the classic edit pop
function pop(t, g = 0.5, f0 = 900, f1 = 260) { let ph = 0; add(t, 0.12, (x) => { const f = f1 + (f0 - f1) * Math.exp(-x * 55); ph += 2 * Math.PI * f / SR; return g * (Math.sin(ph) * Math.exp(-x * 34) + (x < 0.003 ? rnd() * 0.6 : 0)); }); }
const popHi = (t, g = 0.45) => pop(t, g, 1400, 420);
const popLo = (t, g = 0.55) => pop(t, g, 650, 170);
// racket-style "byun": band-passed noise sweeping up then down, fast
function swing(t, g = 0.5, d = 0.32) { const f = bp(800, 6); add(t, d, (x) => { const p = x / d; const fc = 500 + 3500 * Math.sin(Math.PI * Math.min(1, p * 1.15)); return g * 2.2 * f(rnd(), fc) * Math.sin(Math.PI * p) ** 1.5; }); }
// soft airy whoosh for camera moves
function whoosh(t, g = 0.35, d = 0.5) { const f = bp(600, 1.2); add(t, d, (x) => { const p = x / d; return g * 1.6 * f(rnd(), 300 + 1600 * p) * Math.sin(Math.PI * p); }); }
// punchy hit: sub thump + click
function hit(t, g = 0.7, f0 = 120) { let ph = 0; add(t, 0.5, (x) => { ph += 2 * Math.PI * (45 + f0 * Math.exp(-x * 30)) / SR; return g * (Math.sin(ph) * Math.exp(-x * 7) + (x < 0.01 ? rnd() * 0.5 * (1 - x / 0.01) : 0)); }); }
// taiko-like drum for dramatic moments
function taiko(t, g = 0.8) { let ph = 0; const l = lp1(0.05); add(t, 0.8, (x) => { ph += 2 * Math.PI * (68 + 50 * Math.exp(-x * 18)) / SR; return g * (Math.sin(ph) * Math.exp(-x * 5) + 0.35 * l(rnd()) * Math.exp(-x * 25)); }); }
// paper rustle / unrolling scroll
function paper(t, g = 0.35, d = 0.45) { const f = bp(3000, 0.8); add(t, d, (x) => { const crack = Math.random ? (rnd() > 0.97 ? rnd() * 2 : 0) : 0; return g * (f(rnd(), 2500 + 1500 * Math.sin(x * 40)) * (0.5 + 0.5 * Math.abs(Math.sin(x * 23))) + crack * 0.2) * Math.sin(Math.PI * x / d); }); }
// shoji sliding: wooden rumble
function slideDoor(t, g = 0.4, d = 0.35) { const f = bp(220, 2); add(t, d, (x) => g * 2 * f(rnd(), 180 + 120 * Math.sin(x * 60)) * Math.min(1, x * 30) * Math.max(0, 1 - x / d)); add(t + d - 0.02, 0.08, (x) => g * 0.8 * Math.sin(2 * Math.PI * 160 * x) * Math.exp(-x * 60)); }
// wooden clack (scroll hitting the floor)
function clack(t, g = 0.35) { add(t, 0.08, (x) => g * (Math.sin(2 * Math.PI * 1100 * x) * 0.6 + Math.sin(2 * Math.PI * 1850 * x) * 0.4) * Math.exp(-x * 70)); }
// bright ding (mallet-ish), and a 2-note "kirarin"
function ding(t, f = 1568, g = 0.25) { add(t, 0.8, (x) => g * (Math.sin(2 * Math.PI * f * x) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * x) * Math.exp(-x * 8)) * Math.exp(-x * 4.5) * Math.min(1, x * 400)); }
const kira = (t, g = 0.22) => { ding(t, 1318.5, g); ding(t + 0.07, 1975.5, g * 0.9); ding(t + 0.14, 2637, g * 0.7); };
// sparkle shimmer
function shimmer(t, g = 0.12, d = 1.0) { for (let k = 0; k < 9; k++) ding(t + k * 0.05, 2200 + ((k * 7) % 5) * 330, g * (1 - k / 11)); }
// rising build into a hit
function riser(t, d = 0.6, g = 0.25) { const f = bp(400, 3); add(t, d, (x) => { const p = x / d; return g * 1.8 * f(rnd(), 300 + 3000 * p * p) * p; }); }
// "gaan": sad descending tone
function drop(t, g = 0.3) { let ph = 0; add(t, 0.8, (x) => { ph += 2 * Math.PI * (330 * Math.exp(-x * 1.4)) / SR; return g * (Math.sin(ph) + 0.4 * Math.sin(ph * 2)) * Math.exp(-x * 2.5); }); }
// tape rewind
function rewind(t, d = 0.45, g = 0.3) { let ph = 0; const f = bp(1500, 2); add(t, d, (x) => { const p = x / d; ph += 2 * Math.PI * (2400 - 1800 * p + 300 * Math.sin(x * 90)) / SR; return g * (0.5 * Math.sign(Math.sin(ph)) * 0.3 + f(rnd(), 2000) * 1.2) * Math.sin(Math.PI * p); }); }
// smoke bomb "bofu"
function smoke(t, g = 0.6) { const l = lp1(0.04); const f = bp(500, 1); add(t, 1.0, (x) => g * (l(rnd()) * 3 * Math.exp(-x * 4) + f(rnd(), 400 + 600 * Math.exp(-x * 3)) * 0.8 * Math.exp(-x * 3)) * Math.min(1, x * 80)); hit(t, 0.45, 80); }
// small UI sounds
function tick(t, g = 0.18) { add(t, 0.03, (x) => g * Math.sin(2 * Math.PI * 3200 * x) * Math.exp(-x * 160)); }
function key(t, g = 0.25) { add(t, 0.05, (x) => g * (rnd() * Math.exp(-x * 120) * 0.6 + Math.sin(2 * Math.PI * 1800 * x) * Math.exp(-x * 90) * 0.5)); }
function okCheck(t, g = 0.22) { ding(t, 1046.5, g); ding(t + 0.08, 1568, g); }
function buzz(t, g = 0.14) { add(t, 0.28, (x) => g * Math.sign(Math.sin(2 * Math.PI * 140 * x)) * (x < 0.12 || x > 0.16 ? 1 : 0) * Math.exp(-x * 3)); }


// ===== placement (all times = narration seconds) =====
function blip(t, f = 1800, g = 0.16) { add(t, 0.07, (x) => g * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 60)); }
function snap(t, g = 0.5) { hit(t, g * 0.7, 160); add(t, 0.04, (x) => g * rnd() * Math.exp(-x * 140)); ding(t + 0.01, 2093, g * 0.25); }
function shwip(t, g = 0.22, d = 0.35) { const f = bp(1200, 3); add(t, d, (x) => { const p = x / d; return g * 2 * f(rnd(), 900 + 4000 * p) * Math.sin(Math.PI * p); }); }
function thump(t, g = 0.7) { taiko(t, g * 0.7); hit(t, g * 0.5, 110); }
STEPS.forEach((s, i) => {
  whoosh(s.tQ - MOTION.camLead, 0.16, MOTION.camMove * 0.8);
  popHi(s.tQ, 0.5); hit(s.tQ, 0.35, 140);                       // question accent
  blip(s.tQ + MOTION.highlightAfterQ, 1500, 0.14); blip(s.tQ + MOTION.highlightAfterQ + 0.07, 2000, 0.1); // highlight on
  snap(s.tA, 0.55); shwip(s.tA + 0.02, 0.2, MOTION.change);     // answer accent + UI change
  if (i === 1) for (let k = 0; k < 9; k++) tick(s.tA + 0.03 + k * (MOTION.change / 9), 0.12); // 25px -> 16px count
  if (i === 3) for (let k = 0; k < 6; k++) pop(s.tA + 0.05 + k * 0.05, 0.12, 1400, 700);       // emoji -> icons
});
RAPID.forEach((r, i) => {
  whoosh(r.tHit - MOTION.rapidCamLead, 0.18, MOTION.rapidCamMove);
  thump(r.tHit, 0.75); popHi(r.tHit + 0.01, 0.3);
  snap(r.tChange, i === 2 ? 0.7 : 0.5); shwip(r.tChange, 0.2, 0.3);
  if (i === 2) { hit(r.tChange, 0.6, 90); buzz(r.tChange + 0.6, 0.08); }
});
whoosh(FINAL.camStart, 0.22, FINAL.camDur); shimmer(FINAL.t + 0.2, 0.07); kira(FINAL.t + 0.9, 0.12);

// ===== write =====
function readWav(p) { const b = fs.readFileSync(p); let o = 12, ch = 1, data; while (o < b.length) { const id = b.toString('ascii', o, o + 4), sz = b.readUInt32LE(o + 4); if (id === 'fmt ') ch = b.readUInt16LE(o + 10); if (id === 'data') data = b.subarray(o + 8, o + 8 + sz); o += 8 + sz + (sz % 2); } const n = Math.floor(data.length / 2 / ch), L = new Float32Array(n); for (let i = 0; i < n; i++) L[i] = data.readInt16LE(i * 2 * ch) / 32768; return L; }
function writeWav(p, f) { const out = Buffer.alloc(44 + N * 4); for (let i = 0; i < N; i++) { const sm = Math.round(Math.tanh(f(i)) * 32000); out.writeInt16LE(sm, 44 + i * 4); out.writeInt16LE(sm, 46 + i * 4); }
  out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N * 4, 40); fs.writeFileSync(p, out); }
const v = readWav('voice48k.wav');
writeWav('../public/sfx.wav', (i) => sfx[i] * 0.5);
writeWav('../public/narration.wav', (i) => v[i] || 0);
console.log('public/sfx.wav + public/narration.wav', DURATION.toFixed(2), 's');
