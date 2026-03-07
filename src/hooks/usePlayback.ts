import { useState, useEffect, useRef, useCallback } from 'react';

export function usePlayback(durationMs: number) {
  const [currentMs, setCurrentMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(10);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const stop = useCallback(() => {
    setPlaying(false);
    cancelAnimationFrame(rafRef.current);
  }, []);

  const play = useCallback(() => {
    if (durationMs <= 0) return;
    setPlaying(true);
  }, [durationMs]);

  const toggle = useCallback(() => {
    setPlaying(p => !p);
  }, []);

  const seek = useCallback((ms: number) => {
    setCurrentMs(Math.max(0, Math.min(ms, durationMs)));
  }, [durationMs]);

  const reset = useCallback(() => {
    stop();
    setCurrentMs(0);
  }, [stop]);

  // Animation loop
  useEffect(() => {
    if (!playing) return;

    const tick = (now: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = now;
      }
      const wallDelta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setCurrentMs(prev => {
        const next = prev + wallDelta * speed;
        if (next >= durationMs) {
          setPlaying(false);
          return durationMs;
        }
        return next;
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, speed, durationMs]);

  // Reset when duration changes (new match selected)
  useEffect(() => {
    reset();
  }, [durationMs, reset]);

  return { currentMs, playing, speed, play, stop, toggle, seek, setSpeed };
}
