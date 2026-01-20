import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { API_CONFIG } from '../config/api';
import { EpicsData } from '../types';

interface LivePVContextValue {
  isConnected: boolean;
  subscribeToPVs: (pvNames: string[]) => void;
  unsubscribeFromPVs: (pvNames: string[]) => void;
  liveValues: Map<string, EpicsData>;
  lastUpdate: Date | null;
  error: string | null;
}

const LivePVContext = createContext<LivePVContextValue | null>(null);

interface LivePVProviderProps {
  children: ReactNode;
  pollInterval?: number; // milliseconds
}

export function LivePVProvider({
  children,
  pollInterval = 2000, // Poll every 2 seconds by default
}: LivePVProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveValues, setLiveValues] = useState<Map<string, EpicsData>>(new Map());
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribedPVs = useRef<Set<string>>(new Set());
  const pollIntervalRef = useRef<number | null>(null);
  const pollIntervalMs = useRef(pollInterval);

  // Keep pollInterval ref updated
  useEffect(() => {
    pollIntervalMs.current = pollInterval;
  }, [pollInterval]);

  // Poll for PV values - stable function using refs
  const pollValues = useCallback(async () => {
    const pvNames = Array.from(subscribedPVs.current);
    if (pvNames.length === 0) return;

    try {
      // Use POST to avoid URL length limits with many PVs
      const response = await fetch(`${API_CONFIG.endpoints.pvs}/live`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pv_names: pvNames }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.errorCode === 0 && data.payload) {
        const rawValues = data.payload as Record<
          string,
          {
            value: unknown;
            connected: boolean;
            updated_at: number;
            status?: string;
            severity?: number;
            units?: string;
          }
        >;
        const valueCount = Object.keys(rawValues).length;
        console.log('[LivePV] Received', valueCount, 'values from backend');

        // Transform backend format to EpicsData format
        setLiveValues((prev) => {
          const next = new Map(prev);
          Object.entries(rawValues).forEach(([pvName, rawValue]) => {
            // Map backend fields to EpicsData fields
            const epicsData: EpicsData = {
              data: rawValue.value as EpicsData['data'],
              severity: rawValue.severity,
              units: rawValue.units,
              timestamp: rawValue.updated_at ? new Date(rawValue.updated_at * 1000) : undefined,
            };
            next.set(pvName, epicsData);
          });
          return next;
        });
        setLastUpdate(new Date());
        setIsConnected(true);
        setError(null);
      } else {
        console.log('[LivePV] Response:', data);
      }
    } catch (err) {
      console.error('[LivePV] Poll error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch live values');
      setIsConnected(false);
    }
  }, []);

  // Stable subscribe function - doesn't change reference
  const subscribeToPVs = useCallback(
    (pvNames: string[]) => {
      console.log('[LivePV] subscribeToPVs called with', pvNames.length, 'PVs');
      let added = 0;
      pvNames.forEach((pv) => {
        if (!subscribedPVs.current.has(pv)) {
          subscribedPVs.current.add(pv);
          added++;
        }
      });

      if (added > 0) {
        console.log(
          '[LivePV] Added',
          added,
          'new PV subscriptions, total:',
          subscribedPVs.current.size
        );
        // Trigger immediate poll
        pollValues();

        // Start polling if not already running
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = window.setInterval(pollValues, pollIntervalMs.current);
        }
      }
    },
    [pollValues]
  );

  // Stable unsubscribe function - doesn't change reference
  const unsubscribeFromPVs = useCallback((pvNames: string[]) => {
    console.log('[LivePV] unsubscribeFromPVs called with', pvNames.length, 'PVs');
    pvNames.forEach((pv) => {
      subscribedPVs.current.delete(pv);
    });

    // Remove from liveValues
    setLiveValues((prev) => {
      const next = new Map(prev);
      pvNames.forEach((pv) => next.delete(pv));
      return next;
    });

    // Stop polling if no more subscriptions
    if (subscribedPVs.current.size === 0 && pollIntervalRef.current) {
      window.clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  return (
    <LivePVContext.Provider
      value={{
        isConnected,
        subscribeToPVs,
        unsubscribeFromPVs,
        liveValues,
        lastUpdate,
        error,
      }}
    >
      {children}
    </LivePVContext.Provider>
  );
}

export function useLivePVs(): LivePVContextValue {
  const context = useContext(LivePVContext);
  if (!context) {
    throw new Error('useLivePVs must be used within a LivePVProvider');
  }
  return context;
}

export default LivePVContext;
