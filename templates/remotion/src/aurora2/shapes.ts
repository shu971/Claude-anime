// The three wavy shapes, all in the same command structure so they can morph into each other:
// M(x0,560) L(x1,y1) C C C C L(440,yEnd) L(440,560) Z   — edges pushed outside the card so a big blur
// doesn't darken the card's right/bottom edges.
export type Shape = { start: [number, number]; edge: [number, number]; curves: number[][]; end: number };
export const SHAPES: Shape[] = [
  { start: [-140, 560], edge: [-60, 250], curves: [[0, 215, 55, 225, 88, 205], [122, 184, 104, 118, 156, 98], [206, 80, 214, 142, 244, 132], [276, 121, 286, 58, 360, 44]], end: 44 },
  { start: [-140, 560], edge: [-60, 345], curves: [[20, 330, 88, 340, 120, 296], [150, 254, 152, 204, 202, 192], [244, 182, 252, 234, 284, 212], [304, 198, 324, 168, 360, 166]], end: 166 },
  { start: [30, 560], edge: [52, 470], curves: [[96, 420, 128, 392, 158, 338], [188, 284, 212, 272, 252, 278], [292, 284, 316, 306, 360, 292], [360, 292, 360, 292, 360, 292]], end: 292 },
];
// the left edge of shapes 1-2 starts at x=-140 but the visible wave begins at x=-60: insert that point
export function toD(s: Shape) {
  const c = s.curves.map((q) => `C ${q[0]} ${q[1]}, ${q[2]} ${q[3]}, ${q[4]} ${q[5]}`).join(' ');
  return `M ${s.start[0]} ${s.start[1]} L ${s.edge[0]} ${s.edge[1]} ${c} L 440 ${s.end} L 440 560 Z`;
}
// just the wavy edge (for the pen-tool stroke)
export function waveD(s: Shape) { return `M ${s.edge[0]} ${s.edge[1]} ` + s.curves.map((q) => `C ${q[0]} ${q[1]}, ${q[2]} ${q[3]}, ${q[4]} ${q[5]}`).join(' '); }
export function lerpShape(a: Shape, b: Shape, k: number): Shape {
  const l = (x: number, y: number) => x + (y - x) * k;
  return { start: [l(a.start[0], b.start[0]), l(a.start[1], b.start[1])], edge: [l(a.edge[0], b.edge[0]), l(a.edge[1], b.edge[1])], curves: a.curves.map((q, i) => q.map((v, j) => l(v, b.curves[i][j]))), end: l(a.end, b.end) };
}
// anchor points + handles for the "pen tool" look
export function anchors(s: Shape) {
  const pts: { p: [number, number]; hIn?: [number, number]; hOut?: [number, number] }[] = [{ p: [s.edge[0], s.edge[1]] }];
  s.curves.forEach((q, i) => { pts[pts.length - 1].hOut = [q[0], q[1]]; pts.push({ p: [q[4], q[5]], hIn: [q[2], q[3]] }); });
  return pts.filter((a, i, arr) => i === 0 || a.p[0] !== arr[i - 1].p[0] || a.p[1] !== arr[i - 1].p[1]);
}
const CENTERS = [[150, 257], [150, 318], [206, 371]];
const PERIODS = [7, 5.5, 8.5];
const KEYS = [
  [[0, 0, 0, 1], [-40, -30, -8, 1.1], [30, -60, 6, 1.2], [60, -20, 12, 1.05]],
  [[0, 0, 0, 1], [50, -40, 10, 1.15], [-30, -80, -12, 1.25], [-60, -30, 4, 0.95]],
  [[0, 0, 0, 1], [-70, -40, -16, 1.2], [40, -110, 8, 1.3], [-20, -150, 14, 1.1]],
];
const smooth = (x: number) => x * x * (3 - 2 * x);
export function layerTransform(i: number, t: number, amp: number) {
  if (amp <= 0) return undefined;
  const P = PERIODS[i], ph = (Math.max(0, t) % (2 * P)) / P, u = ph <= 1 ? ph : 2 - ph;
  const sg = Math.min(2, Math.floor(u * 3)), k = smooth(u * 3 - sg);
  const v = KEYS[i][sg].map((x, j) => x + (KEYS[i][sg + 1][j] - x) * k);
  const [dx, dy, r, s] = [v[0] * amp, v[1] * amp, v[2] * amp, 1 + (v[3] - 1) * amp];
  const [cx, cy] = CENTERS[i];
  return `translate(${dx} ${dy}) translate(${cx} ${cy}) rotate(${r}) scale(${s}) translate(${-cx} ${-cy})`;
}
