const PLAYBACK_SPEED_OPTIONS = [1, 5, 10, 20];

interface MatchPlaybackTimelineProps {
  playbackPositionMs: number;
  matchDurationMs: number;
  isPlaying: boolean;
  playbackSpeed: number;
  onTogglePlayPause: () => void;
  onSeek: (positionMs: number) => void;
  onSpeedChange: (speed: number) => void;
}

function formatTimestamp(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutesPart = Math.floor(totalSeconds / 60);
  const secondsPart = totalSeconds % 60;
  return `${minutesPart}:${String(secondsPart).padStart(2, '0')}`;
}

export function MatchPlaybackTimeline({
  playbackPositionMs,
  matchDurationMs,
  isPlaying,
  playbackSpeed,
  onTogglePlayPause,
  onSeek,
  onSpeedChange,
}: MatchPlaybackTimelineProps) {
  const progressPercent = matchDurationMs > 0
    ? (playbackPositionMs / matchDurationMs) * 100
    : 0;

  return (
    <div style={styles.container}>
      <button
        style={{ ...styles.playPauseButton, background: isPlaying ? '#ef5350' : '#4fc3f7' }}
        onClick={onTogglePlayPause}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <span style={styles.timestamp}>{formatTimestamp(playbackPositionMs)}</span>

      {/* Custom scrubber: invisible range input layered over a styled progress track */}
      <div style={styles.scrubberWrapper}>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={matchDurationMs || 1}
          value={playbackPositionMs}
          onChange={e => onSeek(Number(e.target.value))}
          style={styles.rangeInput}
        />
      </div>

      <span style={styles.timestamp}>{formatTimestamp(matchDurationMs)}</span>

      <div style={styles.speedButtonGroup}>
        {PLAYBACK_SPEED_OPTIONS.map(speed => (
          <button
            key={speed}
            style={{
              ...styles.speedButton,
              ...(playbackSpeed === speed ? styles.speedButtonActive : {}),
            }}
            onClick={() => onSpeedChange(speed)}
          >
            {speed}×
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
  playPauseButton: {
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
  timestamp: {
    fontSize: '12px',
    color: '#9ca3af',
    fontVariantNumeric: 'tabular-nums',
    flexShrink: 0,
    minWidth: '36px',
    textAlign: 'center',
  },
  scrubberWrapper: {
    flex: 1,
    position: 'relative',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  progressTrack: {
    position: 'absolute',
    inset: '50% 0',
    height: '4px',
    transform: 'translateY(-50%)',
    background: '#252a3a',
    borderRadius: '2px',
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  progressFill: {
    height: '100%',
    background: '#4fc3f7',
    borderRadius: '2px',
    transition: 'width 0.05s',
  },
  rangeInput: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  },
  speedButtonGroup: {
    display: 'flex',
    gap: '3px',
    flexShrink: 0,
  },
  speedButton: {
    background: '#1a1f2e',
    border: '1px solid #252a3a',
    borderRadius: '4px',
    color: '#9ca3af',
    fontSize: '11px',
    padding: '4px 7px',
    cursor: 'pointer',
  },
  speedButtonActive: {
    background: '#0d2a40',
    borderColor: '#4fc3f7',
    color: '#4fc3f7',
  },
};
