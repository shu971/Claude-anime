// The fake video dashboard "Lumo Studio" (520x720), ported from the draft HTML/CSS.
// s[k] / hl[k] are 0..1 progress values that replace the draft's .sK / .hlK classes.
import React from 'react';
import { IconPlayerPlay, IconSearch, IconHome, IconMovie, IconMessageCircle, IconChartBar, IconUsers, IconBook, IconCoffee, IconBolt } from '@tabler/icons-react';
import { lerp, clamp } from './timeline';

type C = [number, number, number, number];
const parse = (c: string): C => {
  if (c.startsWith('#')) { const h = c.slice(1); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1]; }
  const m = c.match(/[\d.]+/g)!.map(Number); return [m[0], m[1], m[2], m[3] ?? 1];
};
// mix through a chain of colors: mix(['a','b','c'], [k1, k2]) -> a→b by k1, then →c by k2
export const mix = (cols: string[], ks: number[]) => { let c = parse(cols[0]); ks.forEach((k, i) => { const d = parse(cols[i + 1]); c = c.map((v, j) => lerp(v, d[j], clamp(k))) as C; }); return `rgba(${c[0].toFixed(1)},${c[1].toFixed(1)},${c[2].toFixed(1)},${c[3].toFixed(3)})`; };

const FONT = '"Noto Sans JP", "Noto Color Emoji", sans-serif';
const PINK = (a: number) => `rgba(255,77,109,${a})`;

// two layers in one grid cell, cross-faded (the draft's .stk)
const Stk: React.FC<{ k: number; v0: React.ReactNode; v1: React.ReactNode; hl?: number; style?: React.CSSProperties }> = ({ k, v0, v1, hl = 0, style }) => (
  <span style={{ display: 'inline-grid', ...style }}>
    <span style={{ gridArea: '1/1', opacity: 1 - k, background: hl > 0 ? PINK(0.45 * hl) : undefined, borderRadius: 4 }}>{v0}</span>
    <span style={{ gridArea: '1/1', opacity: k, display: 'inline-flex', alignItems: 'center' }}>{v1}</span>
  </span>
);

export const LumoScreen: React.FC<{ s: number[]; hl: number[] }> = ({ s, hl }) => {
  const [, s1, s2, s3, s4, s5, s6, s7] = s;
  const icon = (I: any, size = 14) => <I size={size} stroke={2} />;
  const gp = (h: number, tag?: boolean) => (
    <div style={{ position: 'relative', height: lerp(h, 16, s2), background: PINK(0.5 * hl[2]), flex: 'none' }}>
      {tag && (
        <span style={{ position: 'absolute', right: 0, top: '50%', transform: `translateY(-50%) scale(${1 + 0.25 * Math.sin(Math.PI * s2)})`, fontSize: 11, background: '#fff', color: '#c0264f', borderRadius: 99, padding: '0 6px', opacity: hl[2], lineHeight: '16px', fontWeight: 700 }}>
          {Math.round(lerp(h, 16, s2))}px
        </span>
      )}
    </div>
  );
  const slotW = lerp(17, 20, s3), slotM = lerp(6, 0, s3);
  const Row: React.FC<{ pl: number; em: string; I: any; label: string; act?: boolean; badge?: string; red?: boolean; fs?: number; tight?: boolean }> = ({ pl, em, I, label, act, badge, red, fs = 13, tight }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: fs, color: act ? '#fff' : mix(['#e6e0ff', '#cfcfcf'], [s1]), padding: `6px 8px 6px ${lerp(pl, 10, s3)}px`, borderRadius: 8, background: act ? mix(['#6c4bff', '#262626'], [s1]) : 'transparent' }}>
      <span style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', ...(tight ? { fontSize: 12, letterSpacing: '-0.04em' } : {}) }}>
        <span style={{ display: 'inline-block', width: slotW, marginRight: slotM, flex: 'none' }}><Stk k={s4} hl={hl[4]} v0={em} v1={icon(I)} /></span>
        {label}
      </span>
      {badge && <span style={{ fontSize: 11, borderRadius: 99, padding: tight ? '1px 5px' : '1px 7px', background: mix([red ? '#e8336a' : '#6c4bff', '#333333'], [s1]), color: mix(['#ffffff', '#dddddd'], [s1]), flex: 'none' }}>{badge}</span>}
    </div>
  );
  const sec = (em: string, text: string) => (
    <div style={{ fontSize: 11, color: mix(['#a99be0', '#6f6f6f'], [s1]), padding: '0 0 4px 10px' }}><Stk k={s4} hl={hl[4]} v0={`${em} ${text}`} v1={text} /></div>
  );
  const outline = (k: number) => ({ outline: `2px solid ${PINK(k)}`, outlineOffset: 3 + 2 * (1 - k) });
  const card = (k: number): React.CSSProperties => ({
    background: mix(['rgba(120,90,255,0.2)', '#262626', '#171717'], [s1, s6]),
    border: `1px solid ${mix(['rgba(170,140,255,0.5)', '#4d4d4d', '#262626'], [s1, s6])}`,
    borderRadius: lerp(18, 10, s6),
    boxShadow: `0 0 ${lerp(24, 22, s1)}px ${mix(['rgba(140,100,255,0.35)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'], [s1, s6])}`,
    padding: '12px 14px', ...outline(k),
  });
  const lb: React.CSSProperties = { fontSize: 12, fontWeight: s5 > 0.5 ? 400 : 500, color: mix(['#e6dcff', '#f0f0f0', '#8a8a8a'], [s1, s5]) };
  const dl: React.CSSProperties = { fontSize: 12, fontWeight: s5 > 0.5 ? 400 : 500, color: mix(['#ffffff', '#6f6f6f'], [s5]) };
  const dlb: React.CSSProperties = { fontWeight: 500, color: mix(['#ffffff', '#4ade80'], [s5]) };
  const bars = [52, 40, 63, 57, 78, 100, 86];
  return (
    <div style={{ position: 'relative', width: 520, height: 720, display: 'grid', gridTemplateColumns: '170px 1fr', background: 'linear-gradient(160deg,#4a22b8,#1a1240 60%,#120c2e)', fontFamily: FONT, color: '#fff', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: '#121212', opacity: s1 }} />
      {/* sidebar */}
      <aside style={{ position: 'relative', padding: '14px 12px', background: mix(['rgba(12,6,36,0.6)', '#0e0e0e'], [s1]), borderRight: `1px solid ${mix(['rgba(180,150,255,0.15)', '#222222'], [s1])}` }}>
        <div style={{ position: 'absolute', left: 42, top: 0, width: 1, height: `${100 * clamp(hl[3] * 1.4)}%`, background: '#ff4d6d', opacity: Math.min(1, hl[3] * 3), zIndex: 2, boxShadow: '0 0 6px rgba(255,77,109,0.8)' }} />
        <div>
          <Row pl={3} fs={14} em="🎬" I={IconPlayerPlay} label="Lumo Studio" />
          {gp(17)}
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: mix(['#c5b8f0', '#888888'], [s1]), border: `1px solid ${mix(['rgba(170,140,255,0.5)', '#333333'], [s1])}`, borderRadius: 99, padding: `7px 8px 7px ${lerp(4, 10, s3)}px`, background: mix(['rgba(22,22,22,0)', '#161616'], [s1]) }}>
            <span style={{ display: 'inline-block', width: slotW, marginRight: slotM }}><Stk k={s4} hl={hl[4]} v0="🔍" v1={icon(IconSearch)} /></span>動画を検索...
          </div>
          {gp(30)}
          {sec('📌', 'メニュー')}
          <Row pl={7} em="🏠" I={IconHome} label="ホーム" act />
          <Row pl={12} em="🎥" I={IconMovie} label="動画" />
          <Row pl={5} em="💬" I={IconMessageCircle} label="コメント" badge="24" red />
          <Row pl={14} em="📊" I={IconChartBar} label="アナリティクス" />
          <Row pl={8} em="⭐" I={IconUsers} label="メンバー" />
        </div>
        {gp(26)}
        {sec('🎞️', '再生リスト')}
        <Row pl={10} em="📚" I={IconBook} label="チュートリアル" badge="32" tight />
        <Row pl={6} em="☕" I={IconCoffee} label="Vlog" badge="18" />
        <Row pl={13} em="⚡" I={IconBolt} label="ショート" badge="140" />
      </aside>
      {/* main */}
      <main style={{ position: 'relative', padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
        <div>
          <div style={{ fontSize: 13, color: '#ddd' }}><Stk k={s4} hl={hl[4]} v0="🏠 ホーム" v1={<>{icon(IconHome, 13)}&nbsp;ホーム</>} /></div>
          {gp(25, true)}
          <div style={{ ...outline(hl[7]) }}>
            <span style={{ display: 'inline-grid' }}>
              <span style={{ gridArea: '1/1', opacity: 1 - s7, fontSize: 28, fontWeight: 500, lineHeight: 1.3, color: mix(['#d8b6ff', '#f2f2f2'], [s1]), transform: `translateY(${-10 * s7}px)` }}>極上の、視聴体験を。</span>
              <span style={{ gridArea: '1/1', opacity: s7, fontSize: 22, transform: `translateY(${10 * (1 - s7)}px)` }}>11月 <span style={{ color: '#666' }}>2026</span></span>
            </span>
          </div>
          {gp(8, true)}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, ...card(hl[5]) }}>
              <div style={lb}><Stk k={s4} hl={hl[4]} v0="👀 今月の再生回数" v1="今月の再生回数" /></div>
              <div style={{ fontSize: 24, fontWeight: 500, margin: '4px 0' }}>128,400</div>
              <div style={dl}><b style={dlb}>+18%</b> 先月比</div>
            </div>
            <div style={{ flex: 1, ...card(0) }}>
              <div style={lb}><Stk k={s4} hl={hl[4]} v0="⏱️ 総再生時間" v1="総再生時間" /></div>
              <div style={{ fontSize: 24, fontWeight: 500, margin: '4px 0' }}>3,210<span style={{ fontSize: 14 }}> 時間</span></div>
              <div style={dl}><b style={dlb}>+6%</b> 先月比</div>
            </div>
          </div>
        </div>
        {gp(21, true)}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...card(hl[6]) }}>
          <div style={lb}><Stk k={s4} hl={hl[4]} v0="📅 今週の再生数" v1="今週の再生数" /></div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: 10, paddingTop: 16 }}>
            {bars.map((h, i) => <div key={i} style={{ flex: 1, height: `${h}%`, borderRadius: '6px 6px 2px 2px', background: i === 5 ? mix(['#b57cff', '#5a5a5a'], [s1]) : mix(['#6c5cff', '#3a3a3a'], [s1]), boxShadow: `0 0 12px ${mix(['rgba(140,100,255,0.5)', 'rgba(140,100,255,0)'], [s1])}` }} />)}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            {['月', '火', '水', '木', '金', '土', '日'].map((d) => <span key={d} style={{ flex: 1, textAlign: 'center', fontSize: 11, color: mix(['#a99be0', '#666666'], [s1]) }}>{d}</span>)}
          </div>
        </div>
      </main>
      {/* step 1: pulse around the whole purple gradient */}
      <div style={{ position: 'absolute', inset: 6, borderRadius: 14, border: `4px solid ${PINK(hl[1])}`, boxShadow: `inset 0 0 40px ${PINK(0.35 * hl[1])}`, pointerEvents: 'none' }} />
    </div>
  );
};
