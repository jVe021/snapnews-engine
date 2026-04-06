// scripts/rewrite-news.ts
// Uses Gemini LLM to rewrite raw articles into punchy Snap scripts
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import type { RawArticle, RewrittenSegment } from '../src/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `You are a scriptwriter for a fast-paced 60-second vertical news video called "SnapNews".

Your output MUST be a valid JSON array with exactly the same number of segments as input articles.

For each article, create a segment with:
- "headline": A punchy, eye-catching headline (max 8 words, ALL CAPS)
- "script": A high-energy narration script (40-60 words, conversational, use active voice)
- "category": One of: "TECH", "WORLD", "SCIENCE", "BUSINESS", "SPORTS", "HEALTH", "ENTERTAINMENT"
- "keywords": 2-3 specific image search keywords for finding a relevant background image (e.g., "artificial intelligence robot", "stock market charts")
- "durationPercent": Percentage of video duration for this segment

RULES:
- Total of all durationPercent values MUST equal exactly 100
- Make scripts energetic and news-anchor-like
- Start each script with a hook that grabs attention
- Use short, punchy sentences
- NO hashtags, NO emojis in the script text

Return ONLY the JSON array, no markdown formatting, no code blocks.`;

export async function rewriteNews(
    articles: RawArticle[]
): Promise<RewrittenSegment[]> {
    console.log(`🤖 Rewriting ${articles.length} articles with Gemini...`);

    const userPrompt = `Rewrite these ${articles.length} news stories into SnapNews segments:\n\n${articles
        .map(
            (a, i) =>
                `Article ${i + 1}:\nTitle: ${a.title}\nDescription: ${a.description}\nSource: ${a.source}`
        )
        .join('\n\n')}`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: userPrompt,
        config: {
            temperature: 0.8,
            systemInstruction: SYSTEM_PROMPT,
        },
    });

    const text = response.text?.trim() || '';

    // Clean potential markdown code blocks
    const cleaned = text
        .replace(/^```json?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    let segments: RewrittenSegment[];

    try {
        segments = JSON.parse(cleaned);
    } catch {
        console.error('❌ Failed to parse LLM response:', text);
        throw new Error('LLM returned invalid JSON');
    }

    // Validate and normalize durations
    const totalPercent = segments.reduce((s, seg) => s + seg.durationPercent, 0);
    if (Math.abs(totalPercent - 100) > 5) {
        console.warn(
            `⚠️ Duration percentages sum to ${totalPercent}%, normalizing...`
        );
        const factor = 100 / totalPercent;
        segments.forEach((s) => (s.durationPercent = Math.round(s.durationPercent * factor)));
    }

    // Ensure exact 100%
    const diff = 100 - segments.reduce((s, seg) => s + seg.durationPercent, 0);
    if (diff !== 0) {
        segments[0].durationPercent += diff;
    }

    console.log('✅ Rewritten segments:');
    segments.forEach((s, i) =>
        console.log(`   ${i + 1}. [${s.category}] ${s.headline} (${s.durationPercent}%)`)
    );

    return segments;
}

// Allow direct execution for testing
if (require.main === module) {
    const sampleArticles: RawArticle[] = [
        {
            title: 'AI makes breakthrough in protein folding',
            description:
                'New AI system can predict protein structures with unprecedented accuracy.',
            url: 'https://example.com/1',
            source: 'TechCrunch',
            urlToImage: null,
        },
        {
            title: 'SpaceX launches record payload',
            description:
                'Falcon Heavy carries largest commercial satellite ever launched.',
            url: 'https://example.com/2',
            source: 'Space.com',
            urlToImage: null,
        },
        {
            title: 'Global chip shortage easing',
            description:
                'Semiconductor manufacturers report improved supply chain conditions.',
            url: 'https://example.com/3',
            source: 'Reuters',
            urlToImage: null,
        },
    ];

    rewriteNews(sampleArticles)
        .then((segments) => {
            console.log('\n📋 Full output:');
            console.log(JSON.stringify(segments, null, 2));
        })
        .catch(console.error);
}
