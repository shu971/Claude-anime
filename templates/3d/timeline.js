// Timing from the user's narration (whisper + script alignment).
import TIM from './timing.json' with { type: 'json' };
import SCRIPT from './script.json' with { type: 'json' };
export const FPS = 30;
export { SCRIPT };
export const VO = TIM.start;
export const DUR = Object.fromEntries(Object.keys(TIM.start).map((k) => [k, TIM.end[k] - TIM.start[k]]));
export const DURATION = 63.0;
export const S = (id) => TIM.start[id];
export const E = (id) => TIM.end[id];
const text = (id) => SCRIPT.find((l) => l.id === id).text;
export const at = (id, sub, off = 0) => { const i = text(id).indexOf(sub); if (i < 0) throw new Error(`${id}: ${sub}`); return TIM.chars[id][i] + off; };
export const B = {
  mimi: at('l02', 'よく耳'), deploy2: at('l02', 'デプロイ'),
  kokai: at('l03', 'サイトを公開'), omot: at('l03', '思ってませんか'),
  web: at('l04', 'Webサイト'), html: at('l04', 'HTML'), css: at('l04', 'CSS'), js: at('l04', 'JavaScript'), mittsu: at('l04', '3つ'),
  kansei: at('l05', '完成した画面'), nozoki: at('l05', '覗きに'), wake: at('l05', 'わけではありません'),
  sumaho: at('l06', 'スマホ'), pc: at('l06', 'パソコン'), chrome: at('l06', 'Chrome'), browser: at('l06', 'ブラウザさん'),
  url: at('l07', 'URL'), click: at('l07', 'クリック'), server: at('l07', 'Webサーバーさん'),
  onegai: at('l08', 'とお願い'),
  uketori: at('l09', '受け取った'), mochi: at('l09', '持ち帰り'),
  gamen: at('l10', 'あなたの画面'), egaku: at('l10', '描いて'),
  kokai2: at('l12', 'サイトの公開'), sekai: at('l12', '世界中'), morau: at('l12', 'もらえる状態'),
  oku: at('l13', 'コードを置いて'),
  deploy3: at('l14', 'デプロイとは'), koushin: at('l14', '新しいもの'),
  hajime: at('l15', '初めて'), karappo: at('l15', '空っぽ'), todoke: at('l15', '届ける'), set: at('l15', 'セット'),
  kakikae: at('l16', '書き換えて'), localhost: at('l16', 'localhost'), kakunin: at('l16', '確認'),
  naka: at('l17', 'パソコンの中'),
  deploy4: at('l18', 'デプロイした瞬間'), henko: at('l18', 'その変更'), sekai2: at('l18', '世界中'), todoku: at('l18', '届く'),
};
