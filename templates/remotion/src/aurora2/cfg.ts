// ============================================================
//  Aurora gradient short — all timings / looks in one place.
//  Times are NARRATION seconds (chunk times come from chunks.json, aligned to the narration).
// ============================================================
import CHUNKS from './chunks.json';
export { CHUNKS };
export const FPS = 30;
export const AUDIO = { offset: 0.25, narration: 'aurora_narration.wav', sfx: 'aurora_sfx.wav', length: 31.22, tail: 1.3 };
export const DURATION_FRAMES = Math.ceil((AUDIO.offset + AUDIO.length + AUDIO.tail) * FPS);
export const T = (id: string) => (CHUNKS as { id: string; t: number }[]).find((c) => c.id === id)!.t;

// scene starts (narration seconds)
export const SC = {
  before: 0,
  flash: T('c03'), // 4-color flash runs from 「こんなグラデーションに」 through 「変える方法。」
  flat: T('c05'),
  line: T('c09'), // 直線で
  nice: T('c12'),
  fuwa: T('c15'), // ふわっと
  draw: T('c18'), // ランダムな
  copy: T('c22'), // 明るさごとに3つ
  shift: T('c23'), // ずらして
  blur: T('c25'), // これをぼかすと
  reveal: T('c28'), // なりました
  key: T('c30'), // キーフレームで
  move: T('c31'), // 動かすと
  done: T('c34'), // 完成
  broll: T('c35'), // サクッとAIに
  big: T('c37'), // 「オーロラグラデーションの背景にして」
  outro: T('c45'), // 今の手順で
  caption: T('c48'), // キャプションの
};

export const FLASH_STEP = 0.19; // seconds per color in the flash
export const BLUR = 60; // final blur (viewBox units, card is 300 wide)

export const PALETTES = {
  red: ['#e0173a', '#f05a70', '#f7b8c2'],
  purple: ['#8a1fe0', '#b25cf2', '#e2c2fb'],
  blue: ['#1f5fe0', '#5a8ef0', '#bcd3f9'],
  green: ['#1fb83a', '#55dd6c', '#c2f5c9'],
};
export const FLASH_ORDER = ['red', 'purple', 'blue', 'green'] as const;
export const BEFORE_GRADIENT = 'linear-gradient(180deg, #3a0812 0%, #8f0f26 55%, #e0173a 100%)';
export const BG = '#050304';

export const LAYOUT = { card: { w: 660, top: 560 }, capY: 440, brollCapY: 440, bigY: 900 };

// caption look (pattern 1: short chunks flashed in one spot)
export const CAP = {
  size: 92, bigSize: 104, smallSize: 58, color: '#ffffff', accent: '#ff6a86',
  accents: ['グラデーション', '安っぽい', 'のっぺり', '直線', 'ふわっと', 'ランダム', '波打つ', 'ぼかす', 'キーフレーム', '高級感', '完成', '名前', '一言', 'プロンプト'],
  font: '"Noto Sans JP", sans-serif',
};
