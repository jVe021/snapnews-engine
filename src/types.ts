// SnapNews shared types — used by both scripts and Remotion components

export interface NewsSegment {
    id: number;
    headline: string; // Short headline for banner (max 8 words)
    script: string; // Full narration text (40-60 words)
    category: string; // e.g., "TECH", "WORLD", "SCIENCE"
    keywords: string; // Image search keywords
    imageUrl: string; // Pexels image URL (original)
    localImagePath: string; // Downloaded path in public/images/
    audioPath: string; // Generated voice in public/audio/
    durationInFrames: number; // LLM-decided, at 30fps
}

export interface SnapNewsMetadata {
    title: string; // Video title
    date: string; // Generation date ISO string
    totalDurationInFrames: number; // Fixed: 1800 frames (60s @ 30fps)
    fps: number; // 30
    width: number; // 1080
    height: number; // 1920
    segments: NewsSegment[];
}

// Raw article from NewsAPI
export interface RawArticle {
    title: string;
    description: string;
    url: string;
    source: string;
    urlToImage: string | null;
}

// LLM rewrite output per segment
export interface RewrittenSegment {
    headline: string;
    script: string;
    category: string;
    keywords: string;
    durationPercent: number; // Percentage of total video (sums to 100)
}
