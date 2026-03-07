import type { MapId, MatchMetadata } from '../types';
import { MAP_IDS, MAP_CONFIG } from '../constants';

interface MatchFilterPanelProps {
  allMatchMetadata: MatchMetadata[];
  selectedMap: MapId;
  selectedDate: string;
  selectedMatchId: string;
  onMapChange: (mapId: MapId) => void;
  onDateChange: (date: string) => void;
  onMatchChange: (matchId: string) => void;
}

export function MatchFilterPanel({
  allMatchMetadata,
  selectedMap,
  selectedDate,
  selectedMatchId,
  onMapChange,
  onDateChange,
  onMatchChange,
}: MatchFilterPanelProps) {
  const matchesOnSelectedMap = allMatchMetadata.filter(m => m.mapId === selectedMap);
  const availableDates = Array.from(new Set(matchesOnSelectedMap.map(m => m.date))).sort();
  const matchesForSelectedDate = selectedDate === 'all'
    ? matchesOnSelectedMap
    : matchesOnSelectedMap.filter(m => m.date === selectedDate);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.logo}>⬡</span>
        <span style={styles.title}>Telemetry Dashboard</span>
      </div>

      {/* Map selector */}
      <section style={styles.section}>
        <label style={styles.sectionLabel}>MAP</label>
        <div style={styles.mapButtonGrid}>
          {MAP_IDS.map(mapId => (
            <button
              key={mapId}
              style={{ ...styles.mapButton, ...(selectedMap === mapId ? styles.mapButtonActive : {}) }}
              onClick={() => onMapChange(mapId)}
            >
              <span style={styles.mapName}>{MAP_CONFIG[mapId].label}</span>
              <span style={styles.matchCount}>
                {allMatchMetadata.filter(m => m.mapId === mapId).length} matches
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Date selector */}
      <section style={styles.section}>
        <label style={styles.sectionLabel}>DATE</label>
        <select
          style={styles.select}
          value={selectedDate}
          onChange={e => {
            onDateChange(e.target.value);
            onMatchChange(''); // Clear match selection when date changes
          }}
        >
          <option value="all">All dates ({matchesOnSelectedMap.length} matches)</option>
          {availableDates.map(date => (
            <option key={date} value={date}>
              {formatDateLabel(date)} ({matchesOnSelectedMap.filter(m => m.date === date).length} matches)
            </option>
          ))}
        </select>
      </section>

      {/* Match selector */}
      <section style={styles.section}>
        <label style={styles.sectionLabel}>MATCH</label>
        <select
          style={styles.select}
          value={selectedMatchId}
          onChange={e => onMatchChange(e.target.value)}
        >
          <option value="">— Select a match —</option>
          {matchesForSelectedDate.map(match => (
            <option key={match.matchId} value={match.matchId}>
              {match.matchId.slice(0, 8)}… · {match.humanPlayerCount}H {match.botCount}B · {formatMatchDuration(match.durationMs)}
            </option>
          ))}
        </select>
      </section>

      {matchesForSelectedDate.length === 0 && (
        <p style={styles.emptyMessage}>No matches found for this filter.</p>
      )}
    </div>
  );
}

function formatDateLabel(isoDate: string) {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatMatchDuration(durationMs: number) {
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    width: '260px',
    minWidth: '260px',
    background: '#13161f',
    borderRight: '1px solid #1e2330',
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    overflow: 'auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '18px 16px 14px',
    borderBottom: '1px solid #1e2330',
  },
  logo: {
    fontSize: '20px',
    color: '#4fc3f7',
  },
  title: {
    fontSize: '15px',
    fontWeight: 700,
    letterSpacing: '0.05em',
    color: '#e8eaf0',
  },
  section: {
    padding: '16px',
    borderBottom: '1px solid #1e2330',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#6b7280',
  },
  mapButtonGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mapButton: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '6px',
    padding: '8px 10px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#9ca3af',
    transition: 'all 0.1s',
  },
  mapButtonActive: {
    background: '#0d2a40',
    borderColor: '#4fc3f7',
    color: '#e8eaf0',
  },
  mapName: {
    fontSize: '13px',
    fontWeight: 600,
  },
  matchCount: {
    fontSize: '11px',
    opacity: 0.6,
  },
  select: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '6px',
    color: '#e8eaf0',
    padding: '8px 10px',
    fontSize: '12px',
    width: '100%',
    cursor: 'pointer',
    outline: 'none',
  },
  emptyMessage: {
    padding: '12px 16px',
    fontSize: '12px',
    color: '#6b7280',
  },
};
