// Timeline from VOICEVOX's own phoneme timing (no transcription).
// Each line's comma chunks have exact start/end; inside a chunk we go by character position.
import TIM from './audio/timing.json' with { type: 'json' };
import SCRIPT from './script.json' with { type: 'json' };
export const FPS = 30;
export { SCRIPT };
const GAP = { s01: 0.5, s02: 0.45, s03: 0.25, s04: 0.4, s05: 0.25, s06: 0.4, s07: 0.25, s08: 0.6, s09: 0.25, s10: 0.5, s11: 0.3, s12: 0.6, s13: 0.3, s14: 0.55, s15: 0.3, s16: 0.6, s17: 0.3, s18: 0.8, s19: 0.35 };
export const VO = {}, DUR = {};
let t = 0;
for (const l of SCRIPT) { t += GAP[l.id] ?? 0.3; VO[l.id] = +t.toFixed(3); DUR[l.id] = TIM[l.id].dur; t += TIM[l.id].dur; }
export const DURATION = +(t + 2.0).toFixed(2);
export const S = (id) => VO[id];
export const E = (id) => VO[id] + DUR[id];
const disp = (id) => SCRIPT.find((l) => l.id === id).text.replace(/[「」]/g, '');
export const at = (id, sub, off = 0) => {
  const s = disp(id), i = s.indexOf(sub); if (i < 0) throw new Error(`${id}: ${sub}`);
  const parts = s.split(/[、…]/); let k = 0, p0 = 0;
  for (; k < parts.length; k++) { if (i < p0 + parts[k].length + 1) break; p0 += parts[k].length + 1; }
  const ch = TIM[id].chunks[Math.min(k, TIM[id].chunks.length - 1)];
  return VO[id] + ch[0] + (ch[1] - ch[0]) * ((i - p0) / Math.max(1, parts[k].length)) + off;
};
export const B = {
  sub: at('s01', 'サブエージェント'), teiki: at('s01', '定期テスト'),
  hitori: at('s02', '1人'), kokugo: at('s02', '国語'), suugaku: at('s02', '数学'), eigo: at('s02', '英語'), zen: at('s02', '全教科'), print: at('s02', 'プリント'), yomu: at('s02', '全部自分で'),
  jikan: at('s03', 'とにかく'),
  denai: at('s04', 'テストに出ない'), atama: at('s04', '全部頭に'), saigo: at('s04', '最後に'),
  panpan: at('s05', 'パンパン'), umore: at('s05', '大事なところ'),
  nakami: at('s06', '頭の中身'), context: at('s06', 'コンテキスト'),
  nibu: at('s07', '判断が鈍'),
  tomo: at('s08', '友達5人'), ikkyo: at('s08', '1教科ずつ'),
  subag: at('s09', 'サブエージェント'),
  shirabe: at('s10', '自分の教科'), deso: at('s10', '出そうな'), ichimai: at('s10', 'ページ1枚'),
  douji: at('s11', '全員同時'), ikkyobun: at('s11', '1教科分'),
  tanonde: at('s12', '5人に頼んで'), anata: at('s12', 'あなた'), matome: at('s12', 'まとめ役のAI'),
  shiki: at('s13', '全体を指揮'), orch: at('s13', 'オーケストレーション'),
  yomu5: at('s14', '届いた5枚'),
  hiraite: at('s15', '1ページも'), manben: at('s15', 'まんべんなく'), kansei: at('s15', 'すぐ完成'),
  hayai: at('s16', '速いだけ'), punk: at('s16', 'まとめ役AIの頭'),
  seido: at('s17', '精度'),
  tsukau: at('s18', '使い方'), tsukutte: at('s18', 'サブエージェントを作って'), tanomu: at('s18', '頼むだけ'),
  kashikoi: at('s19', '賢い'), tanomanaku: at('s19', '頼まなくても'), jibun: at('s19', '自分で判断'),
};
