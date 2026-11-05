import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { AiSiteFeatures } from './Video';
import { FPS, WIDTH, HEIGHT, DURATION_FRAMES, AUDIO } from './config';
import { AuroraDraft } from './aurora/Aurora';
import { CaptionTest1, CaptionTest2 } from './captest/CapTest';
import { AuroraFinal } from './aurora2/Final';
import * as AUR2 from './aurora2/cfg';
import * as AURORA from './aurora/config';

const Root: React.FC = () => (
  <>
    <Composition id="AiSiteFeatures" component={AiSiteFeatures} durationInFrames={DURATION_FRAMES} fps={FPS} width={WIDTH} height={HEIGHT}
      defaultProps={{ narration: AUDIO.narration, sfx: AUDIO.sfx }} />
    <Composition id="AuroraFinal" component={AuroraFinal} durationInFrames={AUR2.DURATION_FRAMES} fps={30} width={1080} height={1920}
      defaultProps={{ narration: AUR2.AUDIO.narration, sfx: AUR2.AUDIO.sfx }} />
    <Composition id="CaptionTest1" component={CaptionTest1} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="CaptionTest2" component={CaptionTest2} durationInFrames={300} fps={30} width={1080} height={1920} />
    <Composition id="AuroraDraft" component={AuroraDraft} durationInFrames={AURORA.DURATION * AURORA.FPS} fps={AURORA.FPS} width={1080} height={1920} />
  </>
);
registerRoot(Root);
