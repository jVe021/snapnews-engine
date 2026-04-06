import React from 'react';
import {
    spring,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
} from 'remotion';

interface BreakingBannerProps {
    category: string;
    durationInFrames: number;
}

const CATEGORY_STYLES: Record<string, { emoji: string; color: string }> = {
    TECH: { emoji: '💻', color: '#00D4FF' },
    WORLD: { emoji: '🌍', color: '#FF6B35' },
    SCIENCE: { emoji: '🔬', color: '#A855F7' },
    BUSINESS: { emoji: '📈', color: '#10B981' },
    SPORTS: { emoji: '⚽', color: '#EF4444' },
    HEALTH: { emoji: '🏥', color: '#EC4899' },
    ENTERTAINMENT: { emoji: '🎬', color: '#F59E0B' },
    BREAKING: { emoji: '🔥', color: '#FF3333' },
};

export const BreakingBanner: React.FC<BreakingBannerProps> = ({
    category,
    durationInFrames,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const catStyle = CATEGORY_STYLES[category.toUpperCase()] || CATEGORY_STYLES.BREAKING;

    // Slide in from left
    const slideIn = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 150 },
    });

    const translateX = interpolate(slideIn, [0, 1], [-300, 0]);

    // Fade out at the end
    const fadeOut = interpolate(
        frame,
        [durationInFrames - 10, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    // Subtle glow pulse
    const pulse = Math.sin(frame * 0.15) * 0.3 + 0.7;

    return (
        <div
            style={{
                position: 'absolute',
                top: 80,
                left: 0,
                opacity: fadeOut,
                transform: `translateX(${translateX}px)`,
                zIndex: 50,
            }}
        >
            <div
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 28px 12px 20px',
                    backgroundColor: catStyle.color,
                    borderRadius: '0 8px 8px 0',
                    boxShadow: `
            0 4px 20px rgba(0, 0, 0, 0.4),
            0 0 30px ${catStyle.color}${Math.round(pulse * 60).toString(16).padStart(2, '0')}
          `,
                }}
            >
                <span style={{ fontSize: 28 }}>{catStyle.emoji}</span>
                <span
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 900,
                        fontSize: 22,
                        color: '#ffffff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.3)',
                    }}
                >
                    {category}
                </span>
            </div>
        </div>
    );
};
