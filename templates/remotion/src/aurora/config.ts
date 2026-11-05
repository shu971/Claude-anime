// ============================================================
//  Aurora gradient short — DRAFT. All timings (seconds) and texts here.
// ============================================================
export const FPS = 30;
export const DURATION = 60;

// scene windows [start, end)
export const SCENES = {
  hook: [0, 6],
  compare: [6, 14],
  why: [14, 20],
  reveal: [20, 34],
  motion: [34, 43],
  prompts: [43, 56],
  close: [56, 60],
} as const;

// header-card captions (placeholder text — narration not decided yet)
// each: [start, end, badge, line1 parts, line2 parts]; parts = [text, accent?]
export const CAPTIONS: { t: [number, number]; badge?: string; l1: [string, boolean?][]; l2?: [string, boolean?][] }[] = [
  { t: [0.3, 3.2], l1: [['AIに'], ['「高級感のあるグラデ」', true]], l2: [['って頼むと…']] },
  { t: [3.2, 6.0], l1: [['こうなりませんか？', true]], l2: [['上から下へ、ただ明るくなるだけ']] },
  { t: [6.0, 10.0], badge: 'VS', l1: [['同じ赤なのに']], l2: [['右は', false], ['光って見える', true]] },
  { t: [10.0, 14.0], badge: 'VS', l1: [['ちがいは', false], ['立体感', true]], l2: [['光が奥から差し込んでくる']] },
  { t: [14.0, 17.0], badge: '?', l1: [['のっぺりの正体は']], l2: [['均一な変化', true]] },
  { t: [17.0, 20.0], badge: '?', l1: [['光っぽさの正体は']], l2: [['わざと作った', false], ['ムラ', true]] },
  { t: [20.0, 28.5], badge: '01', l1: [['作り方は'], ['3枚重ねるだけ', true]], l2: [['暗い色を奥、明るい色ほど手前']] },
  { t: [28.5, 34.0], badge: '02', l1: [['あとは'], ['強くぼかす', true]], l2: [['境界が消えて、光になる']] },
  { t: [34.0, 38.5], badge: '03', l1: [['形を動かすと']], l2: [['光が', false], ['ゆらぐ', true]] },
  { t: [38.5, 43.0], badge: '03', l1: [['色を変えても']], l2: [['作り方は', false], ['同じ', true]] },
  { t: [43.0, 47.0], badge: 'AI', l1: [['AIへの頼み方'], ['① ふわっと', true]], l2: [['→ のっぺりしがち']] },
  { t: [47.0, 51.0], badge: 'AI', l1: [['② 名前で頼む', true]], l2: [['「オーロラグラデーション」']] },
  { t: [51.0, 56.0], badge: 'AI', l1: [['③ 仕組みを渡す', true]], l2: [['これが一番確実']] },
  { t: [56.0, 60.0], l1: [['デザインの'], ['名前', true], ['を知るだけで']], l2: [['AIへの指示は一言で済む']] },
];

export const PALETTES = {
  red: ['#e0173a', '#f05a70', '#f7b8c2'],
  purple: ['#8a1fe0', '#b25cf2', '#e2c2fb'],
  blue: ['#1f5fe0', '#5a8ef0', '#bcd3f9'],
  green: ['#1fb83a', '#55dd6c', '#c2f5c9'],
};
export const COLOR_CHANGES: [number, keyof typeof PALETTES][] = [[0, 'red'], [38.6, 'purple'], [40.0, 'blue'], [41.4, 'green']];

export const BEFORE_GRADIENT = 'linear-gradient(180deg, #3a0812 0%, #8f0f26 55%, #e0173a 100%)';
export const BG = '#050304';

export const PROMPTS = [
  { text: '高級感のある赤いグラデーション背景をCSSで作って。', grade: '△ のっぺり' },
  { text: '暗い背景に、赤系のオーロラグラデーションのカードを作って。ぼかしたブロブを重ねて、ゆっくり動かして。', grade: '○ ぐっと良くなる' },
  { text: '明るさ違いの不定形を3枚、右下が一番明るくなるように重ねて、強くぼかして。', grade: '◎ 狙いどおり' },
];

export const CAPTION_STYLE = {
  card: { x: 44, y: 236, w: 992, h: 222, radius: 28, bg: 'rgba(22,16,20,0.92)', border: '#3a2a30' },
  size1: 54, size2: 46,
  accent: '#ff5a76', sub: '#f7b8c2', white: '#ffffff',
  font: '"Noto Sans JP", "Noto Color Emoji", sans-serif',
};
