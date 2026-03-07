# Architecture — Telemetry Analytics Dashboard

## Overview

A fully static web application for visualizing LILA BLACK gameplay telemetry. No backend server. Raw parquet data is pre-processed offline into JSON assets that the React frontend fetches directly from Vercel's CDN.

**Repository:** `telemetry-analytics-dashboard`

---

## Tech Stack Choices

### React + TypeScript + Vite

**Why React?** Level Designers need a polished, interactive tool — not a data science notebook. React's component model makes it straightforward to build a sidebar-driven UI with real-time canvas updates without a tangled DOM manipulation mess.

**Why TypeScript?** The data schema is well-defined (8 columns, 8 event types, 3 maps). TypeScript catches shape mismatches early — critical when rendering pipeline output directly onto a canvas.

**Why Vite?** Fast HMR for development iteration and a small production bundle (52 KB gzipped for the entire app, including React).

**Why not Streamlit/Plotly Dash?** These are excellent for exploratory data analysis but feel distinctly "data scientist" in UX. Level Designers need quick spatial reasoning — smooth animation, intuitive controls, a game-like aesthetic. Building that in Streamlit would fight the framework the entire way.

### Source Structure

```
src/
  views/          Root-level page views (DashboardView.tsx)
  components/
    charts/       Canvas-based data visualizations (PlayerMovementMap.tsx)
    *.tsx         UI control components (filters, timeline, legend)
  hooks/          React hooks for data fetching and playback logic
  types/          Shared TypeScript type definitions
  constants/      Map configuration, color palettes, event metadata
```

### HTML5 Canvas for rendering

**Why Canvas over SVG?** A match can have 50 players, hundreds of trail points, and thousands of heatmap gradient blends. SVG would create tens of thousands of DOM nodes, causing major layout reflows. A single `<canvas>` element renders everything in one composite pass — smooth even at 60fps on a 10-year-old laptop.

**Why not WebGL (e.g., deck.gl)?** WebGL would be faster, but the data volume (≤800 matches × ~50 players) doesn't require GPU acceleration. Canvas keeps the implementation readable and dependency-free.

### Python pipeline (offline preprocessing)

**Why preprocess instead of serving parquet directly?**

| | Pre-processed JSON | Live parquet API |
|---|---|---|
| Hosting cost | $0 (static) | Needs a server |
| Load time | CDN-cached | Cold-start latency |
| Coordinate transform | Done once at build time | Repeated per request |
| Maintainability | Simple Python script | Server + API layer |

The pipeline runs once and outputs ~4 MB of JSON (across 3 files). Vercel gzip-compresses these to ~1 MB in transit. A full map load takes under 2 seconds on a typical connection.

**Why pyarrow + pandas?** pyarrow reads the `.nakama-0` parquet files (no extension) reliably without configuration. pandas simplifies the timestamp arithmetic and per-row iteration. For 89K rows, this takes ~3 seconds — fast enough to re-run whenever new data arrives.

### Vercel for hosting

Free tier, zero-config for static sites, automatic HTTPS, GitHub integration for auto-deploys, global CDN. No other option delivers all of that without a credit card.

---

## Data Flow

```
player_data/
  February_10/   ← 437 × .nakama-0 parquet files
  February_11/
  February_12/
  February_13/
  February_14/
         │
         ▼  pipeline/process.py
         │  - pyarrow reads each file (~89K events total)
         │  - Decodes event bytes → UTF-8 strings
         │  - UUID regex check → is_bot flag
         │  - World coords (x,z) → pixel coords (px, py) using:
         │      u = (x - origin_x) / scale
         │      v = (z - origin_z) / scale
         │      px = u × 1024
         │      py = (1 - v) × 1024   [Y-flipped for image origin]
         │  - Groups: map_id → match_id → user_id → [events]
         │  - Computes match metadata (player counts, duration)
         ▼
public/data/
  index.json           (796 matches × metadata) ~50 KB
  ambrose_valley.json  (566 matches × events)   ~2.8 MB
  grand_rift.json      (59 matches × events)    ~320 KB
  lockdown.json        (171 matches × events)   ~1 MB
         │
         ▼  Vercel CDN (gzip ~60% compression)
         │
  Browser fetch on map selection
         │
         ▼  React App
  useIndex()     → loads index.json once, cached in memory
  useMapData()   → loads {map}.json on map switch, cached in memory
         │
  FilterPanel    → user selects map / date / match
         │
  App.tsx        → resolves players[] for selected match_id
         │
  usePlayback()  → requestAnimationFrame loop, emits currentMs
         │
  MapCanvas      → draws to <canvas> on every frame:
    1. drawImage(minimapImg)       — background
    2. drawHeatmap() (if enabled)  — offscreen canvas, pixel-level color mapping
    3. per-player trails           — filtered to events.ts ≤ currentMs
    4. event markers               — Kill/Death/Loot/Storm at exact positions
```

---

## Trade-offs Made

### JSON files are committed to the repo

The `public/data/` JSON files are checked in rather than generated at Vercel build time. This avoids needing Python in the Vercel build environment and makes the deploy reproducible.

**Trade-off:** The repo grows by ~4 MB per pipeline run. With more data over time, this becomes impractical.

**Better approach with more time:** Run the pipeline as a Vercel serverless function or a separate GitHub Actions job that uploads JSON to S3/R2 and serves it via CDN separately from the app.

### Pixel coordinates pre-computed in the pipeline

The coordinate transform happens in Python, not JavaScript. The browser receives `(px, py)` already in 0–1024 space.

**Trade-off:** If the minimap images are ever rescaled or the coordinate system changes, the pipeline must re-run. The browser can't dynamically adjust to a different scale.

**Better approach:** Store raw `(x, z)` world coordinates and let the browser apply the transform. This adds ~20% more JSON data but makes the coordinate system runtime-configurable.

### Canvas re-renders the entire frame on each animation tick

Every `requestAnimationFrame` clears and redraws the entire canvas — background, heatmap, all trails, all markers.

**Trade-off:** For large matches (50 players, 30-minute duration), this can cause dropped frames on slow machines.

**Better approach:** Separate the static heatmap layer (which changes only when mode or time changes significantly) from the dynamic "current position dot" layer, using two stacked canvases. The heatmap canvas is only redrawn when needed; the top canvas renders only current positions.

### Single match selected at a time

The filter UI selects one match to view. The heatmap, however, accumulates data from all events up to `currentMs` in that match.

**Trade-off:** Level Designers can't compare two matches side-by-side or aggregate heatmaps across all matches on a map.

**Better approach with more time:** A separate "Aggregate View" mode that loads all matches for a map, ignores the timeline, and renders a population-level heatmap. This would immediately show the macro-level picture ("where does everyone die?") without requiring match-by-match browsing.

---

## What I Would Do Differently With More Time

### 1. Aggregate heatmaps across all matches
The single most valuable view for a Level Designer isn't one match — it's "where do kills cluster across all 796 matches?" A multi-match heatmap would surface design problems (or successes) in seconds.

### 2. Separate static vs. live canvas layers
Two stacked canvases: one for the heatmap (re-drawn only on mode change), one for animated trails. This would eliminate unnecessary full redraws and support smoother animation at larger scales.

### 3. Player-level filtering and labeling
Add the ability to click a player's trail and highlight/isolate that player's journey. A tooltip on hover showing player ID, kills, deaths, and loot count would let Designers dig into individual behavior.

### 4. Storm zone visualization
LILA BLACK has a storm that pushes across the map. If the data ever includes storm boundary coordinates, overlaying the storm circle/zone at each timestamp would provide crucial context for why players move the way they do.

### 5. Event density timeline chart
A small bar chart below the timeline showing the density of kills/deaths per 10-second interval would let Designers instantly identify "hot moments" in a match without needing to scrub manually.

### 6. Streaming data support
Right now the tool only shows historical data. With a WebSocket connection to a live match feed, Designers could watch live matches in real time — extremely valuable for playtesting sessions.

### 7. Per-map image optimization
The minimap images total 23 MB uncompressed. Converting them to WebP and resizing to 512×512 (sufficient for a browser viewport) would reduce load times by 3–4× with no perceptible quality loss.
