// node render.mjs stills hq|basic 1 3.5 ...   -> stills/<mode>_t*.jpg
// node render.mjs video hq|basic             -> out/demo_<mode>.mp4
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const ROOT = path.resolve(HERE, '..', '..'); // リポジトリ直下
const require = createRequire(path.join(ROOT, 'package.json'));
const puppeteer = require('puppeteer-core');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.mjs': 'text/javascript' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(8769);

const [cmd, mode = 'hq', ...rest] = process.argv.slice(2);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--ignore-gpu-blocklist', '--enable-gpu', '--use-angle=d3d11', '--hide-scrollbars'],
});
const page = await browser.newPage();
page.on('console', (m) => console.log('[page]', m.text()));
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
await page.goto(`http://127.0.0.1:8769/templates/3d/index.html?render${mode === 'basic' ? '&basic' : ''}`, { waitUntil: 'load' });
await page.evaluate(() => window.ready);
const grab = async (t, q) => Buffer.from((await page.evaluate((t, q) => window.frameAt(t, q), t, q)).split(',')[1], 'base64');

const out = (p) => path.join(HERE, p);
if (cmd === 'stills') {
  fs.mkdirSync(out('stills'), { recursive: true });
  for (const s of rest) fs.writeFileSync(out(`stills/${mode}_t${s}.jpg`), await grab(parseFloat(s), 0.88));
  console.log('stills done');
} else {
  fs.mkdirSync(out('out'), { recursive: true });
  const { FPS, DURATION } = await import('./timeline.js');
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
    out(`out/deploy_silent.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const n = Math.round(DURATION * FPS), t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await grab(i / FPS, 0.94);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log(`video done in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
await browser.close();
server.close();
