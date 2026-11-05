// Aurora gradient short — draft screens with camera moves and header-card captions (no audio yet).
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion';
import { loadFont as loadJP } from '@remotion/google-fonts/NotoSansJP';
import { SCENES, CAPTIONS, PALETTES, COLOR_CHANGES, BEFORE_GRADIENT, BG, PROMPTS, CAPTION_STYLE as C } from './config';
import { AuroraCard, BeforeCard, RadialCard, PATHS, mixHex, hexA } from './AuroraCard';

loadJP('normal', { weights: ['400', '500', '700', '900'] });

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const eout = Easing.out(Easing.cubic);
const FONT = C.font;

// camera: keys [time, x, y, scale]; world is 1080x1920, scaled around (540, 1100)
function cam(t: number, keys: [number, number, number, number][]) {
  let [x, y, s] = [keys[0][1], keys[0][2], keys[0][3]];
  for (let i = 1; i < keys.length; i++) { const [t0] = keys[i - 1], [t1, x1, y1, s1] = keys[i]; const k = eio(seg(t, t0, t1)); x = lerp(x, x1, k); y = lerp(y, y1, k); s = lerp(s, s1, k); }
  return `translate(${x}px, ${y}px) translate(540px, 1100px) scale(${s}) translate(-540px, -1100px)`;
}
const World: React.FC<{ tf: string; children: React.ReactNode; style?: React.CSSProperties }> = ({ tf, children, style }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: tf, ...style }}>{children}</div>
);
const At: React.FC<{ x: number; y: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ x, y, children, style }) => (
  <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)', ...style }}>{children}</div>
);
const sceneAlpha = (t: number, [a, b]: readonly [number, number]) => seg(t, a, a + 0.3) * (1 - seg(t, b - 0.3, b));
const Chip: React.FC<{ text: string; bg?: string; fg?: string; size?: number; k?: number }> = ({ text, bg = 'rgba(255,255,255,0.12)', fg = '#fff', size = 34, k = 1 }) => (
  <span style={{ display: 'inline-block', font: `900 ${size}px ${FONT}`, color: fg, background: bg, padding: `${size * 0.25}px ${size * 0.7}px`, borderRadius: 99, transform: `scale(${k})`, opacity: clamp(k * 2), whiteSpace: 'nowrap', border: '2px solid rgba(255,255,255,0.18)' }}>{text}</span>
);
function palette(t: number) {
  let cur = PALETTES.red;
  for (let i = 1; i < COLOR_CHANGES.length; i++) { const [tc, name] = COLOR_CHANGES[i]; const k = eio(seg(t, tc, tc + 0.6)); const nx = PALETTES[name]; cur = cur.map((c, j) => mixHex(c, nx[j], k)); }
  return cur;
}
// typed chat message
const Chat: React.FC<{ text: string; t: number; t0: number; w?: number; reply?: string; tReply?: number }> = ({ text, t, t0, w = 880, reply, tReply = 1e9 }) => {
  const n = Math.floor(clamp((t - t0) / Math.max(1.0, text.length * 0.045)) * text.length);
  return (
    <div style={{ width: w, borderRadius: 30, background: 'rgba(28,24,30,0.95)', border: '2px solid rgba(255,255,255,0.08)', padding: '22px 26px 26px', boxSizing: 'border-box', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
      <div style={{ font: `800 26px ${FONT}`, color: 'rgba(255,255,255,0.55)', marginBottom: 16 }}>✦ AIチャット</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ maxWidth: w * 0.84, font: `700 34px/1.5 ${FONT}`, color: '#fff', background: '#3f6fb0', borderRadius: '26px 26px 6px 26px', padding: '14px 22px', minHeight: 40 }}>{t < t0 ? '' : text.slice(0, Math.max(1, n))}<span style={{ opacity: n < text.length && Math.floor(t * 3) % 2 ? 1 : 0 }}>|</span></div>
      </div>
      {reply && t > tReply && <div style={{ marginTop: 16, display: 'inline-block', font: `700 32px ${FONT}`, color: '#1d2433', background: '#eef0f4', borderRadius: '26px 26px 26px 6px', padding: '12px 22px', opacity: seg(t, tReply, tReply + 0.2) }}>{reply}</div>}
    </div>
  );
};

// ---------------- scenes ----------------
const Hook: React.FC<{ t: number; spr: (t0: number) => number }> = ({ t, spr }) => {
  const k = spr(2.7);
  return (
    <World tf={cam(t, [[0, 0, 0, 1], [3.6, 0, 0, 1], [5.6, 0, -160, 1.28]])}>
      <At x={540} y={640}><div style={{ opacity: 1 - seg(t, 3.6, 4.6) * 0.6 }}><Chat text={PROMPTS[0].text} t={t} t0={0.4} reply="できました！" tReply={2.3} /></div></At>
      <At x={540} y={1240} style={{ transform: `translate(-50%, -50%) translateY(${(1 - k) * 160}px) scale(${0.7 + 0.3 * k})`, opacity: clamp(k * 2) }}><BeforeCard w={520} gradient={BEFORE_GRADIENT} /></At>
    </World>
  );
};
const Compare: React.FC<{ t: number; spr: (t0: number) => number }> = ({ t, spr }) => (
  <World tf={cam(t, [[6, 0, 40, 0.94], [9.4, 0, 0, 1], [10.2, 0, 0, 1], [13.4, -350, -40, 1.55]])}>
    <At x={300} y={1120}><BeforeCard w={420} gradient={BEFORE_GRADIENT} /></At>
    <At x={780} y={1120}><AuroraCard w={420} colors={PALETTES.red} blur={30} t={t} amp={0.4} /></At>
    <At x={300} y={1470}><Chip text="よくあるグラデ" k={spr(6.6)} /></At>
    <At x={780} y={1470}><Chip text="光のグラデ" bg="rgba(224,23,58,0.85)" k={spr(7.6)} /></At>
    <At x={540} y={1120}><div style={{ font: `900 64px ${FONT}`, color: 'rgba(255,255,255,0.75)', opacity: seg(t, 6.4, 6.8) * (1 - seg(t, 10.2, 10.8)) }}>VS</div></At>
  </World>
);
const Why: React.FC<{ t: number; spr: (t0: number) => number }> = ({ t, spr }) => {
  const arr = eout(seg(t, 14.6, 15.6)), ring = spr(17.9);
  return (
    <World tf={cam(t, [[14, 0, 0, 1], [16.7, 0, 0, 1], [17.4, -1080, 0, 1]])}>
      <At x={540} y={1110}><BeforeCard w={560} gradient={BEFORE_GRADIENT} /></At>
      {/* straight top -> bottom arrow */}
      <At x={900} y={1110}><svg width={120} height={700} style={{ overflow: 'visible' }}><defs><marker id="arw" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto"><path d="M0,0 L10,5 L0,10 z" fill="#fff" /></marker></defs><line x1={60} y1={20} x2={60} y2={20 + 640 * arr} stroke="#fff" strokeWidth={8} strokeDasharray="18 12" markerEnd="url(#arw)" /></svg></At>
      <At x={900} y={1500}><div style={{ opacity: seg(t, 15.4, 15.8) }}><Chip text="均一に明るく" size={30} /></div></At>
      <At x={1620} y={1110}><AuroraCard w={560} colors={PALETTES.red} blur={30} t={t} amp={0.25} /></At>
      <At x={1760} y={1290}><div style={{ width: 300, height: 300, borderRadius: '50%', border: '6px dashed #fff', transform: `scale(${ring})`, opacity: clamp(ring * 2) }} /></At>
      <At x={1460} y={820}><div style={{ width: 230, height: 230, borderRadius: '50%', border: '6px dashed rgba(255,255,255,0.5)', transform: `scale(${spr(18.4)})`, opacity: clamp(spr(18.4) * 2) }} /></At>
      <At x={1880} y={1530}><Chip text="明るい" size={30} bg="rgba(224,23,58,0.9)" k={spr(18.1)} /></At>
      <At x={1340} y={650}><Chip text="暗い" size={30} k={spr(18.6)} /></At>
    </World>
  );
};
const Reveal: React.FC<{ t: number; spr: (t0: number) => number }> = ({ t, spr }) => {
  const ex = eio(seg(t, 21.2, 23.4)) * (1 - eio(seg(t, 27.4, 28.8)));
  const drift = Math.sin((t - 23.4) * 0.8) * 4 * ex;
  const blurV = 30 * eio(seg(t, 29.4, 32.4));
  const W = 560, H = (W * 4) / 3;
  const labels = ['奥：いちばん暗い色', '中：少し明るい色', '手前：かなり明るい色'];
  return (
    <World tf={cam(t, [[20, 0, 0, 1], [21.2, 0, 0, 1], [23.4, 0, -40, 0.92], [27.4, 0, -40, 0.92], [28.8, 0, 0, 1], [29.4, 0, 0, 1], [32.6, 0, -30, 1.12]])}>
      <At x={540 + 110 * ex} y={1090}>
        <div style={{ width: W, height: H, perspective: 2200 }}>
          <div style={{ position: 'relative', width: W, height: H, transformStyle: 'preserve-3d', transform: `rotateX(${52 * ex}deg) rotateZ(${(-30 + drift) * ex}deg)` }}>
            {ex < 0.001 ? (
              <AuroraCard w={W} colors={PALETTES.red} blur={blurV} t={t} amp={0} />
            ) : (
              [0, 1, 2].map((i) => (
                <div key={i} style={{ position: 'absolute', inset: 0, transform: `translateZ(${i * 190 * ex}px)`, transformStyle: 'preserve-3d' }}>
                  <AuroraCard w={W} colors={PALETTES.red} blur={0} t={t} amp={0} only={[i]} transparent={i > 0} outline glow={i === 0 ? 1 : 0} style={{ background: i === 0 ? BG : 'rgba(255,255,255,0.03)' }} />
                  <div style={{ position: 'absolute', right: W + 20, top: H * 0.66, font: `900 30px ${FONT}`, color: i === 2 ? '#3a0812' : '#fff', whiteSpace: 'nowrap', background: hexA(PALETTES.red[i], 0.9), padding: '8px 20px', borderRadius: 14, opacity: seg(ex, 0.7, 1) }}>{labels[i]}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </At>
      {/* blur slider */}
      <At x={540} y={1580}>
        <div style={{ width: 820, opacity: seg(t, 29.0, 29.3), display: 'flex', alignItems: 'center', gap: 28, background: 'rgba(28,24,30,0.92)', borderRadius: 26, padding: '22px 30px', boxSizing: 'border-box' }}>
          <span style={{ font: `900 34px ${FONT}`, color: '#fff', whiteSpace: 'nowrap' }}>ぼかし</span>
          <div style={{ position: 'relative', flex: 1, height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.15)' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(blurV / 30) * 100}%`, borderRadius: 7, background: '#f05a70' }} />
            <div style={{ position: 'absolute', left: `${(blurV / 30) * 100}%`, top: '50%', width: 40, height: 40, borderRadius: '50%', background: '#fff', transform: 'translate(-50%,-50%)', boxShadow: '0 0 18px rgba(240,90,112,0.8)' }} />
          </div>
          <span style={{ font: `900 38px ${FONT}`, color: '#f7b8c2', width: 120, textAlign: 'right' }}>{Math.round(blurV)}px</span>
        </div>
      </At>
    </World>
  );
};
const Motion: React.FC<{ t: number; spr: (t0: number) => number }> = ({ t, spr }) => {
  const cols = palette(t), names = ['red', 'purple', 'blue', 'green'] as const;
  const ry = Math.sin((t - 34) * 0.45) * 9, rx = Math.cos((t - 34) * 0.35) * 5;
  return (
    <World tf={cam(t, [[34, 0, 30, 0.95], [38, 0, 0, 1.05], [43, 0, 0, 1.0]])}>
      <At x={540} y={1080}><div style={{ perspective: 2000 }}><div style={{ transform: `rotateY(${ry}deg) rotateX(${rx}deg)` }}><AuroraCard w={600} colors={cols} blur={30} t={t} amp={1} /></div></div></At>
      <At x={540} y={1560}>
        <div style={{ display: 'flex', gap: 30, opacity: seg(t, 38.3, 38.7) }}>
          {names.map((n, i) => { const on = t >= COLOR_CHANGES[i][0] && (i === 3 || t < COLOR_CHANGES[i + 1][0]); return <div key={n} style={{ width: 70, height: 70, borderRadius: '50%', background: `radial-gradient(circle at 70% 70%, ${PALETTES[n][2]}, ${PALETTES[n][0]})`, transform: `scale(${on ? 1.25 : 0.9})`, boxShadow: on ? `0 0 26px ${PALETTES[n][1]}` : 'none', border: on ? '4px solid #fff' : '4px solid transparent' }} />; })}
        </div>
      </At>
    </World>
  );
};
const Prompts: React.FC<{ t: number; spr: (t0: number) => number }> = ({ t, spr }) => {
  const rows = [43, 47, 51], Y = [760, 1700, 2640];
  const keys: [number, number, number, number][] = [[43, 0, 1100 - Y[0] - 40, 1], [46.6, 0, 1100 - Y[0] - 40, 1], [47.4, 0, 1100 - Y[1] - 40, 1], [50.6, 0, 1100 - Y[1] - 40, 1], [51.4, 0, 1100 - Y[2] - 40, 1]];
  return (
    <World tf={cam(t, keys)}>
      {PROMPTS.map((p, i) => (
        <React.Fragment key={i}>
          <At x={540} y={Y[i] - 120}><Chat text={p.text} t={t} t0={rows[i] + 0.2} w={960} /></At>
          <At x={340} y={Y[i] + 260}>
            <div style={{ opacity: seg(t, rows[i] + 1.6, rows[i] + 1.9), transform: `scale(${0.85 + 0.15 * spr(rows[i] + 1.6)})` }}>
              {i === 0 ? <BeforeCard w={260} gradient={BEFORE_GRADIENT} /> : i === 1 ? <RadialCard w={260} /> : <AuroraCard w={260} colors={PALETTES.red} blur={30} t={t} amp={0.6} />}
            </div>
          </At>
          <At x={720} y={Y[i] + 260}><Chip text={p.grade} size={44} bg={['rgba(255,255,255,0.14)', 'rgba(240,90,112,0.7)', 'rgba(224,23,58,0.95)'][i]} k={spr(rows[i] + 2.1)} /></At>
        </React.Fragment>
      ))}
    </World>
  );
};
const Close: React.FC<{ t: number }> = ({ t }) => (
  <World tf={cam(t, [[56, 0, -40, 1.18], [60, 0, 0, 1.0]])}>
    <At x={540} y={1080}><AuroraCard w={640} colors={PALETTES.red} blur={30} t={t} amp={0.7} /></At>
  </World>
);

// ---------------- captions (pattern B header card) ----------------
const Captions: React.FC<{ t: number; spr: (t0: number, d?: number, s?: number) => number }> = ({ t, spr }) => {
  const i = CAPTIONS.findIndex((c) => t >= c.t[0] && t < c.t[1]); if (i < 0) return null;
  const c = CAPTIONS[i]; const k = eout(seg(t, c.t[0], c.t[0] + 0.25)), leave = eout(seg(t, c.t[1] - 0.15, c.t[1]));
  const cardIn = spr(0.0, 14, 200);
  const line = (parts: [string, boolean?][], size: number, t0: number, color: string) => (
    <div style={{ font: `900 ${size}px/1.3 ${FONT}`, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
      {parts.map(([s, acc], j) => { const kk = acc ? spr(t0 + 0.05, 9, 260) : eout(seg(t, t0, t0 + 0.2)); return <span key={j} style={{ display: 'inline-block', whiteSpace: 'pre', color: acc ? C.accent : color, transform: acc ? `scale(${1.6 - 0.6 * kk})` : `translateX(${(1 - kk) * -20}px)`, transformOrigin: 'left center', opacity: clamp(kk * 2) }}>{s}</span>; })}
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: C.card.x, top: C.card.y, width: C.card.w, height: C.card.h, borderRadius: C.card.radius, background: C.card.bg, border: `2px solid ${C.card.border}`, boxShadow: '0 14px 40px rgba(0,0,0,0.5)', overflow: 'hidden', transform: `translateY(${(1 - cardIn) * -80}px)`, opacity: cardIn }}>
      <div style={{ position: 'absolute', inset: 0, padding: '24px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `translateY(${(1 - k) * 40 - leave * 40}px)`, opacity: k * (1 - leave) }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {c.badge && <span style={{ font: `900 30px ${FONT}`, color: '#1a0a0e', background: C.accent, borderRadius: 12, padding: '4px 14px', marginRight: 16, transform: `scale(${spr(c.t[0], 10, 220)})` }}>{c.badge}</span>}
          {line(c.l1, C.size1, c.t[0] + 0.05, C.white)}
        </div>
        {c.l2 && <div style={{ marginTop: 10 }}>{line(c.l2, C.size2, c.t[0] + 0.35, C.sub)}</div>}
      </div>
    </div>
  );
};

export const AuroraDraft: React.FC = () => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig(); const t = frame / fps;
  const spr = (t0: number, damping = 12, stiffness = 200) => (t < t0 ? 0 : spring({ frame: (t - t0) * fps, fps, config: { damping, stiffness, mass: 0.6 } }));
  const scenes: [readonly [number, number], React.ReactNode][] = [
    [SCENES.hook, <Hook t={t} spr={spr} />], [SCENES.compare, <Compare t={t} spr={spr} />], [SCENES.why, <Why t={t} spr={spr} />],
    [SCENES.reveal, <Reveal t={t} spr={spr} />], [SCENES.motion, <Motion t={t} spr={spr} />], [SCENES.prompts, <Prompts t={t} spr={spr} />], [SCENES.close, <Close t={t} />],
  ];
  const glow = palette(t)[0];
  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 70% 45% at 60% 62%, ${hexA(glow, 0.12)}, transparent 70%)` }} />
      {scenes.map(([w, node], i) => { const a = sceneAlpha(t, w); return a > 0 ? <AbsoluteFill key={i} style={{ opacity: a }}>{node}</AbsoluteFill> : null; })}
      <Captions t={t} spr={spr} />
      <svg style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: 0.06, mixBlendMode: 'overlay' }}><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={Math.floor(t * 12)} /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg>
      <div style={{ position: 'absolute', right: 28, bottom: 28, font: `700 22px ${FONT}`, color: 'rgba(255,255,255,0.3)' }}>DRAFT</div>
    </AbsoluteFill>
  );
};
