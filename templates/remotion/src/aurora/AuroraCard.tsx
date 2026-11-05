// The aurora card: 3 wavy shapes (dark -> light) stacked bottom-right and blurred together.
import React from 'react';
import { BG } from './config';

export const PATHS = [
  'M-60 470 L-60 250 C 0 215, 55 225, 88 205 C 122 184, 104 118, 156 98 C 206 80, 214 142, 244 132 C 276 121, 286 58, 360 44 L 360 470 Z',
  'M-60 470 L-60 345 C 20 330, 88 340, 120 296 C 150 254, 152 204, 202 192 C 244 182, 252 234, 284 212 C 304 198, 324 168, 360 166 L 360 470 Z',
  'M 52 470 C 96 420, 128 392, 158 338 C 188 284, 212 272, 252 278 C 292 284, 316 306, 360 292 L 360 470 Z',
];
const CENTERS = [[150, 257], [150, 318], [206, 371]];
const PERIODS = [7, 5.5, 8.5];
// 4 keyframes per shape: [dx, dy, rotateDeg, scale] (viewBox units, card is 300 wide)
const KEYS = [
  [[0, 0, 0, 1], [-40, -30, -8, 1.1], [30, -60, 6, 1.2], [60, -20, 12, 1.05]],
  [[0, 0, 0, 1], [50, -40, 10, 1.15], [-30, -80, -12, 1.25], [-60, -30, 4, 0.95]],
  [[0, 0, 0, 1], [-70, -40, -16, 1.2], [40, -110, 8, 1.3], [-20, -150, 14, 1.1]],
];
const smooth = (x: number) => x * x * (3 - 2 * x);
// ping-pong through the 4 keyframes (like CSS alternate)
export function layerTransform(i: number, t: number, amp: number) {
  const P = PERIODS[i], ph = (t % (2 * P)) / P, u = ph <= 1 ? ph : 2 - ph; // 0..1..0
  const seg = Math.min(2, Math.floor(u * 3)), k = smooth(u * 3 - seg);
  const a = KEYS[i][seg], b = KEYS[i][seg + 1];
  const v = a.map((x, j) => x + (b[j] - x) * k);
  const [dx, dy, r, s] = [v[0] * amp, v[1] * amp, v[2] * amp, 1 + (v[3] - 1) * amp];
  const [cx, cy] = CENTERS[i];
  return `translate(${dx} ${dy}) translate(${cx} ${cy}) rotate(${r}) scale(${s}) translate(${-cx} ${-cy})`;
}

let uid = 0;
export const AuroraCard: React.FC<{ w: number; colors: string[]; blur: number; t: number; amp?: number; glow?: number; only?: number[]; outline?: boolean; transparent?: boolean; style?: React.CSSProperties }> = ({ w, colors, blur, t, amp = 0, glow = 1, only, outline, transparent, style }) => {
  const id = React.useMemo(() => `ab${uid++}`, []);
  const h = (w * 4) / 3, R = (28 / 300) * w;
  const glowCol = colors[0];
  return (
    <div style={{ position: 'relative', width: w, height: h, borderRadius: R, overflow: 'hidden', background: transparent ? 'transparent' : BG, boxShadow: glow > 0 ? `0 0 ${(70 / 300) * w}px ${(6 / 300) * w}px ${hexA(glowCol, 0.32 * glow)}` : undefined, outline: outline ? '2px solid rgba(255,255,255,0.35)' : undefined, outlineOffset: -2, ...style }}>
      <svg viewBox="0 0 300 400" width={w} height={h} style={{ display: 'block' }}>
        <defs><filter id={id} x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation={blur} /></filter></defs>
        <g filter={blur > 0.05 ? `url(#${id})` : undefined}>
          {PATHS.map((d, i) => (only && !only.includes(i) ? null : <path key={i} d={d} fill={colors[i]} transform={layerTransform(i, t, amp)} />))}
        </g>
      </svg>
    </div>
  );
};

export const BeforeCard: React.FC<{ w: number; gradient: string; style?: React.CSSProperties }> = ({ w, gradient, style }) => (
  <div style={{ width: w, height: (w * 4) / 3, borderRadius: (28 / 300) * w, background: gradient, boxShadow: `0 0 ${(70 / 300) * w}px ${(6 / 300) * w}px rgba(224,23,58,0.32)`, ...style }} />
);

// "named" prompt result: round radial blobs (what AI tends to make from the name alone)
export const RadialCard: React.FC<{ w: number }> = ({ w }) => (
  <div style={{ position: 'relative', width: w, height: (w * 4) / 3, borderRadius: (28 / 300) * w, overflow: 'hidden', background: BG, boxShadow: `0 0 ${(70 / 300) * w}px ${(6 / 300) * w}px rgba(224,23,58,0.28)` }}>
    {[[0.7, 0.75, 0.55, '#e0173a'], [0.35, 0.85, 0.4, '#f05a70'], [0.8, 0.45, 0.35, '#b0102d']].map(([x, y, r, c], i) => (
      <div key={i} style={{ position: 'absolute', left: `${(x as number) * 100}%`, top: `${(y as number) * 100}%`, width: w * (r as number) * 2, height: w * (r as number) * 2, transform: 'translate(-50%,-50%)', borderRadius: '50%', background: `radial-gradient(circle, ${c} 0%, transparent 70%)`, opacity: 0.9 }} />
    ))}
  </div>
);

export function hexA(hex: string, a: number) { const h = hex.replace('#', ''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; }
export function mixHex(a: string, b: string, k: number) { const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); const A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
