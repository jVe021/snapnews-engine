import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import type { SnapNewsMetadata } from '../types';
import { DynamicBackground } from './DynamicBackground';
import { Headline } from './Headline';
import { BreakingBanner } from './BreakingBanner';
import { TransitionOverlay } from './TransitionOverlay';
import { ProgressBar } from './ProgressBar';
import { AudioLayer } from './AudioLayer';
import '../styles/global.css';

export const SnapNewsComposition: React.FC<SnapNewsMetadata> = (props) => {
    const { segments, totalDurationInFrames } = props;

    return (
        <AbsoluteFill style={{ backgroundColor: '#0a0a0a' }}>
            {/* Background images + headlines — sequenced per segment */}
            <Series>
                {segments.map((segment) => (
                    <Series.Sequence
                        key={segment.id}
                        durationInFrames={segment.durationInFrames}
                    >
                        <AbsoluteFill>
                            {/* Ken Burns background */}
                            <DynamicBackground
                                imagePath={segment.localImagePath || segment.imageUrl}
                                durationInFrames={segment.durationInFrames}
                            />

                            {/* Transition flash at start of segment */}
                            <TransitionOverlay
                                durationInFrames={segment.durationInFrames}
                            />

                            {/* Category banner */}
                            <BreakingBanner
                                category={segment.category}
                                durationInFrames={segment.durationInFrames}
                            />

                            {/* Headline + script text */}
                            <Headline
                                headline={segment.headline}
                                script={segment.script}
                                durationInFrames={segment.durationInFrames}
                            />
                        </AbsoluteFill>
                    </Series.Sequence>
                ))}
            </Series>

            {/* Audio layer — runs across all segments */}
            <AudioLayer segments={segments} />

            {/* Progress bar — spans the full video */}
            <ProgressBar
                totalDurationInFrames={totalDurationInFrames}
                segments={segments}
            />
        </AbsoluteFill>
    );
};
