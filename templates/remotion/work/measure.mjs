// Measures the zoom-target rectangles of the draft HTML in the same state run() is in when it calls go().
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const MOCK = path.resolve('../../lumo_mock');
const css = fs.readFileSync(path.join(MOCK, 'draft.css'), 'utf8').replace('<style>', '').replace('</style>', '');
const scr = fs.readFileSync(path.join(MOCK, 'draft_scr.html'), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Color+Emoji&display=block" rel="stylesheet">
<style>${css} body{font-family:"Noto Sans JP","Noto Color Emoji",sans-serif} *{transition:none!important} .row span{white-space:nowrap}</style></head>
<body><div class="fr" id="fr"><div class="cam" id="cam" style="position:relative">${scr}</div></div></body></html>`;
const require = createRequire(path.resolve('../package.json'));
let puppeteer; try { puppeteer = require('puppeteer-core'); } catch { puppeteer = createRequire(path.resolve('../../api/package.json'))('puppeteer-core'); }
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); }).listen(8770);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const pg = await b.newPage(); await pg.goto('http://127.0.0.1:8770/', { waitUntil: 'networkidle0' });
await pg.evaluate(() => document.fonts.ready);
const out = await pg.evaluate(() => {
  const cam = document.getElementById('cam'), scr = document.getElementById('scr');
  const rect = (id) => { let el = document.getElementById(id), x = 0, y = 0; const w = el.offsetWidth, h = el.offsetHeight; while (el && el !== cam) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; } return [x, y, w, h]; };
  const set = (n) => { scr.className = 'scr' + Array.from({ length: n }, (_, i) => ' s' + (i + 1)).join(''); };
  const R = {};
  set(1); R.top = rect('zTop');
  set(2); R.side = rect('zSide');
  set(4); R.card1 = rect('zCard1');
  set(5); R.chart = rect('zChart');
  set(6); R.title = rect('zTitle');
  return R;
});
fs.writeFileSync('rects.json', JSON.stringify(out, null, 1)); console.log(out);
await b.close(); srv.close();
