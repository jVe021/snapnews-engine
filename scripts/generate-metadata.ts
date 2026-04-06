// scripts/generate-metadata.ts
// Orchestrator — runs the full ingestion pipeline and outputs metadata.json
import 'dotenv/config';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fetchNews } from './fetch-news';
import { rewriteNews } from './rewrite-news';
import { fetchImages } from './fetch-images';
import { generateVoice } from './generate-voice';
import type { SnapNewsMetadata, NewsSegment } from '../src/types';

const FPS = 30;
const TOTAL_DURATION_FRAMES = 1800; // 60 seconds at 30fps
const WIDTH = 1080;
const HEIGHT = 1920;

export async function generateMetadata(
    category: string = 'technology'
): Promise<SnapNewsMetadata> {
    console.log('🚀 SnapNews Pipeline Starting...\n');
    console.log('='.repeat(50));

    // Step 1: Fetch news
    console.log('\n📰 STEP 1: Fetching News...\n');
    const articles = await fetchNews(category);

    // Step 2: Rewrite with LLM
    console.log('\n🤖 STEP 2: Rewriting with AI...\n');
    const rewritten = await rewriteNews(articles);

    // Step 3: Fetch images
    console.log('\n🖼️ STEP 3: Fetching Images...\n');
    const images = await fetchImages(rewritten);

    // Step 4: Generate voice
    console.log('\n🎙️ STEP 4: Generating Voice...\n');
    const voices = await generateVoice(rewritten);

    // Step 5: Assemble metadata
    console.log('\n📋 STEP 5: Assembling Metadata...\n');

    const segments: NewsSegment[] = rewritten.map((seg, i) => ({
        id: i,
        headline: seg.headline,
        script: seg.script,
        category: seg.category,
        keywords: seg.keywords,
        imageUrl: images[i]?.imageUrl || '',
        localImagePath: images[i]?.localImagePath || '',
        audioPath: voices[i]?.audioPath || '',
        durationInFrames: Math.round(
            (seg.durationPercent / 100) * TOTAL_DURATION_FRAMES
        ),
    }));

    // Ensure frames sum exactly to total
    const totalFrames = segments.reduce((s, seg) => s + seg.durationInFrames, 0);
    const frameDiff = TOTAL_DURATION_FRAMES - totalFrames;
    if (frameDiff !== 0) {
        segments[0].durationInFrames += frameDiff;
    }

    // Generate a compelling title from the first headline
    const title = `SNAPNEWS: ${segments[0].headline} | ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

    const metadata: SnapNewsMetadata = {
        title,
        date: new Date().toISOString(),
        totalDurationInFrames: TOTAL_DURATION_FRAMES,
        fps: FPS,
        width: WIDTH,
        height: HEIGHT,
        segments,
    };

    // Write to project root
    const outputPath = join(__dirname, '..', 'metadata.json');
    writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

    console.log('='.repeat(50));
    console.log(`\n✅ Pipeline complete! metadata.json written.`);
    console.log(`   Title: ${metadata.title}`);
    console.log(`   Segments: ${segments.length}`);
    console.log(
        `   Duration: ${TOTAL_DURATION_FRAMES / FPS}s (${TOTAL_DURATION_FRAMES} frames @ ${FPS}fps)`
    );
    console.log(`   Resolution: ${WIDTH}x${HEIGHT} (vertical)`);

    return metadata;
}

// Direct execution
if (require.main === module) {
    const category = process.argv[2] || 'technology';
    generateMetadata(category).catch((err) => {
        console.error('\n❌ Pipeline failed:', err);
        process.exit(1);
    });
}
