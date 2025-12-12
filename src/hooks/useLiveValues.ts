import { useEffect, useMemo } from 'react';
import { useLivePVs } from '../contexts/LivePVContext';
import { EpicsData } from '../types';

interface UseLiveValuesOptions {
  pvNames: string[];
  throttleMs?: number; // Kept for API compatibility but not used (polling is in context)
  enabled?: boolean;
}

interface UseLiveValuesReturn {
  liveValues: Map<string, EpicsData>;
  isConnected: boolean;
}

/**
 * Hook for subscribing to live PV values via REST polling
 *
 * @param options.pvNames - Array of PV names to subscribe to
 * @param options.throttleMs - Not used (polling interval is set in LivePVProvider)
 * @param options.enabled - Whether to enable subscriptions (default: true)
 * @returns Object with liveValues Map and connection status
 */
export function useLiveValues({
  pvNames,
  enabled = true,
}: UseLiveValuesOptions): UseLiveValuesReturn {
  const { subscribeToPVs, unsubscribeFromPVs, liveValues, isConnected } = useLivePVs();

  // Memoize pvNames to prevent unnecessary re-subscriptions
  const pvNamesKey = useMemo(() => [...pvNames].sort().join(','), [pvNames]);

  // Subscribe to PVs when enabled and pvNames change
  useEffect(() => {
    if (!enabled || pvNames.length === 0) return;

    subscribeToPVs(pvNames);

    return () => {
      unsubscribeFromPVs(pvNames);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pvNamesKey, enabled, subscribeToPVs, unsubscribeFromPVs]);

  // Filter liveValues to only include subscribed PVs
  const filteredValues = useMemo(() => {
    const filtered = new Map<string, EpicsData>();
    const pvSet = new Set(pvNames);
    liveValues.forEach((value, key) => {
      if (pvSet.has(key)) {
        filtered.set(key, value);
      }
    });
    return filtered;
  }, [liveValues, pvNames]);

  return {
    liveValues: filteredValues,
    isConnected,
  };
}

export default useLiveValues;
