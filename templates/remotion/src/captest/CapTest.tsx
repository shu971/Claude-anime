// Caption-only samples (10s, 9:16) for the aurora video, assuming very fast narration.
// Pattern 1: tiny chunks flashed in the same spot, plain bold text.
// Pattern 2: slightly longer chunks in a white box, the spoken token highlighted as it goes.
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansJP';

loadFont('normal', { weights: ['500', '700', '800', '900'] });
const FONT = '"Noto Sans JP", sans-serif';
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eout = Easing.out(Easing.cubic);

// fast speech: seconds per character (+ a beat on punctuation)
const SEC_PER_CHAR = 0.085, PER_CHUNK = 0.05, PUNCT = 0.08;
const dur = (s: string) => s.length * SEC_PER_CHAR + PER_CHUNK + (/[、。]$/.test(s) ? PUNCT : 0);

// layout: caption above the card (card = where the gradient will be)
const CARD = { w: 660, h: 880, top: 560 };
const CAP_Y = 440;

const Stage: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <AbsoluteFill style={{ background: '#050304' }}>
    <div style={{ position: 'absolute', left: (1080 - CARD.w) / 2, top: CARD.top, width: CARD.w, height: CARD.h, borderRadius: 60, border: '3px dashed rgba(255,255,255,0.14)', boxShadow: '0 0 140px 10px rgba(224,23,58,0.18)' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: `700 30px ${FONT}`, color: 'rgba(255,255,255,0.2)' }}>（グラデーションのカード）</div>
    </div>
    {children}
    <div style={{ position: 'absolute', left: 40, top: 1830, font: `700 26px ${FONT}`, color: 'rgba(255,255,255,0.35)' }}>{label}</div>
  </AbsoluteFill>
);

// ---------------- Pattern 1 ----------------
const P1: { s: string; small?: string; big?: boolean }[] = [
  { s: 'AIで作った' }, { s: '安っぽい背景を' }, { small: 'こんな', s: 'グラデーションに' }, { s: '変える方法。', big: true },
  { s: 'AIの背景が' }, { s: 'のっぺりして' }, { s: '見えるのは、' }, { s: '直線で明るさを' }, { s: '変えてるから。', big: true },
  { s: 'こっちが綺麗に' }, { s: '見えるのは、' }, { s: 'ふわっと光が' }, { s: '広がるから。', big: true },
  { s: 'ランダムな' }, { s: '波打つ図形を' }, { s: '用意して' }, { s: 'みましょう。' },
];
const ACCENTS = ['グラデーション', '安っぽい', 'のっぺり', '直線', 'ふわっと', 'ランダム', '波打つ'];
const ACC = '#ff6a86';
const withAccents = (s: string) => {
  const re = new RegExp(`(${ACCENTS.join('|')})`);
  return s.split(re).filter(Boolean).map((p, i) => <span key={i} style={{ color: ACCENTS.includes(p) ? ACC : undefined }}>{p}</span>);
};

export const CaptionTest1: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  let acc = 0.25, idx = -1, t0 = 0;
  P1.forEach((c, i) => { const start = acc; acc += dur((c.small ?? '') + c.s); if (t >= start) { idx = i; t0 = start; } });
  if (idx < 0) return <Stage label="サンプル1：短く区切って高速表示">{null}</Stage>;
  const c = P1[idx], tt = t - t0;
  const k = spring({ frame: tt * fps, fps, config: { damping: 11, stiffness: 320, mass: 0.5 } });
  const size = c.big ? 104 : 92;
  const shake = c.big ? Math.sin(tt * 60) * 6 * Math.exp(-tt * 10) : 0;
  return (
    <Stage label="サンプル1：短く区切って高速表示">
      <div style={{ position: 'absolute', left: 0, right: 0, top: CAP_Y, transform: `translate(${shake}px, -50%)`, textAlign: 'center' }}>
        {c.small && <div style={{ font: `900 58px/1.1 ${FONT}`, color: '#fff', opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 18}px)`, textShadow: '0 4px 18px rgba(0,0,0,0.6)' }}>{c.small}</div>}
        <div style={{ display: 'inline-block', font: `900 ${size}px/1.2 ${FONT}`, color: '#fff', whiteSpace: 'nowrap', letterSpacing: '0.01em', opacity: clamp(k * 2.5), transform: `translateY(${(1 - k) * 26}px) scale(${0.82 + 0.18 * k})`, textShadow: '0 4px 22px rgba(0,0,0,0.65)' }}>
          {[...withAccents(c.s)]}
        </div>
      </div>
    </Stage>
  );
};

// ---------------- Pattern 2 ----------------
const P2: string[][] = [
  ['AIで', '作った', '安っぽい', '背景を'],
  ['こんな', 'グラデーションに'],
  ['変える', '方法。'],
  ['AIの', '背景が', 'のっぺりして'],
  ['見えるのは、'],
  ['直線で', '明るさを', '変えてるから。'],
  ['こっちが', '綺麗に', '見えるのは、'],
  ['ふわっと', '光が', '広がるから。'],
  ['ランダムな', '波打つ', '図形を'],
  ['用意して', 'みましょう。'],
];
const BOX = { bg: '#ffffff', text: '#6a6f7a', active: '#14161f', pill: '#ebe7df', size: 60 };

export const CaptionTest2: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  // build token timeline
  let acc = 0.25; const chunks = P2.map((toks) => { const ts = toks.map((tk) => { const s = acc; acc += dur(tk) - PER_CHUNK + 0.02; return s; }); const start = ts[0]; acc += PER_CHUNK; return { toks, ts, start, end: acc }; });
  const ci = chunks.findIndex((c) => t >= c.start && t < c.end);
  const label = 'サンプル2：ボックス＋読み上げ位置のハイライト';
  if (ci < 0) return <Stage label={label}>{null}</Stage>;
  // one box: k = entrance spring (0..1), out = exit progress (0..1)
  const Box = (c: typeof chunks[number], ti: number, k: number, out: number, key: string) => (
    <div key={key} style={{ position: 'absolute', left: 0, right: 0, top: CAP_Y, display: 'flex', justifyContent: 'center', transform: 'translateY(-50%)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: BOX.bg, borderRadius: 22, padding: '18px 22px', boxShadow: '0 14px 40px rgba(0,0,0,0.45), 0 2px 0 rgba(0,0,0,0.08)', whiteSpace: 'nowrap',
        transform: `translateY(${(1 - k) * 46 - out * 70}px) scale(${(0.78 + 0.22 * k) * (1 - 0.18 * out)}) rotate(${(1 - k) * -4 + out * 3}deg)`, opacity: clamp(k * 3) * (1 - out) }}>
        {c.toks.map((tk, i) => {
          const on = i === ti && out === 0, ka = on ? eout(seg(t, c.ts[i], c.ts[i] + 0.07)) : 0;
          const popK = on ? Math.sin(Math.PI * seg(t, c.ts[i], c.ts[i] + 0.16)) : 0;
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', padding: '2px 12px', font: `800 ${BOX.size}px/1.25 ${FONT}`, color: on ? BOX.active : i < ti ? '#3d424d' : BOX.text, transform: `scale(${1 + 0.06 * popK})` }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: 12, background: BOX.pill, opacity: ka, transform: `scale(${0.85 + 0.15 * ka})`, zIndex: 0 }} />
              <span style={{ position: 'relative' }}>{tk}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
  const c = chunks[ci], tt = t - c.start;
  const kBox = spring({ frame: tt * fps, fps, config: { damping: 9, stiffness: 340, mass: 0.5 } }); // bouncy landing
  let ti = 0; c.ts.forEach((s, i) => { if (t >= s) ti = i; });
  const prev = ci > 0 ? chunks[ci - 1] : null, outK = eout(seg(tt, 0, 0.14));
  return (
    <Stage label={label}>
      {prev && outK < 1 && Box(prev, prev.toks.length - 1, 1, outK, 'prev')}
      {Box(c, ti, kBox, 0, 'cur')}
    </Stage>
  );
};
