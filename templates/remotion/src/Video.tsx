import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { loadFont as loadJP } from '@remotion/google-fonts/NotoSansJP';
import { loadFont as loadEmoji } from '@remotion/google-fonts/NotoColorEmoji';
import { AUDIO, LAYOUT } from './config';
import { uiState, nt } from './timeline';
import { LumoScreen } from './LumoScreen';
import { Captions } from './Captions';

loadJP('normal', { weights: ['400', '500', '700', '900'] });
loadEmoji();

export type Props = { narration: string | null; sfx: string | null };

export const AiSiteFeatures: React.FC<Props> = ({ narration, sfx }) => {
  const frame = useCurrentFrame(); const { fps } = useVideoConfig();
  const t = nt(frame / fps);
  const { s, hl, cam } = uiState(t);
  const V = LAYOUT.viewport;
  return (
    <AbsoluteFill style={{ background: '#0b0b0b' }}>
      <div style={{ position: 'absolute', left: V.x, top: V.y, width: V.w, height: V.h, borderRadius: V.radius, overflow: 'hidden', background: '#000' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 520, height: 720, transformOrigin: '0 0', transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.sc})` }}>
          <LumoScreen s={s} hl={hl} />
        </div>
      </div>
      <Captions t={t} />
      <Sequence from={Math.round(AUDIO.offset * fps)}>
        {narration && <Audio src={staticFile(narration)} volume={AUDIO.narrationVolume} />}
        {sfx && <Audio src={staticFile(sfx)} volume={AUDIO.sfxVolume} />}
      </Sequence>
    </AbsoluteFill>
  );
};
