import React from 'react';
import {
    spring,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
} from 'remotion';

interface HeadlineProps {
    headline: string;
    script: string;
    durationInFrames: number;
}

export const Headline: React.FC<HeadlineProps> = ({
    headline,
    script,
    durationInFrames,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Headline spring animation (pop in)
    const headlineScale = spring({
        frame,
        fps,
        config: { damping: 10.5, stiffness: 180 },
    });

    const headlineOpacity = interpolate(frame, [0, 8], [0, 1], {
        extrapolateRight: 'clamp',
    });

    // Script text: word-by-word reveal
    const words = script.split(' ');
    const wordsPerFrame = words.length / (durationInFrames * 0.7); // Use 70% of segment time for text reveal
    const visibleWordCount = Math.min(
        Math.floor(frame * wordsPerFrame) + 1,
        words.length
    );

    // Fade out near end of segment
    const fadeOut = interpolate(
        frame,
        [durationInFrames - 15, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Script slides up from bottom
    const scriptTranslateY = spring({
        frame: Math.max(0, frame - 10),
        fps,
        config: { damping: 15, stiffness: 100 },
    });

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 120,
                left: 40,
                right: 40,
                opacity: fadeOut,
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
            }}
        >
            {/* Main Headline */}
            <h1
                style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 900,
                    fontSize: 64,
                    color: '#FFD700',
                    textTransform: 'uppercase',
                    lineHeight: 1.05,
                    letterSpacing: '-0.02em',
                    transform: `scale(${headlineScale})`,
                    opacity: headlineOpacity,
                    textShadow: `
            0 2px 8px rgba(0, 0, 0, 0.8),
            0 4px 16px rgba(0, 0, 0, 0.6),
            0 0 40px rgba(0, 0, 0, 0.4),
            0 0 60px rgba(255, 215, 0, 0.15)
          `,
                    transformOrigin: 'left bottom',
                }}
            >
                {headline}
            </h1>

            {/* Script text — word by word reveal */}
            <p
                style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontWeight: 400,
                    fontSize: 36,
                    color: '#ffffff',
                    lineHeight: 1.5,
                    transform: `translateY(${(1 - scriptTranslateY) * 30}px)`,
                    textShadow: `
            0 1px 4px rgba(0, 0, 0, 0.8),
            0 2px 8px rgba(0, 0, 0, 0.6)
          `,
                }}
            >
                {words.map((word, i) => (
                    <span
                        key={i}
                        style={{
                            opacity: i < visibleWordCount ? 1 : 0.15,
                            transition: 'opacity 0.1s',
                            color: i < visibleWordCount ? '#ffffff' : 'rgba(255,255,255,0.15)',
                        }}
                    >
                        {word}{' '}
                    </span>
                ))}
            </p>
        </div>
    );
};
