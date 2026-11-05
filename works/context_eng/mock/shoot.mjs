// node works/context_eng/mock/shoot.mjs  -> mock/out/{0,A,B,C}.png と mock/out/sheet.png
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const HERE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')));
const ROOT = path.resolve(HERE, '..', '..', '..');
const puppeteer = createRequire(path.join(ROOT, 'package.json'))('puppeteer-core');
const TYPES = { '.html': 'text/html', '.jpg': 'image/jpeg', '.png': 'image/png', '.js': 'text/javascript' };
const server = http.createServer((req, res) => {
  const p = path.join(HERE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(HERE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(8771);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
// node shoot.mjs [ページ] [名前...]  例: node shoot.mjs mock2.html D E F
const file = process.argv[2] || 'mock.html';
const names = process.argv.length > 3 ? process.argv.slice(3) : ['0', 'A', 'B', 'C'];
const sheetName = file === 'mock.html' ? 'sheet.png' : `sheet_${path.basename(file, '.html')}.png`;
for (const v of names) {
  await page.goto(`http://127.0.0.1:8771/${file}?v=${v}`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => window.ready);
  await page.screenshot({ path: path.join(HERE, 'out', `${v}.png`) });
}
await browser.close();
server.close();
const ins = names.flatMap((v) => ['-i', path.join(HERE, 'out', `${v}.png`)]);
spawnSync('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex',
  names.map((_, i) => `[${i}]scale=540:-1[s${i}]`).join(';') + ';' + names.map((_, i) => `[s${i}]`).join('') + `hstack=${names.length}`,
  path.join(HERE, 'out', sheetName)], { stdio: 'inherit' });
console.log('done');
