import { HUMAN_TRAIL_COLORS, BOT_TRAIL_COLORS } from '../constants';

export function Legend() {
  return (
    <div style={styles.container}>
      <div style={styles.group}>
        <span style={styles.label}>PLAYERS</span>
        <div style={styles.row}>
          <div style={{ ...styles.line, background: HUMAN_TRAIL_COLORS[0], height: '2px' }} />
          <span style={styles.text}>Human</span>
        </div>
        <div style={styles.row}>
          <div style={{ ...styles.dashedLine, borderColor: BOT_TRAIL_COLORS[0] }} />
          <span style={styles.text}>Bot</span>
        </div>
      </div>

      <div style={styles.group}>
        <span style={styles.label}>EVENTS</span>
        {[
          { color: '#f44336', label: 'Kill (vs Human)' },
          { color: '#9e9e9e', label: 'Death (by Human)' },
          { color: '#ff7043', label: 'Bot Kill' },
          { color: '#ffa726', label: 'Death (by Bot)' },
          { color: '#ab47bc', label: 'Storm Death' },
          { color: '#66bb6a', label: 'Loot' },
        ].map(({ color, label }) => (
          <div key={label} style={styles.row}>
            <div style={{ ...styles.dot, background: color }} />
            <span style={styles.text}>{label}</span>
          </div>
        ))}
      </div>

      <div style={styles.group}>
        <span style={styles.label}>HEATMAP</span>
        <div style={styles.heatGradient} />
        <div style={styles.heatLabels}>
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
  label: {
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
  line: {
    width: '20px',
    borderRadius: '1px',
    flexShrink: 0,
  },
  dashedLine: {
    width: '20px',
    height: 0,
    borderTop: '2px dashed',
    flexShrink: 0,
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  text: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  heatGradient: {
    width: '100%',
    height: '10px',
    borderRadius: '5px',
    background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
    marginTop: '2px',
  },
  heatLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#6b7280',
  },
};
