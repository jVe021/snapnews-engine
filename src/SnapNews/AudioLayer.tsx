import React from 'react';
import { Audio, Series, staticFile } from 'remotion';
import type { NewsSegment } from '../types';

interface AudioLayerProps {
    segments: NewsSegment[];
}

export const AudioLayer: React.FC<AudioLayerProps> = ({ segments }) => {
    // Filter to segments that have audio
    const audioSegments = segments.filter((seg) => seg.audioPath);

    if (audioSegments.length === 0) return null;

    return (
        <Series>
            {segments.map((segment) => (
                <Series.Sequence
                    key={segment.id}
                    durationInFrames={segment.durationInFrames}
                >
                    {segment.audioPath ? (
                        <Audio
                            src={staticFile(segment.audioPath.replace(/^public\//, ''))}
                            volume={0.9}
                        />
                    ) : null}
                </Series.Sequence>
            ))}
        </Series>
    );
};
