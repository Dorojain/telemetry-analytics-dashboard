import { useState, useEffect, useRef } from 'react';
import type { MapId, MapMatchData, MatchIndex } from '../types';
import { MAP_CONFIG } from '../constants';

// Module-level caches prevent re-fetching data that's already been loaded
const mapDataCache: Partial<Record<MapId, MapMatchData>> = {};
let matchIndexCache: MatchIndex | null = null;

/**
 * Fetches and caches the match metadata index (all maps, all dates).
 * The index is loaded once and reused for the lifetime of the page.
 */
export function useMatchIndex() {
  const [index, setIndex] = useState<MatchIndex | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (matchIndexCache) {
      setIndex(matchIndexCache);
      setIsLoading(false);
      return;
    }
    fetch('/data/index.json')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<MatchIndex>;
      })
      .then(data => {
        matchIndexCache = data;
        setIndex(data);
        setIsLoading(false);
      })
      .catch(err => {
        setError(String(err));
        setIsLoading(false);
      });
  }, []);

  return { index, isLoading, error };
}

/**
 * Lazy-loads telemetry event data for a specific map.
 * Data is cached after the first fetch — switching maps then back won't re-fetch.
 * Aborts in-flight requests if the map changes before the fetch completes.
 */
export function useMapTelemetryData(mapId: MapId | null) {
  const [matchData, setMatchData] = useState<MapMatchData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!mapId) {
      setMatchData(null);
      return;
    }

    // Serve from cache if already loaded
    if (mapDataCache[mapId]) {
      setMatchData(mapDataCache[mapId]!);
      return;
    }

    // Abort any previous in-flight request before starting a new one
    abortControllerRef.current?.abort();
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsLoading(true);
    setError(null);
    setMatchData(null);

    const dataFileName = MAP_CONFIG[mapId].dataFileName;
    fetch(`/data/${dataFileName}.json`, { signal: abortController.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<MapMatchData>;
      })
      .then(data => {
        mapDataCache[mapId] = data;
        setMatchData(data);
        setIsLoading(false);
      })
      .catch(err => {
        // Ignore cancellations from component unmount or map change
        if (err.name !== 'AbortError') {
          setError(String(err));
          setIsLoading(false);
        }
      });

    return () => abortController.abort();
  }, [mapId]);

  return { matchData, isLoading, error };
}
