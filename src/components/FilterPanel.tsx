import type { MapId, MatchMeta } from '../types';
import { MAP_IDS, MAP_CONFIG } from '../constants';

interface Props {
  allMatches: MatchMeta[];
  selectedMap: MapId;
  selectedDate: string;
  selectedMatchId: string;
  onMapChange: (m: MapId) => void;
  onDateChange: (d: string) => void;
  onMatchChange: (id: string) => void;
}

export function FilterPanel({
  allMatches,
  selectedMap,
  selectedDate,
  selectedMatchId,
  onMapChange,
  onDateChange,
  onMatchChange,
}: Props) {
  const mapMatches = allMatches.filter(m => m.map_id === selectedMap);
  const dates = Array.from(new Set(mapMatches.map(m => m.date))).sort();
  const dateMatches = selectedDate === 'all'
    ? mapMatches
    : mapMatches.filter(m => m.date === selectedDate);

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <span style={styles.logo}>⬡</span>
        <span style={styles.title}>LILA Map Viz</span>
      </div>

      <section style={styles.section}>
        <label style={styles.label}>MAP</label>
        <div style={styles.mapGrid}>
          {MAP_IDS.map(id => (
            <button
              key={id}
              style={{ ...styles.mapBtn, ...(selectedMap === id ? styles.mapBtnActive : {}) }}
              onClick={() => onMapChange(id)}
            >
              <span style={styles.mapName}>{MAP_CONFIG[id].label}</span>
              <span style={styles.mapCount}>{allMatches.filter(m => m.map_id === id).length} matches</span>
            </button>
          ))}
        </div>
      </section>

      <section style={styles.section}>
        <label style={styles.label}>DATE</label>
        <select
          style={styles.select}
          value={selectedDate}
          onChange={e => {
            onDateChange(e.target.value);
            onMatchChange('');
          }}
        >
          <option value="all">All dates ({mapMatches.length} matches)</option>
          {dates.map(d => (
            <option key={d} value={d}>
              {formatDate(d)} ({mapMatches.filter(m => m.date === d).length} matches)
            </option>
          ))}
        </select>
      </section>

      <section style={styles.section}>
        <label style={styles.label}>MATCH</label>
        <select
          style={styles.select}
          value={selectedMatchId}
          onChange={e => onMatchChange(e.target.value)}
        >
          <option value="">— Select a match —</option>
          {dateMatches.map(m => (
            <option key={m.match_id} value={m.match_id}>
              {m.match_id.slice(0, 8)}… · {m.human_count}H {m.bot_count}B · {formatDuration(m.duration_ms)}
            </option>
          ))}
        </select>
      </section>

      {dateMatches.length === 0 && (
        <p style={styles.empty}>No matches found for this filter.</p>
      )}
    </div>
  );
}

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(ms: number) {
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
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
  label: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#6b7280',
  },
  mapGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  mapBtn: {
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
  mapBtnActive: {
    background: '#0d2a40',
    borderColor: '#4fc3f7',
    color: '#e8eaf0',
  },
  mapName: {
    fontSize: '13px',
    fontWeight: 600,
  },
  mapCount: {
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
  empty: {
    padding: '12px 16px',
    fontSize: '12px',
    color: '#6b7280',
  },
};
