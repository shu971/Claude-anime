// node render.mjs stills 1.2 5.5 ...   -> stills/s_<t>.png と stills/sheet.png（元の映像に重ねた状態）
// node render.mjs video                -> out/silent.mp4（元の映像＋重ねた映像、音なし）と cues.json
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const HERE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')));
const ROOT = path.resolve(HERE, '..', '..');
const puppeteer = createRequire(path.join(ROOT, 'package.json'))('puppeteer-core');
const SRC = process.env.SRC_VIDEO || path.join(HERE, 'source.mp4'); // 背景にする喋り動画（コミットしない）
const FPS = 30;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(HERE, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(HERE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
}).listen(8772);

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
  args: ['--hide-scrollbars'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text()); });
await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:8772/overlay.html', { waitUntil: 'networkidle0' });
await page.waitForFunction(() => window.ready === true, { timeout: 60000 });
const DUR = await page.evaluate(() => window.DUR);
fs.writeFileSync(path.join(HERE, 'cues.json'), JSON.stringify(await page.evaluate(() => window.CUES), null, 1));
const grab = async (t) => Buffer.from((await page.evaluate((t) => window.frameAt(t), t)).split(',')[1], 'base64');

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === 'stills') {
  const dir = path.join(HERE, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const outs = [];
  for (const s of rest) {
    const t = parseFloat(s); const ov = path.join(dir, `ov_${s}.png`); const o = path.join(dir, `s_${s}.png`);
    fs.writeFileSync(ov, await grab(t));
    spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', SRC, '-i', ov, '-frames:v', '1', '-filter_complex',
      `[0:v][1:v]overlay=0:0,drawtext=fontfile='C\\:/Windows/Fonts/arial.ttf':text='${s}s':x=20:y=1860:fontsize=40:fontcolor=white:box=1:boxcolor=black@0.6`, o], { stdio: 'inherit' });
    outs.push(o);
  }
  const cols = Math.min(outs.length, 4), rows = Math.ceil(outs.length / cols);
  const ins = outs.flatMap((o) => ['-i', o]);
  const pad = cols * rows - outs.length;
  const f = outs.map((_, i) => `[${i}]scale=360:-1[s${i}]`).join(';') +
    (pad ? ';' + Array.from({ length: pad }, (_, k) => `color=c=black:s=360x640:d=1[p${k}]`).join(';') : '') + ';' +
    outs.map((_, i) => `[s${i}]`).join('') + Array.from({ length: pad }, (_, k) => `[p${k}]`).join('') +
    `xstack=inputs=${cols * rows}:layout=` + Array.from({ length: cols * rows }, (_, i) => `${(i % cols) * 360}_${Math.floor(i / cols) * 640}`).join('|');
  spawnSync('ffmpeg', ['-v', 'error', '-y', ...ins, '-filter_complex', f, '-frames:v', '1', path.join(dir, 'sheet.png')], { stdio: 'inherit' });
  console.log('stills done');
} else if (cmd === 'video') {
  fs.mkdirSync(path.join(HERE, 'out'), { recursive: true });
  const n = Math.round(DUR * FPS);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-i', SRC, '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-filter_complex', '[0:v][1:v]overlay=0:0:eof_action=pass,format=yuv420p[v]', '-map', '[v]', '-an',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-r', String(FPS), '-frames:v', String(n), path.join(HERE, 'out', 'silent.mp4')],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const buf = await grab(i / FPS);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`${(i / FPS).toFixed(1)}s / ${DUR}s  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  console.log('video done', ((Date.now() - t0) / 1000).toFixed(0) + 's');
}
await browser.close();
server.close();
