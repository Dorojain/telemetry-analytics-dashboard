import type { MapId, EventType, HeatmapMode } from './types';

export const MAP_CONFIG: Record<MapId, { scale: number; originX: number; originZ: number; label: string; file: string; minimap: string }> = {
  AmbroseValley: { scale: 900, originX: -370, originZ: -473, label: 'Ambrose Valley', file: 'ambrose_valley', minimap: '/minimaps/AmbroseValley_Minimap.png' },
  GrandRift:     { scale: 581, originX: -290, originZ: -290, label: 'Grand Rift',     file: 'grand_rift',    minimap: '/minimaps/GrandRift_Minimap.png' },
  Lockdown:      { scale: 1000, originX: -500, originZ: -500, label: 'Lockdown',       file: 'lockdown',      minimap: '/minimaps/Lockdown_Minimap.jpg' },
};

export const MAP_IDS: MapId[] = ['AmbroseValley', 'GrandRift', 'Lockdown'];

// Colors for human player trails (distinct blue/teal/cyan hues)
export const HUMAN_TRAIL_COLORS = [
  '#4fc3f7', '#29b6f6', '#0288d1', '#0097a7', '#26c6da',
  '#80deea', '#4dd0e1', '#00acc1', '#00bcd4', '#006064',
];

// Colors for bot trails (orange/amber hues)
export const BOT_TRAIL_COLORS = [
  '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#e65100',
  '#ffb74d', '#ffd54f', '#ffcc02', '#ff6f00', '#bf360c',
];

// Event marker colors
export const EVENT_COLORS: Record<EventType, string> = {
  Position:      'transparent',
  BotPosition:   'transparent',
  Kill:          '#f44336',   // red — you killed a human
  Killed:        '#9e9e9e',   // gray — you were killed by human
  BotKill:       '#ff7043',   // orange-red — you killed a bot
  BotKilled:     '#ffa726',   // orange — killed by bot
  KilledByStorm: '#ab47bc',   // purple — storm death
  Loot:          '#66bb6a',   // green — loot pickup
};

export const EVENT_LABELS: Record<EventType, string> = {
  Position:      'Movement',
  BotPosition:   'Bot Movement',
  Kill:          'Kill (vs Human)',
  Killed:        'Death (by Human)',
  BotKill:       'Bot Kill',
  BotKilled:     'Death (by Bot)',
  KilledByStorm: 'Storm Death',
  Loot:          'Loot',
};

export const HEATMAP_MODES: { id: HeatmapMode; label: string; events: EventType[] }[] = [
  { id: 'kills',   label: 'Kill Zones',   events: ['Kill', 'BotKill'] },
  { id: 'deaths',  label: 'Death Zones',  events: ['Killed', 'BotKilled', 'KilledByStorm'] },
  { id: 'traffic', label: 'High Traffic', events: ['Position', 'BotPosition'] },
];

export const NON_MOVEMENT_EVENTS: EventType[] = ['Kill', 'Killed', 'BotKill', 'BotKilled', 'KilledByStorm', 'Loot'];
