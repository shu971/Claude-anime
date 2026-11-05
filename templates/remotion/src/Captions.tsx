// Pattern B captions: one header card in the top safe area. Accent words land on the narration beats.
import React from 'react';
import { spring, useVideoConfig, interpolate, Easing } from 'remotion';
import { CAPTION as C, STEPS, RAPID, FINAL } from './config';
import { seg, clamp } from './timeline';

type Part = readonly [string, boolean?] | readonly [string];
const easeOut = Easing.out(Easing.cubic);

// spring that starts at narration time t0 (seconds)
const useSpr = () => { const { fps } = useVideoConfig(); return (t: number, t0: number, damping = 11, stiffness = 190) => (t < t0 ? 0 : spring({ frame: (t - t0) * fps, fps, config: { damping, stiffness, mass: 0.6 } })); };

const Badge: React.FC<{ id: string; k: number }> = ({ id, k }) => (
  <span style={{ display: 'inline-block', font: `900 30px ${C.font}`, color: '#0b0b0b', background: C.badgeBg, borderRadius: 12, padding: '4px 14px', marginRight: 16, verticalAlign: 'middle', transform: `scale(${k}) rotate(${(1 - k) * -14}deg)`, opacity: clamp(k * 2) }}>{id}</span>
);

// a line whose accent part pops at tAcc and whose other parts slide in right after
const Line: React.FC<{ parts: readonly Part[]; t: number; tAcc: number; size: number; accentColor: string; restColor: string; marker?: boolean; badge?: React.ReactNode }> = ({ parts, t, tAcc, size, accentColor, restColor, marker, badge }) => {
  const spr = useSpr();
  let seenAccent = false;
  return (
    <div style={{ font: `900 ${size}px/1.3 ${C.font}`, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center' }}>
      {badge}
      {parts.map(([text, acc], i) => {
        if (acc) {
          seenAccent = true;
          const k = spr(t, tAcc, 9, 260); const sw = easeOut(seg(t, tAcc + 0.03, tAcc + 0.28));
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', color: accentColor, transform: `scale(${interpolate(k, [0, 1], [1.7, 1])})`, transformOrigin: 'left center', opacity: clamp(k * 3) }}>
              {marker && <span style={{ position: 'absolute', left: -6, bottom: size * 0.08, height: size * 0.42, width: `calc(${sw * 100}% + 12px)`, background: 'rgba(255,209,102,0.33)', borderRadius: 6, zIndex: -1 }} />}
              {text}
            </span>
          );
        }
        const t0 = seenAccent ? tAcc + 0.09 : tAcc - 0.08; const k = easeOut(seg(t, t0, t0 + 0.18));
        return <span key={i} style={{ color: restColor, opacity: k, transform: `translateX(${(1 - k) * -24}px)`, display: 'inline-block', whiteSpace: 'pre' }}>{text}</span>;
      })}
    </div>
  );
};

export const Captions: React.FC<{ t: number }> = ({ t }) => {
  const spr = useSpr();
  const items = [
    ...STEPS.map((s, i) => ({ kind: 'qa' as const, i, start: s.tQ - 0.14 })),
    ...RAPID.map((r, i) => ({ kind: 'rapid' as const, i, start: r.tHit - 0.12 })),
    { kind: 'final' as const, i: 0, start: FINAL.t - 0.15 },
  ];
  let idx = 0; items.forEach((it, i) => { if (t >= it.start) idx = i; });
  const it = items[idx], next = items[idx + 1];
  // leave: slide up before the next item
  const leave = next ? easeOut(seg(t, next.start - 0.12, next.start)) : 0;
  const cardIn = spr(t, -0.3, 14, 200);
  // the card's border flashes on each accent beat
  const beats = [...STEPS.flatMap((s) => [s.tQ, s.tA]), ...RAPID.flatMap((r) => [r.tHit, r.tChange]), FINAL.t];
  const flash = Math.max(0, ...beats.map((b) => (t >= b ? Math.exp(-(t - b) * 9) : 0)));
  let body: React.ReactNode = null;
  if (it.kind === 'qa') {
    const s = STEPS[it.i];
    body = (<>
      <Line parts={s.q} t={t} tAcc={s.tQ} size={C.qSize} accentColor={C.pink} restColor={C.white} badge={<Badge id={s.id} k={spr(t, s.tQ - 0.1, 10, 220)} />} />
      <div style={{ height: 14 }} />
      {t >= s.tA - 0.1 && <Line parts={s.a} t={t} tAcc={s.tA} size={C.aSize} accentColor={C.yellow} restColor={C.yellow} marker />}
    </>);
  } else if (it.kind === 'rapid') {
    const r = RAPID[it.i];
    body = (<>
      <Line parts={r.l1} t={t} tAcc={r.tHit} size={C.rapidSize * (r.l1.length > 1 ? 0.82 : 1)} accentColor={C.pink} restColor={C.white} badge={<Badge id={r.id} k={spr(t, r.tHit - 0.08, 10, 240)} />} />
      {t >= r.tChange - 0.05 && (
        <div style={{ marginLeft: 92, transform: it.i === 2 ? `translateX(${Math.sin((t - r.tChange) * 70) * 10 * Math.exp(-(t - r.tChange) * 6)}px)` : undefined }}>
          <Line parts={r.l2} t={t} tAcc={r.tChange} size={C.rapidSize * (it.i === 2 ? 1.05 : 1)} accentColor={C.yellow} restColor={C.yellow} marker />
        </div>
      )}
    </>);
  } else {
    body = (
      <div style={{ textAlign: 'center', width: '100%' }}>
        {FINAL.lines.map((ln, li) => (
          <div key={li} style={{ font: `900 ${C.finalSize}px/1.35 ${C.font}`, color: li === 1 ? C.white : '#d0d0d8', whiteSpace: 'nowrap' }}>
            {[...ln].map((ch, ci) => { const t0 = FINAL.t + li * 0.35 + ci * 0.035; const k = easeOut(seg(t, t0, t0 + 0.3)); return <span key={ci} style={{ display: 'inline-block', opacity: k, transform: `translateY(${(1 - k) * 18}px)`, color: li === 1 && ci < 5 ? C.pink : undefined }}>{ch}</span>; })}
          </div>
        ))}
      </div>
    );
  }
  const finalGrow = easeOut(seg(t, FINAL.t - 0.15, FINAL.t + 0.4));
  return (
    <div style={{ position: 'absolute', left: C.card.x, top: C.card.y, width: C.card.w, height: C.card.h + finalGrow * 30, borderRadius: C.card.radius, background: C.card.bg, border: `2px solid rgba(255,77,109,${0.15 + 0.85 * flash})`, boxShadow: `0 14px 40px rgba(0,0,0,0.5), 0 0 ${40 * flash}px rgba(255,77,109,${0.45 * flash})`, transform: `translateY(${(1 - cardIn) * -80}px)`, opacity: cardIn, overflow: 'hidden', isolation: 'isolate' }}>
      <div style={{ position: 'absolute', inset: 0, padding: '26px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'center', transform: `translateY(${-leave * 60}px)`, opacity: 1 - leave }}>{body}</div>
    </div>
  );
};
