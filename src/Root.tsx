import React from 'react';
import { Composition } from 'remotion';
import { SnapNewsComposition } from './SnapNews/SnapNewsComposition';
import type { SnapNewsMetadata } from './types';

// Default props for Remotion Studio preview
const defaultProps: SnapNewsMetadata = {
  title: 'SNAPNEWS: AI REVOLUTION | Preview',
  date: new Date().toISOString(),
  totalDurationInFrames: 1800,
  fps: 30,
  width: 1080,
  height: 1920,
  segments: [
    {
      id: 0,
      headline: 'AI BREAKS ALL RECORDS',
      script:
        'Hold onto your seats! A groundbreaking AI system has just shattered every record in protein structure prediction. Scientists are calling it the biggest leap in biology in decades. This could change everything we know about medicine.',
      category: 'TECH',
      keywords: 'artificial intelligence',
      imageUrl:
        'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1080',
      localImagePath: '',
      audioPath: '',
      durationInFrames: 720,
    },
    {
      id: 1,
      headline: 'SPACEX MAKES HISTORY',
      script:
        'SpaceX does it again! The Falcon Heavy just carried the heaviest commercial satellite ever into orbit. Engineers say this marks a new era for global communications and internet access worldwide.',
      category: 'SCIENCE',
      keywords: 'rocket space launch',
      imageUrl:
        'https://images.pexels.com/photos/586030/pexels-photo-586030.jpeg?auto=compress&cs=tinysrgb&w=1080',
      localImagePath: '',
      audioPath: '',
      durationInFrames: 540,
    },
    {
      id: 2,
      headline: 'CHIP CRISIS OVER',
      script:
        'Great news for tech lovers! The global chip shortage is finally easing up. Major semiconductor manufacturers report supply chains are stabilizing, meaning faster delivery times and lower prices ahead.',
      category: 'BUSINESS',
      keywords: 'semiconductor microchip',
      imageUrl:
        'https://images.pexels.com/photos/2582937/pexels-photo-2582937.jpeg?auto=compress&cs=tinysrgb&w=1080',
      localImagePath: '',
      audioPath: '',
      durationInFrames: 540,
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SnapNewsComposition"
        component={SnapNewsComposition as unknown as React.FC<Record<string, unknown>>}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultProps as unknown as Record<string, unknown>}
      />
    </>
  );
};
