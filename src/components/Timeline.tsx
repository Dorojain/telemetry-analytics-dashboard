interface Props {
  currentMs: number;
  durationMs: number;
  playing: boolean;
  speed: number;
  onToggle: () => void;
  onSeek: (ms: number) => void;
  onSpeedChange: (s: number) => void;
}

function formatTime(ms: number) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const SPEEDS = [1, 5, 10, 20];

export function Timeline({ currentMs, durationMs, playing, speed, onToggle, onSeek, onSpeedChange }: Props) {
  const pct = durationMs > 0 ? (currentMs / durationMs) * 100 : 0;

  return (
    <div style={styles.container}>
      <button
        style={{ ...styles.playBtn, background: playing ? '#ef5350' : '#4fc3f7' }}
        onClick={onToggle}
        title={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      <span style={styles.time}>{formatTime(currentMs)}</span>

      <div style={styles.sliderWrap}>
        <div style={styles.track}>
          <div style={{ ...styles.fill, width: `${pct}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={durationMs || 1}
          value={currentMs}
          onChange={e => onSeek(Number(e.target.value))}
          style={styles.slider}
        />
      </div>

      <span style={styles.time}>{formatTime(durationMs)}</span>

      <div style={styles.speeds}>
        {SPEEDS.map(s => (
          <button
            key={s}
            style={{ ...styles.speedBtn, ...(speed === s ? styles.speedBtnActive : {}) }}
            onClick={() => onSpeedChange(s)}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: '#13161f',
    borderTop: '1px solid #1e2330',
    flexShrink: 0,
  },
  playBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: '#0d0f14',
    fontWeight: 700,
  },
  time: {
    fontSize: '12px',
    color: '#9ca3af',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
    minWidth: '36px',
    textAlign: 'center',
  },
  sliderWrap: {
    flex: 1,
    position: 'relative',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  track: {
    position: 'absolute',
    inset: '50% 0',
    height: '4px',
    transform: 'translateY(-50%)',
    background: '#252a3a',
    borderRadius: '2px',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  fill: {
    height: '100%',
    background: '#4fc3f7',
    borderRadius: '2px',
    transition: 'width 0.05s',
  },
  slider: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  },
  speeds: {
    display: 'flex',
    gap: '3px',
    flexShrink: 0,
  },
  speedBtn: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '4px',
    color: '#9ca3af',
    fontSize: '11px',
    padding: '4px 7px',
    cursor: 'pointer',
  },
  speedBtnActive: {
    background: '#0d2a40',
    borderColor: '#4fc3f7',
    color: '#4fc3f7',
  },
};
