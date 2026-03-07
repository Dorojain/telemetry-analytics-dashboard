import { useEffect, useRef, useCallback } from 'react';
import type { MapId, Player, HeatmapMode, EventType } from '../../types';
import {
  MAP_CONFIG,
  HUMAN_TRAIL_COLORS,
  BOT_TRAIL_COLORS,
  EVENT_MARKER_COLORS,
  DISCRETE_EVENT_TYPES,
  HEATMAP_OVERLAY_MODES,
} from '../../constants';

interface PlayerMovementMapProps {
  mapId: MapId;
  matchPlayers: Player[];
  /** Current playback position in milliseconds — only events at or before this time are rendered */
  playbackPositionMs: number;
  showBots: boolean;
  heatmapMode: HeatmapMode | null;
  visibleEventTypes: Set<EventType>;
}

/** Draws a colored circle with a symbol for a discrete event (kill, death, loot, etc.) */
function renderEventMarker(
  ctx: CanvasRenderingContext2D,
  pixelX: number,
  pixelY: number,
  eventType: EventType,
  canvasScale: number,
) {
  const markerColor = EVENT_MARKER_COLORS[eventType];
  const radius = 5 * canvasScale;

  ctx.save();
  ctx.globalAlpha = 0.9;

  // Colored circle
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, radius, 0, Math.PI * 2);
  ctx.fillStyle = markerColor;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1 * canvasScale;
  ctx.stroke();

  // Symbol inside the circle
  const EVENT_SYMBOLS: Record<string, string> = {
    Kill:          '✕',
    Killed:        '✕',
    BotKill:       '✕',
    BotKilled:     '✕',
    KilledByStorm: '⚡',
    Loot:          '◆',
  };
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(7 * canvasScale)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(EVENT_SYMBOLS[eventType] ?? '?', pixelX, pixelY);

  ctx.restore();
}

export function PlayerMovementMap({
  mapId,
  matchPlayers,
  playbackPositionMs,
  showBots,
  heatmapMode,
  visibleEventTypes,
}: PlayerMovementMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapImageRef = useRef<HTMLImageElement | null>(null);
  const isMinimapReadyRef = useRef(false);

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    // Scale factor: minimap coordinates are in 0-1024 space; canvas may be larger/smaller
    const canvasScale = canvasWidth / 1024;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw minimap image as background, or a dark fallback while it loads
    if (minimapImageRef.current && isMinimapReadyRef.current) {
      ctx.drawImage(minimapImageRef.current, 0, 0, canvasWidth, canvasHeight);
    } else {
      ctx.fillStyle = '#1a1f2e';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // Heatmap is drawn below player trails so it doesn't obscure them
    if (heatmapMode) {
      renderHeatmapOverlay(ctx, matchPlayers, heatmapMode, playbackPositionMs, showBots, canvasScale);
    }

    // Only show bots if the toggle is on
    const visiblePlayers = showBots
      ? matchPlayers
      : matchPlayers.filter(player => !player.isBot);

    for (let playerIndex = 0; playerIndex < visiblePlayers.length; playerIndex++) {
      const player = visiblePlayers[playerIndex]!;

      // Assign a consistent color from the appropriate palette
      const colorPalette = player.isBot ? BOT_TRAIL_COLORS : HUMAN_TRAIL_COLORS;
      const trailColor = colorPalette[playerIndex % colorPalette.length]!;

      // Only render events that have occurred up to the current playback position
      const eventsUpToNow = player.events.filter(
        event => event.eventTimestampMs <= playbackPositionMs
      );
      if (eventsUpToNow.length === 0) continue;

      // Movement trail: connect sequential position samples with a polyline
      const movementEvents = eventsUpToNow.filter(
        event => event.type === 'Position' || event.type === 'BotPosition'
      );

      if (movementEvents.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(movementEvents[0]!.px * canvasScale, movementEvents[0]!.py * canvasScale);
        for (let i = 1; i < movementEvents.length; i++) {
          ctx.lineTo(movementEvents[i]!.px * canvasScale, movementEvents[i]!.py * canvasScale);
        }
        ctx.strokeStyle = trailColor;
        ctx.lineWidth = player.isBot ? 1 * canvasScale : 1.5 * canvasScale;
        ctx.globalAlpha = player.isBot ? 0.35 : 0.65;
        // Bots use a dashed line to visually distinguish them from human players
        if (player.isBot) ctx.setLineDash([4 * canvasScale, 4 * canvasScale]);
        ctx.stroke();
        ctx.restore();
      }

      // Dot at the player's current (most recent) position
      const currentPositionEvent = movementEvents[movementEvents.length - 1];
      if (currentPositionEvent) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(
          currentPositionEvent.px * canvasScale,
          currentPositionEvent.py * canvasScale,
          (player.isBot ? 3 : 4) * canvasScale,
          0, Math.PI * 2,
        );
        ctx.fillStyle = trailColor;
        ctx.globalAlpha = player.isBot ? 0.7 : 1.0;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.lineWidth = 1 * canvasScale;
        ctx.stroke();
        ctx.restore();
      }

      // Discrete event markers (kills, deaths, loot) — only if that type is toggled on
      const discreteEventsToRender = eventsUpToNow.filter(
        event => DISCRETE_EVENT_TYPES.includes(event.type) && visibleEventTypes.has(event.type)
      );
      for (const event of discreteEventsToRender) {
        renderEventMarker(ctx, event.px * canvasScale, event.py * canvasScale, event.type, canvasScale);
      }
    }
  }, [matchPlayers, playbackPositionMs, showBots, heatmapMode, visibleEventTypes]);

  // Reload minimap image when the selected map changes
  useEffect(() => {
    isMinimapReadyRef.current = false;
    const img = new Image();
    img.onload = () => {
      isMinimapReadyRef.current = true;
      minimapImageRef.current = img;
      renderFrame();
    };
    img.src = MAP_CONFIG[mapId].minimapImagePath;
    minimapImageRef.current = img;
  }, [mapId, renderFrame]);

  // Resize canvas to match its container element
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        renderFrame();
      }
    });
    resizeObserver.observe(canvas.parentElement!);
    return () => resizeObserver.disconnect();
  }, [renderFrame]);

  // Re-render on every state change (playback position, filters, etc.)
  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  );
}

// ── Heatmap rendering ──────────────────────────────────────────────────────────

/**
 * Renders a density heatmap onto an offscreen canvas, then composites it onto
 * the main canvas. Each qualifying event contributes a radial gradient "blob";
 * blobs accumulate via alpha and are then colorized using a blue→red heat scale.
 */
function renderHeatmapOverlay(
  ctx: CanvasRenderingContext2D,
  matchPlayers: Player[],
  mode: HeatmapMode,
  playbackPositionMs: number,
  showBots: boolean,
  canvasScale: number,
) {
  const modeConfig = HEATMAP_OVERLAY_MODES.find(m => m.id === mode);
  if (!modeConfig) return;

  const includedEventTypes = new Set<EventType>(modeConfig.includedEventTypes);

  // Render to an offscreen canvas so we can post-process pixels before compositing
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = ctx.canvas.width;
  offscreenCanvas.height = ctx.canvas.height;
  const offscreenCtx = offscreenCanvas.getContext('2d')!;

  // Traffic uses a smaller radius since position events are dense; combat events are sparse
  const blobRadius = mode === 'traffic' ? 20 * canvasScale : 30 * canvasScale;

  for (const player of matchPlayers) {
    if (!showBots && player.isBot) continue;
    for (const event of player.events) {
      if (event.eventTimestampMs > playbackPositionMs) continue;
      if (!includedEventTypes.has(event.type)) continue;

      const x = event.px * canvasScale;
      const y = event.py * canvasScale;

      // Soft radial gradient: bright center fading to transparent at the edge
      const gradient = offscreenCtx.createRadialGradient(x, y, 0, x, y, blobRadius);
      gradient.addColorStop(0, 'rgba(255,255,255,0.15)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');

      offscreenCtx.beginPath();
      offscreenCtx.arc(x, y, blobRadius, 0, Math.PI * 2);
      offscreenCtx.fillStyle = gradient;
      offscreenCtx.fill();
    }
  }

  // Colorize: read accumulated alpha as intensity, map to blue→cyan→green→yellow→red
  const imageData = offscreenCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  const pixels = imageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const intensity = pixels[i + 3]! / 255; // alpha channel encodes density
    if (intensity === 0) continue;

    const [r, g, b] = mapIntensityToHeatColor(Math.min(intensity * 3, 1));
    pixels[i] = r!;
    pixels[i + 1] = g!;
    pixels[i + 2] = b!;
    pixels[i + 3] = Math.round(intensity * 200); // keep semi-transparent over the minimap
  }

  offscreenCtx.putImageData(imageData, 0, 0);
  ctx.save();
  ctx.drawImage(offscreenCanvas, 0, 0);
  ctx.restore();
}

/**
 * Maps a normalized intensity value (0–1) to an RGB heat color.
 * Color scale: blue (cold/low) → cyan → green → yellow → red (hot/high)
 */
function mapIntensityToHeatColor(intensity: number): [number, number, number] {
  if (intensity < 0.25) {
    const t = intensity / 0.25;
    return [0, Math.round(t * 255), 255];
  } else if (intensity < 0.5) {
    const t = (intensity - 0.25) / 0.25;
    return [0, 255, Math.round((1 - t) * 255)];
  } else if (intensity < 0.75) {
    const t = (intensity - 0.5) / 0.25;
    return [Math.round(t * 255), 255, 0];
  } else {
    const t = (intensity - 0.75) / 0.25;
    return [255, Math.round((1 - t) * 255), 0];
  }
}
