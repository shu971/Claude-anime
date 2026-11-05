// Self-made SFX for the aurora video, timed from the aligned caption chunks. Writes public/aurora_sfx.wav.
import fs from 'node:fs';
const src = fs.readFileSync('../mix.mjs', 'utf8');
const lib = src.slice(src.indexOf('const SR'), src.indexOf('// ===== placement'));
const C = JSON.parse(fs.readFileSync('../../src/aurora2/chunks.json', 'utf8'));
const T = (id) => C.find((c) => c.id === id).t;
const DURATION = 31.22 + 1.3;
const SC = { flash: T('c03'), flat: T('c05'), line: T('c09'), nice: T('c12'), fuwa: T('c15'), draw: T('c18'), copy: T('c22'), shift: T('c23'), blur: T('c25'), reveal: T('c28'), key: T('c30'), move: T('c31'), done: T('c34'), broll: T('c35'), big: T('c37'), outro: T('c45'), caption: T('c48') };
const body = `
${lib}
function blip(t, f = 1800, g = 0.16) { add(t, 0.07, (x) => g * Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 60)); }
function shwip(t, g = 0.22, d = 0.35) { const f = bp(1200, 3); add(t, d, (x) => { const p = x / d; return g * 2 * f(rnd(), 900 + 4000 * p) * Math.sin(Math.PI * p); }); }
function flip(t, g = 0.25) { const f = bp(900, 2); add(t, 0.22, (x) => g * 2 * f(rnd(), 600 + 2500 * x / 0.22) * Math.sin(Math.PI * x / 0.22)); }
function click(t, g = 0.25) { add(t, 0.03, (x) => g * (Math.sin(2 * Math.PI * 2600 * x) * 0.6 + rnd() * 0.4) * Math.exp(-x * 220)); }
function swell(t, d, g = 0.18) { const f = bp(500, 0.8); add(t, d, (x) => { const p = x / d; return g * 2 * f(rnd(), 300 + 1500 * p) * p * p * Math.min(1, (d - x) * 8); }); for (let k = 0; k < 3; k++) ding(t + d * 0.6 + k * 0.08, [1046.5, 1318.5, 1568][k], 0.06); }
// hook: flat card, then flips + 4-color flash
pop(0.02, 0.35); shimmer(SC.flash, 0.06);
for (let k = 0; SC.flash + k * 0.19 < SC.flat - 0.05; k++) blip(SC.flash + k * 0.19, 1400 + (k % 4) * 260, 0.14);
// flat explanation
flip(SC.flat - 0.1, 0.28); popLo(SC.flat + 0.05, 0.3); shwip(SC.line, 0.22, 0.45); tick(SC.line + 0.5, 0.15);
// nice one, light spreading
flip(SC.nice - 0.1, 0.28); swell(SC.fuwa - 0.1, 1.1, 0.16);
// pen tool: anchor clicks, then fill
whoosh(SC.draw - 0.1, 0.2, 0.4); for (let k = 0; k < 5; k++) click(SC.draw + 0.15 + k * ((SC.copy - 0.5 - SC.draw) / 5), 0.28); pop(SC.copy - 0.35, 0.3);
// copies + shift
popHi(SC.copy + 0.1, 0.35); popHi(SC.copy + 0.42, 0.35); shwip(SC.shift, 0.2, 0.5);
// blur reveal
swell(SC.blur + 0.1, SC.reveal - SC.blur - 0.1, 0.2); kira(SC.reveal, 0.13);
// keyframes, motion, done
for (let r = 0; r < 3; r++) for (let j = 0; j < 4; j++) tick(SC.key + r * 0.08 + j * 0.05, 0.1);
whoosh(SC.move, 0.18, 0.8); hit(SC.done - 0.02, 0.45); kira(SC.done, 0.16); shimmer(SC.done + 0.1, 0.07);
// b-roll + the prompt
whoosh(SC.broll - 0.05, 0.28, 0.6); riser(SC.big - 0.45, 0.4, 0.13); hit(SC.big - 0.03, 0.55); for (let j = 0; j < 3; j++) popHi(SC.big + j * 0.22, 0.3);
// outro
whoosh(SC.outro - 0.1, 0.25, 0.5); pop(SC.caption, 0.4); for (let j = 0; j < 3; j++) tick(SC.caption + 0.3 + j * 0.4, 0.1);
writeOut();
function writeOut() { const N2 = N; const out = Buffer.alloc(44 + N2 * 4); for (let i = 0; i < N2; i++) { const sm = Math.round(Math.tanh(sfx[i] * 0.5) * 32000); out.writeInt16LE(sm, 44 + i * 4); out.writeInt16LE(sm, 46 + i * 4); }
  out.write('RIFF', 0); out.writeUInt32LE(36 + N2 * 4, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22); out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34); out.write('data', 36); out.writeUInt32LE(N2 * 4, 40); fs.writeFileSync('../../public/aurora_sfx.wav', out); console.log('aurora_sfx.wav', DURATION); }
`;
const fn = new Function('fs', 'SC', 'DURATION', body);
fn(fs, SC, DURATION);
