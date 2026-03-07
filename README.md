# Telemetry Analytics Dashboard

**Live tool:** https://lila-map-viz.vercel.app

A browser-based telemetry analytics dashboard for visualizing player behavior in LILA BLACK — an extraction shooter by LILA Games.

Built for Level Designers to explore 5 days of production gameplay data across 3 maps: player journeys, kill zones, loot patterns, and storm deaths.

## Features

- **Player journey visualization** — animate any match's player paths on the minimap
- **Human vs bot distinction** — solid blue trails for humans, dashed orange for bots
- **Event markers** — kills, deaths, bot kills, loot pickups, and storm deaths
- **Heatmap overlays** — Kill Zones, Death Zones, or Traffic density
- **Timeline playback** — scrub through a match or watch it unfold in real time (1x–20x speed)
- **Filters** — by map, date, and match

## Project Structure

```
src/
  views/
    DashboardView.tsx             ← Root layout: orchestrates state and data loading
  components/
    charts/
      PlayerMovementMap.tsx       ← Canvas renderer: minimap + trails + heatmap + markers
    MatchFilterPanel.tsx          ← Left sidebar: map / date / match selectors
    MatchPlaybackTimeline.tsx     ← Bottom bar: scrubber, play/pause, speed control
    HeatmapOverlayControls.tsx   ← Right sidebar: heatmap mode + event type toggles
    MapLegend.tsx                 ← Right sidebar: trail and event color reference
  hooks/
    useTelemetryData.ts           ← Fetches and caches match index + per-map JSON
    useMatchPlaybackController.ts ← requestAnimationFrame-based playback state
  types/
    index.ts                      ← Shared TypeScript types
  constants/
    index.ts                      ← Map configs, colors, event metadata
```

## Local Development

```bash
npm install
npm run dev
```

## Data Pipeline

The pipeline reads raw `.nakama-0` parquet files from the `player_data/` directory and outputs pre-processed JSON assets under `public/data/`:

```bash
cd pipeline
pip install -r requirements.txt
python process.py
```

Re-run whenever new parquet data is available.

## Tech Stack

React + TypeScript + Vite · HTML5 Canvas · Vercel

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full design decisions and trade-offs.
