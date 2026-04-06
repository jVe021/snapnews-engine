import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import type { NewsSegment } from '../types';

interface ProgressBarProps {
    totalDurationInFrames: number;
    segments: NewsSegment[];
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    totalDurationInFrames,
    segments,
}) => {
    const frame = useCurrentFrame();

    const progress = interpolate(
        frame,
        [0, totalDurationInFrames],
        [0, 100],
        { extrapolateRight: 'clamp' }
    );

    // Calculate segment marker positions
    let accumulated = 0;
    const markers = segments.map((seg) => {
        accumulated += seg.durationInFrames;
        return (accumulated / totalDurationInFrames) * 100;
    });

    // Gradient color based on progress: red → yellow → green
    const red = interpolate(progress, [0, 50, 100], [255, 255, 50], {
        extrapolateRight: 'clamp',
    });
    const green = interpolate(progress, [0, 50, 100], [50, 200, 255], {
        extrapolateRight: 'clamp',
    });

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                zIndex: 100,
            }}
        >
            {/* Progress fill */}
            <div
                style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: `rgb(${red}, ${green}, 50)`,
                    borderRadius: '0 3px 3px 0',
                    boxShadow: `0 0 12px rgba(${red}, ${green}, 50, 0.6)`,
                    transition: 'width 0.03s linear',
                }}
            />

            {/* Segment markers */}
            {markers.slice(0, -1).map((pos, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: `${pos}%`,
                        top: -2,
                        width: 2,
                        height: 10,
                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: 1,
                    }}
                />
            ))}
        </div>
    );
};
