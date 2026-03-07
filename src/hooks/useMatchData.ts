import { useState, useEffect, useRef } from 'react';
import type { MapId, MapMatchData, MatchIndex } from '../types';
import { MAP_CONFIG } from '../constants';

// Cache loaded map data in memory so we don't re-fetch
const cache: Partial<Record<MapId, MapMatchData>> = {};
let indexCache: MatchIndex | null = null;

export function useIndex() {
  const [index, setIndex] = useState<MatchIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (indexCache) {
      setIndex(indexCache);
      setLoading(false);
      return;
    }
    fetch('/data/index.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MatchIndex>;
      })
      .then(data => {
        indexCache = data;
        setIndex(data);
        setLoading(false);
      })
      .catch(e => {
        setError(String(e));
        setLoading(false);
      });
  }, []);

  return { index, loading, error };
}

export function useMapData(mapId: MapId | null) {
  const [data, setData] = useState<MapMatchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!mapId) {
      setData(null);
      return;
    }
    if (cache[mapId]) {
      setData(cache[mapId]!);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setData(null);

    const file = MAP_CONFIG[mapId].file;
    fetch(`/data/${file}.json`, { signal: ctrl.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<MapMatchData>;
      })
      .then(d => {
        cache[mapId] = d;
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        if (e.name !== 'AbortError') {
          setError(String(e));
          setLoading(false);
        }
      });

    return () => ctrl.abort();
  }, [mapId]);

  return { data, loading, error };
}
