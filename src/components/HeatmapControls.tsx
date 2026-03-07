import type { HeatmapMode, EventType } from '../types';
import { HEATMAP_MODES, NON_MOVEMENT_EVENTS, EVENT_COLORS, EVENT_LABELS } from '../constants';

interface Props {
  heatmapMode: HeatmapMode | null;
  showBots: boolean;
  visibleEventTypes: Set<EventType>;
  onHeatmapChange: (m: HeatmapMode | null) => void;
  onShowBotsChange: (v: boolean) => void;
  onEventTypeToggle: (t: EventType) => void;
}

export function HeatmapControls({
  heatmapMode,
  showBots,
  visibleEventTypes,
  onHeatmapChange,
  onShowBotsChange,
  onEventTypeToggle,
}: Props) {
  return (
    <div style={styles.container}>
      {/* Heatmap */}
      <div style={styles.section}>
        <span style={styles.label}>HEATMAP</span>
        <div style={styles.row}>
          <button
            style={{ ...styles.heatBtn, ...(heatmapMode === null ? styles.heatBtnOff : {}) }}
            onClick={() => onHeatmapChange(null)}
          >
            Off
          </button>
          {HEATMAP_MODES.map(m => (
            <button
              key={m.id}
              style={{ ...styles.heatBtn, ...(heatmapMode === m.id ? styles.heatBtnActive : {}) }}
              onClick={() => onHeatmapChange(m.id)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Event markers */}
      <div style={styles.section}>
        <span style={styles.label}>EVENT MARKERS</span>
        <div style={styles.eventGrid}>
          {NON_MOVEMENT_EVENTS.map(type => (
            <button
              key={type}
              style={{
                ...styles.eventBtn,
                ...(visibleEventTypes.has(type) ? { borderColor: EVENT_COLORS[type], opacity: 1 } : { opacity: 0.35 }),
              }}
              onClick={() => onEventTypeToggle(type)}
              title={EVENT_LABELS[type]}
            >
              <span style={{ ...styles.dot, background: EVENT_COLORS[type] }} />
              <span style={styles.eventLabel}>{EVENT_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={styles.divider} />

      {/* Show bots toggle */}
      <div style={styles.section}>
        <label style={styles.toggle}>
          <input
            type="checkbox"
            checked={showBots}
            onChange={e => onShowBotsChange(e.target.checked)}
            style={{ accentColor: '#ffa726' }}
          />
          <span style={styles.toggleLabel}>Show Bots</span>
          <span style={styles.botBadge}>dashed orange</span>
        </label>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#13161f',
    borderLeft: '1px solid #1e2330',
    width: '220px',
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'auto',
  },
  section: {
    padding: '14px 14px',
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
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  heatBtn: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '5px',
    color: '#9ca3af',
    fontSize: '11px',
    padding: '5px 8px',
    cursor: 'pointer',
  },
  heatBtnActive: {
    background: '#1a2a1a',
    borderColor: '#66bb6a',
    color: '#66bb6a',
  },
  heatBtnOff: {
    background: '#0d2a40',
    borderColor: '#4fc3f7',
    color: '#4fc3f7',
  },
  divider: {
    height: '1px',
    background: '#1e2330',
    margin: '0 14px',
  },
  eventGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  eventBtn: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '5px',
    color: '#9ca3af',
    fontSize: '11px',
    padding: '5px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    textAlign: 'left',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  eventLabel: {
    flex: 1,
  },
  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#e8eaf0',
  },
  toggleLabel: {
    fontWeight: 600,
  },
  botBadge: {
    fontSize: '10px',
    color: '#ffa726',
    opacity: 0.8,
  },
};
