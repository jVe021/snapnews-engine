// scripts/render.ts
// Renders the SnapNews video using Remotion CLI
import 'dotenv/config';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(__dirname, '..');

export function renderVideo(outputName?: string): string {
    const metadataPath = join(PROJECT_ROOT, 'metadata.json');

    if (!existsSync(metadataPath)) {
        throw new Error(
            'metadata.json not found! Run the pipeline first: npx tsx scripts/generate-metadata.ts'
        );
    }

    const date = new Date().toISOString().split('T')[0];
    const fileName = outputName || `snapnews_${date}.mp4`;
    const outputPath = join(PROJECT_ROOT, 'out', fileName);

    console.log('🎬 Starting Remotion render...');
    console.log(`   Composition: SnapNewsComposition`);
    console.log(`   Props: metadata.json`);
    console.log(`   Output: out/${fileName}`);
    console.log('');

    const cmd = `npx remotion render src/index.ts SnapNewsComposition "${outputPath}" --props="${metadataPath}"`;

    try {
        execSync(cmd, {
            cwd: PROJECT_ROOT,
            stdio: 'inherit',
            timeout: 600000, // 10 minute timeout
        });

        console.log(`\n✅ Video rendered successfully: out/${fileName}`);
        return outputPath;
    } catch (error) {
        console.error('\n❌ Render failed:', error);
        throw error;
    }
}

// Direct execution
if (require.main === module) {
    const outputName = process.argv[2];
    renderVideo(outputName);
}
