import type { MapId, EventType, HeatmapMode } from '../types';

/** Per-map configuration for coordinate transformation and asset paths */
export const MAP_CONFIG: Record<MapId, {
  /** World-unit span that maps to the full minimap width/height */
  scale: number;
  /** World X coordinate that maps to minimap pixel 0 */
  originX: number;
  /** World Z coordinate that maps to minimap pixel 0 */
  originZ: number;
  /** Human-readable display name */
  label: string;
  /** JSON data file basename (no extension) under /data/ */
  dataFileName: string;
  /** Path to the minimap image served from /public */
  minimapImagePath: string;
}> = {
  AmbroseValley: {
    scale: 900, originX: -370, originZ: -473,
    label: 'Ambrose Valley',
    dataFileName: 'ambrose_valley',
    minimapImagePath: '/minimaps/AmbroseValley_Minimap.png',
  },
  GrandRift: {
    scale: 581, originX: -290, originZ: -290,
    label: 'Grand Rift',
    dataFileName: 'grand_rift',
    minimapImagePath: '/minimaps/GrandRift_Minimap.png',
  },
  Lockdown: {
    scale: 1000, originX: -500, originZ: -500,
    label: 'Lockdown',
    dataFileName: 'lockdown',
    minimapImagePath: '/minimaps/Lockdown_Minimap.jpg',
  },
};

export const MAP_IDS: MapId[] = ['AmbroseValley', 'GrandRift', 'Lockdown'];

/** Distinct blue/teal/cyan hues for human player movement trails */
export const HUMAN_TRAIL_COLORS = [
  '#4fc3f7', '#29b6f6', '#0288d1', '#0097a7', '#26c6da',
  '#80deea', '#4dd0e1', '#00acc1', '#00bcd4', '#006064',
];

/** Orange/amber hues for bot movement trails (rendered dashed) */
export const BOT_TRAIL_COLORS = [
  '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#e65100',
  '#ffb74d', '#ffd54f', '#ffcc02', '#ff6f00', '#bf360c',
];

/** Canvas fill color for each event type marker */
export const EVENT_MARKER_COLORS: Record<EventType, string> = {
  Position:      'transparent',
  BotPosition:   'transparent',
  Kill:          '#f44336',   // red   — human killed another human
  Killed:        '#9e9e9e',   // gray  — human was killed by a human
  BotKill:       '#ff7043',   // orange-red — human killed a bot
  BotKilled:     '#ffa726',   // orange — human was killed by a bot
  KilledByStorm: '#ab47bc',   // purple — died to the storm
  Loot:          '#66bb6a',   // green  — item picked up
};

/** Display labels for each event type (used in legend and tooltips) */
export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  Position:      'Movement',
  BotPosition:   'Bot Movement',
  Kill:          'Kill (vs Human)',
  Killed:        'Death (by Human)',
  BotKill:       'Bot Kill',
  BotKilled:     'Death (by Bot)',
  KilledByStorm: 'Storm Death',
  Loot:          'Loot',
};

/** Heatmap overlay modes — each aggregates a specific set of event types */
export const HEATMAP_OVERLAY_MODES: { id: HeatmapMode; label: string; includedEventTypes: EventType[] }[] = [
  { id: 'kills',   label: 'Kill Zones',   includedEventTypes: ['Kill', 'BotKill'] },
  { id: 'deaths',  label: 'Death Zones',  includedEventTypes: ['Killed', 'BotKilled', 'KilledByStorm'] },
  { id: 'traffic', label: 'High Traffic', includedEventTypes: ['Position', 'BotPosition'] },
];

/**
 * Event types that represent discrete actions (kills, deaths, loot) rather
 * than continuous position samples. These are rendered as point markers on the map.
 */
export const DISCRETE_EVENT_TYPES: EventType[] = [
  'Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot',
];
