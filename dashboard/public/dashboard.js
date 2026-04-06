// SnapNews Dashboard — Client-side JavaScript
let currentMetadata = null;
let statusPollInterval = null;

// ------ API calls ------
async function api(path, method = 'GET', body = null) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    return res.json();
}

// ------ Load metadata ------
async function loadMetadata() {
    const result = await api('/metadata');
    if (result.exists && result.data) {
        currentMetadata = result.data;
        renderSegments(currentMetadata);
        document.getElementById('btn-render').disabled = false;
    }
}

// ------ Generate content ------
async function generateContent() {
    const category = document.getElementById('category-select').value;
    const btn = document.getElementById('btn-generate');
    btn.disabled = true;
    btn.textContent = '⏳ Generating...';

    await api('/generate', 'POST', { category });
    startStatusPolling();
}

// ------ Render video ------
async function renderVideo() {
    // Save any edits first
    if (currentMetadata) {
        await saveEdits();
    }

    const btn = document.getElementById('btn-render');
    btn.disabled = true;
    btn.textContent = '⏳ Rendering...';

    await api('/render', 'POST');
    startStatusPolling();
}

// ------ Status polling ------
function startStatusPolling() {
    if (statusPollInterval) clearInterval(statusPollInterval);

    statusPollInterval = setInterval(async () => {
        const status = await api('/status');
        updateStatusBadge(status.stage, status.message);

        if (status.stage === 'done') {
            clearInterval(statusPollInterval);
            statusPollInterval = null;

            // Reload metadata
            await loadMetadata();

            // Reset buttons
            document.getElementById('btn-generate').disabled = false;
            document.getElementById('btn-generate').textContent = '🚀 Generate Content';
            document.getElementById('btn-render').disabled = false;
            document.getElementById('btn-render').textContent = '🎬 Approve & Render';
        } else if (status.stage === 'error') {
            clearInterval(statusPollInterval);
            statusPollInterval = null;

            document.getElementById('btn-generate').disabled = false;
            document.getElementById('btn-generate').textContent = '🚀 Generate Content';
            document.getElementById('btn-render').disabled = false;
            document.getElementById('btn-render').textContent = '🎬 Approve & Render';

            alert('Pipeline error: ' + status.message);
        }
    }, 2000);
}

function updateStatusBadge(stage, message) {
    const badge = document.getElementById('status-badge');
    const text = document.getElementById('status-text');

    badge.className = `status-badge ${stage}`;
    text.textContent = message || stage.charAt(0).toUpperCase() + stage.slice(1);
}

// ------ Render segments UI ------
function renderSegments(metadata) {
    const container = document.getElementById('segments-container');
    const titleSection = document.getElementById('title-section');
    const timelineSection = document.getElementById('timeline-section');

    // Show title
    titleSection.style.display = 'block';
    document.getElementById('video-title').value = metadata.title;

    // Render segment cards
    container.innerHTML = metadata.segments.map((seg, i) => `
    <div class="segment-card" data-index="${i}">
      <div class="segment-image">
        ${seg.localImagePath
            ? `<img src="/images/segment_${i}.jpg" alt="${seg.headline}" onerror="this.src='${seg.imageUrl}'" />`
            : seg.imageUrl
                ? `<img src="${seg.imageUrl}" alt="${seg.headline}" />`
                : '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#666;">No Image</div>'
        }
      </div>
      <div class="segment-content">
        <div class="segment-header">
          <span class="segment-number">Segment ${i + 1}</span>
          <span class="category-badge cat-${seg.category.toLowerCase()}">${seg.category}</span>
        </div>
        <input
          type="text"
          value="${escapeHtml(seg.headline)}"
          data-field="headline"
          data-index="${i}"
          onchange="onFieldEdit(this)"
        />
        <textarea
          data-field="script"
          data-index="${i}"
          onchange="onFieldEdit(this)"
        >${escapeHtml(seg.script)}</textarea>
        <div class="duration-row">
          <span>Duration:</span>
          <input
            type="range"
            min="300"
            max="1200"
            value="${seg.durationInFrames}"
            data-field="durationInFrames"
            data-index="${i}"
            oninput="onDurationChange(this)"
          />
          <span class="duration-value">${(seg.durationInFrames / 30).toFixed(1)}s</span>
        </div>
        ${seg.audioPath ? `<div style="font-size:12px;color:#888;">🎙️ Audio: ${seg.audioPath}</div>` : ''}
      </div>
    </div>
  `).join('');

    // Render timeline
    timelineSection.style.display = 'block';
    const timeline = document.getElementById('timeline');
    timeline.innerHTML = metadata.segments.map((seg, i) => {
        const percent = (seg.durationInFrames / metadata.totalDurationInFrames) * 100;
        return `<div class="timeline-segment cat-${seg.category.toLowerCase()}" style="flex:${percent}">${seg.headline.substring(0, 12)}…</div>`;
    }).join('');
}

// ------ Editing ------
function onFieldEdit(el) {
    const index = parseInt(el.dataset.index);
    const field = el.dataset.field;
    currentMetadata.segments[index][field] = el.value;
}

function onDurationChange(el) {
    const index = parseInt(el.dataset.index);
    const newDuration = parseInt(el.value);

    currentMetadata.segments[index].durationInFrames = newDuration;

    // Update display
    el.parentElement.querySelector('.duration-value').textContent = (newDuration / 30).toFixed(1) + 's';

    // Update timeline
    renderTimeline();
}

function renderTimeline() {
    const timeline = document.getElementById('timeline');
    const total = currentMetadata.segments.reduce((s, seg) => s + seg.durationInFrames, 0);
    timeline.innerHTML = currentMetadata.segments.map((seg) => {
        const percent = (seg.durationInFrames / total) * 100;
        return `<div class="timeline-segment cat-${seg.category.toLowerCase()}" style="flex:${percent}">${seg.headline.substring(0, 12)}…</div>`;
    }).join('');
}

async function saveEdits() {
    currentMetadata.title = document.getElementById('video-title').value;
    await api('/metadata', 'POST', currentMetadata);
}

// ------ Helpers ------
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ------ Init ------
loadMetadata();
