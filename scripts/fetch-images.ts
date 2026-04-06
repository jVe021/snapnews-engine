// scripts/fetch-images.ts
// Uses Pexels API to find and download images for each news segment
import 'dotenv/config';
import { createClient, type PhotosWithTotalResults, type Photo } from 'pexels';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { RewrittenSegment } from '../src/types';

const client = createClient(process.env.PEXELS_API_KEY!);
const IMAGES_DIR = join(__dirname, '..', 'public', 'images');

export interface ImageResult {
    imageUrl: string;
    localImagePath: string;
}

export async function fetchImages(
    segments: RewrittenSegment[]
): Promise<ImageResult[]> {
    console.log(`🖼️ Fetching images for ${segments.length} segments from Pexels...`);

    // Ensure images directory exists
    if (!existsSync(IMAGES_DIR)) {
        mkdirSync(IMAGES_DIR, { recursive: true });
    }

    const results: ImageResult[] = [];

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const query = segment.keywords || segment.headline;

        console.log(`   ${i + 1}. Searching: "${query}"...`);

        try {
            const searchResult = (await client.photos.search({
                query,
                per_page: 5,
                orientation: 'portrait', // Vertical for 1080x1920
            })) as PhotosWithTotalResults;

            let photo: Photo | undefined;

            if (searchResult.photos && searchResult.photos.length > 0) {
                // Pick the best photo — prefer large portrait images
                photo = searchResult.photos[0];
            }

            if (photo) {
                // Use the portrait size (fits 1080x1920 well)
                const imageUrl = photo.src.portrait || photo.src.large || photo.src.original;
                const localPath = join(IMAGES_DIR, `segment_${i}.jpg`);

                // Download the image
                console.log(`      Downloading: ${imageUrl.substring(0, 60)}...`);
                const imageResponse = await fetch(imageUrl);
                const buffer = Buffer.from(await imageResponse.arrayBuffer());
                writeFileSync(localPath, buffer);

                results.push({
                    imageUrl: imageUrl,
                    localImagePath: `public/images/segment_${i}.jpg`,
                });

                console.log(`      ✅ Saved: segment_${i}.jpg`);
            } else {
                console.warn(`      ⚠️ No photos found for "${query}", using fallback`);
                results.push(await fetchFallbackImage(i));
            }
        } catch (error) {
            console.error(`      ❌ Error fetching image for "${query}":`, error);
            results.push(await fetchFallbackImage(i));
        }
    }

    return results;
}

async function fetchFallbackImage(index: number): Promise<ImageResult> {
    try {
        const fallback = (await client.photos.search({
            query: 'breaking news',
            per_page: 1,
            orientation: 'portrait',
        })) as PhotosWithTotalResults;

        if (fallback.photos && fallback.photos.length > 0) {
            const photo = fallback.photos[0];
            const imageUrl = photo.src.portrait || photo.src.large;
            const localPath = join(IMAGES_DIR, `segment_${index}.jpg`);

            const imageResponse = await fetch(imageUrl);
            const buffer = Buffer.from(await imageResponse.arrayBuffer());
            writeFileSync(localPath, buffer);

            return {
                imageUrl,
                localImagePath: `public/images/segment_${index}.jpg`,
            };
        }
    } catch {
        // Ignore fallback errors
    }

    return {
        imageUrl: '',
        localImagePath: '',
    };
}

// Allow direct execution for testing
if (require.main === module) {
    const sampleSegments: RewrittenSegment[] = [
        {
            headline: 'AI REVOLUTION',
            script: 'Test script',
            category: 'TECH',
            keywords: 'artificial intelligence technology',
            durationPercent: 40,
        },
        {
            headline: 'SPACE LAUNCH',
            script: 'Test script',
            category: 'SCIENCE',
            keywords: 'rocket space launch',
            durationPercent: 30,
        },
        {
            headline: 'CHIP SHORTAGE ENDS',
            script: 'Test script',
            category: 'TECH',
            keywords: 'semiconductor microchip',
            durationPercent: 30,
        },
    ];

    fetchImages(sampleSegments)
        .then((results) => {
            console.log('\n📋 Full output:');
            console.log(JSON.stringify(results, null, 2));
        })
        .catch(console.error);
}
