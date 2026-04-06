import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';

interface TransitionOverlayProps {
    durationInFrames: number;
}

/**
 * Flash/glitch transition effect between segments.
 * Shows a brief white flash + scale burst at the START of each segment (first 5 frames).
 */
export const TransitionOverlay: React.FC<TransitionOverlayProps> = ({
    durationInFrames: _durationInFrames,
}) => {
    const frame = useCurrentFrame();

    // Flash effect — peaks at frame 1, fades by frame 5
    const flashOpacity = interpolate(frame, [0, 1, 5], [0.9, 1, 0], {
        extrapolateRight: 'clamp',
    });

    // Glitch line effect at the start
    const glitchOpacity = interpolate(frame, [0, 3, 7], [0.8, 0.4, 0], {
        extrapolateRight: 'clamp',
    });

    if (frame > 7) return null;

    return (
        <>
            {/* White flash */}
            <AbsoluteFill
                style={{
                    backgroundColor: '#ffffff',
                    opacity: flashOpacity,
                    zIndex: 200,
                }}
            />

            {/* Horizontal glitch lines */}
            {[0.2, 0.45, 0.7].map((pos, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        top: `${pos * 100}%`,
                        left: 0,
                        right: 0,
                        height: 3,
                        backgroundColor: '#FFD700',
                        opacity: glitchOpacity,
                        transform: `translateX(${(i % 2 === 0 ? 1 : -1) * (7 - frame) * 15}px)`,
                        zIndex: 201,
                    }}
                />
            ))}
        </>
    );
};
