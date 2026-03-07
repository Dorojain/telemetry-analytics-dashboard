export type MapId = 'AmbroseValley' | 'GrandRift' | 'Lockdown';

export type EventType =
  | 'Position'
  | 'BotPosition'
  | 'Kill'
  | 'Killed'
  | 'BotKill'
  | 'BotKilled'
  | 'KilledByStorm'
  | 'Loot';

export interface PlayerEvent {
  ts: number;   // ms from match start
  px: number;   // minimap pixel x (0-1024)
  py: number;   // minimap pixel y (0-1024)
  type: EventType;
}

export interface Player {
  user_id: string;
  is_bot: boolean;
  events: PlayerEvent[];
}

export interface MatchData {
  players: Player[];
}

// map_id → match_id → MatchData
export type MapMatchData = Record<string, MatchData>;

export interface MatchMeta {
  match_id: string;
  map_id: MapId;
  date: string;
  human_count: number;
  bot_count: number;
  duration_ms: number;
}

export interface MatchIndex {
  matches: MatchMeta[];
}

export type HeatmapMode = 'kills' | 'deaths' | 'traffic';
