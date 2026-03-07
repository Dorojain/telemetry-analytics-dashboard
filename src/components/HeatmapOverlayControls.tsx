import type { HeatmapMode, EventType } from '../types';
import { HEATMAP_OVERLAY_MODES, DISCRETE_EVENT_TYPES, EVENT_MARKER_COLORS, EVENT_TYPE_LABELS } from '../constants';

interface HeatmapOverlayControlsProps {
  heatmapMode: HeatmapMode | null;
  showBots: boolean;
  visibleEventTypes: Set<EventType>;
  onHeatmapModeChange: (mode: HeatmapMode | null) => void;
  onShowBotsChange: (show: boolean) => void;
  onEventTypeToggle: (eventType: EventType) => void;
}

export function HeatmapOverlayControls({
  heatmapMode,
  showBots,
  visibleEventTypes,
  onHeatmapModeChange,
  onShowBotsChange,
  onEventTypeToggle,
}: HeatmapOverlayControlsProps) {
  return (
    <div style={styles.container}>
      {/* Heatmap mode selector */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>HEATMAP</span>
        <div style={styles.buttonRow}>
          <button
            style={{ ...styles.modeButton, ...(heatmapMode === null ? styles.modeButtonSelected : {}) }}
            onClick={() => onHeatmapModeChange(null)}
          >
            Off
          </button>
          {HEATMAP_OVERLAY_MODES.map(mode => (
            <button
              key={mode.id}
              style={{ ...styles.modeButton, ...(heatmapMode === mode.id ? styles.modeButtonActive : {}) }}
              onClick={() => onHeatmapModeChange(mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      {/* Event marker visibility toggles */}
      <div style={styles.section}>
        <span style={styles.sectionLabel}>EVENT MARKERS</span>
        <div style={styles.eventTypeList}>
          {DISCRETE_EVENT_TYPES.map(eventType => (
            <button
              key={eventType}
              style={{
                ...styles.eventTypeButton,
                ...(visibleEventTypes.has(eventType)
                  ? { borderColor: EVENT_MARKER_COLORS[eventType], opacity: 1 }
                  : { opacity: 0.35 }),
              }}
              onClick={() => onEventTypeToggle(eventType)}
              title={EVENT_TYPE_LABELS[eventType]}
            >
              <span style={{ ...styles.colorDot, background: EVENT_MARKER_COLORS[eventType] }} />
              <span style={styles.eventTypeLabel}>{EVENT_TYPE_LABELS[eventType]}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.divider} />

      {/* Bot visibility toggle */}
      <div style={styles.section}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={showBots}
            onChange={e => onShowBotsChange(e.target.checked)}
            style={{ accentColor: '#ffa726' }}
          />
          <span style={styles.checkboxText}>Show Bots</span>
          <span style={styles.botStyleHint}>dashed orange</span>
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
    padding: '14px',
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
  buttonRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
  },
  modeButton: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '5px',
    color: '#9ca3af',
    fontSize: '11px',
    padding: '5px 8px',
    cursor: 'pointer',
  },
  modeButtonActive: {
    background: '#1a2a1a',
    borderColor: '#66bb6a',
    color: '#66bb6a',
  },
  modeButtonSelected: {
    background: '#0d2a40',
    borderColor: '#4fc3f7',
    color: '#4fc3f7',
  },
  divider: {
    height: '1px',
    background: '#1e2330',
    margin: '0 14px',
  },
  eventTypeList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  eventTypeButton: {
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
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  eventTypeLabel: {
    flex: 1,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#e8eaf0',
  },
  checkboxText: {
    fontWeight: 600,
  },
  botStyleHint: {
    fontSize: '10px',
    color: '#ffa726',
    opacity: 0.8,
  },
};
