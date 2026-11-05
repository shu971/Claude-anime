// screenshots of the draft HTML screen in each state (s0..s7), for comparison
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
const MOCK = path.resolve('../../lumo_mock');
const css = fs.readFileSync(path.join(MOCK, 'draft.css'), 'utf8').replace('<style>', '').replace('</style>', '');
const scr = fs.readFileSync(path.join(MOCK, 'draft_scr.html'), 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.19.0/dist/tabler-icons.min.css"><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=Noto+Color+Emoji&display=block" rel="stylesheet"><style>${css} body{margin:0;font-family:"Noto Sans JP","Noto Color Emoji",sans-serif} *{transition:none!important} .fr{width:520px;height:720px;border-radius:0}</style></head><body><div class="fr" id="fr"><div id="cam">${scr}</div></div></body></html>`;
const puppeteer = createRequire(path.resolve('../../api/package.json'))('puppeteer-core');
const srv = http.createServer((q, r) => { r.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }); r.end(html); }).listen(8771);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const pg = await b.newPage(); await pg.setViewport({ width: 520, height: 720, deviceScaleFactor: 2 }); await pg.goto('http://127.0.0.1:8771/', { waitUntil: 'networkidle0' });
fs.mkdirSync('../stills/draft', { recursive: true });
for (let n = 0; n <= 7; n++) { await pg.evaluate((n) => { document.getElementById('scr').className = 'scr' + Array.from({ length: n }, (_, i) => ' s' + (i + 1)).join(''); }, n); await pg.screenshot({ path: `../stills/draft/s${n}.png`, clip: { x: 0, y: 0, width: 520, height: 720 } }); }
await b.close(); srv.close(); console.log('draft states done');
