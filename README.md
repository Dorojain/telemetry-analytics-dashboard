# LILA Map Viz

A web-based player behavior visualization tool for LILA BLACK — an extraction shooter by LILA Games.

Built for Level Designers to explore 5 days of production gameplay data across 3 maps: player journeys, kill zones, loot patterns, and storm deaths.

## Features

- **Player journey visualization** — animate any match's player paths on the minimap
- **Human vs bot distinction** — solid blue trails for humans, dashed orange for bots
- **Event markers** — kills, deaths, bot kills, loot pickups, and storm deaths
- **Heatmap overlays** — Kill Zones, Death Zones, or Traffic density
- **Timeline playback** — scrub through a match or watch it unfold in real time (1x–20x speed)
- **Filters** — by map, date, and match

## Local Development

```bash
npm install
npm run dev
```

## Data Pipeline

The pipeline reads raw `.nakama-0` parquet files from the `player_data/` directory and outputs JSON assets:

```bash
cd pipeline
pip install -r requirements.txt
python process.py
```

## Tech Stack

React + TypeScript + Vite · HTML5 Canvas · Vercel

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full design decisions and trade-offs.
