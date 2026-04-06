import React from 'react';
import {
    AbsoluteFill,
    Img,
    interpolate,
    useCurrentFrame,
    staticFile,
} from 'remotion';

interface DynamicBackgroundProps {
    imagePath: string;
    durationInFrames: number;
}

export const DynamicBackground: React.FC<DynamicBackgroundProps> = ({
    imagePath,
    durationInFrames,
}) => {
    const frame = useCurrentFrame();

    // Ken Burns effect — slow zoom from 1.0 to 1.15 + subtle pan
    const scale = interpolate(frame, [0, durationInFrames], [1.0, 1.15], {
        extrapolateRight: 'clamp',
    });

    const translateX = interpolate(frame, [0, durationInFrames], [0, -15], {
        extrapolateRight: 'clamp',
    });

    const translateY = interpolate(frame, [0, durationInFrames], [0, -8], {
        extrapolateRight: 'clamp',
    });

    // Resolve the image source
    const imgSrc = imagePath.startsWith('http')
        ? imagePath
        : staticFile(imagePath.replace(/^public\//, ''));

    return (
        <AbsoluteFill
            style={{
                overflow: 'hidden',
                backgroundColor: '#0a0a0a',
            }}
        >
            {/* Background image with Ken Burns */}
            <Img
                src={imgSrc}
                style={{
                    width: '120%',
                    height: '120%',
                    objectFit: 'cover',
                    transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
                    position: 'absolute',
                    top: '-10%',
                    left: '-10%',
                }}
            />

            {/* Dark gradient overlay for text readability */}
            <AbsoluteFill
                style={{
                    background: `linear-gradient(
            to bottom,
            rgba(0, 0, 0, 0.3) 0%,
            rgba(0, 0, 0, 0.1) 30%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(0, 0, 0, 0.7) 75%,
            rgba(0, 0, 0, 0.95) 100%
          )`,
                }}
            />

            {/* Subtle vignette */}
            <AbsoluteFill
                style={{
                    background: `radial-gradient(
            ellipse at center,
            transparent 50%,
            rgba(0, 0, 0, 0.5) 100%
          )`,
                }}
            />
        </AbsoluteFill>
    );
};
