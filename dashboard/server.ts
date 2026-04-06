// dashboard/server.ts
// Simple Express server for the approval dashboard
import 'dotenv/config';
import express from 'express';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { exec } from 'child_process';

const app = express();
const PORT = 3456;
const PROJECT_ROOT = join(__dirname, '..');
const METADATA_PATH = join(PROJECT_ROOT, 'metadata.json');

app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// Serve downloaded images
app.use('/images', express.static(join(PROJECT_ROOT, 'public', 'images')));
app.use('/audio', express.static(join(PROJECT_ROOT, 'public', 'audio')));

// Pipeline status tracking
let pipelineStatus = {
    stage: 'idle', // idle | generating | rendering | done | error
    message: '',
    lastUpdated: new Date().toISOString(),
};

// GET /api/metadata — return current metadata
app.get('/api/metadata', (_req, res) => {
    if (!existsSync(METADATA_PATH)) {
        return res.json({ exists: false, data: null });
    }
    try {
        const data = JSON.parse(readFileSync(METADATA_PATH, 'utf8'));
        return res.json({ exists: true, data });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to read metadata.json' });
    }
});

// POST /api/metadata — save edited metadata
app.post('/api/metadata', (req, res) => {
    try {
        writeFileSync(METADATA_PATH, JSON.stringify(req.body, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save metadata.json' });
    }
});

// POST /api/generate — trigger the ingestion pipeline
app.post('/api/generate', (req, res) => {
    const category = req.body?.category || 'technology';
    pipelineStatus = {
        stage: 'generating',
        message: `Generating content for category: ${category}...`,
        lastUpdated: new Date().toISOString(),
    };

    res.json({ success: true, message: 'Pipeline started' });

    // Run pipeline in background
    exec(`npx tsx scripts/generate-metadata.ts ${category}`, {
        cwd: PROJECT_ROOT,
    }, (error, stdout, stderr) => {
        if (error) {
            pipelineStatus = {
                stage: 'error',
                message: `Generation failed: ${error.message}`,
                lastUpdated: new Date().toISOString(),
            };
            console.error('Pipeline error:', stderr);
        } else {
            pipelineStatus = {
                stage: 'done',
                message: 'Content generated successfully!',
                lastUpdated: new Date().toISOString(),
            };
            console.log(stdout);
        }
    });
});

// POST /api/render — trigger Remotion render
app.post('/api/render', (_req, res) => {
    if (!existsSync(METADATA_PATH)) {
        return res.status(400).json({ error: 'No metadata.json found. Generate content first.' });
    }

    pipelineStatus = {
        stage: 'rendering',
        message: 'Rendering video with Remotion...',
        lastUpdated: new Date().toISOString(),
    };

    res.json({ success: true, message: 'Render started' });

    exec(`npx tsx scripts/render.ts`, {
        cwd: PROJECT_ROOT,
        timeout: 600000,
    }, (error, stdout, stderr) => {
        if (error) {
            pipelineStatus = {
                stage: 'error',
                message: `Render failed: ${error.message}`,
                lastUpdated: new Date().toISOString(),
            };
            console.error('Render error:', stderr);
        } else {
            pipelineStatus = {
                stage: 'done',
                message: 'Video rendered successfully!',
                lastUpdated: new Date().toISOString(),
            };
            console.log(stdout);
        }
    });
});

// GET /api/status — return pipeline status
app.get('/api/status', (_req, res) => {
    res.json(pipelineStatus);
});

app.listen(PORT, () => {
    console.log(`\n🎛️  SnapNews Dashboard running at http://localhost:${PORT}\n`);
});
