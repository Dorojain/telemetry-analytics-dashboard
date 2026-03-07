import { useState, useMemo } from 'react';
import type { MapId, HeatmapMode, EventType, Player } from './types';
import { NON_MOVEMENT_EVENTS } from './constants';
import { useIndex, useMapData } from './hooks/useMatchData';
import { usePlayback } from './hooks/usePlayback';
import { FilterPanel } from './components/FilterPanel';
import { MapCanvas } from './components/MapCanvas';
import { Timeline } from './components/Timeline';
import { HeatmapControls } from './components/HeatmapControls';
import { Legend } from './components/Legend';

export function App() {
  const [selectedMap, setSelectedMap] = useState<MapId>('AmbroseValley');
  const [selectedDate, setSelectedDate] = useState('all');
  const [selectedMatchId, setSelectedMatchId] = useState('');
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode | null>(null);
  const [showBots, setShowBots] = useState(true);
  const [visibleEventTypes, setVisibleEventTypes] = useState<Set<EventType>>(
    new Set(NON_MOVEMENT_EVENTS)
  );

  const { index, loading: indexLoading } = useIndex();
  const { data: mapData, loading: mapLoading } = useMapData(selectedMap);

  // Resolve current match's players
  const currentMatch = useMemo(() => {
    if (!mapData || !selectedMatchId) return null;
    return mapData[selectedMatchId] ?? null;
  }, [mapData, selectedMatchId]);

  const players: Player[] = useMemo(() => currentMatch?.players ?? [], [currentMatch]);

  const durationMs = useMemo(() => {
    if (players.length === 0) return 0;
    return Math.max(...players.flatMap(p => p.events.map(e => e.ts)));
  }, [players]);

  const { currentMs, playing, speed, toggle, seek, setSpeed } = usePlayback(durationMs);

  function handleMapChange(m: MapId) {
    setSelectedMap(m);
    setSelectedDate('all');
    setSelectedMatchId('');
  }

  function toggleEventType(t: EventType) {
    setVisibleEventTypes(prev => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  const allMatches = index?.matches ?? [];
  const isLoading = indexLoading || mapLoading;

  return (
    <div style={styles.root}>
      {/* Left sidebar — filters */}
      <FilterPanel
        allMatches={allMatches}
        selectedMap={selectedMap}
        selectedDate={selectedDate}
        selectedMatchId={selectedMatchId}
        onMapChange={handleMapChange}
        onDateChange={setSelectedDate}
        onMatchChange={setSelectedMatchId}
      />

      {/* Center — map + timeline */}
      <div style={styles.main}>
        <div style={styles.mapArea}>
          {isLoading && (
            <div style={styles.overlay}>
              <div style={styles.spinner} />
              <span style={styles.loadText}>Loading data…</span>
            </div>
          )}

          {!selectedMatchId && !isLoading && (
            <div style={styles.overlay}>
              <span style={styles.emptyIcon}>⬡</span>
              <p style={styles.emptyTitle}>Select a match to explore</p>
              <p style={styles.emptyHint}>Choose a map, date, and match from the left panel.</p>
            </div>
          )}

          <MapCanvas
            mapId={selectedMap}
            players={selectedMatchId ? players : []}
            currentMs={currentMs}
            showBots={showBots}
            heatmapMode={heatmapMode}
            visibleEventTypes={visibleEventTypes}
          />
        </div>

        <Timeline
          currentMs={currentMs}
          durationMs={durationMs}
          playing={playing}
          speed={speed}
          onToggle={toggle}
          onSeek={seek}
          onSpeedChange={setSpeed}
        />
      </div>

      {/* Right sidebar — controls + legend */}
      <div style={styles.right}>
        <HeatmapControls
          heatmapMode={heatmapMode}
          showBots={showBots}
          visibleEventTypes={visibleEventTypes}
          onHeatmapChange={setHeatmapMode}
          onShowBotsChange={setShowBots}
          onEventTypeToggle={toggleEventType}
        />
        <Legend />
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
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    background: '#0d0f14',
  },
  overlay: {
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
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #252a3a',
    borderTopColor: '#4fc3f7',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadText: {
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
  right: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
};
