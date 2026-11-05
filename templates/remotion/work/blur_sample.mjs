// One still comparing blur strengths of the aurora card (current 30 vs stronger 45 / 60).
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const puppeteer = createRequire(path.resolve('../../api/package.json'))('puppeteer-core');
const P = [
  ['#e0173a', 'M-60 470 L-60 250 C 0 215, 55 225, 88 205 C 122 184, 104 118, 156 98 C 206 80, 214 142, 244 132 C 276 121, 286 58, 360 44 L 360 470 Z'],
  ['#f05a70', 'M-60 470 L-60 345 C 20 330, 88 340, 120 296 C 150 254, 152 204, 202 192 C 244 182, 252 234, 284 212 C 304 198, 324 168, 360 166 L 360 470 Z'],
  ['#f7b8c2', 'M 52 470 C 96 420, 128 392, 158 338 C 188 284, 212 272, 252 278 C 292 284, 316 306, 360 292 L 360 470 Z'],
];
const card = (b, label, now) => `<div class="col"><div class="card"><svg viewBox="0 0 300 400" width="420" height="560"><defs><filter id="f${b}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${b}"/></filter></defs><g filter="url(#f${b})">${P.map(([c, d]) => `<path d="${d}" fill="${c}"/>`).join('')}</g></svg></div><div class="lb">${label}</div><div class="sub">${now}</div></div>`;
const html = `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@700;900&display=block" rel="stylesheet"><style>
body{margin:0;background:#050304;font-family:"Noto Sans JP",sans-serif}
.wrap{width:1620px;height:900px;display:flex;justify-content:center;align-items:center;gap:80px}
.card{width:420px;height:560px;border-radius:39px;overflow:hidden;background:#050304;box-shadow:0 0 98px 8px rgba(224,23,58,.32)}
.col{display:flex;flex-direction:column;align-items:center}
.lb{margin-top:46px;font:900 40px "Noto Sans JP";color:#fff}.sub{margin-top:6px;font:700 26px "Noto Sans JP";color:#f7b8c2}
</style></head><body><div class="wrap">${card(30, 'ぼかし 30', '今の動画')}${card(45, 'ぼかし 45', '1.5倍')}${card(60, 'ぼかし 60', '2倍')}</div></body></html>`;
fs.writeFileSync('blur_sample.html', html);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const pg = await b.newPage(); await pg.setViewport({ width: 1620, height: 900 });
await pg.goto('file:///' + path.resolve('blur_sample.html').replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
await pg.evaluate(() => document.fonts.ready);
await pg.screenshot({ path: '../stills/aurora/blur_sample.png' }); await b.close(); console.log('ok');
