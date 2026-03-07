#!/usr/bin/env python3
"""
LILA Map Viz — Data Pipeline
Reads all .nakama-0 parquet files from player_data/ and outputs JSON assets
to public/data/ for the React frontend.

Output files:
  public/data/index.json         — match metadata list
  public/data/ambrose_valley.json — full event data for AmbroseValley
  public/data/grand_rift.json    — full event data for GrandRift
  public/data/lockdown.json      — full event data for Lockdown
"""

import os
import re
import json
import pyarrow.parquet as pq
import pandas as pd
from pathlib import Path
from collections import defaultdict

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
DATA_DIR = Path("/Users/sameehajain/Documents/player_data")
OUTPUT_DIR = PROJECT_ROOT / "public" / "data"

DATE_DIRS = [
    "February_10",
    "February_11",
    "February_12",
    "February_13",
    "February_14",
]

DATE_LABELS = {
    "February_10": "2026-02-10",
    "February_11": "2026-02-11",
    "February_12": "2026-02-12",
    "February_13": "2026-02-13",
    "February_14": "2026-02-14",
}

# ── Map configuration (from README) ───────────────────────────────────────────
MAP_CONFIG = {
    "AmbroseValley": {"scale": 900, "origin_x": -370, "origin_z": -473},
    "GrandRift":     {"scale": 581, "origin_x": -290, "origin_z": -290},
    "Lockdown":      {"scale": 1000, "origin_x": -500, "origin_z": -500},
}

MAP_FILE_KEYS = {
    "AmbroseValley": "ambrose_valley",
    "GrandRift":     "grand_rift",
    "Lockdown":      "lockdown",
}

UUID_PATTERN = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE,
)

def is_human(user_id: str) -> bool:
    return bool(UUID_PATTERN.match(str(user_id)))

def world_to_pixel(x: float, z: float, map_id: str) -> tuple[int, int]:
    cfg = MAP_CONFIG[map_id]
    u = (x - cfg["origin_x"]) / cfg["scale"]
    v = (z - cfg["origin_z"]) / cfg["scale"]
    px = round(u * 1024)
    py = round((1 - v) * 1024)
    return px, py

def decode_event(val) -> str:
    if isinstance(val, bytes):
        return val.decode("utf-8")
    return str(val)

def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Storage: map_id → { match_id → { user_id → [events] } }
    map_data: dict[str, dict[str, dict[str, list]]] = {m: {} for m in MAP_CONFIG}
    # Metadata: match_id → info dict
    match_meta: dict[str, dict] = {}

    total_files = 0
    total_events = 0
    errors = 0

    print("Reading parquet files...")
    for date_dir in DATE_DIRS:
        dir_path = DATA_DIR / date_dir
        if not dir_path.exists():
            print(f"  Skipping missing dir: {date_dir}")
            continue

        date_label = DATE_LABELS[date_dir]
        files = list(dir_path.iterdir())
        print(f"  {date_dir}: {len(files)} files")

        for filepath in files:
            try:
                table = pq.read_table(str(filepath))
                df = table.to_pandas()
            except Exception as e:
                errors += 1
                continue

            if df.empty:
                continue

            # Decode event bytes
            df["event"] = df["event"].apply(decode_event)

            # Normalize map_id (take first value — all rows same match/map)
            map_id = str(df["map_id"].iloc[0])
            if map_id not in MAP_CONFIG:
                continue

            match_id = str(df["match_id"].iloc[0])
            # Strip .nakama-0 suffix from match_id if present
            match_id_clean = match_id.replace(".nakama-0", "")
            user_id = str(df["user_id"].iloc[0])
            human = is_human(user_id)

            # Convert timestamp to ms integer (match-relative)
            if pd.api.types.is_datetime64_any_dtype(df["ts"]):
                df["ts_ms"] = (df["ts"] - df["ts"].min()).dt.total_seconds() * 1000
            else:
                ts_numeric = pd.to_numeric(df["ts"], errors="coerce")
                df["ts_ms"] = ts_numeric - ts_numeric.min()
            df["ts_ms"] = df["ts_ms"].fillna(0).astype(int)

            # Build event list with pixel coords
            events = []
            for _, row in df.iterrows():
                try:
                    px, py = world_to_pixel(float(row["x"]), float(row["z"]), map_id)
                    events.append({
                        "ts": int(row["ts_ms"]),
                        "px": px,
                        "py": py,
                        "type": row["event"],
                    })
                except Exception:
                    continue

            if not events:
                continue

            # Store in map data
            if match_id_clean not in map_data[map_id]:
                map_data[map_id][match_id_clean] = {}

            map_data[map_id][match_id_clean][user_id] = {
                "user_id": user_id,
                "is_bot": not human,
                "events": events,
            }

            # Update match metadata
            if match_id_clean not in match_meta:
                match_meta[match_id_clean] = {
                    "match_id": match_id_clean,
                    "map_id": map_id,
                    "date": date_label,
                    "human_count": 0,
                    "bot_count": 0,
                    "duration_ms": 0,
                }
            meta = match_meta[match_id_clean]
            if human:
                meta["human_count"] += 1
            else:
                meta["bot_count"] += 1
            duration = max(e["ts"] for e in events)
            if duration > meta["duration_ms"]:
                meta["duration_ms"] = duration

            total_files += 1
            total_events += len(events)

        # end for filepath

    print(f"\nProcessed {total_files} files, {total_events} events, {errors} errors")

    # ── Write per-map JSON files ───────────────────────────────────────────────
    for map_id, matches in map_data.items():
        # Convert nested dicts to serializable format
        output = {}
        for match_id_clean, players_dict in matches.items():
            output[match_id_clean] = {
                "players": list(players_dict.values())
            }

        file_key = MAP_FILE_KEYS[map_id]
        out_path = OUTPUT_DIR / f"{file_key}.json"
        with open(out_path, "w") as f:
            json.dump(output, f, separators=(",", ":"))  # compact JSON
        size_kb = out_path.stat().st_size / 1024
        print(f"  Wrote {out_path.name}: {len(matches)} matches, {size_kb:.0f} KB")

    # ── Write index.json ──────────────────────────────────────────────────────
    index = {"matches": list(match_meta.values())}
    index_path = OUTPUT_DIR / "index.json"
    with open(index_path, "w") as f:
        json.dump(index, f, indent=2)
    print(f"  Wrote index.json: {len(match_meta)} matches")

    print("\nDone! JSON assets written to public/data/")

if __name__ == "__main__":
    main()
