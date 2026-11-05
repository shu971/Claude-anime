// Turns config.ts into per-frame state: UI change progress (s1..s7), highlights (hl1..hl7), camera.
import { Easing } from 'remotion';
import { STEPS, RAPID, FINAL, MOTION, CAMERA, LAYOUT, AUDIO } from './config';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const easeOut = Easing.out(Easing.cubic);

export type State = { s: number[]; hl: number[]; cam: { tx: number; ty: number; sc: number } };

// narration time from video seconds
export const nt = (videoSec: number) => videoSec - AUDIO.offset;

const nextQ = (i: number) => (i < STEPS.length - 1 ? STEPS[i + 1].tQ : RAPID[0].tHit);

export function uiState(t: number): State {
  const s = Array(8).fill(0), hl = Array(8).fill(0);
  STEPS.forEach((st, i) => {
    s[i + 1] = easeOut(seg(t, st.tA, st.tA + MOTION.change));
    const on = st.tQ + MOTION.highlightAfterQ, off = Math.min(st.tA + 1.0, nextQ(i) - MOTION.highlightOffBeforeNext);
    hl[i + 1] = seg(t, on, on + 0.18) * (1 - seg(t, off, off + 0.2));
  });
  RAPID.forEach((r, i) => {
    s[i + 5] = easeOut(seg(t, r.tChange, r.tChange + MOTION.change));
    const off = i < RAPID.length - 1 ? RAPID[i + 1].tHit - 0.08 : FINAL.camStart;
    hl[i + 5] = seg(t, r.tHit, r.tHit + 0.12) * (1 - seg(t, off, off + 0.15));
  });
  return { s, hl, cam: camera(t) };
}

// camera transform (output pixels) that frames a target inside the viewport, like the draft's go()
export function frameTarget(name: string) {
  const { r, pad } = CAMERA.targets[name];
  const W = LAYOUT.viewport.w, H = LAYOUT.viewport.h, U = 1080 / 340;
  const sc = Math.min(CAMERA.maxScale * U, W / (r[2] + pad * 2), H / (r[3] + pad * 2));
  let tx = W / 2 - sc * (r[0] + r[2] / 2), ty = H / 2 - sc * (r[1] + r[3] / 2);
  if (CAMERA.clampToScreen) {
    tx = sc * 520 >= W ? clamp(tx, W - sc * 520, 0) : (W - sc * 520) / 2;
    ty = sc * 720 >= H ? clamp(ty, H - sc * 720, 0) : (H - sc * 720) / 2;
  }
  return { tx, ty, sc };
}

type Move = { start: number; dur: number; to: string };
export const MOVES: Move[] = [
  ...STEPS.map((st) => ({ start: st.tQ - MOTION.camLead, dur: MOTION.camMove, to: st.cam as string })),
  ...RAPID.map((r) => ({ start: r.tHit - MOTION.rapidCamLead, dur: MOTION.rapidCamMove, to: r.cam as string })),
  { start: FINAL.camStart, dur: FINAL.camDur, to: 'full' },
];

export function camera(t: number) {
  let cur = frameTarget('full');
  for (const m of MOVES) {
    if (t < m.start) break;
    const to = frameTarget(m.to), k = ease(seg(t, m.start, m.start + m.dur));
    cur = { tx: lerp(cur.tx, to.tx, k), ty: lerp(cur.ty, to.ty, k), sc: lerp(cur.sc, to.sc, k) };
  }
  return cur;
}
