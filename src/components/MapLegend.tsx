import { HUMAN_TRAIL_COLORS, BOT_TRAIL_COLORS } from '../constants';

/** Static legend explaining trail colors, event marker colors, and heatmap scale */
export function MapLegend() {
  return (
    <div style={styles.container}>
      {/* Player trail legend */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>PLAYERS</span>
        <div style={styles.row}>
          <div style={{ ...styles.solidLine, background: HUMAN_TRAIL_COLORS[0] }} />
          <span style={styles.itemText}>Human</span>
        </div>
        <div style={styles.row}>
          <div style={{ ...styles.dashedLine, borderColor: BOT_TRAIL_COLORS[0] }} />
          <span style={styles.itemText}>Bot</span>
        </div>
      </div>

      {/* Event marker legend */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>EVENTS</span>
        {[
          { color: '#f44336', label: 'Kill (vs Human)' },
          { color: '#9e9e9e', label: 'Death (by Human)' },
          { color: '#ff7043', label: 'Bot Kill' },
          { color: '#ffa726', label: 'Death (by Bot)' },
          { color: '#ab47bc', label: 'Storm Death' },
          { color: '#66bb6a', label: 'Loot' },
        ].map(({ color, label }) => (
          <div key={label} style={styles.row}>
            <div style={{ ...styles.colorDot, background: color }} />
            <span style={styles.itemText}>{label}</span>
          </div>
        ))}
      </div>

      {/* Heatmap scale */}
      <div style={styles.group}>
        <span style={styles.groupLabel}>HEATMAP</span>
        <div style={styles.heatGradientBar} />
        <div style={styles.heatScaleLabels}>
          <span>Low</span>
          <span>High</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    borderTop: '1px solid #1e2330',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  groupLabel: {
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    color: '#6b7280',
    marginBottom: '2px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  solidLine: {
    width: '20px',
    height: '2px',
    borderRadius: '1px',
    flexShrink: 0,
  },
  dashedLine: {
    width: '20px',
    height: 0,
    borderTop: '2px dashed',
    flexShrink: 0,
  },
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  itemText: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  heatGradientBar: {
    width: '100%',
    height: '10px',
    borderRadius: '5px',
    background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
    marginTop: '2px',
  },
  heatScaleLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#6b7280',
  },
};
