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
  /** Milliseconds elapsed from match start when this event occurred */
  eventTimestampMs: number;
  /** Minimap pixel X coordinate (0–1024 space) */
  px: number;
  /** Minimap pixel Y coordinate (0–1024 space, Y-axis flipped from world Z) */
  py: number;
  type: EventType;
}

export interface Player {
  userId: string;
  isBot: boolean;
  events: PlayerEvent[];
}

export interface MatchData {
  players: Player[];
}

/** Keyed by match_id → MatchData for all matches on one map */
export type MapMatchData = Record<string, MatchData>;

export interface MatchMetadata {
  matchId: string;
  mapId: MapId;
  date: string;
  humanPlayerCount: number;
  botCount: number;
  durationMs: number;
}

export interface MatchIndex {
  matches: MatchMetadata[];
}

export type HeatmapMode = 'kills' | 'deaths' | 'traffic';
