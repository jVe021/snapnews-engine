# SnapNews Automation Engine ⚡

A fully automated vertical video generator that creates fast-paced, 60-second news videos suitable for TikTok, YouTube Shorts, or Instagram Reels.

It uses:
- **NewsAPI** to fetch trending headlines.
- **Google Gemini 2.5 Flash** to rewrite stories into punchy scripts.
- **Pexels API** to search and download portrait-oriented background images.
- **Google Gemini 2.5 Pro TTS** to generate natural voiceovers.
- **Remotion** to compose Ken Burns animations, text reveals, and render the final MP4.
- **Express** to provide a local dashboard for reviewing and editing the AI's work before rendering.

---

## 🚀 How to Run SnapNews

### Step 1: Start the Approval Dashboard
The dashboard is your control center. Open a terminal and run:
```bash
npm run dashboard
```
Then, open your browser and navigate to **http://localhost:3456**.

### Step 2: Generate Content
In the dashboard:
1. Select a news category (e.g., Technology, Business).
2. Click **🚀 Generate Content**.
   *(This triggers the AI pipeline: fetching news → rewriting scripts → downloading images → generating voiceovers. It takes about 20-30 seconds).*
3. Watch the status indicator in the top right. Once it turns green ("Done"), the segments will appear on your screen.

### Step 3: Review and Edit
The AI isn't perfect, so you can edit the results!
- Tweak the **Headlines** or **Scripts** directly in the text boxes.
- Adjust the **Duration Slider** if you want one segment to be longer than another.
- Click **Play Preview timeline** to see how the 60 seconds are divided.

### Step 4: Approve and Render
Once you are happy with the text and pacing:
1. Click **🎬 Approve & Render** in the dashboard.
2. The server will run Remotion in the background to build your video.
3. When finished, you will find your new video in the `out/` folder (e.g., `out/snapnews_2026-04-01.mp4`).

---

## 🎨 Previewing the Visuals (Remotion Studio)

If you want to tweak the animations, colors, or fonts, you can use Remotion Studio:
```bash
npm run dev
```
Open **http://localhost:3000**. You'll see `SnapNewsComposition`. Any CSS or React changes you make in `src/SnapNews/` will update live here.

*(Note: The Studio uses dummy data from `src/Root.tsx` by default, not your live fetched news. To see live news, generate it from the dashboard first, then Remotion will pick up `metadata.json` during the final render).*

---

## 📁 Project Structure

| Directory/File | Purpose |
|---|---|
| `scripts/` | The Node.js ingestion pipeline (`fetch-news`, `rewrite-news`, `generate-voice`, etc.) |
| `src/SnapNews/` | React components for the video visually (Ken Burns, Headlines, Transitions) |
| `dashboard/` | Code for the local web UI (`server.ts`, `index.html`) |
| `public/` | Downloaded images and audio files |
| `out/` | Your rendered MP4 videos |
| `metadata.json` | The link between the Node pipeline and the React video—contains all text, timings, and file paths. |

## 🔑 Environment Variables
Make sure your `.env` file at the root contains:
```env
NEWS_API_KEY=your_key
PEXELS_API_KEY=your_key
GEMINI_API_KEY=your_key
```
