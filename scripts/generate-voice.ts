// scripts/generate-voice.ts
// Uses Gemini TTS (gemini-2.5-pro-preview-tts) to generate voice narration
import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { RewrittenSegment } from '../src/types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
const AUDIO_DIR = join(__dirname, '..', 'public', 'audio');

export interface VoiceResult {
    audioPath: string;
}

export async function generateVoice(
    segments: RewrittenSegment[]
): Promise<VoiceResult[]> {
    console.log(`🎙️ Generating voice for ${segments.length} segments with Gemini TTS...`);

    if (!existsSync(AUDIO_DIR)) {
        mkdirSync(AUDIO_DIR, { recursive: true });
    }

    const results: VoiceResult[] = [];

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        console.log(`   ${i + 1}. Generating voice for: "${segment.headline}"...`);

        try {
            const generateText = async () => {
                return await ai.models.generateContentStream({
                    model: 'gemini-2.5-pro-preview-tts',
                    config: {
                        temperature: 1,
                        responseModalities: ['audio' as const],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: 'Zephyr',
                                },
                            },
                        },
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: `Read aloud in a warm, energetic news anchor tone: ${segment.script}`,
                                },
                            ],
                        },
                    ],
                });
            };

            const response = await generateText();

            // Collect all audio chunks
            const audioChunks: Buffer[] = [];

            for await (const chunk of response) {
                if (!chunk.candidates?.[0]?.content?.parts) continue;

                const part = chunk.candidates[0].content.parts[0];
                if (part.inlineData) {
                    const buffer = Buffer.from(part.inlineData.data || '', 'base64');

                    if (part.inlineData.mimeType && !part.inlineData.mimeType.includes('wav')) {
                        // Raw PCM data — will need WAV header
                        audioChunks.push(buffer);
                    } else {
                        audioChunks.push(buffer);
                    }
                }
            }

            if (audioChunks.length === 0) {
                console.warn(`      ⚠️ No audio generated for segment ${i + 1}`);
                results.push({ audioPath: '' });
                continue;
            }

            const combinedAudio = Buffer.concat(audioChunks);
            const fileName = `segment_${i}.wav`;
            const filePath = join(AUDIO_DIR, fileName);

            // Check if we need to add WAV header
            const hasWavHeader =
                combinedAudio.length >= 4 &&
                combinedAudio.toString('ascii', 0, 4) === 'RIFF';

            if (hasWavHeader) {
                writeFileSync(filePath, combinedAudio);
            } else {
                // Add WAV header for raw PCM data (24kHz, 16-bit, mono — Gemini defaults)
                const wavBuffer = addWavHeader(combinedAudio, 24000, 1, 16);
                writeFileSync(filePath, wavBuffer);
            }

            results.push({ audioPath: `public/audio/${fileName}` });
            console.log(`      ✅ Saved: ${fileName} (${(combinedAudio.length / 1024).toFixed(1)} KB)`);

            // Wait 5 seconds between API calls to avoid 429 quota limits on the preview model
            if (i < segments.length - 1) {
                console.log(`      ⏳ Waiting 5s to avoid API rate limits...`);
                await new Promise((resolve) => setTimeout(resolve, 5000));
            }
        } catch (error: any) {
            console.error(`      ❌ Error generating voice for segment ${i + 1} with preview model:`);
            console.error(error);

            console.log(`      🔄 Attempting fallback to gemini-2.5-flash for segment ${i + 1}...`);
            try {
                const fallbackResponse = await ai.models.generateContentStream({
                    model: 'gemini-2.5-flash',
                    config: {
                        temperature: 1,
                        responseModalities: ['audio' as const],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: {
                                    voiceName: 'Zephyr',
                                },
                            },
                        },
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: `Read aloud in a warm, energetic news anchor tone: ${segment.script}`,
                                },
                            ],
                        },
                    ],
                });

                // Collect all audio chunks
                const fallbackAudioChunks: Buffer[] = [];

                for await (const chunk of fallbackResponse) {
                    if (!chunk.candidates?.[0]?.content?.parts) continue;

                    const part = chunk.candidates[0].content.parts[0];
                    if (part.inlineData) {
                        const buffer = Buffer.from(part.inlineData.data || '', 'base64');

                        if (part.inlineData.mimeType && !part.inlineData.mimeType.includes('wav')) {
                            // Raw PCM data — will need WAV header
                            fallbackAudioChunks.push(buffer);
                        } else {
                            fallbackAudioChunks.push(buffer);
                        }
                    }
                }

                if (fallbackAudioChunks.length === 0) {
                    console.warn(`      ⚠️ No audio generated for segment ${i + 1} even with fallback.`);
                    results.push({ audioPath: '' });
                    continue;
                }

                const combinedAudio = Buffer.concat(fallbackAudioChunks);
                const fileName = `segment_${i}.wav`;
                const filePath = join(AUDIO_DIR, fileName);

                // Check if we need to add WAV header
                const hasWavHeader =
                    combinedAudio.length >= 4 &&
                    combinedAudio.toString('ascii', 0, 4) === 'RIFF';

                if (hasWavHeader) {
                    writeFileSync(filePath, combinedAudio);
                } else {
                    // Add WAV header for raw PCM data (24kHz, 16-bit, mono — Gemini defaults)
                    const wavBuffer = addWavHeader(combinedAudio, 24000, 1, 16);
                    writeFileSync(filePath, wavBuffer);
                }

                results.push({ audioPath: `public/audio/${fileName}` });
                console.log(`      ✅ Saved (Fallback): ${fileName} (${(combinedAudio.length / 1024).toFixed(1)} KB)`);

            } catch (fallbackError: any) {
                console.error(`      ❌ Fallback also failed for segment ${i + 1}. Proceeding without audio.`);
                if (fallbackError.status === 429) {
                    console.error(`         Quota Exceeded on both models. Please try again later.`);
                }
                results.push({ audioPath: '' });
            }
        }
    }

    return results;
}

function addWavHeader(
    pcmData: Buffer,
    sampleRate: number,
    numChannels: number,
    bitsPerSample: number
): Buffer {
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const dataLength = pcmData.length;

    const header = Buffer.alloc(44);

    header.write('RIFF', 0); // ChunkID
    header.writeUInt32LE(36 + dataLength, 4); // ChunkSize
    header.write('WAVE', 8); // Format
    header.write('fmt ', 12); // Subchunk1ID
    header.writeUInt32LE(16, 16); // Subchunk1Size (PCM)
    header.writeUInt16LE(1, 20); // AudioFormat (1 = PCM)
    header.writeUInt16LE(numChannels, 22); // NumChannels
    header.writeUInt32LE(sampleRate, 24); // SampleRate
    header.writeUInt32LE(byteRate, 28); // ByteRate
    header.writeUInt16LE(blockAlign, 32); // BlockAlign
    header.writeUInt16LE(bitsPerSample, 34); // BitsPerSample
    header.write('data', 36); // Subchunk2ID
    header.writeUInt32LE(dataLength, 40); // Subchunk2Size

    return Buffer.concat([header, pcmData]);
}

// Allow direct execution for testing
if (require.main === module) {
    const sampleSegments: RewrittenSegment[] = [
        {
            headline: 'AI REVOLUTION',
            script:
                'Breaking news! A revolutionary AI system has just shattered every record in protein structure prediction. Scientists are calling it the biggest breakthrough in biology in decades.',
            category: 'TECH',
            keywords: 'artificial intelligence',
            durationPercent: 50,
        },
        {
            headline: 'SPACE LAUNCH',
            script:
                'SpaceX makes history again! The Falcon Heavy has just carried the largest commercial satellite ever launched into orbit. This changes the game for global communications.',
            category: 'SCIENCE',
            keywords: 'rocket launch',
            durationPercent: 50,
        },
    ];

    generateVoice(sampleSegments)
        .then((results) => {
            console.log('\n📋 Full output:');
            console.log(JSON.stringify(results, null, 2));
        })
        .catch(console.error);
}
