// Aurora gradient short (final build). Card in the middle with same-color glow, pattern-1 captions above it.
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig, spring, Easing } from 'remotion';
import { loadFont } from '@remotion/google-fonts/NotoSansJP';
import { CHUNKS, AUDIO, SC, FLASH_STEP, BLUR, PALETTES, FLASH_ORDER, BEFORE_GRADIENT, BG, LAYOUT, CAP } from './cfg';
import { SHAPES, toD, waveD, lerpShape, anchors, layerTransform, Shape } from './shapes';
import { SiteBefore, CyberBG, Bulb, RedArrow, WallpaperBG } from './Decor';

loadFont('normal', { weights: ['500', '700', '800', '900'] });
const FONT = CAP.font;
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const eio = Easing.bezier(0.65, 0, 0.35, 1);
const eout = Easing.out(Easing.cubic);
const hexA = (hex: string, a: number) => { const h = hex.replace('#', ''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };
const mixHex = (a: string, b: string, k: number) => { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
type Spr = (t0: number, d?: number, s?: number) => number;

// ---------- the gradient artwork (SVG, 300x400 viewBox) ----------
let uid = 0;
const Art: React.FC<{ shapes: Shape[]; fills: string[]; blur: number; t: number; amp: number; bg: string; editor?: { stroke?: number; anchorsOf?: number; anchorK?: number; fill?: number[]; select?: number; guides?: number } ; aspect?: 'card' | 'wide' }> = ({ shapes, fills, blur, t, amp, bg, editor, aspect = 'card' }) => {
  const id = React.useMemo(() => `af${uid++}`, []);
  const fillA = editor?.fill ?? [1, 1, 1];
  const pts = editor?.anchorsOf !== undefined ? anchors(shapes[editor.anchorsOf]) : [];
  const nShow = Math.ceil((editor?.anchorK ?? 0) * pts.length);
  return (
    <svg viewBox="0 0 300 400" preserveAspectRatio={aspect === 'wide' ? 'xMidYMid slice' : 'xMidYMid meet'} width="100%" height="100%" style={{ display: 'block', background: bg }}>
      <defs><filter id={id} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation={blur} /></filter></defs>
      <g filter={blur > 0.05 ? `url(#${id})` : undefined}>
        {shapes.map((s, i) => <path key={i} d={toD(s)} fill={fills[i]} fillOpacity={fillA[i]} transform={layerTransform(i, t, amp)} />)}
      </g>
      {editor && (
        <g style={{ opacity: editor.guides ?? 1 }}>
          {editor.stroke !== undefined && <path d={waveD(shapes[0])} fill="none" stroke="#4f8cff" strokeWidth={2.4} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - editor.stroke} />}
          {editor.select !== undefined && editor.select > 0 && <rect x={6} y={40} width={288} height={354} fill="none" stroke="#4f8cff" strokeWidth={1.2} opacity={editor.select} />}
          {editor.select !== undefined && editor.select > 0 && [[6, 40], [294, 40], [6, 394], [294, 394], [150, 40], [150, 394], [6, 217], [294, 217]].map(([x, y], i) => <rect key={i} x={x - 3} y={y - 3} width={6} height={6} fill="#fff" stroke="#4f8cff" strokeWidth={1} opacity={editor.select} />)}
          {pts.slice(0, nShow).map((a, i) => {
            const last = i === nShow - 1;
            return (
              <g key={i}>
                {last && a.hIn && <><line x1={a.p[0]} y1={a.p[1]} x2={a.hIn[0]} y2={a.hIn[1]} stroke="#4f8cff" strokeWidth={1} /><circle cx={a.hIn[0]} cy={a.hIn[1]} r={2.6} fill="#4f8cff" /></>}
                {last && a.hOut && <><line x1={a.p[0]} y1={a.p[1]} x2={a.hOut[0]} y2={a.hOut[1]} stroke="#4f8cff" strokeWidth={1} /><circle cx={a.hOut[0]} cy={a.hOut[1]} r={2.6} fill="#4f8cff" /></>}
                <rect x={a.p[0] - 3.2} y={a.p[1] - 3.2} width={6.4} height={6.4} fill={last ? '#4f8cff' : '#fff'} stroke="#4f8cff" strokeWidth={1.2} />
              </g>
            );
          })}
        </g>
      )}
    </svg>
  );
};

// ---------- card state per moment ----------
function palette(name: keyof typeof PALETTES) { return PALETTES[name]; }
function cardFace(t: number) {
  // which face, colors, blur, motion, editor overlays
  if (t < SC.flash) return { kind: 'before' as const, colors: PALETTES.red };
  if (t < SC.flat) { const i = Math.floor((t - SC.flash) / FLASH_STEP) % 4; const n = Math.floor((t - SC.flash) / FLASH_STEP); return { kind: 'art' as const, colors: palette(FLASH_ORDER[i]), blur: BLUR, amp: 1, flashI: i, tFix: [1.2, 6.3, 3.4, 9.1, 12.5, 4.7, 15.2, 7.8][n % 8] }; }
  if (t < SC.nice) return { kind: 'before' as const, colors: PALETTES.red };
  if (t < SC.draw) return { kind: 'art' as const, colors: PALETTES.red, blur: BLUR, amp: 0.45 };
  return { kind: 'editor' as const, colors: PALETTES.red };
}

const CardView: React.FC<{ t: number; spr: Spr }> = ({ t, spr }) => {
  const W = LAYOUT.card.w, H = (W * 4) / 3, R = (28 / 300) * W;
  const face = cardFace(t);
  // flips at face changes (before <-> art)
  const flips = [SC.flat, SC.nice]; // the flash itself is a hard cut, no card motion
  let rot = 0; for (const f of flips) { const k = seg(t, f - 0.12, f + 0.2); if (k > 0 && k < 1) rot = (k < 0.5 ? k : k - 1) * 180; }
  // scene-level card transform
  const out = eio(seg(t, SC.broll - 0.05, SC.broll + 0.45)), back = eout(seg(t, SC.outro - 0.1, SC.outro + 0.5));
  const brollHide = out * (1 - back);
  const drawZoom = eio(seg(t, SC.draw - 0.1, SC.draw + 0.4)) * (1 - eio(seg(t, SC.reveal - 0.2, SC.reveal + 0.5)));
  const doneK = spr(SC.done, 9, 200), donePulse = t > SC.done ? Math.exp(-(t - SC.done) * 3) : 0;
  const fuwa = t > SC.fuwa && t < SC.draw ? Math.sin(Math.PI * seg(t, SC.fuwa, SC.fuwa + 1.3)) : 0;
  const flashPump = 1;
  const scale = (1 + 0.05 * drawZoom + 0.04 * donePulse) * (1 - 0.25 * brollHide) * flashPump;
  const glowCol = face.colors[0];
  const glowA = 0.34 + 0.25 * fuwa + 0.3 * donePulse;
  // editor timeline
  let content: React.ReactNode;
  if (face.kind === 'before') content = <SiteBefore w={W} />;
  else if (face.kind === 'art') content = <Art shapes={SHAPES} fills={face.colors} blur={face.blur!} t={'tFix' in face && face.tFix !== undefined ? face.tFix : t} amp={face.amp!} bg={BG} />;
  else {
    const stroke = eio(seg(t, SC.draw + 0.05, SC.copy - 0.35));
    const fill0 = eout(seg(t, SC.copy - 0.4, SC.copy - 0.1));
    const c1 = eout(seg(t, SC.copy + 0.1, SC.copy + 0.3)), c2 = eout(seg(t, SC.copy + 0.42, SC.copy + 0.62));
    const sh = eio(seg(t, SC.shift - 0.05, SC.shift + 0.6));
    const shapes = [SHAPES[0], lerpShape(SHAPES[0], SHAPES[1], sh), lerpShape(SHAPES[0], SHAPES[2], sh)];
    const blur = BLUR * eio(seg(t, SC.blur + 0.1, SC.reveal - 0.1));
    const bgK = eio(seg(t, SC.reveal - 0.6, SC.reveal + 0.2));
    const amp = eio(seg(t, SC.move, SC.move + 0.7));
    const guides = 1 - seg(t, SC.blur, SC.blur + 0.25);
    const anchorK = t < SC.copy - 0.3 ? stroke : 1;
    content = <Art shapes={shapes} fills={face.colors} blur={blur} t={t - SC.move} amp={amp} bg={mixHex('#262626', BG, bgK)}
      editor={{ stroke: t < SC.copy ? stroke : undefined, anchorsOf: t < SC.copy + 0.1 ? 0 : undefined, anchorK, fill: [Math.max(fill0, t > SC.copy ? 1 : 0), c1, c2], select: t > SC.copy && t < SC.blur ? seg(t, SC.copy, SC.copy + 0.1) : 0, guides }} />;
  }
  return (
    <div style={{ position: 'absolute', left: (1080 - W) / 2, top: LAYOUT.card.top, width: W, height: H, perspective: 2400, opacity: 1 - brollHide }}>
      <div style={{ width: W, height: H, transform: `scale(${scale}) rotateY(${rot}deg)`, borderRadius: R, overflow: 'hidden', background: BG, boxShadow: `0 0 ${(150 / 300) * W}px ${(26 / 300) * W}px ${hexA(glowCol, glowA * 1.25)}, 0 0 ${(330 / 300) * W}px ${(70 / 300) * W}px ${hexA(glowCol, glowA * 0.55)}${fuwa > 0 ? `, 0 0 ${220 * fuwa}px ${60 * fuwa}px ${hexA(face.colors[1], 0.25 * fuwa)}` : ''}` }}>
        {content}
      </div>
      {/* straight arrow on the flat gradient */}
      {t > SC.line && t < SC.nice + 0.1 && (
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <defs><marker id="ar" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#fff" /></marker></defs>
          <line x1={W / 2} y1={H * 0.12} x2={W / 2} y2={H * 0.12 + H * 0.74 * eout(seg(t, SC.line, SC.line + 0.5))} stroke="#fff" strokeWidth={10} strokeDasharray="26 16" markerEnd="url(#ar)" opacity={1 - seg(t, SC.nice - 0.15, SC.nice)} />
        </svg>
      )}
      {/* light spreading from the bright corner */}
      {fuwa > 0 && [0, 0.25, 0.5].map((d, i) => { const k = seg(t, SC.fuwa + d, SC.fuwa + d + 1.1); return k > 0 && k < 1 ? <div key={i} style={{ position: 'absolute', left: W * 0.78, top: H * 0.86, width: 900 * k, height: 900 * k, transform: 'translate(-50%,-50%)', borderRadius: '50%', border: `4px solid ${hexA('#ffffff', 0.5 * (1 - k))}`, pointerEvents: 'none' }} /> : null; })}
      {/* arrow to the bright corner + lightbulb (ふわっと光が広がるから) */}
      {t > SC.fuwa && t < SC.draw && (() => { const ka = spr(SC.fuwa + 0.15, 10, 240), kb = spr(SC.fuwa + 0.45, 9, 220), out = 1 - seg(t, SC.draw - 0.25, SC.draw);
        return (<>
          <div style={{ position: 'absolute', left: W * 0.62, top: H * 0.86, transform: `translate(${(1 - ka) * 60}px, ${(1 - ka) * 60}px) scale(${ka})`, opacity: Math.min(1, ka * 2) * out }}><RedArrow size={170} /></div>
          <div style={{ position: 'absolute', left: W * 0.86, top: H * 0.98, transform: `scale(${kb}) rotate(${(1 - kb) * 30}deg)`, opacity: Math.min(1, kb * 2) * out }}><Bulb size={170} glow={0.6 + 0.4 * Math.sin(t * 6)} t={t} /></div>
        </>); })()}
      {/* blur value chip */}
      {t > SC.blur && t < SC.reveal + 0.6 && (
        <div style={{ position: 'absolute', left: '50%', top: H + 46, transform: 'translateX(-50%)', opacity: seg(t, SC.blur, SC.blur + 0.15) * (1 - seg(t, SC.reveal + 0.3, SC.reveal + 0.6)), display: 'flex', alignItems: 'center', gap: 22, background: 'rgba(30,26,32,0.92)', borderRadius: 22, padding: '14px 26px', whiteSpace: 'nowrap' }}>
          <span style={{ font: `900 32px ${FONT}`, color: '#fff' }}>ぼかし</span>
          <div style={{ position: 'relative', width: 360, height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.15)' }}><div style={{ width: `${100 * eio(seg(t, SC.blur + 0.1, SC.reveal - 0.1))}%`, height: '100%', borderRadius: 6, background: '#f05a70' }} /></div>
          <span style={{ font: `900 34px ${FONT}`, color: '#f7b8c2', width: 70, textAlign: 'right' }}>{Math.round(BLUR * eio(seg(t, SC.blur + 0.1, SC.reveal - 0.1)))}</span>
        </div>
      )}
      {/* keyframe panel */}
      {t > SC.key - 0.1 && t < SC.done + 0.6 && (
        <div style={{ position: 'absolute', left: '50%', top: H + 40, width: 620, transform: 'translateX(-50%)', opacity: seg(t, SC.key - 0.1, SC.key + 0.1) * (1 - seg(t, SC.done + 0.3, SC.done + 0.6)), background: 'rgba(30,26,32,0.92)', borderRadius: 20, padding: '14px 22px', boxSizing: 'border-box' }}>
          {[0, 1, 2].map((r) => (
            <div key={r} style={{ position: 'relative', height: 30, display: 'flex', alignItems: 'center' }}>
              <span style={{ width: 70, font: `700 20px ${FONT}`, color: 'rgba(255,255,255,0.6)' }}>形 {r + 1}</span>
              <div style={{ position: 'relative', flex: 1, height: 2, background: 'rgba(255,255,255,0.15)' }}>
                {[0.05, 0.35, 0.65, 0.95].map((x, j) => { const k = spr(SC.key + r * 0.08 + j * 0.05, 10, 260); return <div key={j} style={{ position: 'absolute', left: `${(x + r * 0.02) * 100}%`, top: -9, width: 18, height: 18, background: PALETTES.red[r], transform: `rotate(45deg) scale(${k})` }} />; })}
              </div>
            </div>
          ))}
          <div style={{ position: 'absolute', top: 8, bottom: 8, left: 92 + 500 * ((Math.max(0, t - SC.move) * 0.45) % 1), width: 3, background: '#fff', opacity: t > SC.move ? 1 : 0 }} />
        </div>
      )}
      {/* "完成" sparkle */}
      {t > SC.done && t < SC.done + 1.2 && Array.from({ length: 10 }).map((_, i) => { const a = (i / 10) * Math.PI * 2, k = eout(seg(t, SC.done, SC.done + 0.9)); return <div key={i} style={{ position: 'absolute', left: W / 2 + Math.cos(a) * (W * 0.45 + 160 * k), top: H / 2 + Math.sin(a) * (H * 0.45 + 160 * k), width: 18, height: 18, background: '#fff', transform: `translate(-50%,-50%) rotate(45deg) scale(${(1 - k) * doneK})`, boxShadow: '0 0 18px #fff' }} />; })}
      {/* point to the post caption */}
      {t > SC.caption && (
        <div style={{ position: 'absolute', left: '50%', top: H + 60 + Math.abs(Math.sin((t - SC.caption) * 5)) * 26, transform: `translateX(-50%) scale(${spr(SC.caption, 9, 220)})`, font: `900 90px ${FONT}`, color: '#fff', textShadow: `0 0 30px ${hexA('#f05a70', 0.9)}` }}>↓</div>
      )}
    </div>
  );
};

// ---------- B-roll: stylish UI mockups drifting, blurred ----------
const Mock: React.FC<{ w: number; h: number; pal: keyof typeof PALETTES; kind: 'hero' | 'phone' | 'price' | 'dash'; t: number }> = ({ w, h, pal, kind, t }) => {
  const P = PALETTES[pal];
  const bar = (x: number, y: number, ww: number, hh: number, a = 0.85) => <div style={{ position: 'absolute', left: x, top: y, width: ww, height: hh, borderRadius: hh / 2, background: `rgba(255,255,255,${a})` }} />;
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: kind === 'phone' ? 46 : 26, overflow: 'hidden', background: BG, boxShadow: `0 0 80px ${hexA(P[0], 0.35)}`, border: '2px solid rgba(255,255,255,0.08)' }}>
      <div style={{ position: 'absolute', inset: kind === 'dash' || kind === 'price' ? '0 0 45% 30%' : 0 }}><Art shapes={SHAPES} fills={P} blur={BLUR} t={t} amp={0.8} bg={BG} aspect="wide" /></div>
      {kind === 'hero' && <>{bar(40, 34, 90, 14, 0.9)}{[0, 1, 2].map((i) => bar(w - 300 + i * 80, 36, 56, 10, 0.5))}{bar(40, h * 0.38, w * 0.55, 34)}{bar(40, h * 0.38 + 50, w * 0.4, 34)}{bar(40, h * 0.38 + 112, w * 0.32, 12, 0.5)}<div style={{ position: 'absolute', left: 40, top: h * 0.38 + 150, width: 160, height: 46, borderRadius: 23, background: '#fff' }} /></>}
      {kind === 'phone' && <>{bar(30, 60, 120, 14, 0.9)}{bar(30, 110, w - 60, 26)}{[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', left: 24, top: h * 0.45 + i * 96, width: w - 48, height: 80, borderRadius: 20, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)' }} />)}</>}
      {kind === 'price' && <>{bar(36, 40, 120, 14, 0.7)}{bar(36, 80, 180, 44)}{[0, 1, 2, 3].map((i) => bar(36, 170 + i * 40, w * 0.6, 10, 0.45))}<div style={{ position: 'absolute', left: 36, right: 36, bottom: 36, height: 54, borderRadius: 27, background: P[1] }} /></>}
      {kind === 'dash' && <>{bar(30, 30, 140, 14, 0.8)}{[0, 1, 2].map((i) => <div key={i} style={{ position: 'absolute', left: 30 + i * ((w - 80) / 3 + 10), top: 70, width: (w - 80) / 3, height: 90, borderRadius: 16, background: 'rgba(255,255,255,0.08)' }} />)}{Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ position: 'absolute', left: 40 + i * ((w - 80) / 8), bottom: 30, width: (w - 80) / 8 - 14, height: 40 + ((i * 37) % 120), borderRadius: 8, background: i === 5 ? P[2] : 'rgba(255,255,255,0.25)' }} />)}</>}
    </div>
  );
};
const BRoll: React.FC<{ t: number }> = ({ t }) => {
  const a = seg(t, SC.broll - 0.05, SC.broll + 0.4) * (1 - seg(t, SC.outro - 0.2, SC.outro + 0.3));
  if (a <= 0) return null;
  const d = t - SC.broll;
  const items: [number, number, number, number, keyof typeof PALETTES, 'hero' | 'phone' | 'price' | 'dash', number, number][] = [
    [-80, 360, 820, 520, 'purple', 'hero', 30, -12], [620, 820, 330, 660, 'blue', 'phone', -26, 18], [-60, 1060, 520, 600, 'green', 'price', 22, -16], [420, 1520, 760, 460, 'red', 'dash', -34, 10],
  ];
  return (
    <AbsoluteFill style={{ opacity: a }}>
      {items.map(([x, y, w, h, pal, kind, vx, vy], i) => (
        <div key={i} style={{ position: 'absolute', left: x + vx * d, top: y + vy * d, transform: `rotate(${(i % 2 ? 1 : -1) * 4}deg)`, filter: 'blur(5px)', opacity: 0.6 }}><Mock w={w} h={h} pal={pal} kind={kind} t={t + i * 2} /></div>
      ))}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 50%, rgba(5,3,4,0.72), rgba(5,3,4,0.35))' }} />
    </AbsoluteFill>
  );
};

// ---------- captions (pattern 1) ----------
const withAccents = (s: string) => { const re = new RegExp(`(${CAP.accents.join('|')})`); return s.split(re).filter(Boolean).map((p, i) => <span key={i} style={{ color: CAP.accents.includes(p) ? CAP.accent : undefined }}>{p}</span>); };
const Captions: React.FC<{ t: number; fps: number }> = ({ t, fps }) => {
  const C = CHUNKS as { id: string; text: string; t: number; end: number }[];
  let i = -1; C.forEach((c, j) => { if (t >= c.t) i = j; });
  if (i < 0) return null;
  const c = C[i], next = C[i + 1];
  const until = next && next.t - c.end < 0.6 ? next.t : c.end + 0.35;
  if (t > until) return null;
  const tt = t - c.t, k = spring({ frame: tt * fps, fps, config: { damping: 11, stiffness: 320, mass: 0.5 } });
  const inBroll = t >= SC.broll && t < SC.outro;
  if (c.id === 'c37') {
    // the prompt itself: big, centered, line by line
    const lines = ['「オーロラ', 'グラデーションの', '背景にして」'];
    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: LAYOUT.bigY, transform: 'translateY(-50%)', textAlign: 'center' }}>
        {lines.map((ln, j) => { const kk = spring({ frame: Math.max(0, tt - j * 0.22) * fps, fps, config: { damping: 10, stiffness: 260, mass: 0.6 } }); return (
          <div key={j} style={{ font: `900 ${j === 1 ? 128 : 118}px/1.18 ${FONT}`, whiteSpace: 'nowrap', opacity: clamp(kk * 2), transform: `translateY(${(1 - kk) * 40}px) scale(${0.8 + 0.2 * kk})`, background: 'linear-gradient(100deg, #ffffff 10%, #f7b8c2 45%, #e2c2fb 70%, #bcd3f9 95%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 28px ${hexA('#f05a70', 0.55)})` }}>{ln}</div>
        ); })}
      </div>
    );
  }
  const special = c.id === 'c03';
  const big = /。$/.test(c.text);
  const base = inBroll ? 100 : big ? CAP.bigSize : CAP.size;
  const size = Math.min(base, 960 / [...c.text].length);
  const shake = big ? Math.sin(tt * 60) * 6 * Math.exp(-tt * 10) : 0;
  const y = inBroll ? LAYOUT.brollCapY : LAYOUT.capY;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: y, transform: `translate(${shake}px, -50%)`, textAlign: 'center' }}>
      {special ? (<>
        <div style={{ font: `900 ${CAP.smallSize}px/1.1 ${FONT}`, color: '#fff', opacity: clamp(k * 2), transform: `translateY(${(1 - k) * 18}px)`, textShadow: '0 4px 18px rgba(0,0,0,0.6)' }}>こんな</div>
        <div style={{ display: 'inline-block', font: `900 ${CAP.size}px/1.2 ${FONT}`, color: '#fff', whiteSpace: 'nowrap', opacity: clamp(k * 2.5), transform: `translateY(${(1 - k) * 26}px) scale(${0.82 + 0.18 * k})`, textShadow: '0 4px 22px rgba(0,0,0,0.65)' }}>{withAccents('グラデーションに')}</div>
      </>) : (
        <div style={{ display: 'inline-block', font: `900 ${size}px/1.2 ${FONT}`, color: '#fff', whiteSpace: 'nowrap', opacity: clamp(k * 2.5), transform: `translateY(${(1 - k) * 26}px) scale(${0.82 + 0.18 * k})`, textShadow: '0 4px 22px rgba(0,0,0,0.65)' }}>{withAccents(c.text)}</div>
      )}
    </div>
  );
};

export const AuroraFinal: React.FC<{ narration: string | null; sfx: string | null }> = ({ narration, sfx }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = frame / fps - AUDIO.offset;
  const spr: Spr = (t0, damping = 12, stiffness = 200) => (t < t0 ? 0 : spring({ frame: (t - t0) * fps, fps, config: { damping, stiffness, mass: 0.6 } }));
  const glow = cardFace(t).colors[0];
  return (
    <AbsoluteFill style={{ background: BG, overflow: 'hidden' }}>
      <CyberBG t={t} color={glow} color2={cardFace(t).colors[1]} calm={seg(t, SC.draw - 0.3, SC.draw + 0.6) * (1 - 0.5 * seg(t, SC.broll, SC.broll + 0.5))} />
      {(() => { const w = (t < SC.flash - 0.06 ? 1 : 0) + seg(t, SC.flat - 0.12, SC.flat) * (1 - seg(t, SC.nice - 0.12, SC.nice)); return w > 0 ? <AbsoluteFill style={{ opacity: Math.min(1, w) }}><WallpaperBG t={t} /></AbsoluteFill> : null; })()}
      <BRoll t={t} />
      <CardView t={t} spr={spr} />
      <Captions t={t} fps={fps} />
      <svg style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, opacity: 0.05, mixBlendMode: 'overlay', pointerEvents: 'none' }}><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 7} /></filter><rect width="100%" height="100%" filter="url(#grain)" /></svg>
      <Sequence from={Math.round(AUDIO.offset * fps)}>
        {narration && <Audio src={staticFile(narration)} />}
        {sfx && <Audio src={staticFile(sfx)} />}
      </Sequence>
    </AbsoluteFill>
  );
};
