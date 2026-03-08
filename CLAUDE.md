# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend dev server
npm run dev

# Type-check + production build (run before committing)
npm run build

# Preview production build locally
npm run preview

# Data pipeline — regenerate public/data/ JSON assets from parquet source files
python3 pipeline/process.py

# Install pipeline dependencies (first time only)
pip install -r pipeline/requirements.txt
```

There are no tests or linters configured. `npm run build` (which runs `tsc -b && vite build`) is the only correctness gate — it must pass before pushing.

## Git / GitHub

- Remote is HTTPS (not SSH): `https://github.com/Dorojain/telemetry-analytics-dashboard.git`
- The gh CLI is authenticated as `Dorojain`; the SSH key belongs to `sameehajain` — always push via HTTPS
- Vercel auto-deploys from `main`; to force a redeploy run `vercel --prod` from the project root

## Architecture

The tool is entirely static: no backend, no API. A Python pipeline runs once offline, transforming raw parquet files into JSON that the React app fetches directly from Vercel's CDN.

```
player_data/*.nakama-0   (source parquet, NOT in this repo)
        │
        ▼  pipeline/process.py
        │
public/data/
  index.json             match metadata for all maps
  ambrose_valley.json    full event data for AmbroseValley (~3.7 MB)
  grand_rift.json        full event data for GrandRift
  lockdown.json          full event data for Lockdown
        │
        ▼  fetch() in useTelemetryData.ts (lazy, cached per map)
        │
src/views/DashboardView.tsx    root: owns all filter + playback state
  ├── MatchFilterPanel          left sidebar: map / date / match selectors
  ├── PlayerMovementMap         center: HTML5 Canvas rendering engine
  │     └── renderHeatmapOverlay()  offscreen canvas, pixel-level colorization
  ├── MatchPlaybackTimeline     bottom: scrubber + play/pause + speed
  ├── HeatmapOverlayControls   right sidebar: heatmap mode + event toggles
  └── MapLegend
```

### Coordinate system

Raw data uses 3D world coordinates (`x`, `y`, `z`). The pipeline converts `x`/`z` to minimap pixel space (0–1024) at processing time — the browser never sees raw world coords. `y` (elevation) is discarded. The formula per map:

```
px = (x - originX) / scale * 1024
py = (1 - (z - originZ) / scale) * 1024   ← Y is flipped
```

Map `scale`/`originX`/`originZ` values live in both `pipeline/process.py` (`MAP_CONFIG` dict) and `src/constants/index.ts` (`MAP_CONFIG` object). **Keep these in sync if they ever change.**

### Player identity

- UUID `userId` → human player (`isBot: false`), rendered as solid blue trail
- Numeric `userId` (e.g. `"1440"`) → bot (`isBot: true`), rendered as dashed orange trail

### Data flow in the browser

1. `useMatchIndex()` fetches `index.json` once on load (cached module-level)
2. `useMapTelemetryData(mapId)` fetches the per-map JSON on map selection (cached, aborts on map change)
3. `DashboardView` resolves `matchData[selectedMatchId].players` → passes `matchPlayers[]` to `PlayerMovementMap`
4. `useMatchPlaybackController(matchDurationMs)` drives `playbackPositionMs` via `requestAnimationFrame`
5. `PlayerMovementMap.renderFrame()` filters each player's events to `eventTimestampMs ≤ playbackPositionMs` and draws trails + markers on a single `<canvas>`

### Canvas rendering order (within one frame)

1. `drawImage(minimapImage)` — background
2. `renderHeatmapOverlay()` — optional, uses offscreen canvas + pixel manipulation for heat coloring
3. Per-player movement polylines (solid for humans, dashed for bots)
4. Current-position dot for each player
5. Discrete event markers (Kill, Killed, BotKill, BotKilled, KilledByStorm, Loot)

### Adding a new map

1. Add minimap image to `public/minimaps/`
2. Add entry to `MAP_CONFIG` in both `pipeline/process.py` and `src/constants/index.ts`
3. Add the `MapId` string literal to the union type in `src/types/index.ts`
4. Re-run `python3 pipeline/process.py`
