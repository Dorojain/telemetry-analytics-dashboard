import { useState, useMemo } from 'react';
import type { MapId, HeatmapMode, EventType, Player } from '../types';
import { DISCRETE_EVENT_TYPES } from '../constants';
import { useMatchIndex, useMapTelemetryData } from '../hooks/useTelemetryData';
import { useMatchPlaybackController } from '../hooks/useMatchPlaybackController';
import { MatchFilterPanel } from '../components/MatchFilterPanel';
import { PlayerMovementMap } from '../components/charts/PlayerMovementMap';
import { MatchPlaybackTimeline } from '../components/MatchPlaybackTimeline';
import { HeatmapOverlayControls } from '../components/HeatmapOverlayControls';
import { MapLegend } from '../components/MapLegend';

/**
 * Root view for the Telemetry Analytics Dashboard.
 * Orchestrates filter state, data loading, and playback, passing derived
 * props down to the map canvas and control components.
 */
export function DashboardView() {
  // Filter state
  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedMatchId, setSelectedMatchId] = useState('');

  // Overlay state
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode | null>(null);
  const [showBots, setShowBots] = useState(true);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<EventType>>(
    new Set(DISCRETE_EVENT_TYPES)
  );

  // Data loading
  const { index, isLoading: isIndexLoading } = useMatchIndex();
  const { matchData, isLoading: isMapDataLoading } = useMapTelemetryData(selectedMap);

  // Resolve the selected match's player list from the loaded map data
  const activeMatchData = useMemo(() => {
    if (!matchData || !selectedMatchId) return null;
    return matchData[selectedMatchId] ?? null;
  }, [matchData, selectedMatchId]);

  const matchPlayers: Player[] = useMemo(
    () => activeMatchData?.players ?? [],
    [activeMatchData],
  );

  // Derive match duration from the latest event timestamp across all players
  const matchDurationMs = useMemo(() => {
    if (matchPlayers.length === 0) return 0;
    return Math.max(
      ...matchPlayers.flatMap(player =>
        player.events.map(event => event.eventTimestampMs)
      )
    );
  }, [matchPlayers]);

  const {
    playbackPositionMs,
    isPlaying,
    playbackSpeed,
    togglePlayPause,
    seekToPosition,
    setPlaybackSpeed,
  } = useMatchPlaybackController(matchDurationMs);

  // Resetting date + match when the user switches maps keeps the UI consistent
  function handleMapSelection(mapId: MapId) {
    setSelectedMap(mapId);
    setSelectedDate('all');
    setSelectedMatchId('');
  }

  function toggleEventTypeVisibility(eventType: EventType) {
    setVisibleEventTypes(prev => {
      const updated = new Set(prev);
      if (updated.has(eventType)) updated.delete(eventType);
      else updated.add(eventType);
      return updated;
    });
  }

  const allMatchMetadata = index?.matches ?? [];
  const isDataLoading = isIndexLoading || isMapDataLoading;

  return (
    <div style={styles.root}>
      {/* Left sidebar — map/date/match filters */}
      <MatchFilterPanel
        allMatchMetadata={allMatchMetadata}
        selectedMap={selectedMap}
        selectedDate={selectedDate}
        selectedMatchId={selectedMatchId}
        onMapChange={handleMapSelection}
        onDateChange={setSelectedDate}
        onMatchChange={setSelectedMatchId}
      />

      {/* Center — map canvas + playback timeline */}
      <div style={styles.mainColumn}>
        <div style={styles.mapViewport}>
          {isDataLoading && (
            <div style={styles.overlayMessage}>
              <div style={styles.loadingSpinner} />
              <span style={styles.overlayText}>Loading data…</span>
            </div>
          )}

          {!selectedMatchId && !isDataLoading && (
            <div style={styles.overlayMessage}>
              <span style={styles.emptyIcon}>⬡</span>
              <p style={styles.emptyTitle}>Select a match to explore</p>
              <p style={styles.emptyHint}>Choose a map, date, and match from the left panel.</p>
            </div>
          )}

          <PlayerMovementMap
            mapId={selectedMap}
            matchPlayers={selectedMatchId ? matchPlayers : []}
            playbackPositionMs={playbackPositionMs}
            showBots={showBots}
            heatmapMode={heatmapMode}
            visibleEventTypes={visibleEventTypes}
          />
        </div>

        <MatchPlaybackTimeline
          playbackPositionMs={playbackPositionMs}
          matchDurationMs={matchDurationMs}
          isPlaying={isPlaying}
          playbackSpeed={playbackSpeed}
          onTogglePlayPause={togglePlayPause}
          onSeek={seekToPosition}
          onSpeedChange={setPlaybackSpeed}
        />
      </div>

      {/* Right sidebar — heatmap controls + legend */}
      <div style={styles.rightSidebar}>
        <HeatmapOverlayControls
          heatmapMode={heatmapMode}
          showBots={showBots}
          visibleEventTypes={visibleEventTypes}
          onHeatmapModeChange={setHeatmapMode}
          onShowBotsChange={setShowBots}
          onEventTypeToggle={toggleEventTypeVisibility}
        />
        <MapLegend />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  mainColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  mapViewport: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    background: '#0d0f14',
  },
  overlayMessage: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    zIndex: 10,
    background: 'rgba(13,15,20,0.75)',
    backdropFilter: 'blur(2px)',
  },
  loadingSpinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #252a3a',
    borderTopColor: '#4fc3f7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  overlayText: {
    fontSize: '14px',
    color: '#9ca3af',
  },
  emptyIcon: {
    fontSize: '48px',
    color: '#252a3a',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#6b7280',
  },
  emptyHint: {
    fontSize: '13px',
    color: '#4b5563',
  },
  rightSidebar: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
};
