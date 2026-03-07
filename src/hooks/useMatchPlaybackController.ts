import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Controls match timeline playback: play/pause, seek, and speed.
 * Uses requestAnimationFrame for smooth, frame-accurate animation.
 * Automatically resets when the match duration changes (i.e., a new match is selected).
 */
export function useMatchPlaybackController(matchDurationMs: number) {
  const [playbackPositionMs, setPlaybackPositionMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10);
  const animationFrameRef = useRef<number>(0);
  const previousFrameTimestampRef = useRef<number>(0);

  const stop = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameRef.current);
  }, []);

  const play = useCallback(() => {
    if (matchDurationMs <= 0) return;
    setIsPlaying(true);
  }, [matchDurationMs]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(current => !current);
  }, []);

  const seekToPosition = useCallback((positionMs: number) => {
    setPlaybackPositionMs(Math.max(0, Math.min(positionMs, matchDurationMs)));
  }, [matchDurationMs]);

  const resetToStart = useCallback(() => {
    stop();
    setPlaybackPositionMs(0);
  }, [stop]);

  // Animation loop: advances playback position based on real wall-clock time × speed multiplier
  useEffect(() => {
    if (!isPlaying) return;

    const advanceFrame = (frameTimestamp: number) => {
      if (previousFrameTimestampRef.current === 0) {
        previousFrameTimestampRef.current = frameTimestamp;
      }
      const elapsedWallClockMs = frameTimestamp - previousFrameTimestampRef.current;
      previousFrameTimestampRef.current = frameTimestamp;

      setPlaybackPositionMs(current => {
        const next = current + elapsedWallClockMs * playbackSpeed;
        if (next >= matchDurationMs) {
          setIsPlaying(false);
          return matchDurationMs;
        }
        return next;
      });

      animationFrameRef.current = requestAnimationFrame(advanceFrame);
    };

    previousFrameTimestampRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(advanceFrame);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isPlaying, playbackSpeed, matchDurationMs]);

  // Reset playback whenever a new match is loaded
  useEffect(() => {
    resetToStart();
  }, [matchDurationMs, resetToStart]);

  return {
    playbackPositionMs,
    isPlaying,
    playbackSpeed,
    play,
    stop,
    togglePlayPause,
    seekToPosition,
    setPlaybackSpeed,
  };
}
