// Extra visuals: the "AI-made" website with a flat linear gradient, the cyber background, the lightbulb + arrow.
import React from 'react';
import { BEFORE_GRADIENT } from './cfg';

const FONT = '"Noto Sans JP", sans-serif';
const hexA = (hex: string, a: number) => { const h = hex.replace('#', ''); return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`; };

// mobile website whose background is the flat linear gradient (so it reads as "a site's background")
export const SiteBefore: React.FC<{ w: number }> = ({ w }) => {
  const u = w / 660;
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: BEFORE_GRADIENT, fontFamily: FONT, color: '#fff' }}>
      {/* browser bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 74 * u, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', padding: `0 ${26 * u}px`, gap: 12 * u }}>
        {['#ff5f57', '#febc2e', '#28c840'].map((c) => <span key={c} style={{ width: 14 * u, height: 14 * u, borderRadius: '50%', background: c }} />)}
        <div style={{ flex: 1, marginLeft: 16 * u, height: 36 * u, borderRadius: 18 * u, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', padding: `0 ${18 * u}px`, font: `500 ${20 * u}px ${FONT}`, color: 'rgba(255,255,255,0.75)' }}>🔒 lumo.app</div>
      </div>
      {/* nav */}
      <div style={{ position: 'absolute', left: 34 * u, right: 34 * u, top: 110 * u, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ font: `900 ${30 * u}px ${FONT}`, letterSpacing: '0.08em' }}>◆ LUMO</span>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 7 * u }}>{[0, 1, 2].map((i) => <span key={i} style={{ width: 34 * u, height: 4 * u, borderRadius: 2, background: '#fff' }} />)}</span>
      </div>
      {/* hero */}
      <div style={{ position: 'absolute', left: 34 * u, right: 34 * u, top: 300 * u }}>
        <div style={{ font: `900 ${52 * u}px/1.3 ${FONT}` }}>最高の体験を、<br />あなたに。</div>
        <div style={{ marginTop: 26 * u, display: 'flex', flexDirection: 'column', gap: 12 * u }}>{[0.9, 0.75, 0.5].map((x, i) => <span key={i} style={{ width: `${x * 100}%`, height: 12 * u, borderRadius: 6 * u, background: 'rgba(255,255,255,0.45)' }} />)}</div>
        <div style={{ marginTop: 44 * u, display: 'inline-block', padding: `${16 * u}px ${44 * u}px`, borderRadius: 999, background: '#fff', color: '#8f0f26', font: `900 ${26 * u}px ${FONT}` }}>はじめる →</div>
      </div>
      {/* feature row at the bottom */}
      <div style={{ position: 'absolute', left: 34 * u, right: 34 * u, bottom: 40 * u, display: 'flex', gap: 16 * u }}>
        {[0, 1, 2].map((i) => <div key={i} style={{ flex: 1, height: 120 * u, borderRadius: 18 * u, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }} />)}
      </div>
    </div>
  );
};

// cyber-space backdrop: perspective grid floor, drifting particles, colored fog. calm = 0..1 (quieter in the how-to part)
export const CyberBG: React.FC<{ t: number; color: string; color2: string; calm: number }> = ({ t, color, color2, calm }) => {
  const a = 1 - 0.7 * calm;
  const lines: React.ReactNode[] = [];
  // horizontal lines rushing toward the viewer (perspective)
  for (let i = 0; i < 16; i++) {
    const z = ((i / 16 + t * 0.09) % 1); const y = 1260 + 660 * z * z; const op = z * 0.6;
    lines.push(<line key={`h${i}`} x1={0} y1={y} x2={1080} y2={y} stroke={color} strokeWidth={1 + 2 * z} opacity={op} />);
  }
  for (let i = -10; i <= 10; i++) lines.push(<line key={`v${i}`} x1={540 + i * 22} y1={1260} x2={540 + i * 260} y2={1920} stroke={color} strokeWidth={1.5} opacity={0.35} />);
  // mirrored ceiling grid, fainter
  const ceil: React.ReactNode[] = [];
  for (let i = 0; i < 10; i++) { const z = ((i / 10 + t * 0.06) % 1); const y = 330 - 330 * z * z; ceil.push(<line key={`c${i}`} x1={0} y1={y} x2={1080} y2={y} stroke={color2} strokeWidth={1 + z} opacity={z * 0.3} />); }
  const parts = Array.from({ length: 46 }).map((_, i) => {
    const h = (n: number) => { const s = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return s - Math.floor(s); };
    const x = h(1) * 1080 + Math.sin(t * 0.4 + i) * 20, y = ((h(2) * 1920 - t * (20 + h(3) * 60)) % 1920 + 1920) % 1920, r = 1.5 + h(4) * 3.5;
    return <circle key={i} cx={x} cy={y} r={r} fill={i % 3 ? color2 : '#ffffff'} opacity={(0.25 + 0.5 * h(5)) * (0.5 + 0.5 * Math.sin(t * 2 + i))} />;
  });
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: a }}>
      {/* fog */}
      <div style={{ position: 'absolute', left: 540 - 650 + Math.sin(t * 0.3) * 60, top: 1000 - 650 + Math.cos(t * 0.25) * 50, width: 1300, height: 1300, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(color, 0.28)}, transparent 62%)` }} />
      <div style={{ position: 'absolute', left: -200 + Math.cos(t * 0.2) * 80, top: 200, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(color2, 0.14)}, transparent 65%)` }} />
      <div style={{ position: 'absolute', right: -260 + Math.sin(t * 0.22) * 80, top: 1300, width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${hexA(color2, 0.12)}, transparent 65%)` }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="fadeFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="1" /><stop offset="0.25" stopColor="#000" stopOpacity="0" /></linearGradient>
          <filter id="glowL"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <g filter="url(#glowL)">{lines}{ceil}</g>
        <rect x={0} y={1260} width={1080} height={660} fill="url(#fadeFloor)" />
        {parts}
      </svg>
      {/* horizon glow line */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1252, height: 16, background: `linear-gradient(90deg, transparent, ${hexA(color, 0.7)}, transparent)`, filter: 'blur(6px)' }} />
    </div>
  );
};

// lightbulb icon (own drawing)
export const Bulb: React.FC<{ size: number; glow: number; t: number }> = ({ size, glow, t }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 100 115" style={{ overflow: 'visible', filter: `drop-shadow(0 0 ${18 * glow}px rgba(255,210,80,${0.9 * glow}))` }}>
    {[-60, -30, 0, 30, 60].map((a, i) => { const r = (a * Math.PI) / 180, l = 10 + 4 * Math.sin(t * 8 + i); return <line key={i} x1={50 + Math.sin(r) * 46} y1={44 - Math.cos(r) * 46} x2={50 + Math.sin(r) * (46 + l)} y2={44 - Math.cos(r) * (46 + l)} stroke="#f7c531" strokeWidth={6} strokeLinecap="round" />; })}
    <path d="M50 8 C 28 8, 16 25, 16 42 C 16 56, 26 63, 31 72 L 69 72 C 74 63, 84 56, 84 42 C 84 25, 72 8, 50 8 Z" fill="#f7c531" />
    <path d="M40 72 L 40 54 C 40 48, 47 46, 50 52 C 53 46, 60 48, 60 54 L 60 72" fill="none" stroke="#a87908" strokeWidth={4} strokeLinejoin="round" />
    {[78, 86, 94].map((y) => <rect key={y} x={33} y={y} width={34} height={6} rx={3} fill="#8e8e93" />)}
    <path d="M42 102 L 58 102 L 54 110 L 46 110 Z" fill="#6e6e73" />
    <ellipse cx={38} cy={28} rx={7} ry={11} fill="#fff" opacity={0.45} transform="rotate(-25 38 28)" />
  </svg>
);

// chunky red arrow (own drawing), pointing up-left
export const RedArrow: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.5))' }}>
    <path d="M30 10 L 10 45 L 26 43 L 60 92 L 78 80 L 44 33 L 58 26 Z" fill="#e3121b" stroke="#9e0b12" strokeWidth={2} strokeLinejoin="round" />
  </svg>
);

// soft OS-wallpaper style backdrop: blue base with big silky diagonal sheets of light
export const WallpaperBG: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, #3d7cc9 0%, #2457a8 45%, #173a7a 100%)', overflow: 'hidden' }}>
    <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id="sheetA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#bfe0ff" stopOpacity="0.55" /><stop offset="1" stopColor="#5b9be6" stopOpacity="0" /></linearGradient>
        <linearGradient id="sheetB" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd0ff" stopOpacity="0.35" /><stop offset="1" stopColor="#2f6fc4" stopOpacity="0" /></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="14" /></filter>
      </defs>
      <g filter="url(#soft)">
        <path d={`M -200 ${520 + Math.sin(t * 0.4) * 30} C 300 ${300 + Math.sin(t * 0.3) * 40}, 700 900, 1300 ${620 + Math.cos(t * 0.35) * 30} L 1300 820 C 700 1100, 300 520, -200 760 Z`} fill="url(#sheetA)" />
        <path d={`M -200 ${1180 + Math.cos(t * 0.33) * 30} C 260 1000, 760 ${1560 + Math.sin(t * 0.3) * 40}, 1300 1240 L 1300 1420 C 760 1760, 300 1180, -200 1380 Z`} fill="url(#sheetB)" />
        <path d={`M 700 -100 C 820 400, 600 ${900 + Math.sin(t * 0.25) * 40}, 1180 1500 L 1300 1500 L 1300 -100 Z`} fill="url(#sheetA)" opacity={0.5} />
      </g>
    </svg>
    <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 50%, transparent 40%, rgba(0,0,0,0.35))' }} />
  </div>
);
