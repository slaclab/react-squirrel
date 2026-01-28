import { useEffect, useMemo, useRef } from 'react';
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

  // Store pvNames in a ref to avoid dependency issues
  const pvNamesRef = useRef<string[]>(pvNames);
  const subscribedRef = useRef(false);

  // Update ref when pvNames changes (but don't trigger re-subscription from this)
  pvNamesRef.current = pvNames;

  // Create a stable key for detecting actual changes
  const pvNamesKey = useMemo(() => {
    if (pvNames.length === 0) return 'empty';
    const first = pvNames[0] || '';
    const last = pvNames[pvNames.length - 1] || '';
    return `${pvNames.length}:${first}:${last}`;
  }, [pvNames]);

  // Subscribe only once when enabled and pvNames are available
  useEffect(() => {
    if (!enabled || pvNamesRef.current.length === 0) {
      if (subscribedRef.current) {
        // We were subscribed, now need to unsubscribe
        subscribedRef.current = false;
      }
      return undefined;
    }

    if (!subscribedRef.current) {
      // Subscribe for the first time
      subscribeToPVs(pvNamesRef.current);
      subscribedRef.current = true;
    }

    // Cleanup on unmount only
    return () => {
      if (subscribedRef.current) {
        unsubscribeFromPVs(pvNamesRef.current);
        subscribedRef.current = false;
      }
    };
    // Only re-run when the key changes (meaning actual PV list changed) or enabled changes
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
