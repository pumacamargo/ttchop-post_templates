import React from 'react';
import { Composition } from 'remotion';
import { RiveTestOverlay } from './RiveTestOverlay';
import { RiveLipSync } from './RiveLipSync';
import { RiveOnVideo } from './RiveOnVideo';
import { RiveProbe } from './RiveProbe';
import { RiveDiag } from './RiveDiag';
import { HeadDirTest } from './HeadDirTest';
import { HeadDirSweep } from './HeadDirSweep';
import { BrowTest } from './BrowTest';
import { FirstLineTest } from './FirstLineTest';
import { ThreeLineTest } from './ThreeLineTest';
import { JpEmotionTest } from './JpEmotionTest';
import { JpFirstLineTest } from './JpFirstLineTest';
import { JpSecondLineTest } from './JpSecondLineTest';
import { BodyPosTest } from './BodyPosTest';
import { CharacterClip } from './CharacterClip';
import { AatoOnVideo } from './AatoOnVideo';
import { OverlaySamplerOverlay } from './OverlaySamplerOverlay';
import { ReviewCardOverlay } from './ReviewCardOverlay';
import { AutoOverlay } from './AutoOverlay';
import { FontStyleDemo } from './FontStyleDemo';
import { TextAnimDemo, GlowCompareDemo } from './TextAnimDemo';
import { CarouselSlide } from './CarouselSlide';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="CarouselSlide"
        component={CarouselSlide}
        durationInFrames={1}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          bg: 'placeholder.jpg',
          text: 'Sample slide text',
          role: 'hook',
          slideIndex: 0,
          total: 7,
          style: { layoutId: 'cinematic-concert-still' },
        }}
      />
      <Composition
        id="overlay-sampler"
        component={OverlaySamplerOverlay}
        durationInFrames={1068}
        fps={25}
        width={1080}
        height={1920}
      />
      <Composition
        id="review-card-demo"
        component={ReviewCardOverlay}
        durationInFrames={361}
        fps={24}
        width={1080}
        height={1920}
      />
      <Composition
        id="font-style-demo"
        component={FontStyleDemo}
        durationInFrames={361}
        fps={24}
        width={1080}
        height={1920}
      />
      <Composition
        id="text-anim-demo"
        component={TextAnimDemo}
        durationInFrames={600}
        fps={24}
        width={1080}
        height={1920}
      />
      <Composition
        id="glow-compare"
        component={GlowCompareDemo}
        durationInFrames={72}
        fps={24}
        width={1080}
        height={1920}
      />
      <Composition
        id="auto-overlay-default"
        component={AutoOverlay}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round((props.duration ?? 30) * 25),
        })}
        defaultProps={{
          videoFile: 'auto_base.mp4',
          duration: 30,
          hook: ['🔥'],
          features: [],
          reviews: [],
          fomo: { line1: '', line2: '' },
          cta: { showPrice: false, priceLine: '', discountLine: '', fomoLine: '' },
        }}
        fps={25}
        width={1080}
        height={1920}
      />
      <Composition
        id="RiveTest"
        component={RiveTestOverlay}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RiveLipSync"
        component={RiveLipSync}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition id="RiveProbe" component={RiveProbe} durationInFrames={1} fps={30} width={900} height={900} />
      <Composition id="DiagLinear" component={RiveDiag} defaultProps={{ mode: 'linear' }} durationInFrames={180} fps={60} width={700} height={700} />
      <Composition id="DiagSmStatic" component={RiveDiag} defaultProps={{ mode: 'sm-static' }} durationInFrames={180} fps={60} width={700} height={700} />
      <Composition id="DiagSmLipsync" component={RiveDiag} defaultProps={{ mode: 'sm-lipsync' }} durationInFrames={180} fps={60} width={700} height={700} />
      <Composition id="HeadDir0" component={HeadDirTest} defaultProps={{ value: 0 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="HeadDir1" component={HeadDirTest} defaultProps={{ value: 1 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="HeadDir2" component={HeadDirTest} defaultProps={{ value: 2 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="HeadDir3" component={HeadDirTest} defaultProps={{ value: 3 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="HeadDir4" component={HeadDirTest} defaultProps={{ value: 4 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="HeadDir5" component={HeadDirTest} defaultProps={{ value: 5 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="HeadDirSweep" component={HeadDirSweep} durationInFrames={720} fps={60} width={700} height={800} />
      <Composition id="Brow0" component={BrowTest} defaultProps={{ value: 0 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="Brow1" component={BrowTest} defaultProps={{ value: 1 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="Brow2" component={BrowTest} defaultProps={{ value: 2 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="Brow3" component={BrowTest} defaultProps={{ value: 3 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="Brow4" component={BrowTest} defaultProps={{ value: 4 }} durationInFrames={1} fps={30} width={700} height={700} />
      <Composition id="FirstLineTest" component={FirstLineTest} durationInFrames={158} fps={60} width={1080} height={1920} />
      <Composition id="ThreeLineTest" component={ThreeLineTest} durationInFrames={518} fps={60} width={1080} height={1920} />
      <Composition id="JpEmotionTest" component={JpEmotionTest} durationInFrames={686} fps={60} width={1080} height={1920} />
      <Composition id="JpFirstLineTest" component={JpFirstLineTest} durationInFrames={216} fps={60} width={1080} height={1920} />
      <Composition id="JpSecondLineTest" component={JpSecondLineTest} durationInFrames={173} fps={60} width={1080} height={1920} />
      <Composition id="Body0" component={BodyPosTest} defaultProps={{ value: 0 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body1" component={BodyPosTest} defaultProps={{ value: 1 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body2" component={BodyPosTest} defaultProps={{ value: 2 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body3" component={BodyPosTest} defaultProps={{ value: 3 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body4" component={BodyPosTest} defaultProps={{ value: 4 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body5" component={BodyPosTest} defaultProps={{ value: 5 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body6" component={BodyPosTest} defaultProps={{ value: 6 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body7" component={BodyPosTest} defaultProps={{ value: 7 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition id="Body8" component={BodyPosTest} defaultProps={{ value: 8 }} durationInFrames={1} fps={30} width={700} height={900} />
      <Composition
        id="character-clip"
        component={CharacterClip}
        fps={60}
        width={1080}
        height={1080}
        calculateMetadata={({ props }) => ({
          durationInFrames: Math.round((props.duration ?? 5) * 60),
        })}
        defaultProps={{
          rivFile: 'aato02.riv',
          audioFile: 'emotion_test.wav',
          duration: 5,
          mouthCues: [],
          browCues: [],
          bodyCues: [],
          blinkTimes: [],
        }}
      />
      <Composition id="AatoOnVideo" component={AatoOnVideo} durationInFrames={1234} fps={60} width={1080} height={1920} />
      <Composition
        id="RiveOnVideo"
        component={RiveOnVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
