import { useEffect, useRef, useCallback } from 'react';
import type { MapId, Player, HeatmapMode, EventType } from '../types';
import { MAP_CONFIG, HUMAN_TRAIL_COLORS, BOT_TRAIL_COLORS, EVENT_COLORS, NON_MOVEMENT_EVENTS, HEATMAP_MODES } from '../constants';

interface Props {
  mapId: MapId;
  players: Player[];
  currentMs: number;
  showBots: boolean;
  heatmapMode: HeatmapMode | null;
  visibleEventTypes: Set<EventType>;
}

// Draw a small marker for non-movement events
function drawEventMarker(ctx: CanvasRenderingContext2D, px: number, py: number, type: EventType, scale: number) {
  const color = EVENT_COLORS[type];
  const r = 5 * scale;
  ctx.save();
  ctx.globalAlpha = 0.9;

  ctx.beginPath();
  ctx.arc(px, py, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1 * scale;
  ctx.stroke();

  // Symbol inside marker
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(7 * scale)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const symbols: Record<string, string> = {
    Kill:          '✕',
    Killed:        '✕',
    BotKill:       '✕',
    BotKilled:     '✕',
    KilledByStorm: '⚡',
    Loot:          '◆',
  };
  ctx.fillText(symbols[type] ?? '?', px, py);
  ctx.restore();
}

export function MapCanvas({ mapId, players, currentMs, showBots, heatmapMode, visibleEventTypes }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgLoadedRef = useRef(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const scale = W / 1024; // how much to scale 1024-unit coords

    ctx.clearRect(0, 0, W, H);

    // Background minimap
    if (imgRef.current && imgLoadedRef.current) {
      ctx.drawImage(imgRef.current, 0, 0, W, H);
    } else {
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, W, H);
    }

    // Heatmap layer (drawn below trails)
    if (heatmapMode) {
      drawHeatmap(ctx, players, heatmapMode, currentMs, showBots, scale, W, H);
    }

    // Draw trails and markers per player
    const filteredPlayers = showBots ? players : players.filter(p => !p.is_bot);

    for (let pi = 0; pi < filteredPlayers.length; pi++) {
      const player = filteredPlayers[pi]!;
      const palette = player.is_bot ? BOT_TRAIL_COLORS : HUMAN_TRAIL_COLORS;
      const trailColor = palette[pi % palette.length]!;

      // Filter events up to current time
      const visible = player.events.filter(e => e.ts <= currentMs);
      if (visible.length === 0) continue;

      // Movement trail (all position events)
      const trail = visible.filter(e => e.type === 'Position' || e.type === 'BotPosition');

      if (trail.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(trail[0]!.px * scale, trail[0]!.py * scale);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i]!.px * scale, trail[i]!.py * scale);
        }
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = player.is_bot ? 1 * scale : 1.5 * scale;
        ctx.globalAlpha = player.is_bot ? 0.35 : 0.65;
        if (player.is_bot) ctx.setLineDash([4 * scale, 4 * scale]);
        ctx.stroke();
        ctx.restore();
      }

      // Player dot at current position
      const lastPos = trail[trail.length - 1];
      if (lastPos) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(lastPos.px * scale, lastPos.py * scale, (player.is_bot ? 3 : 4) * scale, 0, Math.PI * 2);
        ctx.fillStyle = trailColor;
        ctx.globalAlpha = player.is_bot ? 0.7 : 1.0;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();
        ctx.restore();
      }

      // Event markers (only non-movement, only if in visibleEventTypes)
      const markers = visible.filter(
        e => NON_MOVEMENT_EVENTS.includes(e.type) && visibleEventTypes.has(e.type)
      );
      for (const ev of markers) {
        drawEventMarker(ctx, ev.px * scale, ev.py * scale, ev.type, scale);
      }
    }
  }, [players, currentMs, showBots, heatmapMode, visibleEventTypes]);

  // Load minimap image when map changes
  useEffect(() => {
    const cfg = MAP_CONFIG[mapId];
    imgLoadedRef.current = false;
    const img = new Image();
    img.onload = () => {
      imgLoadedRef.current = true;
      imgRef.current = img;
      draw();
    };
    img.src = cfg.minimap;
    imgRef.current = img;
  }, [mapId, draw]);

  // Resize canvas to fill container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        draw();
      }
    });
    ro.observe(canvas.parentElement!);
    return () => ro.disconnect();
  }, [draw]);

  // Redraw whenever state changes
  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ── Heatmap rendering ──────────────────────────────────────────────────────────
function drawHeatmap(
  ctx: CanvasRenderingContext2D,
  players: Player[],
  mode: HeatmapMode,
  currentMs: number,
  showBots: boolean,
  scale: number,
  _W: number,
  _H: number,
) {
  const config = HEATMAP_MODES.find(m => m.id === mode);
  if (!config) return;

  const eventTypes = new Set<EventType>(config.events);

  // Use an offscreen canvas for heatmap compositing
  const offscreen = document.createElement('canvas');
  offscreen.width = ctx.canvas.width;
  offscreen.height = ctx.canvas.height;
  const octx = offscreen.getContext('2d')!;
  octx.globalCompositeOperation = 'source-over';

  const radius = mode === 'traffic' ? 20 * scale : 30 * scale;

  for (const player of players) {
    if (!showBots && player.is_bot) continue;
    for (const ev of player.events) {
      if (ev.ts > currentMs) continue;
      if (!eventTypes.has(ev.type)) continue;

      const x = ev.px * scale;
      const y = ev.py * scale;

      const grd = octx.createRadialGradient(x, y, 0, x, y, radius);
      grd.addColorStop(0, 'rgba(255,255,255,0.15)');
      grd.addColorStop(1, 'rgba(255,255,255,0)');

      octx.beginPath();
      octx.arc(x, y, radius, 0, Math.PI * 2);
      octx.fillStyle = grd;
      octx.fill();
    }
  }

  // Color the offscreen canvas using pixel manipulation
  const imageData = octx.getImageData(0, 0, offscreen.width, offscreen.height);
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    const intensity = d[i + 3]! / 255; // alpha as intensity (0-1)
    if (intensity === 0) continue;

    // Map intensity to color: low=blue, mid=yellow, high=red
    const [r, g, b] = heatColor(Math.min(intensity * 3, 1));
    d[i] = r!;
    d[i + 1] = g!;
    d[i + 2] = b!;
    d[i + 3] = Math.round(intensity * 200); // semi-transparent
  }

  octx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.drawImage(offscreen, 0, 0);
  ctx.restore();
}

function heatColor(t: number): [number, number, number] {
  // t: 0→1  maps blue→cyan→green→yellow→red
  if (t < 0.25) {
    const s = t / 0.25;
    return [0, Math.round(s * 255), 255];
  } else if (t < 0.5) {
    const s = (t - 0.25) / 0.25;
    return [0, 255, Math.round((1 - s) * 255)];
  } else if (t < 0.75) {
    const s = (t - 0.5) / 0.25;
    return [Math.round(s * 255), 255, 0];
  } else {
    const s = (t - 0.75) / 0.25;
    return [255, Math.round((1 - s) * 255), 0];
  }
}
